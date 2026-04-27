export default async function handler(req, res) {
    // 1. Solo permitir peticiones POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Método no permitido" });
    }

    const { pregunta, instruccion } = req.body;
    const API_KEY = process.env.GEMINI_KEY;

    // 2. Verificación de seguridad de la API Key
    if (!API_KEY) {
        console.error("ERROR: GEMINI_KEY no configurada en las variables de Vercel");
        return res.status(500).json({ error: "Configuración del servidor incompleta" });
    }

    // 3. URL sincronizada con tu Google AI Studio (Modelo 2.5)
    // Usamos /v1/ que es la ruta más estable para producción
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${API_KEY}`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ 
                        text: `INSTRUCCIÓN DE ROL: ${instruccion}\n\nCONTESTA A ESTO: ${pregunta}` 
                    }]
                }],
                // Ajustes opcionales para mejorar la creatividad de la respuesta
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.8,
                    topK: 40
                }
            })
        });

        const data = await response.json();

        // 4. Manejo de errores de cuota o de modelo
        if (data.error) {
            console.error("Error desde Google API:", data.error.message);
            
            // Si es error de cuota (429), avisamos amigablemente
            if (data.error.code === 429) {
                return res.status(429).json({ 
                    error: "Se agotó la cuota gratuita de hoy. Intenta de nuevo en unos minutos." 
                });
            }
            
            return res.status(400).json({ error: data.error.message });
        }

        // 5. Enviar la respuesta exitosa
        return res.status(200).json(data);

    } catch (error) {
        console.error("Error crítico en la función Lambda:", error);
        return res.status(500).json({ error: "El servidor de LexiCode tuvo un problema de conexión." });
    }
}