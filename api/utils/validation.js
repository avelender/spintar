/**
 * Утилиты для валидации пользовательских данных на сервере
 */

/**
 * Валидация имени пользователя
 * @param {string} username - Имя пользователя для проверки
 * @returns {boolean} - Результат валидации
 */
export function validateUsername(username) {
  // Проверяем, что username существует и является строкой
  if (!username || typeof username !== 'string') {
    return false;
  }
  
  // Разрешаем: буквы (любой алфавит, в т.ч. кириллица/латиница), цифры, подчёркивание, дефис и точка
  // Длина: 2–30 символов
  // \p{L} — любая буква Юникода, \p{N} — цифра Юникода
  const validPattern = /^[\p{L}\p{N}_\-.]{2,30}$/u;
  return validPattern.test(username);
}

/**
 * Валидация числового значения (например, очков)
 * @param {number|string} score - Числовое значение для проверки
 * @param {number} min - Минимальное допустимое значение
 * @param {number} max - Максимальное допустимое значение
 * @returns {boolean} - Результат валидации
 */
export function validateNumericValue(score, min = 0, max = 1000000) {
  // Преобразуем в число, если передана строка
  const numericScore = Number(score);
  
  // Проверяем, что это действительное число и в допустимом диапазоне
  return !isNaN(numericScore) && 
         isFinite(numericScore) && 
         numericScore >= min && 
         numericScore <= max;
}

/**
 * Валидация эмодзи символа
 * @param {string} emoji - Эмодзи для проверки
 * @returns {boolean} - Результат валидации
 */
export function validateEmoji(emoji) {
  if (!emoji || typeof emoji !== 'string') {
    return false;
  }
  
  // Проверка, что строка содержит только один символ эмодзи
  // Это упрощенная проверка, для полной проверки нужна более сложная логика
  return emoji.length <= 2 && /\p{Emoji}/u.test(emoji);
}

/**
 * Валидация типа отношения (друг/враг)
 * @param {string} relationType - Тип отношения для проверки
 * @returns {boolean} - Результат валидации
 */
export function validateRelationType(relationType) {
  return ['friend', 'enemy'].includes(relationType);
}

/**
 * Валидация действия с отношением (добавить/удалить)
 * @param {string} action - Действие для проверки
 * @returns {boolean} - Результат валидации
 */
export function validateRelationAction(action) {
  return ['add', 'remove'].includes(action);
}

/**
 * Санитизация строки (удаление потенциально опасных символов)
 * @param {string} input - Строка для санитизации
 * @returns {string} - Санитизированная строка
 */
export function sanitizeString(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Удаляем HTML-теги и специальные символы
  return input
    .replace(/<[^>]*>/g, '') // Удаление HTML-тегов
    .replace(/[<>'"`;()]/g, ''); // Удаление потенциально опасных символов
}

/**
 * Проверка всех полей объекта на наличие инъекций
 * @param {Object} obj - Объект для проверки
 * @returns {boolean} - true если объект безопасен, false если найдены потенциальные инъекции
 */
export function validateObjectSafety(obj) {
  // Проверяем, что это объект
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  // Рекурсивно проверяем все строковые значения в объекте
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // Проверяем на наличие потенциально опасных паттернов
      const value = obj[key];
      if (
        /<script/i.test(value) || 
        /javascript:/i.test(value) || 
        /data:/i.test(value) ||
        /on\w+=/i.test(value) ||
        /\$where/i.test(value) ||
        /\$ne/i.test(value) ||
        /\$gt/i.test(value)
      ) {
        return false;
      }
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      // Рекурсивно проверяем вложенные объекты
      if (!validateObjectSafety(obj[key])) {
        return false;
      }
    }
  }
  
  return true;
}
