/**
 * Константы для работы с графиками и визуализацией данных
 */

/**
 * Цвета для графиков (используют CSS переменные)
 */
export const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))"
] as const;

/**
 * Цвета для конкретных типов элементов
 */
export const UI_COLORS = {
  BARS: {
    PRIMARY: "hsl(var(--primary))",
    BLUE: "#60a5fa",
  },
  STATS: {
    BLUE: "blue",
    GREEN: "green", 
    RED: "red",
    PURPLE: "purple",
    ORANGE: "orange"
  }
} as const;

/**
 * Общие настройки для оформления графиков
 */
export const CHART_THEME = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  color: "hsl(var(--foreground))"
} as const;

/**
 * Стили для осей графиков
 */
export const CHART_AXIS_STYLE = {
  stroke: "hsl(var(--foreground))",
  style: { fill: 'hsl(var(--foreground))' }
} as const;

/**
 * Настройки размеров графиков
 */
export const CHART_DIMENSIONS = {
  /** Высота графиков в статистических карточках */
  STATS_CHART_HEIGHT: 250,
  /** Высота линейных графиков */
  LINE_CHART_HEIGHT: 220,
  /** Высота графиков задач */
  TASK_CHART_HEIGHT: 300,
  /** Ширина оси Y для горизонтальных графиков */
  VERTICAL_AXIS_WIDTH: 120,
} as const;

/**
 * Настройки экспорта в PDF
 */
export const PDF_EXPORT_CONFIG = {
  /** Масштаб для html2canvas */
  CANVAS_SCALE: 2,
  /** Ориентация документа */
  ORIENTATION: "landscape" as const,
  /** Единица измерения */
  UNIT: "mm" as const,
  /** Формат документа */
  FORMAT: "a4" as const,
  /** Отступы от краев */
  MARGIN: 10,
} as const;

/**
 * Лимиты для отображения данных
 */
export const DISPLAY_LIMITS = {
  /** Максимальное количество отделов в круговой диаграмме */
  MAX_DEPARTMENTS_IN_PIE: 5,
  /** Максимальное количество сотрудников в топе */
  MAX_TOP_EMPLOYEES: 5,
  /** Максимальное количество исполнителей в топе */
  MAX_TOP_EXECUTORS: 10,
  /** Максимальное количество постановщиков в топе */
  MAX_TOP_CREATORS: 10,
  /** Максимальная длина названия стадии */
  MAX_STAGE_NAME_LENGTH: 20,
  /** Максимальное количество сотрудников для отображения */
  MAX_PERSONS_TO_DISPLAY: 20,
} as const;