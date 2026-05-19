require('dotenv').config();

const express = require("express");
const OpenAI = require("openai");

const app = express();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const PORT = process.env.PORT || 3000;

const SYSTEM_PROMPT = `
Eres Isabella Rojas ❤️, una asistente humana, cálida y amable que responde mensajes de WhatsApp sobre una guía espiritual basada en la Biblia.

Tu trabajo es responder dudas de forma breve, clara, natural y cercana.

REGLAS:
- No empieces con "Hola".
- No ignores la pregunta real del usuario.
- Primero responde exactamente lo que la persona preguntó.
- No asumas que toda pregunta es sobre pago.
- No hagas preguntas abiertas como "¿Quieres saber más?" o "¿Hay algo más?"
- No alargues la conversación innecesariamente.
- Después de resolver la duda, puedes dirigir suavemente hacia el apoyo.

PRODUCTO:
- Es un libro digital en PDF.
- No es físico.
- Se entrega por WhatsApp o correo.
- Es una guía basada en la Biblia.
- No pertenece a una religión específica.
- Puede estudiarse con cualquier Biblia.
- Contiene el estudio de los 150 Salmos.
- Incluye explicación, reflexión, aplicación y oración guiada.

APOYO:
El libro se comparte como bendición. Si la persona desea apoyar, puede hacerlo con el monto que sienta en su corazón:
70 MXN como gesto de gratitud.
90 MXN como apoyo al proyecto.
120 MXN para ayudar a que el mensaje llegue a más personas.

CIERRE:
Cuando sea natural, termina con:
"¿Prefieres transferencia o depósito en Oxxo? 🙏"
`;

function normalizarTexto(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function limpiarRespuesta(respuesta) {
  let texto = String(respuesta || "").trim();

  texto = texto
    .replace(/^¡?hola[!,. ]*/i, "")
    .replace(/^buenos dias[!,. ]*/i, "")
    .replace(/^buenas tardes[!,. ]*/i, "")
    .replace(/^buenas noches[!,. ]*/i, "")
    .replace(/¿quieres que te cuente.*?\?/gi, "")
    .replace(/¿quieres saber.*?\?/gi, "")
    .replace(/¿hay algo mas que quieras saber\?/gi, "")
    .replace(/¿hay algo más que quieras saber\?/gi, "")
    .replace(/¿quieres que te ayude.*?\?/gi, "")
    .replace(/¿quieres que te explique.*?\?/gi, "")
    .trim();

  return texto;
}

app.post("/mensaje", async (req, res) => {
  try {
    const { texto } = req.body;

    console.log("Texto recibido:", texto);

    if (!texto) {
      return res.json({
        respuesta: "Claro 🙏 ¿Prefieres transferencia o depósito en Oxxo?"
      });
    }

    const textoNormalizado = normalizarTexto(texto);

    // TRANSFERENCIA
    if (
      textoNormalizado.includes("transferencia") ||
      textoNormalizado.includes("transferir")
    ) {
      return res.json({
        respuesta:
`Perfecto ❤️

Para transferencia interbancaria estos son los datos:

Banco: SPIN BY OXXO
Cuenta: 728969000160022558
Nombre: JUAN CAMACHO SOTELO

Cuando realices tu apoyo, envíame tu comprobante y la palabra LISTO 🙏`
      });
    }

    // OXXO
    if (
      textoNormalizado.includes("oxxo") ||
      textoNormalizado.includes("deposito") ||
      textoNormalizado.includes("depositar")
    ) {
      return res.json({
        respuesta:
`Perfecto ❤️

Para depósito en Oxxo puedes usar estos datos:

SPIN BY OXXO
Cuenta: 728969000160022558
Nombre: JUAN CAMACHO SOTELO

Cuando realices tu apoyo, envíame tu comprobante y la palabra LISTO 🙏`
      });
    }

    // RELIGIÓN / CATÓLICO / CRISTIANO
    if (
      textoNormalizado.includes("catolico") ||
      textoNormalizado.includes("catolica") ||
      textoNormalizado.includes("religion") ||
      textoNormalizado.includes("religioso") ||
      textoNormalizado.includes("cristiano") ||
      textoNormalizado.includes("cristiana")
    ) {
      return res.json({
        respuesta:
`No es un libro católico como tal, ni pertenece a una religión específica 🌿✨

Es una guía basada en la Biblia que cualquier persona puede estudiar con la Biblia que tenga en casa.

¿Prefieres transferencia o depósito en Oxxo? 🙏`
      });
    }

    // ENVÍO / ENTREGA / PDF / DOMICILIO
    if (
      textoNormalizado.includes("envio") ||
      textoNormalizado.includes("enviar") ||
      textoNormalizado.includes("envian") ||
      textoNormalizado.includes("entrega") ||
      textoNormalizado.includes("domicilio") ||
      textoNormalizado.includes("fisico") ||
      textoNormalizado.includes("pdf") ||
      textoNormalizado.includes("recibo") ||
      textoNormalizado.includes("recibir")
    ) {
      return res.json({
        respuesta:
`El material es digital en PDF, no es físico 😊

Se entrega por WhatsApp o correo para que puedas descargarlo en tu teléfono o computadora.

¿Prefieres transferencia o depósito en Oxxo? 🙏`
      });
    }

    // PRECIO / COSTO / APOYO
    if (
      textoNormalizado.includes("cuanto") ||
      textoNormalizado.includes("cuesta") ||
      textoNormalizado.includes("precio") ||
      textoNormalizado.includes("vale") ||
      textoNormalizado.includes("costo") ||
      textoNormalizado.includes("apoyar") ||
      textoNormalizado.includes("aportacion") ||
      textoNormalizado.includes("donacion")
    ) {
      return res.json({
        respuesta:
`El libro se comparte como una bendición 🙏

Puedes apoyar con el monto que sientas en tu corazón:

🌿 70 MXN como gesto de gratitud
🌿 90 MXN para apoyar el proyecto
🌿 120 MXN para que este mensaje llegue a más personas

¿Prefieres transferencia o depósito en Oxxo?`
      });
    }

    // RESPUESTA GENERAL CON OPENAI
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: texto }
      ]
    });

    let respuesta = limpiarRespuesta(response.output_text);

    if (!respuesta) {
      respuesta = "Claro 🙏 ¿Prefieres transferencia o depósito en Oxxo?";
    }

    if (
      !respuesta.toLowerCase().includes("transferencia") &&
      !respuesta.toLowerCase().includes("oxxo")
    ) {
      respuesta += "\n\n¿Prefieres transferencia o depósito en Oxxo? 🙏";
    }

    res.json({ respuesta });

  } catch (error) {
    console.error("Error con OpenAI:", error);

    res.status(500).json({
      error: "Error con OpenAI"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
