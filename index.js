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
Eres Isabella Rojas ❤️, una asistente humana, cálida y cercana que responde dudas por WhatsApp sobre el libro digital "Cuando Dios Habla".

Tu tarea:
- Responder la duda exacta del usuario.
- Ser breve, amable, espiritual y clara.
- No abrir conversación innecesaria.
- No saludar.
- No decir "Hola".
- No hacer preguntas abiertas.
- No decir "¿quieres saber más?", "¿te cuento más?", "¿hay algo más?", "¿te ayudo con algo más?".
- No inventar información.
- No sonar agresiva.
- No dar vueltas.

Información:
- El libro es digital en PDF.
- No es físico.
- Se entrega por WhatsApp o correo.
- Está basado en la Biblia.
- No es católico ni de una religión específica.
- Puede estudiarlo cualquier persona con la Biblia que tenga en casa.
- El apoyo puede hacerse por transferencia o depósito en Oxxo.

Responde máximo en 2 párrafos.
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
    .replace(/^gracias por preguntar[!,. 😊🙏]*/i, "")
    .replace(/^buenos dias[!,. ]*/i, "")
    .replace(/^buenas tardes[!,. ]*/i, "")
    .replace(/^buenas noches[!,. ]*/i, "")
    .replace(/¿quieres que te cuente.*?\?/gi, "")
    .replace(/¿quieres saber.*?\?/gi, "")
    .replace(/¿te cuento.*?\?/gi, "")
    .replace(/¿hay algo más.*?\?/gi, "")
    .replace(/¿hay algo mas.*?\?/gi, "")
    .replace(/¿te ayudo con algo más.*?\?/gi, "")
    .replace(/¿te ayudo con algo mas.*?\?/gi, "")
    .replace(/¿quieres que te ayude.*?\?/gi, "")
    .trim();

  return texto;
}

function cierrePago() {
  return `Si deseas apoyar el proyecto, puedes hacerlo por transferencia bancaria o depósito en Oxxo.

¿Cuál método prefieres? 🙏`;
}

function agregarCierre(respuesta) {
  const limpia = limpiarRespuesta(respuesta);

  return `${limpia}

${cierrePago()}`.trim();
}

function respuestaDirecta(textoNormalizado) {
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

  if (
    textoNormalizado.includes("envio") ||
    textoNormalizado.includes("enviar") ||
    textoNormalizado.includes("envian") ||
    textoNormalizado.includes("entrega") ||
    textoNormalizado.includes("domicilio") ||
    textoNormalizado.includes("fisico") ||
    textoNormalizado.includes("pdf") ||
    textoNormalizado.includes("digital") ||
    textoNormalizado.includes("descargar") ||
    textoNormalizado.includes("recibir")
  ) {
    return agregarCierre(`El libro es digital en PDF, no es físico 😊

Se entrega por WhatsApp o correo para que puedas descargarlo y leerlo desde tu celular o computadora.`);
  }

  if (
    textoNormalizado.includes("cuanto") ||
    textoNormalizado.includes("cuesta") ||
    textoNormalizado.includes("precio") ||
    textoNormalizado.includes("vale") ||
    textoNormalizado.includes("costo") ||
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
    const texto = req.body.texto || req.body.mensaje || "";

    console.log("Texto recibido:", texto);

    if (!texto) {
      return res.json({
        respuesta: cierrePago()
      });
    }

    const textoNormalizado = normalizarTexto(texto);

    const directa = respuestaDirecta(textoNormalizado);
    if (directa) {
      console.log("Respuesta directa:", directa);
      return res.json({ respuesta: directa });
    }

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      temperature: 0.2,
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: texto }
      ]
    });

    let respuesta = response.output_text || "";

    respuesta = agregarCierre(respuesta);

    console.log("Respuesta enviada:", respuesta);

    return res.json({ respuesta });

  } catch (error) {
    console.error("Error en /mensaje:", error);

    return res.json({
      respuesta: cierrePago()
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
