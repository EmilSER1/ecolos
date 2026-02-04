import { supabase } from "@/integrations/supabase/client";
import { DataSnapshot, SnapshotSummary, WeekRange } from "@/types/snapshots";
import { 
  createLocalSnapshot, 
  getLocalSnapshotsSummary, 
  getLocalSnapshotById, 
  deleteLocalSnapshot 
} from "./local-snapshots";

/**
 * Получить диапазон недели для указанной даты
 */
export function getWeekRange(date: Date = new Date()): WeekRange {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Понедельник как начало недели
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  
  return {
    start: formatDate(start),
    end: formatDate(end),
    label: `${start.getDate()}.${String(start.getMonth() + 1).padStart(2, '0')} - ${end.getDate()}.${String(end.getMonth() + 1).padStart(2, '0')}.${end.getFullYear()}`
  };
}

/**
 * Создать снимок данных
 */
export async function createSnapshot(
  deals: any[],
  tasks: any[],
  weekRange?: WeekRange
): Promise<{ success: boolean; snapshot?: DataSnapshot; error?: string }> {
  const range = weekRange || getWeekRange();
  
  // Сначала пробуем Supabase
  try {
    const snapshot: Omit<DataSnapshot, 'id' | 'created_at'> = {
      week_start: range.start,
      week_end: range.end,
      deals_count: deals.length,
      tasks_count: tasks.length,
      deals_data: deals,
      tasks_data: tasks,
      metadata: {
        source: 'bitrix24',
        version: '1.0.0',
        webhook_url: localStorage.getItem('bitrix_webhook_url') || undefined
      }
    };

    const { data, error } = await supabase
      .from('data_snapshots')
      .insert([snapshot])
      .select()
      .single();

    if (error) {
      console.warn('Supabase недоступен, используем локальное хранение:', error.message);
      // Fallback на локальное хранение
      return await createLocalSnapshot(deals, tasks, range);
    }

    console.log('✅ Снимок сохранен в Supabase');
    return { success: true, snapshot: data };
  } catch (error) {
    console.warn('Supabase недоступен, используем локальное хранение:', error);
    // Fallback на локальное хранение
    return await createLocalSnapshot(deals, tasks, range);
  }
}

/**
 * Получить список всех снимков
 */
export async function getSnapshots(): Promise<{ success: boolean; snapshots?: SnapshotSummary[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('data_snapshots')
      .select('id, created_at, week_start, week_end, deals_count, tasks_count')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase недоступен, используем локальные снимки');
      // Fallback на локальные снимки
      const localSnapshots = getLocalSnapshotsSummary();
      return { success: true, snapshots: localSnapshots };
    }

    return { success: true, snapshots: data };
  } catch (error) {
    console.warn('Supabase недоступен, используем локальные снимки');
    // Fallback на локальные снимки
    const localSnapshots = getLocalSnapshotsSummary();
    return { success: true, snapshots: localSnapshots };
  }
}

/**
 * Получить конкретный снимок по ID
 */
export async function getSnapshot(id: string): Promise<{ success: boolean; snapshot?: DataSnapshot; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('data_snapshots')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.warn('Supabase недоступен, ищем в локальных снимках');
      // Fallback на локальные снимки
      const localSnapshot = getLocalSnapshotById(id);
      if (localSnapshot) {
        return { success: true, snapshot: localSnapshot };
      }
      return { success: false, error: 'Снимок не найден' };
    }

    return { success: true, snapshot: data };
  } catch (error) {
    console.warn('Supabase недоступен, ищем в локальных снимках');
    // Fallback на локальные снимки
    const localSnapshot = getLocalSnapshotById(id);
    if (localSnapshot) {
      return { success: true, snapshot: localSnapshot };
    }
    return { success: false, error: String(error) };
  }
}

/**
 * Получить снимок для конкретной недели
 */
export async function getSnapshotByWeek(weekStart: string): Promise<{ success: boolean; snapshot?: DataSnapshot; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('data_snapshots')
      .select('*')
      .eq('week_start', weekStart)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Снимок для указанной недели не найден' };
      }
      console.error('Ошибка получения снимка по неделе:', error);
      return { success: false, error: error.message };
    }

    return { success: true, snapshot: data };
  } catch (error) {
    console.error('Ошибка получения снимка по неделе:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Удалить снимок
 */
export async function deleteSnapshot(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('data_snapshots')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Supabase недоступен, удаляем из локальных снимков');
      // Fallback на локальные снимки
      const success = deleteLocalSnapshot(id);
      return { success };
    }

    return { success: true };
  } catch (error) {
    console.warn('Supabase недоступен, удаляем из локальных снимков');
    // Fallback на локальные снимки
    const success = deleteLocalSnapshot(id);
    return { success, error: success ? undefined : String(error) };
  }
}