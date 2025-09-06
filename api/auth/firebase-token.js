// API endpoint для получения Firebase custom token
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Извлекаем Firebase token из cookie
        const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            acc[key] = value;
            return acc;
        }, {}) || {};

        const firebaseToken = cookies.firebase_token;

        if (!firebaseToken) {
            return res.status(401).json({ error: 'No Firebase token found' });
        }

        res.status(200).json({ firebaseToken });
    } catch (error) {
        console.error('❌ Ошибка получения Firebase token:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
