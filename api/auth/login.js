// Инициация OAuth2 авторизации через орбитар
export default function handler(req, res) {
    // Разрешаем только GET запросы
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const clientId = process.env.CLIENT_ID;
        const redirectUri = process.env.REDIRECT_URI;
        
        if (!clientId || !redirectUri) {
            console.error('❌ Отсутствуют переменные окружения CLIENT_ID или REDIRECT_URI');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Генерируем случайный state для защиты от CSRF
        const state = Math.random().toString(36).substring(2, 15) + 
                     Math.random().toString(36).substring(2, 15);
        
        // Сохраняем state в cookie для проверки при callback
        res.setHeader('Set-Cookie', [
            `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/`
        ]);

        // Формируем URL для авторизации на орбитаре
        const authUrl = new URL('https://orbitar.space/oauth2/authorize');
        authUrl.searchParams.set('client_id', clientId);
        authUrl.searchParams.set('scope', 'user');
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('state', state);
        authUrl.searchParams.set('response_type', 'code');

        console.log('🚀 Redirecting to Orbitar OAuth2:', authUrl.toString());

        // Редиректим пользователя на страницу авторизации орбитара
        res.redirect(302, authUrl.toString());

    } catch (error) {
        console.error('❌ Ошибка при инициации OAuth2:', error);
        res.status(500).json({ error: 'Failed to initiate OAuth2 flow' });
    }
}
