import { Deal, NormalizedDealsResult } from "@/types/crm";
import { DEPT_BY_PERSON, KNOWN_PEOPLE } from "./constants";

const CANON_STAGES: Record<string, string> = {
  новая: "Новая",
  new: "Новая",
  вработе: "В работе",
  "в работе": "В работе",
  inprogress: "В работе",
  выданопроектировщику: "Выдано проектировщику",
  project: "Выдано проектировщику",
  вэкспертизе: "В экспертизе",
  экспертиза: "В экспертизе",
  экспертизапройдена: "Экспертиза пройдена",
  passedexpertise: "Экспертиза пройдена",
  идеттендер: "Идет тендер",
  тендер: "Идет тендер",
  сборданныхподготовкаткп: "Сбор данных/подготовка ТКП",
  "сборданных/подготовкаткп": "Сбор данных/подготовка ТКП",
  предв: "Сбор данных/подготовка ТКП",
  ткпотправлено: "ТКП отправлено",
  отправленоткп: "ТКП отправлено",
  ткпсогласовано: "ТКП согласовано",
  согласованоткп: "ТКП согласовано",
  договорнасогласовании: "Договор на согласовании",
  согласованиедоговора: "Договор на согласовании",
  договорподписан: "Договор подписан",
  подписандоговор: "Договор подписан",
  производство: "Производство",
  отгружено: "Отгружено",
  shipment: "Отгружено",
  шмипн: "ШМ и ПН",
  "шм и пн": "ШМ и ПН",
  шмишмпн: "ШМ и ПН",
  шмпн: "ШМ и ПН",
};

function normKey(s: string): string {
  return String(s || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

export function normalizeStage(raw: string): string {
  const k = normKey(raw);
  return CANON_STAGES[k] || raw;
}

export function canonName(raw: string): string {
  if (!raw) return "";

  const s = String(raw).replace(/\s+/g, " ").trim();
  if (KNOWN_PEOPLE.includes(s)) return s;

  const parts = s.toLowerCase().split(" ").filter(Boolean);

  for (const p of KNOWN_PEOPLE) {
    const kp = p.toLowerCase().split(" ");
    if (
      parts.length === 2 &&
      kp.length === 2 &&
      ((parts[0] === kp[0] && parts[1] === kp[1]) ||
        (parts[0] === kp[1] && parts[1] === kp[0]))
    ) {
      return p;
    }
  }

  return s;
}

function toISO(d: string | null): string | null {
  if (!d) return null;
  const s = String(d);

  // DD.MM.YYYY HH:MM:SS
  const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) {
    return `${m[3]}-${m[2]}-${m[1]}${m[4] ? " " + m[4] + ":" + m[5] + (m[6] ? ":" + m[6] : "") : ""}`;
  }

  const ts = Date.parse(s);
  return isNaN(ts) ? s : new Date(ts).toISOString().replace("T", " ").slice(0, 19);
}

export function normalizeDeals(rows: Record<string, string>[]): NormalizedDealsResult {
  if (!rows || !rows.length) return { rows: [], info: { mapped: {}, ignored: 0 } };

  const aliases = {
    id: ["id", "id сделки", "deal id", "номер", "ид", "код", "deal"],
    resp: [
      "ответственный",
      "менеджер",
      "сотрудник",
      "ответственный менеджер",
      "owner",
      "responsible",
      "manager",
      "assignee",
      "мпо ответственный",
    ],
    stage: ["стадия", "стадия сделки", "этап", "status", "stage", "pipeline"],
    created: [
      "дата создания",
      "создана",
      "created",
      "date created",
      "создание",
      "create time",
      "created at",
    ],
    updated: [
      "дата изменения",
      "изменена",
      "updated",
      "date updated",
      "обновление",
      "update time",
      "updated at",
      "modified",
    ],
  };

  const norm = (s: string) =>
    String(s || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  const cols: Record<string, string> = {};
  Object.keys(rows[0] || {}).forEach((c) => (cols[c] = norm(c)));

  const pick = (keys: string[]) => {
    for (const [orig, n] of Object.entries(cols)) {
      if (keys.some((a) => n.includes(a))) return orig;
    }
    return null;
  };

  const cId = pick(aliases.id);
  const cR = pick(aliases.resp);
  const cS = pick(aliases.stage);
  const cC = pick(aliases.created);
  const cU = pick(aliases.updated);

  let ignored = 0;

  const out: Deal[] = rows.map((r) => {
    const stage = normalizeStage(
      r[cS ?? ""] ?? r["Стадия сделки"] ?? ""
    );
    const resp = canonName(
      (r[cR ?? ""] ?? r["Ответственный"] ?? r["МПО Ответственный"] ?? "").trim()
    );

    if (!resp || !stage) ignored++;

    return {
      "ID сделки": (r[cId ?? ""] || r["ID"] || r["ID сделки"] || "") || null,
      "Название": r["Название"] || "—",
      Ответственный: resp,
      "Стадия сделки": stage,
      "Дата создания": toISO(r[cC ?? ""] || r["Дата создания"] || null),
      "Дата изменения": toISO(r[cU ?? ""] || r["Дата изменения"] || null),
      Отдел: DEPT_BY_PERSON[resp] || "—",
      "Сумма": r["Сумма"] || "0",
      "Валюта": r["Валюта"] || "RUB",
      "Компания": r["Компания"] || "—",
      "Комментарии": r["Комментарии"] || "—",
    };
  });

  return {
    rows: out,
    info: {
      mapped: {
        "ID сделки": cId || "—",
        Ответственный: cR || "—",
        "Стадия сделки": cS || "—",
        "Дата создания": cC || "—",
        "Дата изменения": cU || "—",
      },
      ignored,
    },
  };
}

export function mergeDeals(existing: Deal[], incoming: Deal[]): Deal[] {
  const map = new Map<string, Deal>();

  (existing || []).forEach((r) => {
    const id = r["ID сделки"];
    if (id) map.set(String(id), r);
  });

  incoming.forEach((r) => {
    const id = r["ID сделки"];
    if (id) {
      map.set(String(id), r);
    } else {
      (existing || []).push(r);
    }
  });

  const withId = Array.from(map.values());
  const noId = (existing || []).filter((r) => !r["ID сделки"]);

  return withId.concat(noId);
}
