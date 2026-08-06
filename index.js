require("dotenv").config();

const express = require("express");
const OpenAI = require("openai");

const app = express();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PORT = process.env.PORT || 8080;

// ==========================================================
// DATOS OFICIALES
// ==========================================================

const DATOS_PAGO = {
  banco: "Spin by OXXO",
  titular: "Francisco Camacho Sotelo",
  clabe: "728969000160022558",
};

const APORTACIONES = {
  gratitud: 70,
  proyecto: 150,
  alcance: 200,
};

// ==========================================================
// PROMPT PRINCIPAL
// ==========================================================

const SYSTEM_PROMPT = `
Eres Isabella Rojas ❤️, una asistente humana, cálida, espiritual y cercana que responde dudas por WhatsApp sobre el libro digital "Cuando Dios Habla".

Tu trabajo es responder dudas de forma NATURAL, BREVE y HUMANA, como si fueras una persona real atendiendo con cariño.

IMPORTANTE:
- Nunca suenes robótica.
- Nunca respondas exactamente igual cada vez.
- Varía ligeramente las palabras y estructura.
- Mantén respuestas cálidas y naturales.
- No escribas demasiado.
- Responde máximo en 1 o 2 párrafos cortos.

REGLAS:
- NO saludes.
- NO uses "Hola".
- NO hagas múltiples preguntas.
- NO hagas preguntas abiertas innecesarias.
- NO digas:
  - "¿Quieres saber más?"
  - "¿Te interesa?"
  - "¿Te gustaría?"
  - "¿Te ayudo en algo más?"
  - "¿Quieres que te cuente?"
- NO seas agresiva vendiendo.
- NO presiones.
- NO inventes información.
- NO menciones correo electrónico.
- NO digas que el libro es físico.
- NO digas que existe una fecha límite para apoyar.
- NO digas que la persona perderá el libro si paga después.
- NO prometas validar manualmente un comprobante.
- Si preguntan si pueden pagar después, responde que no hay problema.
- Si preguntan por una cuenta bancaria o datos de transferencia, utiliza únicamente los datos oficiales incluidos en este prompt.

INFORMACIÓN REAL:
- El libro es DIGITAL en PDF.
- El libro NO es físico.
- El PDF YA fue enviado anteriormente por WhatsApp.
- El usuario lo puede encontrar más arriba en esta misma conversación.
- El libro está basado en la Biblia.
- No pertenece a una religión específica.
- No es exclusivamente católico.
- Puede estudiarse con cualquier Biblia.

REFERENCIAS DE APOYO:
- 70 MXN como gesto de gratitud.
- 150 MXN para apoyar el proyecto.
- 200 MXN para que este mensaje llegue a más personas.

DATOS OFICIALES PARA TRANSFERENCIA:
- Banco: Spin by OXXO.
- Titular: Francisco Camacho Sotelo.
- CLABE: 728969000160022558.

IMPORTANTE SOBRE LOS MÉTODOS DE PAGO:
- La transferencia bancaria utiliza los datos oficiales anteriores.
- Para pagar mediante depósito en OXXO, la persona debe utilizar el código o QR que recibe dentro del flujo de OXXO en WhatsApp.
- Nunca inventes un número, referencia o código de OXXO.
- Después de realizar su apoyo, la persona debe enviar la imagen de su comprobante por WhatsApp.

OBJETIVO:
Después de resolver la duda de forma amable y humana, puedes dirigir suavemente a la persona al apoyo del proyecto espiritual mediante:
- transferencia bancaria
- depósito en OXXO

Haz que el cierre se sienta natural, amable y espiritual, nunca como presión de venta.
`;

// ==========================================================
// FUNCIONES GENERALES
// ==========================================================

function normalizarTexto(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function elegirAleatoria(opciones) {
  return opciones[Math.floor(Math.random() * opciones.length)];
}

function limpiarRespuesta(texto) {
  texto = String(texto || "").trim();

  texto = texto
    .replace(
      /^¡?\s*hola\s*[😊🙏❤️✨🌿,\.\!]*\s*/gi,
      ""
    )
    .replace(
      /^gracias por preguntar\s*[😊🙏❤️✨🌿,\.\!]*\s*/gi,
      ""
    )
    .replace(
      /^buenos días\s*[😊🙏❤️✨🌿,\.\!]*\s*/gi,
      ""
    )
    .replace(
      /^buenos dias\s*[😊🙏❤️✨🌿,\.\!]*\s*/gi,
      ""
    )
    .replace(
      /^buenas tardes\s*[😊🙏❤️✨🌿,\.\!]*\s*/gi,
      ""
    )
    .replace(
      /^buenas noches\s*[😊🙏❤️✨🌿,\.\!]*\s*/gi,
      ""
    );

  texto = texto
    .replace(
      /¿[^?]*(quieres|te interesa|te gustaría|te gustaria|te cuento|te explico|te ayudo|puedo ayudarte|hay algo más|hay algo mas|te parece|te comparto|te paso)[^?]*\?/gi,
      ""
    )
    .replace(/\s{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return texto;
}

function contieneAlguna(texto, expresiones) {
  return expresiones.some((expresion) =>
    texto.includes(expresion)
  );
}

// ==========================================================
// CIERRE GENERAL DE PAGO
// ==========================================================

function cierrePago() {
  const cierres = [
    `💌 Puedes apoyar este proyecto espiritual por transferencia bancaria o depósito en OXXO ✨

¿Cuál método prefieres? 🙏`,

    `💌 Si deseas apoyar este proyecto espiritual, puedes hacerlo por transferencia bancaria o depósito en OXXO ✨

¿Qué método prefieres? 🙏`,

    `💌 Para apoyar este proyecto espiritual puedes elegir transferencia bancaria o depósito en OXXO ✨

¿Cuál opción prefieres? 🙏`,
  ];

  return elegirAleatoria(cierres);
}

function agregarCierre(texto) {
  const limpio = limpiarRespuesta(texto);

  if (!limpio) {
    return cierrePago();
  }

  return `${limpio}

${cierrePago()}`;
}

// ==========================================================
// RESPUESTAS: PAGAR DESPUÉS
// ==========================================================

function esPreguntaPagoPosterior(texto) {
  const expresiones = [
    "puedo pagar despues",
    "puedo hacerlo despues",
    "puedo apoyar despues",
    "puedo depositar despues",
    "puedo transferir despues",
    "puedo pagar luego",
    "puedo hacerlo luego",
    "puedo apoyar luego",
    "puedo depositar luego",
    "puedo transferir luego",
    "pago despues",
    "pago luego",
    "pago mas tarde",
    "lo pago despues",
    "lo pago luego",
    "lo pago mas tarde",
    "mañana pago",
    "mañana lo pago",
    "mañana deposito",
    "mañana transfiero",
    "despues deposito",
    "despues transfiero",
    "ahorita no puedo pagar",
    "ahora no puedo pagar",
    "no puedo pagar ahorita",
    "no puedo pagar ahora",
    "no tengo dinero ahorita",
    "no tengo dinero ahora",
    "cuando tenga dinero",
    "hasta cuando puedo pagar",
    "hay fecha limite",
    "tengo que pagar hoy",
  ];

  return contieneAlguna(texto, expresiones);
}

function respuestaPagoPosterior() {
  const respuestas = [
    `Claro 😊 No hay problema, puedes realizar tu apoyo después.

El material seguirá disponible aquí y, cuando tengas tu comprobante, puedes enviármelo como imagen para recibir también tus regalos 🎁`,

    `Está bien 😊 Puedes realizar tu apoyo más adelante.

Cuando lo hagas, envíame aquí la imagen de tu comprobante y con mucho gusto te entregaré tus regalos 🎁`,

    `No hay problema 🙏 Puedes hacerlo cuando te sea posible.

Cuando tengas el comprobante, envíamelo aquí como imagen para que podamos entregarte también tus regalos 🎁`,
  ];

  return elegirAleatoria(respuestas);
}

// ==========================================================
// RESPUESTAS: DATOS DE TRANSFERENCIA
// ==========================================================

function solicitaDatosTransferencia(texto) {
  const expresiones = [
    "numero de cuenta",
    "numero para depositar",
    "numero para transferencia",
    "numero para transferir",
    "cuenta bancaria",
    "cuenta para depositar",
    "cuenta para transferencia",
    "cuenta para transferir",
    "datos bancarios",
    "datos de banco",
    "datos de la cuenta",
    "datos de transferencia",
    "datos para transferir",
    "datos para depositar",
    "cual es la cuenta",
    "cual cuenta",
    "a que cuenta",
    "en que cuenta",
    "donde transfiero",
    "donde deposito",
    "donde hago la transferencia",
    "como transfiero",
    "como hago transferencia",
    "como hago la transferencia",
    "quiero transferir",
    "quiero hacer transferencia",
    "quiero pagar por transferencia",
    "pagar con transferencia",
    "pago por transferencia",
    "pasame la cuenta",
    "dame la cuenta",
    "comparteme la cuenta",
    "mandame la cuenta",
    "cual es la clabe",
    "pasame la clabe",
    "dame la clabe",
    "comparteme la clabe",
    "mandame la clabe",
    "clabe interbancaria",
    "clabe",
    "transferencia bancaria",
  ];

  return contieneAlguna(texto, expresiones);
}

function respuestaDatosTransferencia() {
  const introducciones = [
    "Claro 😊 Puedes realizar tu transferencia con estos datos:",
    "Por supuesto 🙏 Estos son los datos para realizar tu transferencia:",
    "Claro, te comparto los datos de transferencia 😊",
  ];

  return `${elegirAleatoria(introducciones)}

🏦 Banco: ${DATOS_PAGO.banco}
👤 Titular: ${DATOS_PAGO.titular}
💳 CLABE: ${DATOS_PAGO.clabe}

Cuando la realices, envíame aquí la imagen de tu comprobante para poder entregarte tus regalos 🎁`;
}

// ==========================================================
// RESPUESTAS: DEPÓSITO EN OXXO
// ==========================================================

function solicitaPagoOxxo(texto) {
  const expresiones = [
    "deposito en oxxo",
    "depositar en oxxo",
    "pagar en oxxo",
    "pago en oxxo",
    "quiero pagar en oxxo",
    "quiero depositar en oxxo",
    "como pago en oxxo",
    "como deposito en oxxo",
    "datos de oxxo",
    "codigo de oxxo",
    "codigo para oxxo",
    "qr de oxxo",
    "qr para oxxo",
    "referencia de oxxo",
    "numero de oxxo",
    "oxxo",
  ];

  return contieneAlguna(texto, expresiones);
}

function respuestaPagoOxxo() {
  const respuestas = [
    `Claro 😊 Puedes realizar tu apoyo mediante depósito en OXXO.

En esta conversación recibirás el código con los datos que debes presentar en caja. Después, envíame aquí la imagen de tu comprobante para entregarte tus regalos 🎁`,

    `Por supuesto 🙏 Para realizar el depósito en OXXO utiliza el código que te mostramos en esta conversación.

Cuando termines, envíame aquí la foto del ticket para poder entregarte tus regalos 🎁`,

    `Claro 😊 El depósito en OXXO se realiza presentando en caja el código que aparece en esta conversación.

Después del depósito, envíame aquí la imagen del ticket y con mucho gusto te entregaré tus regalos 🎁`,
  ];

  return elegirAleatoria(respuestas);
}

// ==========================================================
// RESPUESTAS DIRECTAS
// ==========================================================

function respuestaDirecta(textoNormalizado) {
  // 1. Preguntas sobre pagar después.
  // Debe evaluarse antes de la condición general de pago.
  if (esPreguntaPagoPosterior(textoNormalizado)) {
    return respuestaPagoPosterior();
  }

  // 2. Solicitudes específicas de transferencia.
  if (solicitaDatosTransferencia(textoNormalizado)) {
    return respuestaDatosTransferencia();
  }

  // 3. Solicitudes específicas de OXXO.
  if (solicitaPagoOxxo(textoNormalizado)) {
    return respuestaPagoOxxo();
  }

  // 4. Preguntas sobre religión.
  if (
    contieneAlguna(textoNormalizado, [
      "catolico",
      "catolica",
      "religion",
      "religioso",
      "religiosa",
      "cristiano",
      "cristiana",
    ])
  ) {
    const respuestasReligion = [
      `No es un libro católico como tal, ni pertenece a una religión específica 🌿

Es una guía basada en la Biblia que puedes estudiar con cualquier Biblia que tengas en casa.`,

      `No pertenece a una religión en específico 😊

Es un material basado en la Biblia, pensado para acompañarte en tu vida espiritual de una forma sencilla y cercana.`,

      `Es una guía bíblica, no un libro religioso de una denominación específica 🌿

Puedes estudiarlo con la Biblia que tengas en casa, sin importar tu tradición religiosa.`,
    ];

    return agregarCierre(
      elegirAleatoria(respuestasReligion)
    );
  }

  // 5. Preguntas sobre entrega, formato o descarga.
  if (
    contieneAlguna(textoNormalizado, [
      "envio",
      "enviar",
      "entrega",
      "fisico",
      "pdf",
      "digital",
      "descargar",
      "recibir",
      "recibo",
      "archivo",
      "entrego",
      "llega",
    ])
  ) {
    const respuestasEnvio = [
      `El libro es completamente digital 😊

El PDF ya fue enviado anteriormente aquí mismo en WhatsApp, así que solo necesitas abrirlo o descargarlo desde esta conversación 🌿`,

      `No es un libro físico 🙏

Es un material digital en PDF que ya te compartimos anteriormente en esta misma conversación de WhatsApp para que puedas leerlo cuando quieras ✨`,

      `El material ya fue enviado por WhatsApp 😊

Lo encuentras más arriba en esta conversación. Solo necesitas descargar el PDF en tu celular o computadora 🌿`,

      `La entrega es digital 😊

El PDF ya está enviado más arriba en este mismo chat de WhatsApp. No llega nada físico ni se manda por correo; solo debes descargarlo desde aquí mismo 🌿`,
    ];

    return agregarCierre(
      elegirAleatoria(respuestasEnvio)
    );
  }

  // 6. Preguntas generales sobre precio o aportación.
  if (
    contieneAlguna(textoNormalizado, [
      "cuanto",
      "cuesta",
      "precio",
      "costo",
      "vale",
      "apoyo",
      "apoyar",
      "aportacion",
      "donacion",
      "pagar",
      "pago",
    ])
  ) {
    const respuestasPago = [
      `El libro se comparte como una bendición 🙏

Si nace en tu corazón apoyar este proyecto espiritual, las referencias son:
🌿 ${APORTACIONES.gratitud} MXN como gesto de gratitud
🌿 ${APORTACIONES.proyecto} MXN para apoyar el proyecto
🌿 ${APORTACIONES.alcance} MXN para que este mensaje llegue a más personas`,

      `El material ya fue compartido con mucho cariño 😊

Para apoyar el proyecto, puedes elegir una de estas referencias:
🌿 ${APORTACIONES.gratitud} MXN como gesto de gratitud
🌿 ${APORTACIONES.proyecto} MXN para apoyar el proyecto
🌿 ${APORTACIONES.alcance} MXN para ayudar a que llegue a más personas`,

      `Este proyecto se sostiene con el apoyo de las personas que reciben el material 🙏

Puedes apoyar con:
🌿 ${APORTACIONES.gratitud} MXN como gesto de gratitud
🌿 ${APORTACIONES.proyecto} MXN para apoyar directamente el proyecto
🌿 ${APORTACIONES.alcance} MXN para que este mensaje llegue a más personas`,
    ];

    return agregarCierre(
      elegirAleatoria(respuestasPago)
    );
  }

  return null;
}

// ==========================================================
// RUTAS
// ==========================================================

app.get("/", (req, res) => {
  res.send("Bot ventas activo ✅");
});

app.post("/mensaje", async (req, res) => {
  try {
    const texto =
      req.body.texto ||
      req.body.mensaje ||
      req.body.message ||
      "";

    console.log("Texto recibido:", texto);

    if (!texto) {
      return res.json({
        respuesta: cierrePago(),
      });
    }

    const textoNormalizado =
      normalizarTexto(texto);

    const directa =
      respuestaDirecta(textoNormalizado);

    if (directa) {
      console.log(
        "Respuesta directa:",
        directa
      );

      return res.json({
        respuesta: directa,
      });
    }

    const response =
      await openai.responses.create({
        model: "gpt-4.1-mini",
        temperature: 0.4,
        input: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: texto,
          },
        ],
      });

    const respuestaIA =
      response.output_text || "";

    const respuestaFinal =
      agregarCierre(respuestaIA);

    console.log(
      "Respuesta enviada:",
      respuestaFinal
    );

    return res.json({
      respuesta: respuestaFinal,
    });
  } catch (error) {
    console.error(
      "Error en /mensaje:",
      error
    );

    return res.json({
      respuesta: cierrePago(),
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `Servidor corriendo en puerto ${PORT}`
  );
});
