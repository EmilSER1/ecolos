import { supabase } from "@/integrations/supabase/client";
import { Deal, Task } from "@/types/crm";
import { logger } from "@/lib/logger";
import { 
  analyzeDataStructure, 
  autoAddMissingColumns, 
  createAnalyticsView,
  ensureSQLExecutorFunction 
} from "@/lib/supabase-schema-manager";

// Интерфейсы для работы с Supabase
interface SupabaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
}

/**
 * Сохранение сделок в Supabase
 */
export async function saveDealsToSupabase(deals: Deal[]): Promise<SupabaseResult<Deal[]>> {
  try {
    logger.loading(`💾 Сохранение ${deals.length} сделок в Supabase...`);

    // 🧠 УМНЫЙ АНАЛИЗ ДАННЫХ: проверяем новые поля
    if (deals.length > 0) {
      logger.info('🔍 Анализируем структуру данных сделок...');
      const schemaAnalysis = analyzeDataStructure(deals, 'deals');
      
      if (schemaAnalysis.newFields.length > 0) {
        logger.info(`📊 Найдено новых полей: ${schemaAnalysis.newFields.length}`);
        schemaAnalysis.suggestions.forEach(suggestion => {
          logger.info(`💡 ${suggestion}`);
        });
        
        // Автоматически добавляем только критически важные поля
        const priorityFields = ['сумма', 'amount', 'стадия', 'stage', 'ответственный', 'assigned', 'дата', 'date'];
        const importantFields: Record<string, string> = {};
        
        schemaAnalysis.newFields.forEach(field => {
          const isPriority = priorityFields.some(p => field.toLowerCase().includes(p));
          if (isPriority) {
            importantFields[field] = schemaAnalysis.fieldTypes[field];
          }
        });
        
        if (Object.keys(importantFields).length > 0) {
          logger.info('🚀 Автоматически добавляем важные поля...');
          const addResult = await autoAddMissingColumns('deals', importantFields, { dryRun: false });
          
          if (addResult.success && addResult.added.length > 0) {
            logger.success(`✅ Автоматически добавлено полей: ${addResult.added.join(', ')}`);
          }
        }
      }
    }

    // Преобразуем данные для Supabase
    const dealsForSupabase = deals.map(deal => ({
      bitrix_id: deal["ID сделки"] || deal.ID || String(Math.random()),
      title: deal["Название"] || deal.title || "",
      stage_id: deal.STAGE_ID || "",
      stage_name: deal["Стадия сделки"] || "",
      amount: parseFloat(deal["Сумма"] || deal.OPPORTUNITY || "0") || 0,
      currency: deal["Валюта"] || deal.CURRENCY_ID || "RUB",
      assigned_by_id: deal.ASSIGNED_BY_ID || "",
      assigned_by_name: deal["Ответственный"] || "",
      contact_id: deal.CONTACT_ID || "",
      contact_name: deal["Контакт"] || "",
      company_id: deal.COMPANY_ID || "",
      company_name: deal["Компания"] || "",
      date_create: deal["Дата создания"] || deal.DATE_CREATE || null,
      date_modify: deal["Дата изменения"] || deal.DATE_MODIFY || null,
      date_begin: deal["Дата начала"] || deal.BEGINDATE || null,
      date_close: deal["Дата закрытия"] || deal.CLOSEDATE || null,
      department: deal["Отдел"] || "",
      probability: parseInt(deal["Вероятность"]?.replace('%', '') || "0") || 0,
      source_id: deal["Источник"] || deal.SOURCE_ID || "",
      type_id: deal["Тип"] || deal.TYPE_ID || "",
      comments: deal["Комментарии"] || deal.COMMENTS || "",
      raw_data: deal, // Сохраняем все данные as-is
    }));

    // Используем upsert для обновления существующих записей
    const { data, error, count } = await supabase
      .from('deals')
      .upsert(dealsForSupabase, { 
        onConflict: 'bitrix_id',
        count: 'exact'
      })
      .select();

    if (error) {
      logger.error('❌ Ошибка сохранения сделок в Supabase:', error);
      return { success: false, error: error.message };
    }

    logger.success(`✅ Сохранено ${count || data?.length || 0} сделок в Supabase`);
    return { success: true, data, count: count || 0 };

  } catch (error: any) {
    logger.error('❌ Критическая ошибка сохранения сделок:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Сохранение задач в Supabase
 */
export async function saveTasksToSupabase(tasks: Task[]): Promise<SupabaseResult<Task[]>> {
  try {
    logger.loading(`💾 Сохранение ${tasks.length} задач в Supabase...`);

    // 🧠 УМНЫЙ АНАЛИЗ ДАННЫХ: проверяем новые поля для задач
    if (tasks.length > 0) {
      logger.info('🔍 Анализируем структуру данных задач...');
      const schemaAnalysis = analyzeDataStructure(tasks, 'tasks');
      
      if (schemaAnalysis.newFields.length > 0) {
        logger.info(`📊 Найдено новых полей в задачах: ${schemaAnalysis.newFields.length}`);
        schemaAnalysis.suggestions.forEach(suggestion => {
          logger.info(`💡 ${suggestion}`);
        });
        
        // Автоматически добавляем важные поля для задач
        const priorityFields = ['статус', 'status', 'приоритет', 'priority', 'исполнитель', 'responsible', 'группа', 'group', 'проект', 'project'];
        const importantFields: Record<string, string> = {};
        
        schemaAnalysis.newFields.forEach(field => {
          const isPriority = priorityFields.some(p => field.toLowerCase().includes(p));
          if (isPriority) {
            importantFields[field] = schemaAnalysis.fieldTypes[field];
          }
        });
        
        if (Object.keys(importantFields).length > 0) {
          logger.info('🚀 Автоматически добавляем важные поля для задач...');
          const addResult = await autoAddMissingColumns('tasks', importantFields, { dryRun: false });
          
          if (addResult.success && addResult.added.length > 0) {
            logger.success(`✅ Автоматически добавлено полей в tasks: ${addResult.added.join(', ')}`);
          }
        }
      }
    }

    // Преобразуем данные для Supabase
    const tasksForSupabase = tasks.map(task => ({
      bitrix_id: task.ID || String(Math.random()),
      title: task["Название"] || task.title || "",
      status: task.STATUS || "",
      status_name: task["Статус"] || "",
      priority: task.PRIORITY || "1",
      priority_name: task["Приоритет"] || "",
      created_by: task.CREATED_BY || "",
      created_by_name: task["Постановщик"] || "",
      responsible_id: task.RESPONSIBLE_ID || "",
      responsible_name: task["Исполнитель"] || "",
      date_create: task["Дата создания"] || task.CREATED_DATE || null,
      date_close: task["Дата закрытия"] || task.CLOSED_DATE || null,
      description: task["Описание"] || task.DESCRIPTION || "",
      raw_data: task, // Сохраняем все данные as-is
    }));

    // Используем upsert для обновления существующих записей
    const { data, error, count } = await supabase
      .from('tasks')
      .upsert(tasksForSupabase, { 
        onConflict: 'bitrix_id',
        count: 'exact'
      })
      .select();

    if (error) {
      logger.error('❌ Ошибка сохранения задач в Supabase:', error);
      return { success: false, error: error.message };
    }

    logger.success(`✅ Сохранено ${count || data?.length || 0} задач в Supabase`);
    return { success: true, data, count: count || 0 };

  } catch (error: any) {
    logger.error('❌ Критическая ошибка сохранения задач:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Загрузка всех сделок из Supabase
 */
export async function loadDealsFromSupabase(): Promise<SupabaseResult<Deal[]>> {
  try {
    logger.loading('📥 Загрузка сделок из Supabase...');

    const { data, error, count } = await supabase
      .from('deals')
      .select('*', { count: 'exact' })
      .order('date_create', { ascending: false });

    if (error) {
      logger.error('❌ Ошибка загрузки сделок из Supabase:', error);
      return { success: false, error: error.message };
    }

    // Преобразуем данные обратно в формат Deal
    const deals = data?.map(record => ({
      ...record.raw_data, // Используем сохраненные raw_data
      // Дополняем стандартизированными полями
      "ID сделки": record.bitrix_id,
      "Название": record.title,
      "Стадия сделки": record.stage_name,
      "Сумма": record.amount?.toString() || "0",
      "Валюта": record.currency,
      "Ответственный": record.assigned_by_name,
      "Контакт": record.contact_name,
      "Компания": record.company_name,
      "Дата создания": record.date_create,
      "Дата изменения": record.updated_at,
      "Отдел": record.department,
      _supabase_id: record.id,
      _updated_at: record.updated_at,
    })) || [];

    logger.success(`✅ Загружено ${deals.length} сделок из Supabase`);
    return { success: true, data: deals, count: count || 0 };

  } catch (error: any) {
    logger.error('❌ Критическая ошибка загрузки сделок:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Загрузка всех задач из Supabase
 */
export async function loadTasksFromSupabase(): Promise<SupabaseResult<Task[]>> {
  try {
    logger.loading('📥 Загрузка задач из Supabase...');

    const { data, error, count } = await supabase
      .from('tasks')
      .select('*', { count: 'exact' })
      .order('date_create', { ascending: false });

    if (error) {
      logger.error('❌ Ошибка загрузки задач из Supabase:', error);
      return { success: false, error: error.message };
    }

    // Преобразуем данные обратно в формат Task
    const tasks = data?.map(record => ({
      ...record.raw_data, // Используем сохраненные raw_data
      // Дополняем стандартизированными полями
      ID: record.bitrix_id,
      "Название": record.title,
      "Статус": record.status_name,
      "Приоритет": record.priority_name,
      "Постановщик": record.created_by_name,
      "Исполнитель": record.responsible_name,
      "Дата создания": record.date_create,
      "Дата закрытия": record.date_close,
      "Описание": record.description,
      _supabase_id: record.id,
      _updated_at: record.updated_at,
    })) || [];

    logger.success(`✅ Загружено ${tasks.length} задач из Supabase`);
    return { success: true, data: tasks, count: count || 0 };

  } catch (error: any) {
    logger.error('❌ Критическая ошибка загрузки задач:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Создание снимка данных в Supabase (каждый час для тестирования)
 */
export async function createHourlySnapshot(): Promise<SupabaseResult<any>> {
  try {
    logger.info('📸 Создание почасового снимка данных...');

    // Загружаем текущие данные
    const [dealsResult, tasksResult] = await Promise.all([
      loadDealsFromSupabase(),
      loadTasksFromSupabase()
    ]);

    if (!dealsResult.success || !tasksResult.success) {
      return { success: false, error: 'Не удалось загрузить данные для снимка' };
    }

    const deals = dealsResult.data || [];
    const tasks = tasksResult.data || [];

    // Определяем временные границы (текущий час)
    const now = new Date();
    const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
    const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000 - 1); // +59:59

    // Создаем снимок
    const snapshotData = {
      week_start: hourStart.toISOString().split('T')[0], // Используем день как неделю для почасовых снимков
      week_end: hourEnd.toISOString().split('T')[0],
      deals_count: deals.length,
      tasks_count: tasks.length,
      deals_data: deals,
      tasks_data: tasks,
      import_timestamp: now.toISOString(),
      deals_imported: deals.length,
      tasks_imported: tasks.length,
      metadata: {
        type: 'hourly_snapshot',
        created_by: 'system',
        hour: hourStart.getHours(),
        bitrix_sync: true,
        version: '1.0'
      }
    };

    const { data, error } = await supabase
      .from('data_snapshots')
      .insert([snapshotData])
      .select();

    if (error) {
      logger.error('❌ Ошибка создания снимка:', error);
      return { success: false, error: error.message };
    }

    logger.success(`✅ Создан почасовой снимок: ${deals.length} сделок, ${tasks.length} задач`);
    return { success: true, data };

  } catch (error: any) {
    logger.error('❌ Критическая ошибка создания снимка:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Получение статистики по последним снимкам
 */
export async function getSnapshotStats(): Promise<SupabaseResult<any>> {
  try {
    const { data, error } = await supabase
      .from('data_snapshots')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      return { success: false, error: error.message };
    }

    const stats = {
      totalSnapshots: data?.length || 0,
      latestSnapshot: data?.[0] || null,
      averageDeals: data ? Math.round(data.reduce((acc, snap) => acc + (snap.deals_count || 0), 0) / data.length) : 0,
      averageTasks: data ? Math.round(data.reduce((acc, snap) => acc + (snap.tasks_count || 0), 0) / data.length) : 0,
    };

    return { success: true, data: stats };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Очистка старых данных (оставляем последние 100 снимков)
 */
export async function cleanupOldSnapshots(): Promise<SupabaseResult<any>> {
  try {
    logger.loading('🧹 Очистка старых снимков...');

    // Находим ID снимков старше 100 последних
    const { data: oldSnapshots, error: selectError } = await supabase
      .from('data_snapshots')
      .select('id')
      .order('created_at', { ascending: false })
      .range(100, 1000); // Берем с 101 по 1000

    if (selectError) {
      return { success: false, error: selectError.message };
    }

    if (!oldSnapshots || oldSnapshots.length === 0) {
      logger.info('✅ Старых снимков для удаления нет');
      return { success: true, count: 0 };
    }

    // Удаляем старые снимки
    const oldIds = oldSnapshots.map(snap => snap.id);
    const { error: deleteError } = await supabase
      .from('data_snapshots')
      .delete()
      .in('id', oldIds);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    logger.success(`✅ Удалено ${oldSnapshots.length} старых снимков`);
    return { success: true, count: oldSnapshots.length };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}