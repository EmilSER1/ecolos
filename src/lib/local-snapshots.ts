import { DataSnapshot, SnapshotSummary, WeekRange } from '@/types/snapshots';

/**
 * Локальное хранение снимков данных
 * Используется как fallback если Supabase не настроен
 */

const STORAGE_KEY = 'crm_snapshots';

export async function createLocalSnapshot(
  deals: any[],
  tasks: any[],
  weekRange: WeekRange
): Promise<{ success: boolean; snapshot?: DataSnapshot; error?: string }> {
  try {
    const snapshot: DataSnapshot = {
      id: `snapshot_${Date.now()}`,
      created_at: new Date().toISOString(),
      week_start: weekRange.start,
      week_end: weekRange.end,
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

    // Получаем существующие снимки
    const existingSnapshots = getLocalSnapshots();
    
    // Добавляем новый снимок
    existingSnapshots.unshift(snapshot);
    
    // Сохраняем в localStorage (ограничиваем до 10 снимков)
    const limitedSnapshots = existingSnapshots.slice(0, 10);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedSnapshots));
    
    console.log(`✅ Локальный снимок создан: ${snapshot.id}`);
    return { success: true, snapshot };
    
  } catch (error) {
    console.error('Ошибка создания локального снимка:', error);
    return { success: false, error: String(error) };
  }
}

export function getLocalSnapshots(): DataSnapshot[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Ошибка загрузки локальных снимков:', error);
    return [];
  }
}

export function getLocalSnapshotsSummary(): SnapshotSummary[] {
  return getLocalSnapshots().map(snapshot => ({
    id: snapshot.id,
    created_at: snapshot.created_at,
    week_start: snapshot.week_start,
    week_end: snapshot.week_end,
    deals_count: snapshot.deals_count,
    tasks_count: snapshot.tasks_count
  }));
}

export function getLocalSnapshotById(id: string): DataSnapshot | null {
  const snapshots = getLocalSnapshots();
  return snapshots.find(s => s.id === id) || null;
}

export function deleteLocalSnapshot(id: string): boolean {
  try {
    const snapshots = getLocalSnapshots();
    const filtered = snapshots.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    console.log(`✅ Локальный снимок удален: ${id}`);
    return true;
  } catch (error) {
    console.error('Ошибка удаления локального снимка:', error);
    return false;
  }
}

export function clearLocalSnapshots(): void {
  localStorage.removeItem(STORAGE_KEY);
  console.log('🧹 Все локальные снимки очищены');
}

// Проверяем доступность localStorage
export function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}