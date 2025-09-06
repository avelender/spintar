// Обработка callback после авторизации OAuth2 от орбитара
export default async function handler(req, res) {
    // Разрешаем только GET запросы
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('🔍 [DEBUG] Callback invoked');
        console.log('🔍 [DEBUG] Request method:', req.method);
        console.log('🔍 [DEBUG] Request URL:', req.url);
        console.log('🔍 [DEBUG] Query params:', JSON.stringify(req.query, null, 2));
        console.log('🔍 [DEBUG] Headers:', JSON.stringify(req.headers, null, 2));
        
        const { code, state, error } = req.query;
        
        console.log('🔍 [DEBUG] Extracted params:');
        console.log('  - code:', code);
        console.log('  - state:', state); 
        console.log('  - error:', error);
        
        // Проверяем, если пользователь отклонил авторизацию
        if (error) {
            console.error('❌ OAuth2 error:', error);
            return res.redirect('/?error=access_denied');
        }

        if (!code || !state) {
            console.error('❌ Отсутствует code или state в callback');
            console.error('❌ All query params:', Object.keys(req.query));
            return res.redirect('/?error=invalid_request');
        }

        // Получаем сохраненный state из cookie
        const requestCookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            acc[key] = value;
            return acc;
        }, {}) || {};

        const savedState = requestCookies.oauth_state;

        // Проверяем state для защиты от CSRF
        if (!savedState || savedState !== state) {
            console.error('❌ State mismatch - возможная CSRF атака');
            return res.redirect('/?error=state_mismatch');
        }

        const clientId = process.env.CLIENT_ID;
        const clientSecret = process.env.CLIENT_SECRET;
        const redirectUri = process.env.REDIRECT_URI;

        if (!clientId || !clientSecret || !redirectUri) {
            console.error('❌ Отсутствуют переменные окружения');
            return res.redirect('/?error=server_config');
        }

        // Обмениваем authorization code на access token
        const tokenResponse = await fetch('https://api.orbitar.space/api/v1/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'SpinTar-Game/1.0'
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri,
                client_id: clientId,
                client_secret: clientSecret
            })
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('❌ Ошибка получения токена:', tokenResponse.status, errorText);
            return res.redirect('/?error=token_exchange_failed');
        }

        const tokenData = await tokenResponse.json();
        console.log('🔍 [DEBUG] Token response:', JSON.stringify(tokenData, null, 2));
        
        const { access_token, refresh_token, expires_in } = tokenData;

        if (!access_token) {
            console.error('❌ Не получен access_token');
            return res.redirect('/?error=no_access_token');
        }

        console.log('🔍 [DEBUG] Tokens received:');
        console.log('  - access_token length:', access_token.length);
        console.log('  - refresh_token exists:', !!refresh_token);
        console.log('  - expires_in:', expires_in);

        // Устанавливаем токены в HttpOnly cookies для безопасности
        const maxAge = expires_in ? expires_in * 1000 : 3600 * 1000; // 1 час по умолчанию
        
        // Пробуем без Secure для Vercel
        const responseCookies = [
            `access_token=${access_token}; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(maxAge/1000)}; Path=/`,
            `oauth_state=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/` // удаляем state cookie
        ];

        if (refresh_token) {
            responseCookies.push(`refresh_token=${refresh_token}; HttpOnly; SameSite=Lax; Max-Age=2592000; Path=/`); // 30 дней
        }

        console.log('🔍 [DEBUG] Setting cookies:', responseCookies);
        res.setHeader('Set-Cookie', responseCookies);

        console.log('✅ OAuth2 авторизация успешна');

        // Редиректим обратно в игру с успешным статусом
        res.redirect('/?auth=success');

    } catch (error) {
        console.error('❌ Ошибка в callback:', error);
        res.redirect('/?error=callback_error');
    }
}
