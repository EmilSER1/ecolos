-- Создание таблиц для хранения актуальных данных из Bitrix24

-- Таблица сделок
CREATE TABLE IF NOT EXISTS deals (
    id SERIAL PRIMARY KEY,
    bitrix_id TEXT NOT NULL UNIQUE,
    title TEXT,
    stage_id TEXT,
    stage_name TEXT,
    amount DECIMAL(15,2) DEFAULT 0,
    currency TEXT DEFAULT 'RUB',
    assigned_by_id TEXT,
    assigned_by_name TEXT,
    contact_id TEXT,
    contact_name TEXT,
    company_id TEXT,
    company_name TEXT,
    date_create TIMESTAMP WITH TIME ZONE,
    date_modify TIMESTAMP WITH TIME ZONE,
    date_begin DATE,
    date_close DATE,
    department TEXT,
    probability INTEGER,
    source_id TEXT,
    type_id TEXT,
    comments TEXT,
    -- Храним полные данные из Bitrix24 в JSON
    raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Служебные поля
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица задач
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
    -- Храним полные данные из Bitrix24 в JSON
    raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Служебные поля
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_deals_bitrix_id ON deals(bitrix_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage_id ON deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_date_create ON deals(date_create);
CREATE INDEX IF NOT EXISTS idx_deals_assigned_by ON deals(assigned_by_id);
CREATE INDEX IF NOT EXISTS idx_deals_amount ON deals(amount);

CREATE INDEX IF NOT EXISTS idx_tasks_bitrix_id ON tasks(bitrix_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_date_create ON tasks(date_create);
CREATE INDEX IF NOT EXISTS idx_tasks_responsible ON tasks(responsible_id);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_deals_updated_at
    BEFORE UPDATE ON deals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Комментарии к таблицам
COMMENT ON TABLE deals IS 'Актуальные сделки из Bitrix24';
COMMENT ON TABLE tasks IS 'Актуальные задачи из Bitrix24';

COMMENT ON COLUMN deals.bitrix_id IS 'ID сделки в Bitrix24';
COMMENT ON COLUMN deals.raw_data IS 'Полные данные сделки из Bitrix24 в JSON';
COMMENT ON COLUMN tasks.bitrix_id IS 'ID задачи в Bitrix24';
COMMENT ON COLUMN tasks.raw_data IS 'Полные данные задачи из Bitrix24 в JSON';

-- Обновляем таблицу снимков для привязки к конкретным импортам
ALTER TABLE data_snapshots ADD COLUMN IF NOT EXISTS import_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE data_snapshots ADD COLUMN IF NOT EXISTS deals_imported INTEGER DEFAULT 0;
ALTER TABLE data_snapshots ADD COLUMN IF NOT EXISTS tasks_imported INTEGER DEFAULT 0;

COMMENT ON COLUMN data_snapshots.import_timestamp IS 'Время импорта данных из Bitrix24';
COMMENT ON COLUMN data_snapshots.deals_imported IS 'Количество сделок импортированных в этом снимке';
COMMENT ON COLUMN data_snapshots.tasks_imported IS 'Количество задач импортированных в этом снимке';