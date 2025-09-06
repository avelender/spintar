const admin = require('firebase-admin');

// Инициализация Firebase Admin SDK (если еще не инициализирован в других модулях)
if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL
    });
}

const db = admin.database();

export default async function handler(req, res) {
    // Включаем CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Извлекаем JWT токен из HttpOnly cookie
        const token = req.cookies?.jwt_token;
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        // Проверяем токен через Orbitar API
        const profileResponse = await fetch('https://orbitar.fly.dev/api/profile', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!profileResponse.ok) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }

        const userData = await profileResponse.json();
        const username = userData.username;

        if (!username) {
            return res.status(400).json({ error: 'Username not found in token data' });
        }

        // POST - добавить/удалить друга или врага
        if (req.method === 'POST') {
            const { target, type, action } = req.body;

            if (!target || !type || !action) {
                return res.status(400).json({ 
                    error: 'Missing required fields: target, type, action' 
                });
            }

            if (!['friend', 'enemy'].includes(type)) {
                return res.status(400).json({ 
                    error: 'Invalid type. Must be "friend" or "enemy"' 
                });
            }

            if (!['add', 'remove'].includes(action)) {
                return res.status(400).json({ 
                    error: 'Invalid action. Must be "add" or "remove"' 
                });
            }

            if (target === username) {
                return res.status(400).json({ 
                    error: 'Cannot add yourself as friend or enemy' 
                });
            }

            const playerRelationsRef = db.ref(`playerRelations/${username}`);
            const relationIndexRef = db.ref(`relationIndex/${target}`);

            if (action === 'add') {
                // Добавляем отношение
                const updates = {};
                updates[`playerRelations/${username}/${type}`] = target;
                
                // Если добавляем друга, убираем из врагов и наоборот
                const oppositeType = type === 'friend' ? 'enemy' : 'friend';
                updates[`playerRelations/${username}/${oppositeType}`] = null;

                // Обновляем обратный индекс
                const currentRelationIndex = await relationIndexRef.once('value');
                const currentData = currentRelationIndex.val() || {};
                
                // Добавляем в новый тип
                if (!currentData[`${type}edBy`]) {
                    currentData[`${type}edBy`] = [];
                }
                if (!currentData[`${type}edBy`].includes(username)) {
                    currentData[`${type}edBy`].push(username);
                }

                // Убираем из противоположного типа
                if (currentData[`${oppositeType}edBy`]) {
                    currentData[`${oppositeType}edBy`] = currentData[`${oppositeType}edBy`].filter(u => u !== username);
                    if (currentData[`${oppositeType}edBy`].length === 0) {
                        currentData[`${oppositeType}edBy`] = null;
                    }
                }

                updates[`relationIndex/${target}`] = currentData;

                await db.ref().update(updates);

                return res.status(200).json({ 
                    success: true, 
                    message: `Added ${target} as ${type}`,
                    relation: { type, target }
                });

            } else if (action === 'remove') {
                // Удаляем отношение
                const updates = {};
                updates[`playerRelations/${username}/${type}`] = null;

                // Обновляем обратный индекс
                const currentRelationIndex = await relationIndexRef.once('value');
                const currentData = currentRelationIndex.val() || {};
                
                if (currentData[`${type}edBy`]) {
                    currentData[`${type}edBy`] = currentData[`${type}edBy`].filter(u => u !== username);
                    if (currentData[`${type}edBy`].length === 0) {
                        currentData[`${type}edBy`] = null;
                    }
                }

                updates[`relationIndex/${target}`] = currentData;

                await db.ref().update(updates);

                return res.status(200).json({ 
                    success: true, 
                    message: `Removed ${target} from ${type}s` 
                });
            }
        }

        // GET - получить отношения
        if (req.method === 'GET') {
            const { mode } = req.query;

            if (mode === 'my_relations') {
                // Получить свои отношения (кого я добавил в друзья/враги)
                const playerRelationsRef = db.ref(`playerRelations/${username}`);
                const snapshot = await playerRelationsRef.once('value');
                const relations = snapshot.val() || {};

                return res.status(200).json({
                    success: true,
                    relations: {
                        friend: relations.friend || null,
                        enemy: relations.enemy || null
                    }
                });

            } else if (mode === 'who_added_me') {
                // Получить кто меня добавил в друзья/враги
                const relationIndexRef = db.ref(`relationIndex/${username}`);
                const snapshot = await relationIndexRef.once('value');
                const relationIndex = snapshot.val() || {};

                return res.status(200).json({
                    success: true,
                    relationIndex: {
                        friendedBy: relationIndex.friendedBy || [],
                        enemiedBy: relationIndex.enemiedBy || []
                    }
                });

            } else {
                return res.status(400).json({ 
                    error: 'Invalid mode. Must be "my_relations" or "who_added_me"' 
                });
            }
        }

        res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Relations API Error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
