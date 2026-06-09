export const config = {
    api: {
      bodyParser: false,
    },
  };
  
  export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
    }
  
    try {
      // Read raw body
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const rawBody = Buffer.concat(chunks);
  
      // Forward to OpenAI with same Content-Type (multipart/form-data with boundary)
      const contentType = req.headers['content-type'];
  
      const response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': contentType,
        },
        body: rawBody,
      });
  
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (err) {
      console.error('Image edit proxy error:', err);
      return res.status(500).json({ error: err.message });
    }
  }