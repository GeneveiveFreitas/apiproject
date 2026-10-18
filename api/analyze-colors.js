if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const apiKey = process.env.API_KEY;
        const apiSecret = process.env.SECRET_API_KEY;
        const chunks = [];

        for await (const chunk of req) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }

        const image = Buffer.concat(chunks);
        if (image.length === 0) {
            return res.status(400).json({ error: 'Please upload an image.' });
        }

        const formData = new FormData();
        formData.append(
            'image_upload',
            new Blob([image], { type: req.headers['content-type'] || 'application/octet-stream' }),
            'image'
        );

        const response = await fetch('https://api.imagga.com/v2/colors', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`
            },
            body: formData
        });

        const data = await response.json();
        
        return res.status(response.status).json(data);

    } catch (error) {
        return res.status(500).json({ error: `Backend error: ${error.message}` });
    }
}