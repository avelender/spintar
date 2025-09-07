/**
 * Тестовый API эндпоинт для проверки CSRF-защиты
 */
import { getCsrfTokenFromCookie, validateCsrfToken } from './utils/csrf';

export default function handler(req, res) {
  // Разрешаем только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Проверяем CSRF-токен
  const cookieToken = getCsrfTokenFromCookie(req);
  const requestToken = req.headers['x-csrf-token'];
  
  if (!validateCsrfToken(requestToken, cookieToken)) {
    console.error('❌ CSRF validation failed in test-csrf');
    return res.status(403).json({ error: 'CSRF validation failed' });
  }
  
  // Если токен валидный, возвращаем успех
  return res.status(200).json({ 
    success: true, 
    message: 'CSRF protection works correctly!',
    cookieToken: cookieToken ? 'present' : 'missing',
    requestToken: requestToken ? 'present' : 'missing'
  });
}
