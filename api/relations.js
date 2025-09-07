/**
 * API для управления отношениями между пользователями (друзья/враги)
 */
import { validateUsername, validateRelationType, validateRelationAction } from './utils/validation';
import { getCsrfTokenFromCookie, validateCsrfToken } from './utils/csrf';

export default async function handler(req, res) {
  // Проверяем метод запроса
  if (req.method === 'GET') {
    return handleGetRelations(req, res);
  } else if (req.method === 'POST') {
    // Проверяем CSRF-токен для POST запросов
    const cookieToken = getCsrfTokenFromCookie(req);
    const requestToken = req.headers['x-csrf-token'];
    
    if (!validateCsrfToken(requestToken, cookieToken)) {
      console.error('❌ CSRF validation failed in relations API');
      return res.status(403).json({ error: 'CSRF validation failed' });
    }
    
    return handleUpdateRelations(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * Обработка GET запросов для получения отношений
 */
async function handleGetRelations(req, res) {
  try {
    // Получаем access_token из cookies
    const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {}) || {};

    const accessToken = cookies.access_token;
    if (!accessToken) {
      return res.status(401).json({ error: 'Unauthorized', needLogin: true });
    }

    // Получаем режим запроса
    const { mode } = req.query;
    
    // Валидируем параметр mode
    if (!['my_relations', 'who_added_me'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode parameter' });
    }

    // Здесь должен быть код для получения данных из Firebase
    // В зависимости от mode возвращаем разные данные

    // Заглушка для примера
    if (mode === 'my_relations') {
      return res.status(200).json({
        friend: 'username1',
        enemy: 'username2'
      });
    } else {
      return res.status(200).json({
        friendedBy: ['username3', 'username4'],
        enemiedBy: ['username5']
      });
    }
  } catch (error) {
    console.error('❌ Error in relations API (GET):', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Обработка POST запросов для обновления отношений
 */
async function handleUpdateRelations(req, res) {
  try {
    // Получаем access_token из cookies
    const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {}) || {};

    const accessToken = cookies.access_token;
    if (!accessToken) {
      return res.status(401).json({ error: 'Unauthorized', needLogin: true });
    }

    // Получаем данные из запроса
    const { target, type, action } = req.body;

    // Валидируем все входные данные
    if (!validateUsername(target)) {
      return res.status(400).json({ error: 'Invalid target username' });
    }

    if (!validateRelationType(type)) {
      return res.status(400).json({ error: 'Invalid relation type' });
    }

    if (!validateRelationAction(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    // Получаем текущего пользователя из токена
    let currentUsername;
    try {
      const tokenParts = accessToken.split('.');
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      currentUsername = payload.user?.username || payload.username || payload.sub;
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token', needRefresh: true });
    }

    // Проверяем, что пользователь не пытается добавить себя
    if (currentUsername === target) {
      return res.status(400).json({ error: 'Cannot add yourself as friend or enemy' });
    }

    // Здесь должен быть код для обновления данных в Firebase
    // В зависимости от type и action обновляем отношения

    // Заглушка для примера
    return res.status(200).json({
      success: true,
      message: `${action === 'add' ? 'Added' : 'Removed'} ${target} as ${type}`
    });
  } catch (error) {
    console.error('❌ Error in relations API (POST):', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
