import { useState, useEffect, useCallback } from 'react';
import { DataSnapshot, SnapshotSummary, WeekRange } from '@/types/snapshots';
import { 
  createSnapshot, 
  getSnapshots, 
  getSnapshot, 
  getSnapshotByWeek,
  deleteSnapshot,
  getWeekRange 
} from '@/lib/snapshots';

export function useSnapshots() {
  const [snapshots, setSnapshots] = useState<SnapshotSummary[]>([]);
  const [currentSnapshot, setCurrentSnapshot] = useState<DataSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузить список снимков
  const loadSnapshots = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const result = await getSnapshots();
    
    if (result.success && result.snapshots) {
      setSnapshots(result.snapshots);
    } else {
      setError(result.error || 'Ошибка загрузки снимков');
    }
    
    setLoading(false);
  }, []);

  // Создать новый снимок
  const createNewSnapshot = useCallback(async (
    deals: any[], 
    tasks: any[], 
    weekRange?: WeekRange
  ) => {
    setLoading(true);
    setError(null);

    const result = await createSnapshot(deals, tasks, weekRange);
    
    if (result.success && result.snapshot) {
      // Обновляем список снимков
      await loadSnapshots();
      return { success: true, snapshot: result.snapshot };
    } else {
      setError(result.error || 'Ошибка создания снимка');
      return { success: false, error: result.error };
    }
  }, [loadSnapshots]);

  // Загрузить конкретный снимок
  const loadSnapshot = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    const result = await getSnapshot(id);
    
    if (result.success && result.snapshot) {
      setCurrentSnapshot(result.snapshot);
    } else {
      setError(result.error || 'Ошибка загрузки снимка');
    }
    
    setLoading(false);
  }, []);

  // Загрузить снимок по неделе
  const loadSnapshotByWeek = useCallback(async (weekStart: string) => {
    setLoading(true);
    setError(null);

    const result = await getSnapshotByWeek(weekStart);
    
    if (result.success && result.snapshot) {
      setCurrentSnapshot(result.snapshot);
      return { success: true, snapshot: result.snapshot };
    } else {
      setError(result.error || 'Снимок для указанной недели не найден');
      return { success: false, error: result.error };
    }
  }, []);

  // Удалить снимок
  const removeSnapshot = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    const result = await deleteSnapshot(id);
    
    if (result.success) {
      // Обновляем список снимков
      await loadSnapshots();
      // Если удаляемый снимок был текущим, очищаем его
      if (currentSnapshot?.id === id) {
        setCurrentSnapshot(null);
      }
      return { success: true };
    } else {
      setError(result.error || 'Ошибка удаления снимка');
      return { success: false, error: result.error };
    }
  }, [loadSnapshots, currentSnapshot]);

  // Получить текущую неделю
  const getCurrentWeekRange = useCallback(() => {
    return getWeekRange();
  }, []);

  // Автоматическая загрузка снимков при инициализации
  useEffect(() => {
    loadSnapshots();
  }, [loadSnapshots]);

  return {
    snapshots,
    currentSnapshot,
    loading,
    error,
    loadSnapshots,
    createNewSnapshot,
    loadSnapshot,
    loadSnapshotByWeek,
    removeSnapshot,
    getCurrentWeekRange,
    setCurrentSnapshot,
    clearError: () => setError(null)
  };
}