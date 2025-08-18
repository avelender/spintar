// Выход пользователя - очистка токенов авторизации
export default function handler(req, res) {
    // Разрешаем только POST запросы
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Очищаем все cookies с токенами
        res.setHeader('Set-Cookie', [
            `access_token=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/`,
            `refresh_token=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/`,
            `oauth_state=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/`
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
