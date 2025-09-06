# 🎰 SpinTar - План разработки и техническая шпаргалка

## 📋 ЗАВЕРШЕННЫЕ ВОЗМОЖНОСТИ

### ✅ Система друзей/врагов
- **Кнопки ❤️💩** перед каждым никнеймом в рейтинге (только для авторизованных)
- **Toggle функция** - повторное нажатие отменяет выбор
- **Взаимоисключение** - добавление в друзья автоматически убирает из врагов
- **Tooltip для своего ника** - показывает кто добавил в друзья/враги при hover на кнопки
- **Бонусная система** - друзья получают +10% от выигрыша, враги теряют -10% 
- **Сохранение в Firebase** - синхронизация между устройствами

### ✅ Интерфейс и UX
- **Приватный доступ** - игра видна только авторизованным пользователям
- **Адаптивный дизайн** - корректное отображение на мобильных устройствах
- **Объединенные сообщения** - бонусы отображаются в основном сообщении о выигрыше
- **Выравнивание по левому краю** - компактное отображение рейтинга

## 🛠 ТЕХНИЧЕСКАЯ АРХИТЕКТУРА

### Firebase структура данных
```json
{
  "scores": {
    "game_data": {
      "playerScores": {
        "username1": 1500,
        "username2": 2300
      },
      "playerRelations": {
        "username1": {"friend": "user2", "enemy": "user3"}
      },
      "relationIndex": {
        "user2": {
          "friendedBy": ["username1", "username5"],
          "enemiedBy": ["username7"]
        }
      },
      "lastUpdated": "2025-01-01T12:00:00.000Z"
    }
  }
}
```

### Ключевые функции для модификации

#### Система отношений
- `savePlayerRelation(target, type, action)` - сохранение отношений
- `loadPlayerRelations()` - загрузка отношений текущего пользователя  
- `loadWhoAddedMe()` - загрузка списка кто добавил пользователя
- `processFriendEnemyBonuses(username, netWin)` - начисление бонусов

#### UI обновления
- `updateScoreDisplay()` - обновление рейтинга с кнопками
- `updateAuthUI()` - управление видимостью игры
- `handleRelationButtonClick()` - обработка кликов по кнопкам

### CSS классы для стилизации
- `.relation-buttons` - контейнер кнопок
- `.relation-btn` - стили кнопок ❤️💩
- `.relation-btn.active` - активное состояние
- `.leaderboard-item` - строки рейтинга

## 🚀 ИДЕИ ДЛЯ БУДУЩИХ ДОРАБОТОК

### Новые возможности
- [ ] **Групповые отношения** - команды/кланы игроков
- [ ] **История отношений** - лог добавления/удаления из друзей
- [ ] **Уведомления** - когда кто-то добавляет в друзья/враги
- [ ] **Статистика** - графики выигрышей/проигрышей
- [ ] **Достижения** - бейджи за различные успехи
- [ ] **Турниры** - соревнования между игроками
- [ ] **Чат** - общение между игроками

### Улучшения UX
- [ ] **Анимации** - плавные переходы для кнопок
- [ ] **Звуки** - аудио фидбек для действий
- [ ] **Темы оформления** - дополнительные цветовые схемы
- [ ] **Кастомизация** - настройки интерфейса

### Техническая оптимизация
- [ ] **Service Worker** - кэширование для офлайн работы
- [ ] **Lazy loading** - подгрузка контента по требованию
- [ ] **Batch updates** - групповые обновления Firebase
- [ ] **Real-time updates** - живые обновления через WebSocket

## 🔧 КАК ДОБАВИТЬ НОВУЮ ФУНКЦИЮ

### 1. Расширение Firebase структуры
```js
// В loadSavedScores() добавить новые поля:
window.gameData = {
    playerScores: data.playerScores || {},
    playerRelations: data.playerRelations || {},
    relationIndex: data.relationIndex || {},
    // NEW: добавить новые данные
    playerAchievements: data.playerAchievements || {},
    gameHistory: data.gameHistory || []
};
```

### 2. Обновление saveScores()
```js
const gameData = {
    playerScores: playerScores,
    playerRelations: window.gameData?.playerRelations || {},
    relationIndex: window.gameData?.relationIndex || {},
    // NEW: сохранение новых данных
    playerAchievements: window.gameData?.playerAchievements || {},
    gameHistory: window.gameData?.gameHistory || [],
    lastUpdated: new Date().toISOString()
};
```

### 3. Добавление UI элементов
```js
// В updateScoreDisplay() добавить новые элементы в HTML
return `
    <div class="leaderboard-item">
        <span class="rank">${medal}</span>
        ${relationButtons}
        <span class="username">${username}</span>
        ${newFeatureElements} <!-- NEW -->
        <span class="score">${score}</span>
    </div>
`;
```

## 🐛 ЧАСТЫЕ ПРОБЛЕМЫ И РЕШЕНИЯ

### Firebase permissions
**Проблема:** `Missing or insufficient permissions`
**Решение:** Использовать существующий документ `scores/game_data` вместо создания новых коллекций

### Мигание интерфейса
**Проблема:** Игра показывается до проверки авторизации
**Решение:** `display: none` по умолчанию в CSS

### Рассинхронизация данных
**Проблема:** Данные не синхронизируются между устройствами
**Решение:** Всегда вызывать `loadSavedScores()` перед модификацией данных

### Медленная загрузка
**Проблема:** Долгая инициализация Firebase
**Решение:** Показывать loader и использовать fallback на localStorage

## 📱 ОСОБЕННОСТИ МОБИЛЬНОЙ ВЕРСИИ

### Media queries
- `@media (max-width: 1200px)` - планшеты
- `@media (max-width: 900px)` - мобильные устройства
- `@media (max-width: 600px)` - маленькие экраны

### Важные стили
```css
.auth-panel {
    margin: 15px auto 20px auto; /* отступ сверху на мобильных */
}
.leaderboard-item {
    justify-content: flex-start; /* выравнивание по левому краю */
}
```

## 🎯 КОНТАКТЫ И DEPLOYMENT

- **GitHub:** Синхронизация кода
- **Vercel:** Автоматический деплой
- **Firebase:** База данных и аутентификация
- **Orbitar OAuth2:** Система авторизации
