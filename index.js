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

Tu trabajo es responder la duda del usuario de forma breve, amable y clara.

REGLAS IMPORTANTES:
- No empieces con "Hola".
- No hagas preguntas abiertas como "¿quieres saber más?", "¿te cuento más?" o "¿hay algo más?".
- No des vueltas.
- No seas insistente ni agresiva.
- Primero responde exactamente la duda del usuario.
- Después dirige suavemente al siguiente paso de apoyo.
- La respuesta debe sonar humana, espiritual, sencilla y natural.
- Mantén la respuesta corta, máximo 2 párrafos.
- No inventes datos bancarios.
- No digas que el libro es físico.
- No digas que pertenece a una religión específica.

INFORMACIÓN DEL PRODUCTO:
- Es un libro digital en PDF.
- Se entrega por WhatsApp o correo.
- No hay envío físico.
- Está basado en la Biblia.
- No es católico ni de una religión específica.
- Lo puede estudiar cualquier persona con la Biblia que tenga en casa.
- Es una guía espiritual para estudiar los Salmos.

APOYO:
El libro se comparte como una bendición. Si la persona desea apoyar el proyecto, puede hacerlo por transferencia o depósito en Oxxo.

CIERRE OBLIGATORIO:
Después de responder la duda, termina con una frase parecida a esta:

"Si deseas apoyar el proyecto, puedes hacerlo por transferencia o depósito en Oxxo. ¿Cuál método prefieres? 🙏"

Nunca termines con otra pregunta abierta.
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
    .replace(/^buenos días[!,. ]*/i, "")
    .replace(/^buenos dias[!,. ]*/i, "")
    .replace(/^buenas tardes[!,. ]*/i, "")
    .replace(/^buenas noches[!,. ]*/i, "")
    .replace(/¿quieres que te cuente.*?\?/gi, "")
    .replace(/¿quieres saber.*?\?/gi, "")
    .replace(/¿hay algo más que quieras saber\?/gi, "")
    .replace(/¿hay algo mas que quieras saber\?/gi, "")
    .replace(/¿hay algo más en lo que pueda ayudarte\?/gi, "")
    .replace(/¿hay algo mas en lo que pueda ayudarte\?/gi, "")
    .trim();

  return texto;
}

function agregarCierreSiFalta(respuesta) {
  const textoNormalizado = normalizarTexto(respuesta);

  const mencionaMetodo =
    textoNormalizado.includes("transferencia") ||
    textoNormalizado.includes("oxxo");

  if (mencionaMetodo) return respuesta;

  return `${respuesta}

Si deseas apoyar el proyecto, puedes hacerlo por transferencia o depósito en Oxxo. ¿Cuál método prefieres? 🙏`;
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
    return `No es un libro católico como tal, ni pertenece a una religión específica 🌿✨

Es una guía basada en la Biblia que cualquier persona puede estudiar con la Biblia que tenga en casa.

Si deseas apoyar el proyecto, puedes hacerlo por transferencia o depósito en Oxxo. ¿Cuál método prefieres? 🙏`;
  }

  if (
    textoNormalizado.includes("envio") ||
    textoNormalizado.includes("enviar") ||
    textoNormalizado.includes("envian") ||
    textoNormalizado.includes("entrega") ||
    textoNormalizado.includes("domicilio") ||
    textoNormalizado.includes("fisico") ||
    textoNormalizado.includes("pdf") ||
    textoNormalizado.includes("recibo") ||
    textoNormalizado.includes("recibir") ||
    textoNormalizado.includes("descargar")
  ) {
    return `El libro es digital en PDF, no es físico 😊

Se entrega por WhatsApp o correo para que puedas descargarlo en tu teléfono o computadora.

Si deseas apoyar el proyecto, puedes hacerlo por transferencia o depósito en Oxxo. ¿Cuál método prefieres? 🙏`;
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
    textoNormalizado.includes("donacion")
  ) {
    return `El libro se comparte como una bendición 🙏

Si en tu corazón deseas apoyar el proyecto, puedes hacerlo con el monto que sientas correcto.

Puedes apoyar por transferencia o depósito en Oxxo. ¿Cuál método prefieres? 🙏`;
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
        respuesta: "Claro 🙏 Si deseas apoyar el proyecto, puedes hacerlo por transferencia o depósito en Oxxo. ¿Cuál método prefieres?"
      });
    }

    const textoNormalizado = normalizarTexto(texto);

    const directa = respuestaDirecta(textoNormalizado);
    if (directa) {
      return res.json({ respuesta: directa });
    }

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: texto }
      ]
    });

    let respuesta = limpiarRespuesta(response.output_text);

    if (!respuesta) {
      respuesta = "Claro 🙏 Si deseas apoyar el proyecto, puedes hacerlo por transferencia o depósito en Oxxo. ¿Cuál método prefieres?";
    }

    respuesta = agregarCierreSiFalta(respuesta);

    return res.json({ respuesta });

  } catch (error) {
    console.error("Error en /mensaje:", error);

    return res.json({
      respuesta: "Claro 🙏 Si deseas apoyar el proyecto, puedes hacerlo por transferencia o depósito en Oxxo. ¿Cuál método prefieres?"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
