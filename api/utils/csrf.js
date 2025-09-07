/**
 * Утилиты для работы с CSRF-токенами
 */
import crypto from 'crypto';

/**
 * Генерирует случайный CSRF-токен
 */
export function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Проверяет валидность CSRF-токена
 * @param {string} requestToken - Токен из запроса
 * @param {string} cookieToken - Токен из куки
 * @returns {boolean} - Результат проверки
 */
export function validateCsrfToken(requestToken, cookieToken) {
  if (!requestToken || !cookieToken) {
    return false;
  }
  
  // Сравниваем токены с защитой от timing-атак
  return crypto.timingSafeEqual(
    Buffer.from(requestToken),
    Buffer.from(cookieToken)
  );
}

/**
 * Извлекает CSRF-токен из куки
 * @param {object} req - Express request объект
 * @returns {string|null} - CSRF-токен или null
 */
export function getCsrfTokenFromCookie(req) {
  const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {}) || {};
  
  return cookies.csrf_token || null;
}

/**
 * Middleware для установки CSRF-токена
 * @param {object} req - Express request объект
 * @param {object} res - Express response объект
 * @param {function} next - Express next функция
 */
export function setCsrfToken(req, res, next) {
  // Генерируем новый CSRF-токен
  const csrfToken = generateCsrfToken();
  
  // Проверяем окружение для добавления флага Secure
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Устанавливаем токен в куки
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'Strict', // Важно: Strict для CSRF-защиты
    path: '/',
    maxAge: 86400, // 24 часа
    secure: isProduction // Secure флаг только в production
  };
  
  const cookieString = `csrf_token=${csrfToken}; HttpOnly; SameSite=${cookieOptions.sameSite}; Path=${cookieOptions.path}; Max-Age=${cookieOptions.maxAge}${isProduction ? '; Secure' : ''}`;
  
  res.setHeader('Set-Cookie', [cookieString]);
  
  // Добавляем токен в response для доступа из JavaScript
  res.setHeader('X-CSRF-Token', csrfToken);
  
  if (next) {
    next();
  }
  
  return csrfToken;
}

/**
 * Middleware для проверки CSRF-токена
 * @param {object} req - Express request объект
 * @param {object} res - Express response объект
 * @param {function} next - Express next функция
 */
export function validateCsrfMiddleware(req, res, next) {
  // Пропускаем GET и HEAD запросы
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Получаем токен из куки
  const cookieToken = getCsrfTokenFromCookie(req);
  
  // Получаем токен из заголовка или тела запроса
  const requestToken = req.headers['x-csrf-token'] || req.body?.csrfToken;
  
  // Проверяем токен
  if (!validateCsrfToken(requestToken, cookieToken)) {
    console.error('❌ CSRF validation failed');
    return res.status(403).json({ error: 'CSRF validation failed' });
  }
  
  next();
}
