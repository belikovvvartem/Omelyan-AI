import { IncomingForm } from 'formidable';
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

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
    // Parse incoming multipart form
    const form = new IncomingForm({ maxFileSize: 20 * 1024 * 1024 });
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    // Rebuild FormData to forward to OpenAI
    const fd = new FormData();

    // Append fields (model, prompt, n, size, etc.)
    for (const [key, value] of Object.entries(fields)) {
      const val = Array.isArray(value) ? value[0] : value;
      fd.append(key, val);
    }

    // Append files — OpenAI expects the field name 'image[]'
    const imageFiles = files['image[]'] || files['image'];
    if (imageFiles) {
      const arr = Array.isArray(imageFiles) ? imageFiles : [imageFiles];
      for (const f of arr) {
        fd.append('image[]', fs.createReadStream(f.filepath), {
          filename: f.originalFilename || 'image.png',
          contentType: f.mimetype || 'image/png',
        });
      }
    }

    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        ...fd.getHeaders(),
      },
      body: fd,
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error('OpenAI image edit proxy error:', err);
    return res.status(500).json({ error: 'Proxy error' });
  }
}