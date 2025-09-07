/**
 * API для получения CSRF-токена
 */
import { setCsrfToken } from './utils/csrf';

export default function handler(req, res) {
  // Разрешаем только GET запросы
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Генерируем и устанавливаем CSRF-токен
    const csrfToken = setCsrfToken(req, res);
    
    // Возвращаем токен в ответе
    return res.status(200).json({ csrfToken });
  } catch (error) {
    console.error('❌ Ошибка при генерации CSRF-токена:', error);
    return res.status(500).json({ error: 'Failed to generate CSRF token' });
  }
}
