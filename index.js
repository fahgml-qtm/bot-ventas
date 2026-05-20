require("dotenv").config();

const express = require("express");
const axios = require("axios");
const OpenAI = require("openai");

const app = express();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MANYCHAT_API_KEY = process.env.MANYCHAT_API_KEY;

function limpiarRespuesta(texto) {
  if (!texto) return "";

  const bloqueos = [
    /^hola\s*[😊🙏❤️✨🌿,\.\!]*\s*/gi,

    /¿te interesa.*?\?/gi,
    /¿te gustaria.*?\?/gi,
    /¿te gustaría.*?\?/gi,
    /¿quieres.*?\?/gi,
    /¿puedo.*?\?/gi,
    /¿deseas.*?\?/gi,
    /¿te comparto.*?\?/gi,
    /¿te paso.*?\?/gi,
    /¿quieres que te explique.*?\?/gi,
    /¿quieres que te cuente.*?\?/gi,
    /¿quieres saber.*?\?/gi,
    /¿te ayudo.*?\?/gi,
    /¿te explico.*?\?/gi,
    /¿quieres apoyar.*?\?/gi,
    /¿cómo puedo ayudarte.*?\?/gi,
    /¿quieres que te ayude.*?\?/gi,
    /¿quieres que te muestre.*?\?/gi,
  ];

  bloqueos.forEach((regex) => {
    texto = texto.replace(regex, "");
  });

  texto = texto
    .replace(
      /¿[^?]*(interesa|gustaria|gustaría|quieres|puedo|deseas|comparto|paso|ayudo|explico)[^?]*\?/gi,
      ""
    )
    .replace(/\s{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return texto;
}

function agregarCierre(texto) {
  return `${texto}

💌 Puedes apoyar este proyecto espiritual por transferencia bancaria o depósito en Oxxo ✨

¿Cuál método prefieres? 🙏`;
}

app.post("/webhook", async (req, res) => {
  try {
    const mensaje =
      req.body.text ||
      req.body.message ||
      req.body.last_input_text ||
      "";

    const subscriberId =
      req.body.subscriber_id ||
      req.body.user_id ||
      req.body.id;

    console.log("Texto recibido:", mensaje);

    if (!mensaje || !subscriberId) {
      return res.status(400).json({
        success: false,
        error: "Faltan datos",
      });
    }

    const systemPrompt = `
Eres un asistente espiritual amable y humano.

REGLAS IMPORTANTES:
- Responde SIEMPRE de forma cálida, breve y natural.
- NO hagas preguntas abiertas.
- NO cierres con frases como:
  "¿Te interesa?"
  "¿Quieres saber más?"
  "¿Te gustaría?"
  "¿Puedo ayudarte?"
  "¿Quieres que te explique?"
- SOLO responde la duda del usuario.
- Después de responder, termina de forma NATURAL guiando al apoyo del proyecto.
- El cierre SIEMPRE debe orientar al usuario hacia:
  transferencia bancaria o depósito en Oxxo.
- NO uses tono agresivo.
- NO presiones.
- NO parezcas vendedor insistente.
- Mantén tono espiritual, amable y humano.

CONTEXTO:
El proyecto es un estudio bíblico digital basado en la Biblia.
No pertenece a una religión específica.
El material ya fue enviado en PDF.
No hay envío físico.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      max_tokens: 250,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: mensaje,
        },
      ],
    });

    let respuesta =
      completion.choices[0].message.content || "";

    respuesta = limpiarRespuesta(respuesta);

    respuesta = agregarCierre(respuesta);

    console.log("Respuesta IA:", respuesta);

    await axios.post(
      "https://api.manychat.com/fb/sending/sendContent",
      {
        subscriber_id: subscriberId,
        data: {
          version: "v2",
          content: {
            type: "text",
            text: respuesta,
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${MANYCHAT_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.status(200).json({
      success: true,
      respuesta,
    });
  } catch (error) {
    console.error(
      "ERROR:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
