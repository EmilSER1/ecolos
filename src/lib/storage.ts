import { DealFile, FileMeta, Deal } from "@/types/crm";

const DEAL_STORE_KEY = "crm_deal_files_v1";

export function loadDealFiles(): DealFile[] {
  try {
    return JSON.parse(localStorage.getItem(DEAL_STORE_KEY) || "[]");
  } catch (e) {
    return [];
  }
}

export function saveDealFiles(arr: DealFile[]): void {
  localStorage.setItem(DEAL_STORE_KEY, JSON.stringify(arr));
}

export function calcAutoMeta(rows: Deal[]): FileMeta {
  const toDate = (v: string | null): Date | null => {
    if (!v) return null;
    const s = String(v);
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);

    const m2 = s.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
    if (m2) return new Date(+m2[3], +m2[2] - 1, +m2[1]);

    const ts = Date.parse(s);
    return isNaN(ts) ? null : new Date(ts);
  };

  let best: Date | null = null;

  for (const r of rows || []) {
    const a = toDate(r["Дата изменения"]);
    const b = toDate(r["Дата создания"]);
    const d = a || b;
    if (d && (!best || d > best)) best = d;
  }

  if (!best) best = new Date();

  return {
    year: best.getFullYear(),
    month: best.getMonth() + 1,
    wom: weekOfMonth(best),
    woy: isoWeek(best),
  };
}

function isoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - day + 3);

  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const diff = date.getTime() - firstThursday.getTime();

  return 1 + Math.round(diff / 604800000);
}

function weekOfMonth(d: Date): number {
  const first = new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1));
  let dow = first.getUTCDay();
  if (dow === 0) dow = 7;

  const offset = dow - 1;
  return Math.floor((offset + d.getUTCDate() - 1) / 7) + 1;
}

export function addDealFile(name: string, rows: Deal[]): void {
  const files = loadDealFiles();
  const meta = calcAutoMeta(rows);
  const id = Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6);

  files.push({
    id,
    name,
    rows,
    meta,
    uploaded: new Date().toISOString(),
  });

  saveDealFiles(files);
}

export function fileById(id: string): DealFile | undefined {
  return loadDealFiles().find((f) => f.id === id);
}

export function monthName(m: number): string {
  return ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"][
    m - 1
  ];
}

export function labelFromMeta(meta: FileMeta): string {
  const a: string[] = [];

  if (meta.year && meta.woy) {
    a.push(`${meta.year}-W${String(meta.woy).padStart(2, "0")}`);
  }

  if (meta.month && meta.wom) {
    a.push(`${monthName(meta.month)} • нед. ${meta.wom}`);
  }

  return a.join(" | ") || "неделя не задана";
}
