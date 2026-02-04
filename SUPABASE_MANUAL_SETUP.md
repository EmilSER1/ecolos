# 🛠 Ручная настройка Supabase

## Если автоматические миграции не работают

### 📊 Создание таблицы вручную

1. **Откройте ваш проект в Supabase**
2. **Перейдите в SQL Editor**  
3. **Вставьте и выполните SQL:**

```sql
-- Создание таблицы для хранения снимков данных
CREATE TABLE IF NOT EXISTS data_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    deals_count INTEGER DEFAULT 0,
    tasks_count INTEGER DEFAULT 0,
    deals_data JSONB DEFAULT '[]'::jsonb,
    tasks_data JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Создание индексов для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_data_snapshots_week_start ON data_snapshots(week_start);
CREATE INDEX IF NOT EXISTS idx_data_snapshots_created_at ON data_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_snapshots_week_range ON data_snapshots(week_start, week_end);

-- Комментарии к таблице и колонкам
COMMENT ON TABLE data_snapshots IS 'Снимки данных CRM по неделям';
COMMENT ON COLUMN data_snapshots.id IS 'Уникальный идентификатор снимка';
COMMENT ON COLUMN data_snapshots.created_at IS 'Дата и время создания снимка';
COMMENT ON COLUMN data_snapshots.week_start IS 'Начало недели (понедельник)';
COMMENT ON COLUMN data_snapshots.week_end IS 'Конец недели (воскресенье)';
COMMENT ON COLUMN data_snapshots.deals_count IS 'Количество сделок в снимке';
COMMENT ON COLUMN data_snapshots.tasks_count IS 'Количество задач в снимке';
COMMENT ON COLUMN data_snapshots.deals_data IS 'Данные сделок в формате JSON';
COMMENT ON COLUMN data_snapshots.tasks_data IS 'Данные задач в формате JSON';
COMMENT ON COLUMN data_snapshots.metadata IS 'Метаданные снимка (источник, версия, настройки)';
```

4. **Нажмите "Run"**

### ✅ Проверка создания таблицы

1. **Перейдите в Table Editor**
2. **Найдите таблицу `data_snapshots`**
3. **Проверьте структуру** - должны быть все колонки из SQL выше

### 🔒 Настройка Row Level Security (опционально)

Если нужно ограничить доступ:

```sql
-- Включаем RLS
ALTER TABLE data_snapshots ENABLE ROW LEVEL SECURITY;

-- Политика: все могут читать и записывать (для простоты)
CREATE POLICY "Allow all access to data_snapshots" 
ON data_snapshots 
FOR ALL 
USING (true) 
WITH CHECK (true);
```

### 📝 Тестовая вставка

Проверим что таблица работает:

```sql
-- Тестовая запись
INSERT INTO data_snapshots (
    week_start, 
    week_end, 
    deals_count, 
    tasks_count,
    metadata
) VALUES (
    CURRENT_DATE - INTERVAL '7 days',
    CURRENT_DATE,
    100,
    50,
    '{"source": "test", "version": "1.0"}'::jsonb
);

-- Проверка записи
SELECT * FROM data_snapshots ORDER BY created_at DESC LIMIT 1;
```

Если запрос выполнился успешно - таблица готова! 🎉

### 🔧 Возможные проблемы

#### "Permission denied for table"
```sql
-- Добавьте права для анонимного пользователя
GRANT ALL ON data_snapshots TO anon;
GRANT ALL ON data_snapshots TO authenticated;
```

#### "Function gen_random_uuid() does not exist"  
```sql
-- Включите расширение для UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Альтернативно используйте:
-- id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
```

#### "JSONB type not found"
PostgreSQL версии 9.4+ поддерживает JSONB. Если проблема:
```sql
-- Замените JSONB на JSON
deals_data JSON DEFAULT '[]'::json,
tasks_data JSON DEFAULT '[]'::json,
metadata JSON DEFAULT '{}'::json
```