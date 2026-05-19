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
Eres Isabella Rojas ❤️, una asistente humana, cálida y cercana por WhatsApp.

Responde dudas sobre un libro digital bíblico de Salmos.

REGLAS:
- No empieces con "Hola".
- Responde primero la duda real del usuario.
- No asumas que toda pregunta es sobre pago.
- No abras conversación con preguntas como "¿quieres saber más?".
- Mantén mensajes breves, cálidos y claros.
- Si después de responder la duda tiene sentido avanzar, dirige suavemente a elegir método de apoyo.
- El cierre ideal es: "Puedes apoyar por transferencia o depósito en Oxxo. ¿Cuál prefieres? 🙏"

PRODUCTO:
- Es un PDF digital.
- No es físico.
- Se entrega por WhatsApp o correo.
- Es una guía basada en la Biblia.
- No pertenece a una religión específica.
- Puede estudiarse con cualquier Biblia.
- Contiene estudio de los 150 Salmos.

APOYO:
- 70 MXN gesto de gratitud.
- 90 MXN apoyo al proyecto.
- 120 MXN apoyo especial para llegar a más personas.
`;

app.post("/mensaje", async (req, res) => {
  try {
    const { texto } = req.body;

    if (!texto) {
      return res.json({ respuesta: "¿Prefieres transferencia o depósito en Oxxo? 🙏" });
    }

    console.log("Texto recibido:", texto);

    const textoNormalizado = texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

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
`No es un libro religioso como tal, ni pertenece a una religión específica 🌿✨

Es una guía basada en la Biblia que puedes estudiar con cualquier Biblia que tengas en casa.

Puedes apoyar por transferencia o depósito en Oxxo. ¿Cuál prefieres? 🙏`
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

Puedes apoyar por transferencia o depósito en Oxxo. ¿Cuál prefieres? 🙏`
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

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: texto }
      ]
    });

    let respuesta = response.output_text;

    respuesta = respuesta
      .replace(/^¡?Hola[!,. ]*/i, "")
      .replace(/^Buenos días[!,. ]*/i, "")
      .replace(/^Buenas tardes[!,. ]*/i, "")
      .replace(/^Buenas noches[!,. ]*/i, "")
      .replace(/¿Quieres que te cuente.*?\?/gi, "")
      .replace(/¿Quieres saber.*?\?/gi, "")
      .replace(/¿Hay algo más que quieras saber\?/gi, "")
      .replace(/¿Quieres que te ayude.*?\?/gi, "")
      .trim();

    if (
      !respuesta.toLowerCase().includes("transferencia") &&
      !respuesta.toLowerCase().includes("oxxo")
    ) {
      respuesta += "\n\nPuedes apoyar por transferencia o depósito en Oxxo. ¿Cuál prefieres? 🙏";
    }

    res.json({ respuesta });

  } catch (error) {
    console.error("Error con OpenAI:", error);
    res.status(500).json({ error: "Error con OpenAI" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
