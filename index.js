require("dotenv").config();

const express = require("express");
const OpenAI = require("openai");

const app = express();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PORT = process.env.PORT || 8080;

const SYSTEM_PROMPT = `
Eres Isabella Rojas ❤️, una asistente humana, cálida y cercana que responde dudas por WhatsApp sobre el libro digital "Cuando Dios Habla".

Tu única tarea es responder la duda exacta del usuario de forma breve, amable, espiritual y clara.

REGLAS:
- NO saludes.
- NO digas "Hola".
- NO hagas preguntas abiertas.
- NO cierres con "¿quieres saber más?", "¿te cuento más?", "¿te interesa?", "¿te gustaría?", "¿hay algo más?", "¿te ayudo con algo más?".
- NO vendas agresivamente.
- NO inventes información.
- Responde máximo en 2 párrafos.

INFORMACIÓN:
- Es un libro digital en PDF.
- No es físico.
- Se entrega por WhatsApp o correo.
- Ya fue enviado al usuario.
- Está basado en la Biblia.
- No es católico ni de una religión específica.
- Puede estudiarlo cualquier persona con la Biblia que tenga en casa.
`;

function normalizarTexto(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function limpiarRespuesta(texto) {
  texto = String(texto || "").trim();

  texto = texto
    .replace(/^¡?\s*hola\s*[😊🙏❤️✨🌿,\.\!]*\s*/gi, "")
    .replace(/^gracias por preguntar\s*[😊🙏❤️✨🌿,\.\!]*\s*/gi, "")
    .replace(/^buenos días\s*[😊🙏❤️✨🌿,\.\!]*\s*/gi, "")
    .replace(/^buenos dias\s*[😊🙏❤️✨🌿,\.\!]*\s*/gi, "")
    .replace(/^buenas tardes\s*[😊🙏❤️✨🌿,\.\!]*\s*/gi, "")
    .replace(/^buenas noches\s*[😊🙏❤️✨🌿,\.\!]*\s*/gi, "");

  texto = texto
    .replace(/¿[^?]*(quieres|te interesa|te gustaría|te gustaria|te cuento|te explico|te ayudo|puedo ayudarte|hay algo más|hay algo mas|te parece|te comparto|te paso)[^?]*\?/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return texto;
}

function cierrePago() {
  return `💌 Puedes apoyar este proyecto espiritual por transferencia bancaria o depósito en Oxxo ✨

¿Cuál método prefieres? 🙏`;
}

function agregarCierre(texto) {
  const limpio = limpiarRespuesta(texto);

  if (!limpio) {
    return cierrePago();
  }

  return `${limpio}

${cierrePago()}`;
}

function respuestaDirecta(textoNormalizado) {

  // RELIGIÓN / CATÓLICO
  if (
    textoNormalizado.includes("catolico") ||
    textoNormalizado.includes("catolica") ||
    textoNormalizado.includes("religion") ||
    textoNormalizado.includes("religioso") ||
    textoNormalizado.includes("cristiano") ||
    textoNormalizado.includes("cristiana")
  ) {
    return agregarCierre(`No es un libro católico como tal, ni pertenece a una religión específica 🌿

Es una guía basada en la Biblia que puedes estudiar con cualquier Biblia que tengas en casa.`);
  }

  // ENVÍO / PDF / DESCARGA
  if (
    textoNormalizado.includes("envio") ||
    textoNormalizado.includes("enviar") ||
    textoNormalizado.includes("entrega") ||
    textoNormalizado.includes("fisico") ||
    textoNormalizado.includes("pdf") ||
    textoNormalizado.includes("digital") ||
    textoNormalizado.includes("descargar") ||
    textoNormalizado.includes("recibir")
  ) {
    return agregarCierre(`El libro digital ya fue enviado 😊

Solo necesitas descargarlo desde el enlace que te compartimos. No hay envío físico, todo se entrega en PDF para que puedas leerlo desde tu celular o computadora 🌿`);
  }

  // PRECIO / APOYO / PAGO
  if (
    textoNormalizado.includes("cuanto") ||
    textoNormalizado.includes("cuesta") ||
    textoNormalizado.includes("precio") ||
    textoNormalizado.includes("costo") ||
    textoNormalizado.includes("vale") ||
    textoNormalizado.includes("apoyo") ||
    textoNormalizado.includes("apoyar") ||
    textoNormalizado.includes("aportacion") ||
    textoNormalizado.includes("donacion") ||
    textoNormalizado.includes("pagar")
  ) {
    return agregarCierre(`El libro se comparte como una bendición 🙏

Si nace en tu corazón apoyar este proyecto espiritual, puedes hacerlo con el monto que sientas correcto.`);
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
      req.body.message ||
      "";

    console.log("Texto recibido:", texto);

    if (!texto) {
      return res.json({
        respuesta: cierrePago(),
      });
    }

    const textoNormalizado = normalizarTexto(texto);

    // RESPUESTAS DIRECTAS
    const directa = respuestaDirecta(textoNormalizado);

    if (directa) {
      console.log("Respuesta directa:", directa);

      return res.json({
        respuesta: directa,
      });
    }

    // IA
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      temperature: 0.1,
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

    const respuestaIA = response.output_text || "";

    const respuestaFinal = agregarCierre(respuestaIA);

    console.log("Respuesta IA:", respuestaFinal);

    return res.json({
      respuesta: respuestaFinal,
    });

  } catch (error) {

    console.error("Error en /mensaje:", error);

    return res.json({
      respuesta: cierrePago(),
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
