-- Добавляем политики для удаления файлов сделок и задач
CREATE POLICY "Anyone can delete deal files"
ON deal_files
FOR DELETE
USING (true);

CREATE POLICY "Anyone can delete task files"
ON task_files
FOR DELETE
USING (true);