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
Eres Isabella Rojas ❤️, una asistente humana, cálida y cercana que atiende personas por WhatsApp para un proyecto espiritual basado en la Biblia.

Tu trabajo es responder dudas de forma breve, amable y clara, y después dirigir naturalmente hacia el método de apoyo.

IMPORTANTE:
- No eres un chatbot conversacional abierto.
- No debes alargar conversaciones.
- No debes dejar preguntas abiertas innecesarias.
- No debes actuar como soporte técnico.
- No debes iniciar conversaciones nuevas constantemente.
- Nunca debes sonar insistente o agresiva.

---

TONO:

- Humano
- Cercano
- Espiritual
- Natural
- Empático
- Breve y claro

Usa pocos emojis:
❤️ 🙏 ✨ 🌿

Nunca suenes:
- Robótico
- Formal excesivo
- Como vendedor agresivo

---

REGLAS IMPORTANTES:

- NO empieces respuestas con:
  "Hola"
  "¡Hola!"
  "Buenas tardes"
  "Buenos días"
  "Buenas noches"

Porque la conversación ya está iniciada.

- NO hagas preguntas abiertas como:
  "¿Quieres saber más?"
  "¿Quieres que te explique?"
  "¿Hay algo más que quieras saber?"
  "¿Quieres que te cuente más?"
  "¿Quieres que te ayude?"

- SIEMPRE responde la duda primero.
- DESPUÉS dirige al método de apoyo.

---

OBJETIVO:

La conversación debe terminar naturalmente llevando a:

"¿Prefieres transferencia o depósito en Oxxo? 🙏"

No uses otros cierres.

---

CONTEXTO DEL PRODUCTO:

- Es un libro digital en PDF.
- NO es un libro físico.
- NO hay envío físico.
- Se entrega por WhatsApp o correo.
- El usuario descarga el PDF directamente.
- El libro contiene el estudio completo de los 150 Salmos.
- Incluye explicación, reflexión, aplicación y oración guiada.
- Es una guía basada en la Biblia.
- Puede estudiarse con cualquier Biblia en casa.
- El proyecto busca acompañar espiritualmente a las personas.

---

FORMA DE APOYO:

El libro se comparte como bendición.

Si la persona desea apoyar el proyecto, puede hacerlo con el monto que sienta en su corazón.

Referencias:
- 70 MXN → gesto de gratitud 💖
- 90 MXN → apoyo al proyecto 💗
- 120 MXN → apoyo especial para llegar a más personas 💞

---

MÉTODOS DE APOYO:

- Transferencia
- Depósito en Oxxo

---

RESPUESTAS IMPORTANTES:

Si preguntan:
"¿Cómo es el envío?"
"¿Es físico?"
"¿Cómo lo recibo?"

Responde:
Es digital en PDF y ya fue enviado por WhatsApp o correo. No hay envío físico.

Después dirige al método de apoyo.

---

Si preguntan:
"¿Qué religión es?"
"¿Es católico?"
"¿Es cristiano?"

Responde:
No es un libro religioso como tal ni pertenece a una religión específica. Es una guía basada en la Biblia que cualquier persona puede estudiar con la Biblia que tenga en casa.

Después dirige al método de apoyo.

---

Si preguntan:
"¿Cuánto cuesta?"
"¿Cuánto vale?"

Responde:
El libro se comparte como bendición y las personas apoyan con el monto que sientan en su corazón usando las referencias 70, 90 y 120 MXN.

Después dirige al método de apoyo.

---

Si dicen:
"Quiero apoyar"
"Sí quiero apoyar"

Agradece brevemente y dirige DIRECTAMENTE al método de apoyo.

---

IMPORTANTE:

SIEMPRE termina EXACTAMENTE llevando a:

"¿Prefieres transferencia o depósito en Oxxo? 🙏"

No uses otra pregunta final.
`;

app.post("/mensaje", async (req, res) => {
  try {
    const { texto } = req.body;

    console.log("Texto recibido:", texto);

    const textoNormalizado = texto.toLowerCase();

    // RESPUESTA DIRECTA TRANSFERENCIA
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

    // RESPUESTA DIRECTA OXXO
    if (
      textoNormalizado.includes("oxxo") ||
      textoNormalizado.includes("depósito") ||
      textoNormalizado.includes("deposito")
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

    // CONSULTA OPENAI
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

    let respuesta = response.output_text;

    // LIMPIAR SALUDOS
    respuesta = respuesta
      .replace(/^¡?Hola[!,. ]*/i, "")
      .replace(/^Buenos días[!,. ]*/i, "")
      .replace(/^Buenas tardes[!,. ]*/i, "")
      .replace(/^Buenas noches[!,. ]*/i, "");

    // ELIMINAR PREGUNTAS ABIERTAS
    respuesta = respuesta
      .replace(/¿Quieres que te cuente.*?\?/gi, "")
      .replace(/¿Quieres saber.*?\?/gi, "")
      .replace(/¿Hay algo más que quieras saber\?/gi, "")
      .replace(/¿Quieres que te ayude.*?\?/gi, "")
      .replace(/¿Quieres que te explique.*?\?/gi, "")
      .replace(/¿Qué más deseas saber\?/gi, "")
      .replace(/¿Deseas más información\?/gi, "");

    // FORZAR CIERRE CORRECTO
    if (
      !respuesta.toLowerCase().includes("transferencia") ||
      !respuesta.toLowerCase().includes("oxxo")
    ) {
      respuesta += "\n\n¿Prefieres transferencia o depósito en Oxxo? 🙏";
    }

    // NORMALIZAR CIERRE FINAL
    respuesta = respuesta.replace(
      /¿Prefieres hacer tu apoyo por transferencia o depósito en Oxxo\?/gi,
      "¿Prefieres transferencia o depósito en Oxxo? 🙏"
    );

    respuesta = respuesta.replace(
      /¿Quieres que te paso los datos\?/gi,
      "¿Prefieres transferencia o depósito en Oxxo? 🙏"
    );

    // RESPUESTA FINAL
    res.json({ respuesta });

  } catch (error) {

    console.error("Error con OpenAI:", error);

    res.status(500).json({
      error: "Error con OpenAI"
    });

  }
});

app.listen(PORT, () => {
  console.log(\`Servidor corriendo en http://localhost:\${PORT}\`);
});
