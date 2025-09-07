// Импортируем Firebase Admin SDK
import admin from 'firebase-admin';
// Импортируем функции валидации
import { validateUsername, sanitizeString } from '../../utils/validation';

// Добавляем отладочные логи только в режиме разработки
if (process.env.NODE_ENV !== 'production') {
  console.log('🔍 [DEBUG] Переменные окружения:');
  console.log('- FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? 'есть' : 'отсутствует');
  console.log('- FIREBASE_ADMIN_CLIENT_EMAIL:', process.env.FIREBASE_ADMIN_CLIENT_EMAIL ? 'есть' : 'отсутствует');
  console.log('- FIREBASE_ADMIN_PRIVATE_KEY:', process.env.FIREBASE_ADMIN_PRIVATE_KEY ? 'есть' : 'отсутствует');
}

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
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 [DEBUG] Приватный ключ присутствует');
    }
    
    // Проверяем формат ключа и исправляем его
    
    // 1. Удаляем кавычки, если они есть
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔍 [DEBUG] Удалили кавычки вокруг ключа');
      }
    }
    
    // 2. Заменяем \n на переносы строк
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔍 [DEBUG] Заменили \\n на \n');
      }
    }
    
    // 3. Проверяем наличие заголовков
    if (!privateKey.includes('BEGIN PRIVATE KEY') || !privateKey.includes('END PRIVATE KEY')) {
      console.error('❌ [DEBUG] Приватный ключ не содержит необходимых заголовков');
    }
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 [DEBUG] Ключ обработан');
      console.log('🔍 [DEBUG] Количество переносов строк:', (privateKey.match(/\n/g) || []).length);
    }
    
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
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 [DEBUG] Инициализируем Firebase Admin SDK с учетными данными:', {
        projectId: serviceAccount.projectId,
        clientEmail: serviceAccount.clientEmail?.substring(0, 5) + '...',
        privateKeyExists: !!serviceAccount.privateKey
      });
    }
    
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
        
        if (process.env.NODE_ENV !== 'production') {
            console.log(`🔐 [DEBUG] Имя пользователя/идентификатор получен`);
        }

        // Создаем кастомный токен Firebase
        try {
            // Проверяем, инициализирован ли Firebase Admin SDK
            if (!admin.apps.length) {
                console.error('❌ [DEBUG] Firebase Admin SDK не инициализирован');
                throw new Error('Firebase Admin SDK не инициализирован');
            }
            
            // Проверяем и валидируем идентификатор пользователя
            if (!userIdentifier || userIdentifier.length < 1) {
                userIdentifier = 'guest_' + Math.random().toString(36).substring(2, 10);
                console.log(`🔐 [DEBUG] Используем случайный идентификатор: ${userIdentifier}`);
            } else {
                try {
                    // Сначала санитизируем строку
                    userIdentifier = sanitizeString(userIdentifier);
                    
                    // Проверяем соответствие требованиям (2-20 символов, только буквы, цифры, _, -)
                    if (!validateUsername(userIdentifier)) {
                        // Если не соответствует требованиям, преобразуем в допустимый формат
                        userIdentifier = userIdentifier.replace(/[^a-zA-Z0-9_-]/g, '_');
                        
                        // Ограничиваем длину от 2 до 20 символов
                        if (!userIdentifier || userIdentifier.length < 2) {
                            userIdentifier = 'guest_' + Math.random().toString(36).substring(2, 10);
                        } else if (userIdentifier.length > 20) {
                            userIdentifier = userIdentifier.substring(0, 20);
                        }
                        
                        if (process.env.NODE_ENV !== 'production') {
                            console.log(`🔐 [DEBUG] Идентификатор преобразован в допустимый формат`);
                        }
                    }
                } catch (validationError) {
                    // В случае ошибки валидации используем гостевой идентификатор
                    console.error('❌ Ошибка валидации идентификатора:', validationError);
                    userIdentifier = 'guest_' + Math.random().toString(36).substring(2, 10);
                }
            }
            
            // Дополнительная проверка для Firebase (максимум 128 символов)
            if (userIdentifier.length > 128) {
                userIdentifier = userIdentifier.substring(0, 128);
                console.log(`🔐 [DEBUG] Идентификатор обрезан до 128 символов: ${userIdentifier}`);
            }
            if (process.env.NODE_ENV !== 'production') {
                console.log(`🔐 [DEBUG] Идентификатор очищен`);
            }
            
            if (process.env.NODE_ENV !== 'production') {
                console.log(`🔐 [DEBUG] Создаем токен для пользователя`);
            }
            const firebaseToken = await admin.auth().createCustomToken(userIdentifier);
            if (process.env.NODE_ENV !== 'production') {
                console.log(`✅ Создан Firebase токен`);
            }

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
