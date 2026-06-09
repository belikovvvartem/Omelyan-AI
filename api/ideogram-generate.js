export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const apiKey = process.env.IDEOGRAM_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'IDEOGRAM_API_KEY not configured' });
    }
  
    try {
      const response = await fetch('https://api.ideogram.ai/generate', {
        method: 'POST',
        headers: {
          'Api-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });
  
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (err) {
      console.error('Ideogram generate proxy error:', err);
      return res.status(500).json({ error: err.message });
    }
  }