export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }
  
    try {
      const { prompt, imageBase64, imageMime } = req.body;
  
      // Use Gemini 2.0 Flash image generation (imagen-3 via generateContent with image output)
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`;
  
      const requestBody = {
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: imageMime || 'image/jpeg',
                  data: imageBase64,
                }
              },
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          responseModalities: ['Text', 'Image'],
        }
      };
  
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        console.error('Gemini API error:', data);
        return res.status(response.status).json({ error: data.error?.message || 'Gemini API error' });
      }
  
      // Extract image from response
      const parts = data.candidates?.[0]?.content?.parts || [];
      const imagePart = parts.find(p => p.inline_data?.mime_type?.startsWith('image/'));
  
      if (!imagePart) {
        console.error('No image in Gemini response:', JSON.stringify(data).slice(0, 500));
        return res.status(500).json({ error: 'Gemini не повернув зображення' });
      }
  
      return res.status(200).json({
        imageBase64: imagePart.inline_data.data,
        imageMime: imagePart.inline_data.mime_type,
      });
  
    } catch (err) {
      console.error('Gemini proxy error:', err);
      return res.status(500).json({ error: err.message });
    }
  }