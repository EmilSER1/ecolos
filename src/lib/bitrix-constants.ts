/**
 * Константы для работы с Bitrix24 API
 */

/**
 * Маппинг стадий Bitrix24 на русские названия
 */
export const BITRIX_STAGE_MAPPING: Record<string, string> = {
  "NEW": "Новая",
  "PREPARATION": "Сбор данных/подготовка ТКП",
  "PREPAYMENT_INVOICE": "ТКП отправлено",
  "EXECUTING": "В работе",
  "FINAL_INVOICE": "ТКП согласовано",
  "WON": "Договор подписан",
  "LOSE": "Сделка провалена",
  "APOLOGY": "Анализ причины провала",
  "C1:NEW": "Новая",
  "C1:PREPARATION": "Сбор данных/подготовка ТКП",
  "C1:PREPAYMENT_INVOICE": "ТКП отправлено",
  "C1:EXECUTING": "В работе",
  "C1:FINAL_INVOICE": "ТКП согласовано",
  "C1:WON": "Договор подписан",
  "C1:LOSE": "Сделка провалена",
  "C1:UC_DZ4HAS": "Договор на согласовании",
  "C1:UC_55KDZG": "Выдано проектировщику",
  "C1:UC_UGT6PW": "В экспертизе",
  "C1:UC_XMGQ14": "Экспертиза пройдена",
  "C1:UC_ZRMBG8": "Идет тендер",
  "C1:UC_GWWM7C": "Производство",
  "C1:UC_5ZZJBY": "Отгружено",
  "C1:UC_W8XFJK": "ШМ и ПН",
};

/**
 * Статусы задач на русском языке
 */
export const TASK_STATUS_MAPPING: Record<string, string> = {
  "1": "Новая",
  "2": "В работе",
  "3": "Ждет выполнения", 
  "4": "Завершена (требуется контроль)",
  "5": "Завершена",
  "6": "Отложена",
  "7": "Отклонена"
};

/**
 * Приоритеты задач
 */
export const TASK_PRIORITY_MAPPING: Record<string, string> = {
  "0": "Низкий",
  "1": "Обычный", 
  "2": "Высокий"
};

/**
 * Настройки пагинации для API запросов
 */
export const BITRIX_API_CONFIG = {
  /** Количество записей за один запрос */
  BATCH_SIZE: 50,
  /** Максимальное количество записей для обработки пользователей/контактов за раз */
  USER_BATCH_SIZE: 50,
  /** Максимальное количество записей для обработки компаний за раз */
  COMPANY_BATCH_SIZE: 50,
} as const;

/**
 * Поля для запроса задач из Bitrix24
 */
export const TASK_FIELDS = [
  'ID', 
  'TITLE', 
  'STATUS', 
  'CREATED_BY', 
  'RESPONSIBLE_ID', 
  'CREATED_DATE', 
  'CLOSED_DATE', 
  'DESCRIPTION', 
  'PRIORITY'
] as const;

/**
 * Поля для запроса контактов из Bitrix24
 */
export const CONTACT_FIELDS = [
  'ID', 
  'NAME', 
  'LAST_NAME', 
  'COMPANY_TITLE'
] as const;

/**
 * Поля для запроса компаний из Bitrix24
 */
export const COMPANY_FIELDS = [
  'ID', 
  'TITLE', 
  'COMPANY_TYPE'
] as const;

/**
 * Максимальная длина описания задачи для отображения
 */
export const MAX_TASK_DESCRIPTION_LENGTH = 100;

/**
 * Ключи localStorage для сохранения настроек
 */
export const STORAGE_KEYS = {
  BITRIX_WEBHOOK_URL: 'bitrix_webhook_url',
} as const;