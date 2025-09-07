// Обновление access token через refresh token
import { getCsrfTokenFromCookie, validateCsrfToken } from '../utils/csrf';

export default async function handler(req, res) {
    // Разрешаем только POST запросы
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Проверяем CSRF-токен
    const cookieToken = getCsrfTokenFromCookie(req);
    const requestToken = req.headers['x-csrf-token'];
    
    if (!validateCsrfToken(requestToken, cookieToken)) {
        console.error('❌ CSRF validation failed in refresh');
        return res.status(403).json({ error: 'CSRF validation failed' });
    }

    try {
        // Получаем refresh_token из cookies
        const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            acc[key] = value;
            return acc;
        }, {}) || {};

        const refreshToken = cookies.refresh_token;

        if (!refreshToken) {
            return res.status(401).json({ error: 'No refresh token found' });
        }

        const clientId = process.env.CLIENT_ID;
        const clientSecret = process.env.CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            console.error('❌ Отсутствуют переменные окружения');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Обновляем токен через API орбитара
        const tokenResponse = await fetch('https://api.orbitar.space/api/v1/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'SpinTar-Game/1.0'
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: clientId,
                client_secret: clientSecret
            })
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('❌ Ошибка обновления токена:', tokenResponse.status, errorText);
            
            // Проверяем окружение для добавления флага Secure
            const isProduction = process.env.NODE_ENV === 'production';
            console.log(`🔒 Cookies security: ${isProduction ? 'PRODUCTION with Secure flag' : 'DEVELOPMENT without Secure flag'}`);
            
            // Если refresh token недействителен, очищаем cookies
            res.setHeader('Set-Cookie', [
                `access_token=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/${isProduction ? '; Secure' : ''}`,
                `refresh_token=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/${isProduction ? '; Secure' : ''}`
            ]);
            
            return res.status(401).json({ error: 'Refresh token invalid' });
        }

        const tokenData = await tokenResponse.json();
        const { access_token, refresh_token: newRefreshToken, expires_in } = tokenData;

        if (!access_token) {
            console.error('❌ Не получен новый access_token');
            return res.status(500).json({ error: 'Failed to get new access token' });
        }

        // Проверяем окружение для добавления флага Secure
        const isProduction = process.env.NODE_ENV === 'production';
        console.log(`🔒 Cookies security: ${isProduction ? 'PRODUCTION with Secure flag' : 'DEVELOPMENT without Secure flag'}`);
        
        // Устанавливаем новые токены в cookies
        const maxAge = expires_in ? expires_in * 1000 : 3600 * 1000; // 1 час по умолчанию
        
        const newCookies = [
            `access_token=${access_token}; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(maxAge/1000)}; Path=/${isProduction ? '; Secure' : ''}`
        ];

        // Если пришел новый refresh token, обновляем и его
        if (newRefreshToken) {
            newCookies.push(`refresh_token=${newRefreshToken}; HttpOnly; SameSite=Lax; Max-Age=2592000; Path=/${isProduction ? '; Secure' : ''}`);
        }

        res.setHeader('Set-Cookie', newCookies);

        console.log('✅ Токены успешно обновлены');
        
        res.status(200).json({ 
            success: true,
            expires_in: expires_in 
        });

    } catch (error) {
        console.error('❌ Ошибка при обновлении токена:', error);
        res.status(500).json({ error: 'Token refresh failed' });
    }
}
