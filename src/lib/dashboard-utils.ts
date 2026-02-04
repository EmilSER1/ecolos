import { Deal, Task } from "@/types/crm";
import { ALLOWED_BY_PERSON, STAGE_ORDER } from "@/lib/constants";
import { PDF_EXPORT_CONFIG, DISPLAY_LIMITS } from "@/lib/chart-constants";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { format } from "date-fns";

/**
 * Парсит дату из различных форматов
 */
export const parseDate = (dateValue: string | null): Date | null => {
  if (!dateValue) return null;
  const dateString = String(dateValue).trim();
  
  // Формат YYYY-MM-DD или YYYY-MM-DD HH:MM:SS
  const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return new Date(+isoMatch[1], +isoMatch[2] - 1, +isoMatch[3]);
  
  // Формат DD.MM.YYYY или DD.MM.YYYY HH:MM:SS
  const dotMatch = dateString.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  if (dotMatch) return new Date(+dotMatch[3], +dotMatch[2] - 1, +dotMatch[1]);
  
  // Формат DD/MM/YYYY
  const slashMatch = dateString.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (slashMatch) return new Date(+slashMatch[3], +slashMatch[2] - 1, +slashMatch[1]);
  
  // Попытка стандартного парсинга
  const timestamp = Date.parse(dateString);
  return isNaN(timestamp) ? null : new Date(timestamp);
};

/**
 * Фильтрует сделки по датам
 */
export const filterDealsByDate = (
  deals: Deal[], 
  startDate?: Date, 
  endDate?: Date
): Deal[] => {
  if (!startDate && !endDate) return deals;
  
  return deals.filter((deal) => {
    const dealDate = parseDate(deal["Дата создания"] || deal["Дата изменения"]);
    if (!dealDate) return true;
    
    if (startDate && dealDate < startDate) return false;
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (dealDate > endOfDay) return false;
    }
    
    return true;
  });
};

/**
 * Фильтрует задачи по датам
 */
export const filterTasksByDate = (
  tasks: Task[], 
  startDate?: Date, 
  endDate?: Date
): Task[] => {
  if (!startDate && !endDate) return tasks;
  
  return tasks.filter((task) => {
    const taskDate = parseDate(task["Дата создания"]);
    if (!taskDate) return false; // Исключаем задачи без даты при фильтрации
    
    if (startDate && taskDate < startDate) return false;
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (taskDate > endOfDay) return false;
    }
    
    return true;
  });
};

/**
 * Вычисляет статистику по сделкам
 */
export const calculateDealsStats = (deals: Deal[]) => {
  const people = new Set(deals.map((deal) => deal["Ответственный"]).filter(Boolean));
  
  let mismatches = 0;
  const sums: number[] = [];
  
  deals.forEach((deal) => {
    const person = deal["Ответственный"];
    const stage = deal["Стадия сделки"];
    const allowed = ALLOWED_BY_PERSON[person] || [];
    if (stage && allowed.length && !allowed.includes(stage)) mismatches++;
    
    const sumString = deal["Бюджет сделки"] || deal["Сумма"] || deal["Цена"];
    if (sumString) {
      const sum = parseFloat(String(sumString).replace(/[^\d.-]/g, ""));
      if (!isNaN(sum) && sum > 0) sums.push(sum);
    }
  });

  const avgSum = sums.length > 0 ? sums.reduce((a, b) => a + b, 0) / sums.length : 0;
  const maxSum = sums.length > 0 ? Math.max(...sums) : 0;
  const minSum = sums.length > 0 ? Math.min(...sums) : 0;

  return {
    total: deals.length,
    people: people.size,
    mismatches,
    avgSum,
    maxSum,
    minSum,
  };
};

/**
 * Группирует сделки по месяцам
 */
export const groupDealsByMonth = (deals: Deal[]) => {
  const months: Record<string, number> = {};
  deals.forEach((deal) => {
    const date = parseDate(deal["Дата создания"] || deal["Дата изменения"]);
    if (!date) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    months[key] = (months[key] || 0) + 1;
  });

  return Object.entries(months)
    .filter(([, count]) => count > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => ({ name, value }));
};

/**
 * Группирует сделки по отделам
 */
export const groupDealsByDepartment = (deals: Deal[]) => {
  const departments: Record<string, number> = {};
  deals.forEach((deal) => {
    const key = deal["Отдел"] || "—";
    departments[key] = (departments[key] || 0) + 1;
  });
  
  return Object.entries(departments)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }));
};

/**
 * Группирует сделки по стадиям
 */
export const groupDealsByStage = (deals: Deal[]) => {
  const stages: Record<string, number> = Object.fromEntries(
    STAGE_ORDER.map((stage) => [stage, 0])
  );
  
  deals.forEach((deal) => {
    const stage = deal["Стадия сделки"];
    if (stages[stage] != null) stages[stage] += 1;
  });
  
  return Object.entries(stages)
    .filter(([, count]) => count > 0)
    .map(([name, value]) => ({ name: name.slice(0, DISPLAY_LIMITS.MAX_STAGE_NAME_LENGTH), value }));
};

/**
 * Группирует сделки по сотрудникам
 */
export const groupDealsByPerson = (deals: Deal[]) => {
  const persons: Record<string, number> = {};
  deals.forEach((deal) => {
    const key = deal["Ответственный"] || "—";
    persons[key] = (persons[key] || 0) + 1;
  });
  
  return Object.entries(persons)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, DISPLAY_LIMITS.MAX_PERSONS_TO_DISPLAY)
    .map(([name, value]) => ({ name, value }));
};

/**
 * Вычисляет статистику по задачам
 */
export const calculateTasksStats = (tasks: Task[]) => {
  const statusCounts: Record<string, number> = {};
  const executorCounts: Record<string, number> = {};
  const creatorCounts: Record<string, number> = {};
  let completedTasks = 0;
  let activeTasks = 0;

  tasks.forEach((task) => {
    const status = task.Статус || "—";
    statusCounts[status] = (statusCounts[status] || 0) + 1;

    const executor = task.Исполнитель || "—";
    executorCounts[executor] = (executorCounts[executor] || 0) + 1;

    const creator = task.Постановщик || "—";
    creatorCounts[creator] = (creatorCounts[creator] || 0) + 1;

    if (task["Дата закрытия"]) completedTasks++;
    else activeTasks++;
  });

  const statusData = Object.entries(statusCounts)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }));

  const executorData = Object.entries(executorCounts)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, DISPLAY_LIMITS.MAX_TOP_EXECUTORS)
    .map(([name, value]) => ({ name, value }));

  const creatorData = Object.entries(creatorCounts)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, DISPLAY_LIMITS.MAX_TOP_CREATORS)
    .map(([name, value]) => ({ name, value }));

  return {
    total: tasks.length,
    completedTasks,
    activeTasks,
    statusData,
    executorData,
    creatorData,
  };
};

/**
 * Экспортирует элемент в PDF
 */
export const exportToPDF = async (elementId: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const canvas = await html2canvas(element, { scale: PDF_EXPORT_CONFIG.CANVAS_SCALE });
  const imageData = canvas.toDataURL("image/png");
  
  // Используем настройки из констант
  const pdf = new jsPDF({
    orientation: PDF_EXPORT_CONFIG.ORIENTATION,
    unit: PDF_EXPORT_CONFIG.UNIT,
    format: PDF_EXPORT_CONFIG.FORMAT
  });
  
  // Размеры документа
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  
  // Применяем отступы
  const availableWidth = pdfWidth - (2 * PDF_EXPORT_CONFIG.MARGIN);
  const availableHeight = pdfHeight - (2 * PDF_EXPORT_CONFIG.MARGIN);
  
  // Вычисляем масштаб
  const imageWidth = canvas.width;
  const imageHeight = canvas.height;
  const scale = Math.min(availableWidth / imageWidth, availableHeight / imageHeight);
  
  // Размеры изображения на странице
  const scaledWidth = imageWidth * scale;
  const scaledHeight = imageHeight * scale;
  
  // Центрируем изображение
  const x = (pdfWidth - scaledWidth) / 2;
  const y = (pdfHeight - scaledHeight) / 2;
  
  pdf.addImage(imageData, "PNG", x, y, scaledWidth, scaledHeight);
  pdf.save(`dashboard-${format(new Date(), "yyyy-MM-dd")}.pdf`);
};