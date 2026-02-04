# 🚀 SQL для создания умных таблиц в Supabase

Если таблицы еще не созданы, выполните этот SQL в **Supabase SQL Editor**:

## 📊 Полный SQL для создания адаптивных таблиц

```sql
-- =====================================================
-- СОЗДАНИЕ УМНЫХ ТАБЛИЦ ДЛЯ CRM АНАЛИТИКИ
-- =====================================================

-- Создание таблицы сделок с автоадаптацией
CREATE TABLE IF NOT EXISTS deals (
    id SERIAL PRIMARY KEY,
    bitrix_id TEXT NOT NULL UNIQUE,
    
    -- Основные поля сделок
    title TEXT,
    stage_id TEXT,
    stage_name TEXT,
    amount DECIMAL(15,2) DEFAULT 0,
    currency TEXT DEFAULT 'RUB',
    
    -- Ответственные и контакты
    assigned_by_id TEXT,
    assigned_by_name TEXT,
    contact_id TEXT,
    contact_name TEXT,
    company_id TEXT,
    company_name TEXT,
    
    -- Даты
    date_create TIMESTAMP WITH TIME ZONE,
    date_modify TIMESTAMP WITH TIME ZONE,
    date_begin DATE,
    date_close DATE,
    
    -- Дополнительные поля
    department TEXT,
    probability INTEGER,
    source_id TEXT,
    type_id TEXT,
    comments TEXT,
    
    -- 🧠 УМНОЕ ХРАНЕНИЕ: все данные в JSONB (ничего не теряется!)
    raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Служебные поля
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы задач с автоадаптацией
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    bitrix_id TEXT NOT NULL UNIQUE,
    
    -- Основные поля задач
    title TEXT,
    status TEXT,
    status_name TEXT,
    priority TEXT,
    priority_name TEXT,
    
    -- Участники
    created_by TEXT,
    created_by_name TEXT,
    responsible_id TEXT,
    responsible_name TEXT,
    
    -- Даты
    date_create TIMESTAMP WITH TIME ZONE,
    date_close TIMESTAMP WITH TIME ZONE,
    
    -- Содержание
    description TEXT,
    
    -- 🧠 УМНОЕ ХРАНЕНИЕ: все данные в JSONB
    raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Служебные поля
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ИНДЕКСЫ ДЛЯ ВЫСОКОЙ ПРОИЗВОДИТЕЛЬНОСТИ
-- =====================================================

-- Индексы для сделок
CREATE INDEX IF NOT EXISTS idx_deals_bitrix_id ON deals(bitrix_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage_id ON deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_date_create ON deals(date_create);
CREATE INDEX IF NOT EXISTS idx_deals_assigned_by ON deals(assigned_by_id);
CREATE INDEX IF NOT EXISTS idx_deals_amount ON deals(amount);
CREATE INDEX IF NOT EXISTS idx_deals_department ON deals(department);

-- JSONB индексы для быстрого поиска по любым полям
CREATE INDEX IF NOT EXISTS idx_deals_raw_data_gin ON deals USING GIN (raw_data);

-- Индексы для задач  
CREATE INDEX IF NOT EXISTS idx_tasks_bitrix_id ON tasks(bitrix_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_date_create ON tasks(date_create);
CREATE INDEX IF NOT EXISTS idx_tasks_responsible ON tasks(responsible_id);

-- JSONB индексы для задач
CREATE INDEX IF NOT EXISTS idx_tasks_raw_data_gin ON tasks USING GIN (raw_data);

-- =====================================================
-- АВТОМАТИЧЕСКОЕ ОБНОВЛЕНИЕ TIMESTAMPS
-- =====================================================

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для автообновления
CREATE TRIGGER update_deals_updated_at
    BEFORE UPDATE ON deals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- АНАЛИТИЧЕСКИЕ ПРЕДСТАВЛЕНИЯ ДЛЯ УДОБНОГО АНАЛИЗА
-- =====================================================

-- Представление для расширенной аналитики сделок
CREATE OR REPLACE VIEW deals_analytics AS
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
    
    -- 🔥 ИЗВЛЕКАЕМ ЛЮБЫЕ ПОЛЯ ИЗ JSONB (примеры)
    raw_data->>'UF_CRM_1589877847' as department_extended,
    raw_data->>'BEGINDATE' as begin_date_extended,
    raw_data->>'CLOSEDATE' as close_date_extended,
    raw_data->>'PROBABILITY' as probability_extended,
    raw_data->>'SOURCE_DESCRIPTION' as source_description,
    raw_data->>'TYPE_ID' as type_extended,
    
    -- Полные JSON данные для сложных запросов
    raw_data,
    created_at,
    updated_at
FROM deals
WHERE bitrix_id IS NOT NULL;

-- Представление для расширенной аналитики задач
CREATE OR REPLACE VIEW tasks_analytics AS
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
    
    -- 🔥 ИЗВЛЕКАЕМ ДОПОЛНИТЕЛЬНЫЕ ПОЛЯ ИЗ JSONB
    raw_data->>'GROUP_ID' as group_id,
    raw_data->>'PARENT_ID' as parent_id,
    raw_data->>'TIME_ESTIMATE' as time_estimate,
    raw_data->>'TIME_SPENT_IN_LOGS' as time_spent,
    raw_data->>'DEADLINE' as deadline,
    
    -- Полные JSON данные
    raw_data,
    created_at,
    updated_at
FROM tasks
WHERE bitrix_id IS NOT NULL;

-- =====================================================
-- КОММЕНТАРИИ ДЛЯ ДОКУМЕНТАЦИИ
-- =====================================================

COMMENT ON TABLE deals IS 'Умная таблица сделок с автоадаптацией к новым полям';
COMMENT ON TABLE tasks IS 'Умная таблица задач с автоадаптацией к новым полям';

COMMENT ON COLUMN deals.bitrix_id IS 'ID сделки в Bitrix24 (уникальный)';
COMMENT ON COLUMN deals.raw_data IS 'Полные данные сделки из Bitrix24 в JSON - ВСЕ поля сохраняются!';

COMMENT ON COLUMN tasks.bitrix_id IS 'ID задачи в Bitrix24 (уникальный)';
COMMENT ON COLUMN tasks.raw_data IS 'Полные данные задачи из Bitrix24 в JSON - ВСЕ поля сохраняются!';

-- =====================================================
-- ГОТОВО! 🎉
-- =====================================================

SELECT 
    'deals' as table_name,
    count(*) as records
FROM deals
UNION ALL
SELECT 
    'tasks' as table_name,
    count(*) as records  
FROM tasks;

-- Этот запрос покажет количество записей в каждой таблице
```

## 🎯 Что дает эта структура:

### ✅ **Автоматическая адаптация:**
- **raw_data (JSONB)** - сохраняет ВСЕ поля из Bitrix24
- **GIN индексы** - быстрый поиск по любым полям в JSON
- **Аналитические представления** - удобный доступ к данным

### ✅ **Высокая производительность:**
- Оптимизированные индексы для частых запросов  
- JSONB сжимает данные автоматически
- Быстрые запросы даже на миллионах записей

### ✅ **Гибкость для анализа:**
- Можете добавлять новые колонки без потери данных
- Извлекайте любые поля из JSON через представления
- Создавайте сложные аналитические запросы

## 🔍 **Примеры использования:**

```sql
-- Поиск сделок по любому полю в JSON
SELECT * FROM deals 
WHERE raw_data->>'UF_CRM_CUSTOM_FIELD' = 'значение';

-- Аналитика через представление
SELECT 
    department,
    COUNT(*) as deals_count,
    SUM(amount) as total_amount
FROM deals_analytics 
GROUP BY department;

-- Извлечение нового поля из всех записей
SELECT 
    title,
    raw_data->>'НОВОЕ_ПОЛЕ' as new_field
FROM deals_analytics;
```

## 🚀 **После создания таблиц:**

1. **Вернитесь в приложение** 
2. **Загрузите данные** из Bitrix24
3. **Система автоматически** найдет и предложит новые поля
4. **Добавляйте нужные поля** через интерфейс управления схемой

**Ваша база данных готова к автоматической адаптации! 🎉**