-- Создание таблицы для хранения файлов сделок
CREATE TABLE public.deal_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_data JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создание таблицы для хранения файлов задач
CREATE TABLE public.task_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_data JSONB NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Включение RLS для обеих таблиц
ALTER TABLE public.deal_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_files ENABLE ROW LEVEL SECURITY;

-- Политики для публичного доступа (чтение для всех)
CREATE POLICY "Anyone can view deal files"
ON public.deal_files
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert deal files"
ON public.deal_files
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view task files"
ON public.task_files
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert task files"
ON public.task_files
FOR INSERT
WITH CHECK (true);

-- Индексы для быстрого поиска
CREATE INDEX idx_deal_files_uploaded_at ON public.deal_files(uploaded_at DESC);
CREATE INDEX idx_task_files_uploaded_at ON public.task_files(uploaded_at DESC);