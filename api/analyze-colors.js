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

        if (!apiKey || !apiSecret) {
            return res.status(500).json({ error: 'Image analysis credentials are not configured.' });
        }

        const { image, contentType } = req.body || {};
        if (typeof image !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(image)) {
            return res.status(400).json({ error: 'Please upload an image.' });
        }

        const imageBuffer = Buffer.from(image, 'base64');
        if (imageBuffer.length === 0) {
            return res.status(400).json({ error: 'Please upload an image.' });
        }

        const formData = new FormData();
        formData.append(
            'image_upload',
            new Blob([imageBuffer], {
                type: typeof contentType === 'string' && contentType.startsWith('image/')
                    ? contentType
                    : 'application/octet-stream'
            }),
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