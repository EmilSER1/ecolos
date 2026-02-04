-- Создание таблицы задач в Supabase (если её нет)
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    bitrix_id TEXT NOT NULL UNIQUE,
    title TEXT,
    status TEXT,
    status_name TEXT,
    priority TEXT,
    priority_name TEXT,
    created_by TEXT,
    created_by_name TEXT,
    responsible_id TEXT,
    responsible_name TEXT,
    date_create TIMESTAMP WITH TIME ZONE,
    date_close TIMESTAMP WITH TIME ZONE,
    description TEXT,
    raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для задач
CREATE INDEX IF NOT EXISTS idx_tasks_bitrix_id ON tasks(bitrix_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_date_create ON tasks(date_create);
CREATE INDEX IF NOT EXISTS idx_tasks_responsible ON tasks(responsible_id);
CREATE INDEX IF NOT EXISTS idx_tasks_raw_data_gin ON tasks USING GIN (raw_data);

-- Триггер для автообновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Проверяем что таблица создана
SELECT 'tasks table created successfully' as result;