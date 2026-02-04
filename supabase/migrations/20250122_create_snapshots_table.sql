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