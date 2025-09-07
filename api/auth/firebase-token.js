// Импортируем Firebase Admin SDK
import admin from 'firebase-admin';

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
    // Используем жестко заданный ключ для отладки
    const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCpBSXIbffSJB/q
/C9Ol9YdfxXc3U+uCO6LHe3ZwBNFAsVX0mdfQZuI6K9ik5C7O2Snau2NTONZCZIr
BzqO/kbwSxip1OTstJnIV+6Z8kE3K3QQTcPLaf4ed44wAFM6DCcLQEGMbG/85ovv
+ye5BEuQEs9FV8BpwtKKcplM2S4apnTdzXZGaDcoZGjRwu5wNUZg02k//Hz8lsvo
/wmMpOoFEPS/qXOwapV2ky8hAKjYJv+hoN+De0D3HhYptixAHQEM29oCYC+w5PqP
3ILdLInKcyb24bYYqbgkHbWFa7SjtwATzlMm0SYAYr7bMlnMbJkb9wjO6qvLzub2
Yrk/iCE9AgMBAAECggEAHtMBgPwNJhXQfFphhkPKmLaEljMGRQb7+gMLTZrp6LwI
oWuNzqF4bA+DbMbcrki2opGtoQdUrvg/3/kBhPJ6nXgUl2RsG38UTKU8rnavzg/u
qsqD2qUJ4ySKmdZ1VzDALh0Z1zIvej/RZYK4S9Wssim8AzltrdwJ6ZXcv1ccQV+u
L9qt2QxMPpcSJtWeeU/udtVXIEF302wjaL7NCPdhDj+p/ZW6Xg2qWeD/bLMD/HEW
Dr60WknSOLtgyGrBKkOjTEqoYab+W9r3hP+jMfqtwzDWVNCRrn6Gt4yIAzIz3ODi
9GtcKN20DmBZ7ythnIeHgjGyETo8BTP3dNpQsv48AQKBgQDSn4DwVTRshcbRW2eV
rJsHcEwq7m3kN3ep4xrvS2kF5ntmHmGCFfnOemMT+Q9lQJPuV8t+Ug8QZRqvbndW
OmmsThpB7uHOxVtPVOBiLTiIIWZNDeF5s54sJFM+Id02wKSFlmC0oT/FAjJaPHUG
9kilH3OcD0wIICR+v8twdWQBDQKBgQDNbx2fOPPvaf+W0mC3X5ErQrIgCm7lFpms
tq3U3LoiXv9GuJdH4jyBmOdA5x58fhsRSsJ27vok3R3trPKM6zWcXy+AgjNTflus
mhpz7gc0FV/so0jAA162XUeQEcYzijXH09Nj1C23x/KHPlNpSRffN0Lnt3lX8euX
qQQlNL608QKBgQCUz91p8Ml5Y4t1n/8v4SQnvVAThSJffFEv1yXQrJcndBD7tbtv
DdfR6ubV1cLq5xWd8Kn2NkQucUDJcmMeqWbANu6WZxFj5kz9YBqpQwoOJIsDJiuI
sT+wMHogDA0gAjw7pmPtO4Cy0TqCRvToVlo9UFt+h9BQbWVbqGc0rbxagQKBgD6u
FH+sROFbmhxOfCv3ALgOVYLpLATB7ImCA2/bGP+7tG/DioToRkXUfVqUKf0aDPAt
uz/GkpQE00jdZ/QPIABiGoA/OaHT/+yd6ExO5+vASdBN0bikTpWdyGPwyGSZWudp
fioLZxeX7ivNnG2XW61DkypYFLH8okFX1Gf1u+pBAoGBALhGUsvDJobgTmZWUMaK
yd/TDOb8JWYNRYlf4mhYmbTw9T6Uk9u6BaKNnXsBU2o+tE5mW+MIfK9YKTxa4qjP
HI1f5G8CtYf7wPJvMffgAHX2oLzPn7OV/Xm1WJNoW1n4B5s2v+BNuqFVGrdd/1yJ
wHHyCyPu7RTCSULi1O9tkOrw
-----END PRIVATE KEY-----`;
    
    console.log('🔍 [DEBUG] Используем встроенный ключ для отладки');
    console.log('🔍 [DEBUG] Длина ключа:', privateKey.length);
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
        let userIdentifier = req.query.username || cookies.username || 'guest_' + Math.random().toString(36).substring(2, 10);
        
        console.log(`🔐 [DEBUG] Имя пользователя/идентификатор: ${userIdentifier}`);

        // Создаем кастомный токен Firebase
        try {
            // Проверяем, инициализирован ли Firebase Admin SDK
            if (!admin.apps.length) {
                console.error('❌ [DEBUG] Firebase Admin SDK не инициализирован');
                throw new Error('Firebase Admin SDK не инициализирован');
            }
            
            // Проверяем длину идентификатора пользователя
            if (!userIdentifier || userIdentifier.length < 1) {
                userIdentifier = 'guest_' + Math.random().toString(36).substring(2, 10);
                console.log(`🔐 [DEBUG] Используем случайный идентификатор: ${userIdentifier}`);
            }
            
            // Ограничиваем длину идентификатора до 128 символов (ограничение Firebase)
            if (userIdentifier.length > 128) {
                userIdentifier = userIdentifier.substring(0, 128);
                console.log(`🔐 [DEBUG] Идентификатор обрезан до 128 символов: ${userIdentifier}`);
            }
            
            // Удаляем недопустимые символы из идентификатора
            userIdentifier = userIdentifier.replace(/[^a-zA-Z0-9_-]/g, '_');
            console.log(`🔐 [DEBUG] Очищенный идентификатор: ${userIdentifier}`);
            
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
