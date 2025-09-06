// Инициация OAuth2 авторизации через орбитар
export default function handler(req, res) {
    // Разрешаем только GET запросы
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const clientId = process.env.CLIENT_ID;
        const redirectUri = process.env.REDIRECT_URI;
        
        console.log('🔍 [DEBUG] Environment variables:');
        console.log('- CLIENT_ID:', clientId ? `${clientId.substring(0, 8)}...` : 'MISSING');
        console.log('- REDIRECT_URI:', redirectUri);
        
        if (!clientId || !redirectUri) {
            console.error('❌ Отсутствуют переменные окружения CLIENT_ID или REDIRECT_URI');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Генерируем случайный state для защиты от CSRF
        const state = Math.random().toString(36).substring(2, 15) + 
                     Math.random().toString(36).substring(2, 15);
        
        // Проверяем окружение для добавления флага Secure
        const isProduction = process.env.NODE_ENV === 'production';
        console.log(`🔒 Cookies security: ${isProduction ? 'PRODUCTION with Secure flag' : 'DEVELOPMENT without Secure flag'}`);
        
        // Сохраняем state в cookie для проверки при callback
        const cookieOptions = {
            httpOnly: true,
            sameSite: 'Lax',
            path: '/',
            maxAge: 600,
            secure: isProduction // Secure флаг только в production
        };
        
        const cookieString = `oauth_state=${state}; HttpOnly; SameSite=${cookieOptions.sameSite}; Path=${cookieOptions.path}; Max-Age=${cookieOptions.maxAge}${isProduction ? '; Secure' : ''}`;
        
        res.setHeader('Set-Cookie', [cookieString]);

        // Формируем URL для авторизации на орбитаре (строго по документации)
        const authUrl = `https://orbitar.space/oauth2/authorize?` +
            `client_id=${encodeURIComponent(clientId)}&` +
            `scope=${encodeURIComponent('user:profile')}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `state=${encodeURIComponent(state)}`;

        console.log('🚀 Redirecting to Orbitar OAuth2:', authUrl);

        // Редиректим пользователя на страницу авторизации орбитара
        res.redirect(302, authUrl);

    } catch (error) {
        console.error('❌ Ошибка при инициации OAuth2:', error);
        res.status(500).json({ error: 'Failed to initiate OAuth2 flow' });
    }
}
