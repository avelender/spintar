// API для получения профиля пользователя и CSRF-токена
import { setCsrfToken } from './utils/csrf';

export default async function handler(req, res) {
    // Разрешаем только GET запросы
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Получаем access_token из cookies
        const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            acc[key] = value;
            return acc;
        }, {}) || {};

        const accessToken = cookies.access_token;
        console.log('🔍 [DEBUG] Access token exists:', !!accessToken);
        console.log('🔍 [DEBUG] Access token length:', accessToken?.length);
        console.log('🔍 [DEBUG] Token first 50 chars:', accessToken?.substring(0, 50));

        if (!accessToken) {
            console.log('❌ [DEBUG] No access token found in cookies');
            return res.status(401).json({ error: 'No access token found' });
        }

        // Декодируем JWT токен для получения username
        let username;
        let decodedPayload;
        try {
            const tokenParts = accessToken.split('.');
            console.log(' [DEBUG] Token parts count:', tokenParts.length);
            
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
            username = payload.user?.username || payload.username || payload.sub;
            console.log(' [DEBUG] Extracted username:', username);
        } catch (error) {
            console.log(' [DEBUG] JWT decode error:', error.message);
        }

        // Если не удалось получить username из токена, пробуем без параметров
        const requestBody = username ? { username } : {};
        console.log('🔍 [DEBUG] Request body for API:', JSON.stringify(requestBody));

        console.log('🚀 [DEBUG] Making API request to /api/v1/user/profile');
        
        // Запрашиваем профиль пользователя через API орбитара
        const profileResponse = await fetch('https://api.orbitar.space/api/v1/user/profile', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': 'SpinTar-Game/1.0',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('📡 [DEBUG] API Response status:', profileResponse.status);
        console.log('📡 [DEBUG] API Response headers:', Object.fromEntries(profileResponse.headers.entries()));

        if (!profileResponse.ok) {
            const errorText = await profileResponse.text();
            console.error('❌ Ошибка получения профиля:', profileResponse.status, errorText);
            
            // Если токен недействителен (401), пытаемся обновить через refresh token
            if (profileResponse.status === 401) {
                return res.status(401).json({ error: 'Token expired', needRefresh: true });
            }
            
            return res.status(profileResponse.status).json({ error: 'Failed to get user profile' });
        }

        const profileData = await profileResponse.json();
        console.log('🔍 [DEBUG] Full API response:', JSON.stringify(profileData, null, 2));
        
        // Проверяем структуру ответа
        
        // Проверяем структуру ответа API
        if (!profileData.payload || !profileData.payload.profile) {
            console.error('❌ Некорректный ответ API - отсутствует payload.profile');
            return res.status(500).json({ error: 'Invalid profile data structure' });
        }

        const userProfile = profileData.payload.profile;
        console.log('✅ Профиль пользователя получен:', userProfile.username);

        // Централизованно устанавливаем CSRF-токен
        const csrfToken = setCsrfToken(req, res);
        
        // Возвращаем только необходимые данные (без лишней информации)
        res.status(200).json({
            username: userProfile.username,
            displayName: userProfile.display_name || userProfile.username,
            avatar: userProfile.avatar_url || null,
            id: userProfile.id,
            csrfToken: csrfToken // Добавляем CSRF-токен в ответ
        });

    } catch (error) {
        console.error('❌ Ошибка при получении профиля:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
