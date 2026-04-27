export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Método no permitido" });
    }

    // Cambiamos 'pregunta' por 'message' para que coincida con tu nuevo index.html
    const { message } = req.body; 
    const API_KEY = process.env.GEMINI_KEY;

    if (!API_KEY) {
        return res.status(500).json({ error: "Configuración incompleta" });
    }

    // Usamos el modelo Flash Lite para respuesta instantánea (baja latencia)
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${API_KEY}`;

    // NUEVO: Instrucción de personalidad para que la voz no sea aburrida
    const instruccionesPersonalidad = `
        Actúa como un mentor de programación senior, entusiasta y muy humano. 
        IMPORTANTE: 
        1. Tus respuestas deben ser MUY breves (máximo 2 o 3 frases).
        2. Usa un tono alegre. Di cosas como "¡Dale, yo te ayudo!", "¡Eso está pulento!", "Mira, fíjate en esto:".
        3. No expliques todo el código, solo lo más importante para que la lectura de voz sea rápida.
    `;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ 
                        text: `${instruccionesPersonalidad}\n\nPregunta de Joaquín: ${message}` 
                    }]
                }],
                generationConfig: {
                    temperature: 0.8, // Un poco más de "creatividad" y calidez
                    maxOutputTokens: 150 // Forzamos a que no escriba testamentos
                }
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(400).json({ error: data.error.message });
        }

        // Extraemos solo el texto de la respuesta para que el frontend lo lea fácil
        const replyText = data.candidates[0].content.parts[0].text;
        return res.status(200).json({ reply: replyText });

    } catch (error) {
        return res.status(500).json({ error: "Error de conexión." });
    }
}