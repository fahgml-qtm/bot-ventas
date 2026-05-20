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
Eres Isabella Rojas ❤️, una asistente humana, amable y cercana que responde dudas por WhatsApp sobre el libro digital "Cuando Dios Habla".

Tu trabajo es:
1. Responder la duda exacta del usuario.
2. Sonar cálida, espiritual y humana.
3. Mantener respuestas cortas.
4. Guiar suavemente al apoyo del proyecto.

REGLAS IMPORTANTES:
- Nunca digas que eres IA.
- Nunca hables como robot.
- Nunca hagas preguntas abiertas como:
  - "¿Quieres saber más?"
  - "¿Te cuento más?"
  - "¿Hay algo más?"
- Nunca vendas agresivamente.
- No des demasiada información.
- Responde solamente lo necesario.
- Máximo 2 párrafos.
- Sonar natural y amorosa.
- No uses respuestas largas.

INFORMACIÓN DEL PROYECTO:
- Es un libro digital en PDF.
- Está basado en la Biblia.
- No pertenece a una religión específica.
- No es exclusivamente católico.
- Puede estudiarse con cualquier Biblia.
- Se entrega digitalmente por WhatsApp o correo.
- El proyecto busca fortalecer la espiritualidad y acercar a las personas a Dios.

CIERRE OBLIGATORIO:
Después de responder, SIEMPRE termina invitando amablemente al apoyo del proyecto mencionando:
- transferencia
- depósito en Oxxo
- preguntar cuál método prefieren

Hazlo de forma cálida y natural.
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
    .replace(/^hola[!,. ]*/i, "")
    .replace(/^buenos dias[!,. ]*/i, "")
    .replace(/^buenas tardes[!,. ]*/i, "")
    .replace(/^buenas noches[!,. ]*/i, "")
    .replace(/¿quieres saber más\?/gi, "")
    .replace(/¿quieres saber mas\?/gi, "")
    .replace(/¿te cuento más\?/gi, "")
    .replace(/¿te cuento mas\?/gi, "")
    .replace(/¿hay algo más.*?\?/gi, "")
    .replace(/¿hay algo mas.*?\?/gi, "")
    .trim();

  return texto;
}

function agregarCierre(respuesta) {

  return `${respuesta}

🙏 Si deseas apoyar este proyecto, puedes hacerlo por transferencia bancaria o depósito en Oxxo.

¿Cuál método prefieres? ✨`;
}

function respuestaDirecta(textoNormalizado) {

  // RELIGIÓN
  if (
    textoNormalizado.includes("catolico") ||
    textoNormalizado.includes("catolica") ||
    textoNormalizado.includes("religion") ||
    textoNormalizado.includes("religioso") ||
    textoNormalizado.includes("cristiano")
  ) {

    return agregarCierre(
`No, no es un libro católico como tal 🌿

Es una guía basada en la Biblia que puedes estudiar con cualquier Biblia que tengas en casa, sin importar tu creencia.

Está pensado para acompañar y fortalecer la espiritualidad de forma sencilla y amorosa ❤️`
    );
  }

  // PDF / ENTREGA
  if (
    textoNormalizado.includes("pdf") ||
    textoNormalizado.includes("digital") ||
    textoNormalizado.includes("fisico") ||
    textoNormalizado.includes("envio") ||
    textoNormalizado.includes("entrega") ||
    textoNormalizado.includes("correo") ||
    textoNormalizado.includes("whatsapp")
  ) {

    return agregarCierre(
`El material es completamente digital en PDF 😊

Se entrega por WhatsApp o correo para que puedas leerlo fácilmente desde tu celular o computadora ✨`
    );
  }

  // PRECIO / APOYO
  if (
    textoNormalizado.includes("precio") ||
    textoNormalizado.includes("cuanto cuesta") ||
    textoNormalizado.includes("cuanto") ||
    textoNormalizado.includes("costo") ||
    textoNormalizado.includes("vale") ||
    textoNormalizado.includes("apoyo") ||
    textoNormalizado.includes("donacion")
  ) {

    return agregarCierre(
`El proyecto se comparte como una bendición 🙏

Si nace en tu corazón apoyar este trabajo espiritual, puedes hacerlo con el monto que sientas correcto ✨`
    );
  }

  return null;
}

app.get("/", (req, res) => {
  res.send("Bot ventas activo ✅");
});

app.post("/mensaje", async (req, res) => {

  try {

    const texto =
      req.body.texto ||
      req.body.mensaje ||
      "";

    console.log("Texto recibido:", texto);

    if (!texto) {

      return res.json({
        respuesta: agregarCierre(
          "Gracias por escribir 😊"
        )
      });
    }

    const textoNormalizado = normalizarTexto(texto);

    // RESPUESTAS DIRECTAS
    const directa = respuestaDirecta(textoNormalizado);

    if (directa) {

      return res.json({
        respuesta: directa
      });
    }

    // OPENAI
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: texto
        }
      ]
    });

    let respuesta = response.output_text || "";

    respuesta = limpiarRespuesta(respuesta);

    respuesta = agregarCierre(respuesta);

    console.log("Respuesta enviada:", respuesta);

    return res.json({
      respuesta
    });

  } catch (error) {

    console.error("ERROR:", error);

    return res.json({
      respuesta: agregarCierre(
        "Gracias por escribir 😊"
      )
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
