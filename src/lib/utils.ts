import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmt(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "";
  return new Intl.NumberFormat("ru-RU").format(n);
}

export function stageClass(stage: string): string {
  const STAGE_GROUPS = {
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

  if (STAGE_GROUPS.Проектирование.includes(stage)) return "bg-stage-proj text-stage-proj-fg";
  if (STAGE_GROUPS.Тендер.includes(stage)) return "bg-stage-tender text-stage-tender-fg";
  return "bg-stage-real text-stage-real-fg";
}

export function personNameClass(person: string): string {
  const GROUPS = {
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

  if (GROUPS.Tender.includes(person)) return "bg-name-tender text-name-tender-fg";
  if (GROUPS.MPO.includes(person)) return "bg-name-mpo text-name-mpo-fg";
  return "bg-name-op text-name-op-fg";
}
