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

        const response = await fetch('https://api.imagga.com/v2/colors', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(`\({apiKey}:\){apiSecret}`).toString('base64')}`,
                'Content-Type': req.headers['content-type'] // Pass along the form data boundary
            },
            body: req
        });

        const data = await response.json();
        
        return res.status(response.status).json(data);

    } catch (error) {
        return res.status(500).json({ error: `Backend error: ${error.message}` });
    }
}
