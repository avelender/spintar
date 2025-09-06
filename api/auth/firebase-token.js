// Импортируем Firebase Admin SDK
import admin from 'firebase-admin';

// Добавляем отладочные логи
console.log('🔍 [DEBUG] Переменные окружения:');
console.log('- FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? 'есть' : 'отсутствует');
console.log('- FIREBASE_ADMIN_CLIENT_EMAIL:', process.env.FIREBASE_ADMIN_CLIENT_EMAIL ? 'есть' : 'отсутствует');
console.log('- FIREBASE_ADMIN_PRIVATE_KEY:', process.env.FIREBASE_ADMIN_PRIVATE_KEY ? 'есть' : 'отсутствует');

// Инициализируем Firebase Admin SDK, если еще не инициализирован
if (!admin.apps.length) {
  try {
    // Проверяем наличие всех необходимых переменных
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
      throw new Error('Отсутствуют необходимые переменные окружения для Firebase Admin SDK');
    }
    
    // Преобразуем приватный ключ
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n');
    console.log('🔍 [DEBUG] Приватный ключ начинается с:', privateKey.substring(0, 20) + '...');
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: privateKey,
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

        // Получаем имя пользователя из параметров запроса или из cookie
        console.log('🔐 [DEBUG] Получаем имя пользователя');
        
        // Пробуем получить имя пользователя из разных источников
        let userIdentifier = req.query.username || cookies.username || 'guest_' + Math.random().toString(36).substring(2, 10);
        
        console.log(`🔐 [DEBUG] Имя пользователя/идентификатор: ${userIdentifier}`);

        // Создаем кастомный токен Firebase
        try {
            const firebaseToken = await admin.auth().createCustomToken(userIdentifier);
            console.log(`✅ Создан Firebase токен для пользователя: ${userIdentifier}`);

            // Проверяем окружение для добавления флага Secure
            const isProduction = process.env.NODE_ENV === 'production';
            
            // Устанавливаем токен в cookie
            res.setHeader('Set-Cookie', [
                `firebase_token=${firebaseToken}; HttpOnly; SameSite=Lax; Path=/; Max-Age=3600${isProduction ? '; Secure' : ''}`
            ]);

            res.status(200).json({ success: true });
        } catch (tokenError) {
            console.error('❌ Ошибка создания токена:', tokenError);
            res.status(500).json({ error: 'Failed to create Firebase token' });
        }
    } catch (error) {
        console.error('❌ Ошибка генерации Firebase token:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
