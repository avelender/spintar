// Получение профиля пользователя через API орбитара
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

        if (!accessToken) {
            return res.status(401).json({ error: 'No access token found' });
        }

        // Декодируем JWT токен для получения username
        let username;
        try {
            const tokenParts = accessToken.split('.');
            if (tokenParts.length === 3) {
                const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
                username = payload.username || payload.sub || payload.user;
            }
        } catch (error) {
            console.log('❌ Не удалось декодировать JWT токен');
        }

        // Если не удалось получить username из токена, пробуем без параметров
        const requestBody = username ? { username } : {};

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
        
        // Проверяем, что получили необходимые данные
        if (!profileData.username) {
            console.error('❌ Некорректный ответ API - отсутствует username');
            return res.status(500).json({ error: 'Invalid profile data' });
        }

        console.log('✅ Профиль пользователя получен:', profileData.username);

        // Возвращаем только необходимые данные (без лишней информации)
        res.status(200).json({
            username: profileData.username,
            displayName: profileData.display_name || profileData.username,
            avatar: profileData.avatar_url || null,
            id: profileData.id
        });

    } catch (error) {
        console.error('❌ Ошибка при получении профиля:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
