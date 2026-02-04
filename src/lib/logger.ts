/**
 * Утилиты для логирования в development режиме
 */

/**
 * Проверяем, что приложение работает в development режиме
 */
const isDevelopment = import.meta.env.DEV;

/**
 * Логирует сообщения только в development режиме
 */
export const logger = {
  /**
   * Логирует информационное сообщение
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Логирует предупреждение
   */
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Логирует ошибку (логируется в любом режиме для отслеживания)
   */
  error: (...args: any[]) => {
    console.error(...args);
  },

  /**
   * Логирует отладочную информацию
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  /**
   * Логирует успешное выполнение операции
   */
  success: (...args: any[]) => {
    if (isDevelopment) {
      console.log('✅', ...args);
    }
  },

  /**
   * Логирует начало процесса
   */
  loading: (...args: any[]) => {
    if (isDevelopment) {
      console.log('🔄', ...args);
    }
  },

  /**
   * Логирует важную информацию
   */
  highlight: (...args: any[]) => {
    if (isDevelopment) {
      console.log('📍', ...args);
    }
  },

  /**
   * Логирует создание снимка
   */
  snapshot: (...args: any[]) => {
    if (isDevelopment) {
      console.log('📸', ...args);
    }
  },

  /**
   * Логирует группу сообщений
   */
  group: (label: string, callback: () => void) => {
    if (isDevelopment) {
      console.group(label);
      callback();
      console.groupEnd();
    }
  },

  /**
   * Логирует таблицу (полезно для массивов объектов)
   */
  table: (data: any) => {
    if (isDevelopment) {
      console.table(data);
    }
  }
};

/**
 * Сокращенный алиас для logger
 */
export const log = logger;