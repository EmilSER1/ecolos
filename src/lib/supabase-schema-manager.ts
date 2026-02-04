import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

/**
 * Система управления схемой базы данных - автоматически адаптируется к новым полям
 */

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
}

interface SchemaAnalysis {
  newFields: string[];
  commonFields: Record<string, any>;
  fieldTypes: Record<string, string>;
  suggestions: string[];
}

/**
 * Анализирует данные из Bitrix24 и определяет какие поля нужно добавить в базу
 */
export function analyzeDataStructure(data: any[], tableName: 'deals' | 'tasks'): SchemaAnalysis {
  const allFields = new Set<string>();
  const fieldTypes: Record<string, string> = {};
  const fieldValues: Record<string, Set<any>> = {};
  
  // Анализируем все записи
  data.forEach(record => {
    Object.entries(record).forEach(([key, value]) => {
      allFields.add(key);
      
      if (!fieldValues[key]) fieldValues[key] = new Set();
      fieldValues[key].add(value);
      
      // Определяем тип поля на основе данных
      if (!fieldTypes[key]) {
        fieldTypes[key] = detectFieldType(value);
      }
    });
  });

  // Получаем существующие поля из схемы
  const existingFields = getExistingTableFields(tableName);
  const newFields = Array.from(allFields).filter(field => 
    !existingFields.includes(field) && 
    !field.startsWith('_') && // Исключаем служебные поля
    field !== 'raw_data'
  );

  // Анализируем важность полей
  const suggestions = generateFieldSuggestions(newFields, fieldValues, fieldTypes);

  return {
    newFields,
    commonFields: Object.fromEntries(
      Array.from(allFields).map(field => [field, fieldTypes[field]])
    ),
    fieldTypes,
    suggestions
  };
}

/**
 * Определяет тип PostgreSQL для поля на основе значения
 */
function detectFieldType(value: any): string {
  if (value === null || value === undefined) return 'TEXT';
  
  const str = String(value).trim();
  
  // Числовые типы
  if (!isNaN(Number(str)) && str !== '') {
    if (str.includes('.')) return 'DECIMAL(15,2)';
    const num = parseInt(str);
    if (num >= -2147483648 && num <= 2147483647) return 'INTEGER';
    return 'BIGINT';
  }
  
  // Даты
  if (isDateString(str)) return 'TIMESTAMP WITH TIME ZONE';
  if (isDateOnly(str)) return 'DATE';
  
  // Булевы
  if (str.toLowerCase() === 'true' || str.toLowerCase() === 'false') return 'BOOLEAN';
  if (str === '0' || str === '1') return 'BOOLEAN';
  
  // Длинный текст
  if (str.length > 500) return 'TEXT';
  
  // Короткий текст
  return 'VARCHAR(255)';
}

/**
 * Проверяет, является ли строка датой
 */
function isDateString(str: string): boolean {
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO format
    /^\d{2}\.\d{2}\.\d{4}/, // DD.MM.YYYY
    /^\d{4}-\d{2}-\d{2}/ // YYYY-MM-DD
  ];
  
  return datePatterns.some(pattern => pattern.test(str)) && !isNaN(Date.parse(str));
}

function isDateOnly(str: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(Date.parse(str));
}

/**
 * Получает существующие поля таблицы
 */
function getExistingTableFields(tableName: 'deals' | 'tasks'): string[] {
  // Базовые поля для каждой таблицы
  const baseFields = {
    deals: [
      'id', 'bitrix_id', 'title', 'stage_id', 'stage_name', 'amount', 'currency',
      'assigned_by_id', 'assigned_by_name', 'contact_id', 'contact_name',
      'company_id', 'company_name', 'date_create', 'date_modify', 'date_begin',
      'date_close', 'department', 'probability', 'source_id', 'type_id',
      'comments', 'raw_data', 'created_at', 'updated_at'
    ],
    tasks: [
      'id', 'bitrix_id', 'title', 'status', 'status_name', 'priority',
      'priority_name', 'created_by', 'created_by_name', 'responsible_id',
      'responsible_name', 'date_create', 'date_close', 'description',
      'raw_data', 'created_at', 'updated_at'
    ]
  };
  
  return baseFields[tableName];
}

/**
 * Генерирует предложения по добавлению полей
 */
function generateFieldSuggestions(
  newFields: string[],
  fieldValues: Record<string, Set<any>>,
  fieldTypes: Record<string, string>
): string[] {
  const suggestions: string[] = [];
  
  newFields.forEach(field => {
    const values = fieldValues[field];
    const uniqueValues = values.size;
    const totalCount = Array.from(values).filter(v => v !== null && v !== '' && v !== undefined).length;
    
    // Предлагаем добавить поля с высокой заполненностью
    if (totalCount > 0) {
      const fillRate = totalCount / (values.size || 1);
      
      if (fillRate > 0.3) { // Заполнено более 30%
        suggestions.push(`🔥 Важное поле: "${field}" (${fieldTypes[field]}) - заполнено в ${Math.round(fillRate * 100)}% записей`);
      } else if (fillRate > 0.1) {
        suggestions.push(`💡 Возможно полезное: "${field}" (${fieldTypes[field]}) - заполнено в ${Math.round(fillRate * 100)}% записей`);
      }
    }
  });
  
  return suggestions;
}

/**
 * Автоматически создает недостающие поля в таблице
 */
export async function autoAddMissingColumns(
  tableName: 'deals' | 'tasks',
  fields: Record<string, string>,
  options: { dryRun?: boolean; priority?: string[] } = {}
): Promise<{ success: boolean; added: string[]; errors: string[]; sql: string[] }> {
  
  const added: string[] = [];
  const errors: string[] = [];
  const sqlCommands: string[] = [];
  
  logger.info(`🔍 Анализируем поля для таблицы ${tableName}...`);
  
  // Фильтруем поля по приоритету если указан
  let fieldsToAdd = Object.entries(fields);
  if (options.priority) {
    fieldsToAdd = fieldsToAdd.filter(([fieldName]) => 
      options.priority!.some(p => fieldName.toLowerCase().includes(p.toLowerCase()))
    );
  }
  
  for (const [fieldName, fieldType] of fieldsToAdd) {
    try {
      // Создаем безопасное имя колонки
      const safeColumnName = sanitizeColumnName(fieldName);
      const sql = `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS "${safeColumnName}" ${fieldType};`;
      
      sqlCommands.push(sql);
      
      if (!options.dryRun) {
        // Пытаемся выполнить SQL через RPC функцию
        try {
          const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
          
          if (error) {
            logger.warn(`⚠️ Автоматическое добавление поля ${fieldName} недоступно:`, error);
            logger.info(`📋 Выполните SQL вручную в Supabase SQL Editor: ${sql}`);
            errors.push(`${fieldName}: Требует ручного выполнения SQL`);
          } else {
            logger.success(`✅ Добавлено поле: ${safeColumnName} (${fieldType})`);
            added.push(safeColumnName);
          }
        } catch (rpcError) {
          // RPC функция может быть недоступна - это нормально
          logger.info(`📋 Для добавления поля ${fieldName} выполните SQL в Supabase: ${sql}`);
          errors.push(`${fieldName}: Скопируйте и выполните SQL вручную`);
        }
      } else {
        logger.info(`🔍 [DRY RUN] Будет добавлено: ${safeColumnName} (${fieldType})`);
        added.push(safeColumnName);
      }
      
    } catch (error: any) {
      logger.error(`❌ Ошибка при добавлении поля ${fieldName}:`, error);
      errors.push(`${fieldName}: ${error.message}`);
    }
  }
  
  return {
    success: errors.length === 0,
    added,
    errors,
    sql: sqlCommands
  };
}

/**
 * Делает имя колонки безопасным для PostgreSQL
 */
function sanitizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_') // Заменяем спецсимволы на подчеркивания
    .replace(/_{2,}/g, '_') // Убираем множественные подчеркивания
    .replace(/^_+|_+$/g, '') // Убираем подчеркивания в начале и конце
    .substring(0, 63); // Ограничиваем длину (PostgreSQL лимит)
}

/**
 * Создает SQL-представление для удобного анализа данных
 */
export async function createAnalyticsView(tableName: 'deals' | 'tasks'): Promise<{ success: boolean; error?: string }> {
  try {
    const viewName = `${tableName}_analytics`;
    
    // Создаем представление которое извлекает часто используемые поля из JSONB
    const createViewSQL = tableName === 'deals' ? `
      CREATE OR REPLACE VIEW ${viewName} AS
      SELECT 
        id,
        bitrix_id,
        title,
        stage_name,
        amount,
        currency,
        assigned_by_name,
        contact_name,
        company_name,
        department,
        date_create,
        date_modify,
        
        -- Извлекаем дополнительные поля из JSON
        raw_data->>'UF_CRM_1589877847' as department_extended,
        raw_data->>'BEGINDATE' as begin_date_extended,
        raw_data->>'CLOSEDATE' as close_date_extended,
        raw_data->>'PROBABILITY' as probability_extended,
        raw_data->>'SOURCE_DESCRIPTION' as source_description,
        
        -- Полные JSON данные для сложных запросов
        raw_data,
        created_at,
        updated_at
      FROM ${tableName}
      WHERE bitrix_id IS NOT NULL;
    ` : `
      CREATE OR REPLACE VIEW ${viewName} AS
      SELECT 
        id,
        bitrix_id,
        title,
        status_name,
        priority_name,
        created_by_name,
        responsible_name,
        date_create,
        date_close,
        description,
        
        -- Извлекаем дополнительные поля из JSON
        raw_data->>'GROUP_ID' as group_id,
        raw_data->>'PARENT_ID' as parent_id,
        raw_data->>'TIME_ESTIMATE' as time_estimate,
        raw_data->>'TIME_SPENT_IN_LOGS' as time_spent,
        
        -- Полные JSON данные
        raw_data,
        created_at,
        updated_at
      FROM ${tableName}
      WHERE bitrix_id IS NOT NULL;
    `;

    const { error } = await supabase.rpc('exec_sql', { sql_query: createViewSQL });
    
    if (error) {
      logger.error(`❌ Ошибка создания представления ${viewName}:`, error);
      return { success: false, error: error.message };
    }
    
    logger.success(`✅ Создано аналитическое представление: ${viewName}`);
    return { success: true };
    
  } catch (error: any) {
    logger.error('❌ Критическая ошибка создания представления:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Создает функцию для выполнения произвольного SQL (если её нет)
 */
export async function ensureSQLExecutorFunction(): Promise<void> {
  try {
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
      RETURNS TEXT AS $$
      BEGIN
        EXECUTE sql_query;
        RETURN 'SUCCESS';
      EXCEPTION
        WHEN OTHERS THEN
          RETURN 'ERROR: ' || SQLERRM;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    const { error } = await supabase.rpc('exec_sql', { sql_query: createFunctionSQL });
    if (!error) {
      logger.success('✅ SQL executor функция готова');
    }
  } catch (error) {
    // Функция может уже существовать - это нормально
    logger.info('ℹ️ SQL executor функция уже существует или недоступна');
  }
}