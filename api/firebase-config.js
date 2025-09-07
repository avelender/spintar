// API endpoint для получения Firebase конфигурации и CSRF-токена
import { setCsrfToken } from './utils/csrf';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Возвращаем Firebase конфигурацию из environment variables
        const firebaseConfig = {
            apiKey: process.env.FIREBASE_API_KEY,
            authDomain: `${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
            projectId: process.env.FIREBASE_PROJECT_ID,
            storageBucket: `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`,
            messagingSenderId: "109301915648", // Это можно оставить хардкод
            appId: "1:109301915648:web:dfb093e59e0085939cf8e5" // Это тоже можно хардкод
        };

        // Проверяем что все нужные переменные есть
        if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
            console.error('❌ Отсутствуют Firebase environment variables');
            return res.status(500).json({ error: 'Firebase configuration missing' });
        }

        // Генерируем и устанавливаем CSRF-токен
        const csrfToken = setCsrfToken(req, res);
        
        // Возвращаем Firebase конфигурацию и CSRF-токен
        res.status(200).json({ firebaseConfig, csrfToken });
    } catch (error) {
        console.error('❌ Ошибка получения Firebase config:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
