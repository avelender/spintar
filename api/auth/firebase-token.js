// Импортируем Firebase Admin SDK
import admin from 'firebase-admin';
import { validateUsername } from '../utils/validation.js';

// Добавляем отладочные логи
console.log('🔍 [DEBUG] Переменные окружения:');
console.log('- FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? 'есть' : 'отсутствует');
console.log('- FIREBASE_ADMIN_CLIENT_EMAIL:', process.env.FIREBASE_ADMIN_CLIENT_EMAIL ? 'есть' : 'отсутствует');
console.log('- FIREBASE_ADMIN_PRIVATE_KEY:', process.env.FIREBASE_ADMIN_PRIVATE_KEY ? 'длина: ' + process.env.FIREBASE_ADMIN_PRIVATE_KEY.length : 'отсутствует');

// Инициализируем Firebase Admin SDK, если еще не инициализирован
if (!admin.apps.length) {
  try {
    // Проверяем наличие всех необходимых переменных
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
      throw new Error('Отсутствуют необходимые переменные окружения для Firebase Admin SDK');
    }
    
    // Преобразуем приватный ключ - специальный код для Vercel
    // В Vercel переменные окружения с переносами строк сохраняются как \n
    // Получаем ключ из переменных окружения
    let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    
    console.log('🔍 [DEBUG] Исходный ключ, длина:', privateKey.length);
    
    // Проверяем формат ключа и исправляем его
    
    // 1. Удаляем кавычки, если они есть
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
      console.log('🔍 [DEBUG] Удалили кавычки вокруг ключа');
    }
    
    // 2. Заменяем \n на переносы строк
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
      console.log('🔍 [DEBUG] Заменили \\\\n на \\n');
    }
    
    // 3. Проверяем наличие заголовков
    if (!privateKey.includes('BEGIN PRIVATE KEY') || !privateKey.includes('END PRIVATE KEY')) {
      console.error('❌ [DEBUG] Приватный ключ не содержит необходимых заголовков');
    }
    
    console.log('🔍 [DEBUG] Обработанный ключ, длина:', privateKey.length);
    console.log('🔍 [DEBUG] Количество переносов строк:', (privateKey.match(/\n/g) || []).length);
    
    // Проверяем формат ключа после обработки
    console.log('🔍 [DEBUG] Приватный ключ после обработки, начинается с:', privateKey.substring(0, 20) + '...');
    console.log('🔍 [DEBUG] Количество переносов строк в ключе:', (privateKey.match(/\n/g) || []).length);
    
    // Проверяем, что ключ имеет правильный формат PEM
    if (!privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
      console.error('❌ [DEBUG] Ключ не начинается с -----BEGIN PRIVATE KEY-----');
    }
    
    // Создаем объект с учетными данными
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: privateKey
    };
    
    console.log('🔍 [DEBUG] Инициализируем Firebase Admin SDK с учетными данными:', {
      projectId: serviceAccount.projectId,
      clientEmail: serviceAccount.clientEmail,
      privateKeyLength: serviceAccount.privateKey.length
    });
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
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
        const queryUsername = req.query.username;
        const cookieUsername = cookies.username;
        let userIdentifier = null;

        if (validateUsername(queryUsername)) {
            userIdentifier = queryUsername;
        } else if (validateUsername(cookieUsername)) {
            userIdentifier = cookieUsername;
        } else {
            userIdentifier = 'guest_' + Math.random().toString(36).substring(2, 10);
        }

        console.log(`🔐 [DEBUG] Имя пользователя/идентификатор (валид.): ${userIdentifier}`);

        // Создаем кастомный токен Firebase
        try {
            // Проверяем, инициализирован ли Firebase Admin SDK
            if (!admin.apps.length) {
                console.error('❌ [DEBUG] Firebase Admin SDK не инициализирован');
                throw new Error('Firebase Admin SDK не инициализирован');
            }
            
            // Ограничиваем длину идентификатора до 128 символов (ограничение Firebase)
            if (userIdentifier.length > 128) {
                userIdentifier = userIdentifier.substring(0, 128);
                console.log(`🔐 [DEBUG] Идентификатор обрезан до 128 символов: ${userIdentifier}`);
            }
            
            // На этом этапе userIdentifier либо валидное имя (нашими правилами), либо guest_*
            
            console.log(`🔐 [DEBUG] Создаем токен для пользователя: ${userIdentifier}`);
            const firebaseToken = await admin.auth().createCustomToken(userIdentifier);
            console.log(`✅ Создан Firebase токен длиной: ${firebaseToken.length}`);

            // Проверяем окружение для добавления флага Secure
            const isProduction = process.env.NODE_ENV === 'production';
            
            // Устанавливаем токен в cookie
            res.setHeader('Set-Cookie', [
                `firebase_token=${firebaseToken}; HttpOnly; SameSite=Lax; Path=/; Max-Age=3600${isProduction ? '; Secure' : ''}`
            ]);
            
            // Также возвращаем токен в ответе
            res.status(200).json({ success: true, token: firebaseToken });
        } catch (tokenError) {
            console.error('❌ Ошибка создания токена:', tokenError);
            res.status(500).json({ error: 'Failed to create Firebase token', message: tokenError.message });
        }
    } catch (error) {
        console.error('❌ Ошибка генерации Firebase token:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
