import { useState, useEffect } from "react";
import { Deal, Task } from "@/types/crm";
import { 
  loadDealsFromSupabase, 
  loadTasksFromSupabase,
  createHourlySnapshot,
  getSnapshotStats,
  cleanupOldSnapshots 
} from "@/lib/supabase-data";
import { logger } from "@/lib/logger";
import { toast } from "@/hooks/use-toast";

/**
 * Хук для работы с данными из Supabase
 * Этот хук используется для чтения готовых данных для аналитики
 */
export function useSupabaseData() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [snapshotStats, setSnapshotStats] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Загрузка данных из Supabase
  const loadData = async () => {
    setLoading(true);
    try {
      logger.info('🔄 Загрузка данных из Supabase...');

      const [dealsResult, tasksResult] = await Promise.all([
        loadDealsFromSupabase(),
        loadTasksFromSupabase()
      ]);

      if (dealsResult.success) {
        setDeals(dealsResult.data || []);
        logger.success(`✅ Загружено ${dealsResult.data?.length || 0} сделок из Supabase`);
      } else {
        logger.error('❌ Ошибка загрузки сделок:', dealsResult.error);
        toast({
          title: "Ошибка загрузки сделок",
          description: dealsResult.error,
          variant: "destructive"
        });
      }

      if (tasksResult.success) {
        setTasks(tasksResult.data || []);
        logger.success(`✅ Загружено ${tasksResult.data?.length || 0} задач из Supabase`);
      } else {
        logger.error('❌ Ошибка загрузки задач:', tasksResult.error);
        toast({
          title: "Ошибка загрузки задач", 
          description: tasksResult.error,
          variant: "destructive"
        });
      }

      setLastUpdate(new Date());

    } catch (error: any) {
      logger.error('❌ Критическая ошибка загрузки данных:', error);
      toast({
        title: "Критическая ошибка",
        description: "Не удалось загрузить данные из базы",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Загрузка статистики снимков
  const loadSnapshotStats = async () => {
    try {
      const statsResult = await getSnapshotStats();
      if (statsResult.success) {
        setSnapshotStats(statsResult.data);
      }
    } catch (error) {
      logger.error('Ошибка загрузки статистики снимков:', error);
    }
  };

  // Создание снимка
  const createSnapshot = async () => {
    try {
      logger.info('📸 Создание нового снимка...');
      const result = await createHourlySnapshot();
      
      if (result.success) {
        toast({
          title: "Снимок создан",
          description: "Данные сохранены в базе снимков",
        });
        await loadSnapshotStats(); // Обновляем статистику
      } else {
        toast({
          title: "Ошибка создания снимка",
          description: result.error,
          variant: "destructive"
        });
      }

      return result.success;
    } catch (error: any) {
      logger.error('❌ Ошибка создания снимка:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать снимок",
        variant: "destructive"
      });
      return false;
    }
  };

  // Очистка старых снимков
  const cleanupSnapshots = async () => {
    try {
      const result = await cleanupOldSnapshots();
      if (result.success) {
        toast({
          title: "Очистка выполнена",
          description: `Удалено ${result.count} старых снимков`,
        });
        await loadSnapshotStats(); // Обновляем статистику
      }
      return result.success;
    } catch (error: any) {
      logger.error('❌ Ошибка очистки снимков:', error);
      return false;
    }
  };

  // Автоматическая загрузка при монтировании
  useEffect(() => {
    loadData();
    loadSnapshotStats();
  }, []);

  // Автоматическое создание снимков каждый час (для тестирования)
  useEffect(() => {
    const createHourlySnapshots = () => {
      // Создаем снимок только если есть данные
      if (deals.length > 0 || tasks.length > 0) {
        logger.info('⏰ Время создания почасового снимка');
        createSnapshot();
      }
    };

    // Создаем снимок через 5 минут после загрузки данных (для тестирования)
    const initialTimer = setTimeout(() => {
      if (deals.length > 0 || tasks.length > 0) {
        createSnapshot();
      }
    }, 5 * 60 * 1000); // 5 минут

    // Затем каждый час
    const hourlyTimer = setInterval(createHourlySnapshots, 60 * 60 * 1000); // 1 час

    return () => {
      clearTimeout(initialTimer);
      clearInterval(hourlyTimer);
    };
  }, [deals.length, tasks.length]);

  return {
    // Данные
    deals,
    tasks,
    loading,
    lastUpdate,
    snapshotStats,

    // Методы
    loadData,
    createSnapshot,
    cleanupSnapshots,
    refresh: () => {
      loadData();
      loadSnapshotStats();
    }
  };
}