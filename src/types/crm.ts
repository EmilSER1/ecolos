export interface Deal {
  "ID сделки": string | null;
  "Название": string;
  "Ответственный": string;
  "Стадия сделки": string;
  "Дата создания": string | null;
  "Дата изменения": string | null;
  "Отдел": string;
  "Сумма": string;
  "Валюта": string;
  "Компания": string;
  "Комментарии": string;
  "Контакт": string;
  "Дата начала": string | null;
  "Дата закрытия": string | null;
  "Тип": string;
  "Вероятность": string;
  "Источник": string;
}

export interface Task {
  ID: string;
  Название: string;
  Постановщик: string;
  Исполнитель: string;
  Статус: string;
  "Дата создания": string;
  "Дата закрытия": string;
}

export interface DealFile {
  id: string;
  name: string;
  rows: Deal[];
  meta: FileMeta;
  uploaded: string;
}

export interface FileMeta {
  year: number | null;
  month: number | null;
  wom: number | null; // week of month
  woy: number | null; // week of year
}

export interface TaskFile {
  id: string;
  name: string;
  rows: Task[];
  uploaded: string;
}

export interface ImportInfo {
  mapped: Record<string, string>;
  ignored: number;
}

export interface NormalizedDealsResult {
  rows: Deal[];
  info: ImportInfo;
}
