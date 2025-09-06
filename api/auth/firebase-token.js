// Импортируем Firebase Admin SDK
import admin from 'firebase-admin';

// Инициализируем Firebase Admin SDK, если еще не инициализирован
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('✅ Firebase Admin SDK успешно инициализирован');
  } catch (error) {
    console.error('❌ Ошибка инициализации Firebase Admin SDK:', error);
  }
}

// API endpoint для генерации Firebase custom token
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Получаем access_token из cookie
        const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            acc[key] = value;
            return acc;
        }, {}) || {};

        const accessToken = cookies.access_token;

        if (!accessToken) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        // Получаем данные пользователя из API профиля
        const profileResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/profile`, {
            headers: {
                cookie: `access_token=${accessToken}`
            }
        });

        if (!profileResponse.ok) {
            return res.status(401).json({ error: 'Failed to get user profile' });
        }

        const userData = await profileResponse.json();
        const { username } = userData;

        if (!username) {
            return res.status(401).json({ error: 'No username found' });
        }

        // Создаем кастомный токен Firebase
        const firebaseToken = await admin.auth().createCustomToken(username);
        console.log(`✅ Создан Firebase токен для пользователя: ${username}`);

        // Проверяем окружение для добавления флага Secure
        const isProduction = process.env.NODE_ENV === 'production';
        
        // Устанавливаем токен в cookie
        res.setHeader('Set-Cookie', [
            `firebase_token=${firebaseToken}; HttpOnly; SameSite=Lax; Path=/; Max-Age=3600${isProduction ? '; Secure' : ''}`
        ]);

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('❌ Ошибка генерации Firebase token:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
