// Выход пользователя - очистка токенов авторизации
export default function handler(req, res) {
    // Разрешаем POST и GET запросы
    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Проверяем окружение для добавления флага Secure
        const isProduction = process.env.NODE_ENV === 'production';
        console.log(`🔒 Cookies security: ${isProduction ? 'PRODUCTION with Secure flag' : 'DEVELOPMENT without Secure flag'}`);
        
        // Очищаем все cookies с токенами
        res.setHeader('Set-Cookie', [
            `access_token=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/${isProduction ? '; Secure' : ''}`,
            `refresh_token=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/${isProduction ? '; Secure' : ''}`,
            `oauth_state=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/${isProduction ? '; Secure' : ''}`
        ]);

        console.log('✅ Пользователь вышел из системы');

        res.status(200).json({ 
            success: true,
            message: 'Successfully logged out' 
        });

    } catch (error) {
        console.error('❌ Ошибка при выходе:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
}
