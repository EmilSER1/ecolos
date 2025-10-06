export const DEPARTMENTS = {
  "Эколос Алматы": [] as string[],
  "ЗИО Ecolos": [] as string[],
  "Ecolos Engineering": [] as string[],
};

export const GROUPS = {
  OP: [
    "Аблай Каракожаев",
    "Адиль Аманов",
    "Асан Тортаев",
    "Кристина Гайдар",
    "Мадина Абатова",
    "Арслан Мурат",
    "Азамат Байкуатов",
    "Акбота Кудайбергенова",
    "Асылбек",
    "Темірлан Мәкен",
    "Наталья Клюшина",
    "Александр Лукерин",
  ],
  MPO: [
    "Александр Венедиктов",
    "Диана Джакупова",
    "Дмитрий Коваль",
    "Евгений Николаев",
    "Елена Зинкина",
    "Леонид Крупин",
    "Максат Садвакасов",
    "Нургуль Олжабаева",
    "Нурсулу Бопишева",
    "Татьяна Чибурун",
    "Фариза Темирбекова",
  ],
  Tender: ["Арслан Мурат"],
};

export const STAGE_ORDER = [
  "Новая",
  "В работе",
  "Выдано проектировщику",
  "В экспертизе",
  "Экспертиза пройдена",
  "Идет тендер",
  "Сбор данных/подготовка ТКП",
  "ТКП отправлено",
  "ТКП согласовано",
  "Договор на согласовании",
  "Договор подписан",
  "Производство",
  "Отгружено",
  "ШМ и ПН",
];

export const STAGE_GROUPS = {
  Проектирование: ["Новая", "В работе", "Выдано проектировщику", "В экспертизе"],
  Тендер: ["Экспертиза пройдена", "Идет тендер"],
  Реализация: [
    "Сбор данных/подготовка ТКП",
    "ТКП отправлено",
    "ТКП согласовано",
    "Договор на согласовании",
    "Договор подписан",
    "Производство",
    "Отгружено",
    "ШМ и ПН",
  ],
};

// Initialize departments
const almaty = [
  "Аблай Каракожаев",
  "Адиль Аманов",
  "Асан Тортаев",
  "Кристина Гайдар",
  "Мадина Абатова",
  "Арслан Мурат",
];
const zio = [
  "Азамат Байкуатов",
  "Акбота Кудайбергенова",
  "Асылбек",
  "Темірлан Мәкен",
  "Наталья Клюшина",
];
const eng = [...GROUPS.MPO];

DEPARTMENTS["Эколос Алматы"] = almaty;
DEPARTMENTS["ЗИО Ecolos"] = zio;
DEPARTMENTS["Ecolos Engineering"] = eng;

export const ALLOWED_BY_PERSON: Record<string, string[]> = {};
GROUPS.OP.forEach((p) => (ALLOWED_BY_PERSON[p] = STAGE_ORDER.slice(6)));
GROUPS.MPO.forEach((p) => (ALLOWED_BY_PERSON[p] = STAGE_ORDER.slice(0, 4)));
ALLOWED_BY_PERSON["Арслан Мурат"] = STAGE_ORDER.slice(4, 6);

export const DEPT_BY_PERSON: Record<string, string> = {};
[...almaty, ...zio, ...eng].forEach((p) => {
  DEPT_BY_PERSON[p] = almaty.includes(p)
    ? "Эколос Алматы"
    : zio.includes(p)
    ? "ЗИО Ecolos"
    : "Ecolos Engineering";
});

export const KNOWN_PEOPLE = [
  ...GROUPS.OP,
  ...GROUPS.MPO,
];
