import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Database, 
  Plus, 
  Eye, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  Code,
  Table,
  Copy,
  ExternalLink
} from "lucide-react";
import { 
  analyzeDataStructure, 
  autoAddMissingColumns,
  createAnalyticsView 
} from "@/lib/supabase-schema-manager";
import { loadDealsFromSupabase, loadTasksFromSupabase } from "@/lib/supabase-data";
import { toast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

interface SchemaManagerProps {
  onSchemaUpdate?: () => void;
}

interface TableAnalysis {
  tableName: 'deals' | 'tasks';
  newFields: string[];
  suggestions: string[];
  fieldTypes: Record<string, string>;
  analyzed: boolean;
}

export function SchemaManager({ onSchemaUpdate }: SchemaManagerProps) {
  const [loading, setLoading] = useState(false);
  const [analyses, setAnalyses] = useState<TableAnalysis[]>([
    { tableName: 'deals', newFields: [], suggestions: [], fieldTypes: {}, analyzed: false },
    { tableName: 'tasks', newFields: [], suggestions: [], fieldTypes: {}, analyzed: false }
  ]);
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({});
  const [showSQL, setShowSQL] = useState<Record<string, string>>({});

  // Анализ схемы данных
  const analyzeSchema = async () => {
    setLoading(true);
    try {
      logger.info('🔍 Начинаем анализ схемы данных...');

      // Загружаем актуальные данные из Supabase
      const [dealsResult, tasksResult] = await Promise.all([
        loadDealsFromSupabase(),
        loadTasksFromSupabase()
      ]);

      const newAnalyses: TableAnalysis[] = [];

      // Анализируем сделки
      if (dealsResult.success && dealsResult.data && dealsResult.data.length > 0) {
        const dealsAnalysis = analyzeDataStructure(dealsResult.data, 'deals');
        newAnalyses.push({
          tableName: 'deals',
          newFields: dealsAnalysis.newFields,
          suggestions: dealsAnalysis.suggestions,
          fieldTypes: dealsAnalysis.fieldTypes,
          analyzed: true
        });
      } else {
        newAnalyses.push({
          tableName: 'deals',
          newFields: [],
          suggestions: ['Нет данных для анализа'],
          fieldTypes: {},
          analyzed: true
        });
      }

      // Анализируем задачи
      if (tasksResult.success && tasksResult.data && tasksResult.data.length > 0) {
        const tasksAnalysis = analyzeDataStructure(tasksResult.data, 'tasks');
        newAnalyses.push({
          tableName: 'tasks',
          newFields: tasksAnalysis.newFields,
          suggestions: tasksAnalysis.suggestions,
          fieldTypes: tasksAnalysis.fieldTypes,
          analyzed: true
        });
      } else {
        newAnalyses.push({
          tableName: 'tasks',
          newFields: [],
          suggestions: ['Нет данных для анализа'],
          fieldTypes: {},
          analyzed: true
        });
      }

      setAnalyses(newAnalyses);
      logger.success('✅ Анализ схемы завершен');

      toast({
        title: "Анализ завершен",
        description: `Найдено потенциальных новых полей: ${newAnalyses.reduce((sum, a) => sum + a.newFields.length, 0)}`,
      });

    } catch (error: any) {
      logger.error('❌ Ошибка анализа схемы:', error);
      toast({
        title: "Ошибка анализа",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Добавление выбранных полей
  const addSelectedFields = async (tableName: 'deals' | 'tasks') => {
    const analysis = analyses.find(a => a.tableName === tableName);
    if (!analysis) return;

    const fieldsToAdd: Record<string, string> = {};
    analysis.newFields.forEach(field => {
      const fieldKey = `${tableName}_${field}`;
      if (selectedFields[fieldKey]) {
        fieldsToAdd[field] = analysis.fieldTypes[field];
      }
    });

    if (Object.keys(fieldsToAdd).length === 0) {
      toast({
        title: "Не выбрано полей",
        description: "Выберите поля для добавления в схему",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      logger.info(`🚀 Добавляем ${Object.keys(fieldsToAdd).length} полей в таблицу ${tableName}...`);
      
      const result = await autoAddMissingColumns(tableName, fieldsToAdd);
      
      if (result.success && result.added.length > 0) {
        toast({
          title: "Поля добавлены автоматически",
          description: `Успешно добавлено ${result.added.length} полей в таблицу ${tableName}`,
        });
        
        // Обновляем анализ
        await analyzeSchema();
        onSchemaUpdate?.();
      } else if (result.sql.length > 0) {
        // Показываем SQL для ручного выполнения
        const sqlToShow = result.sql.join('\n');
        setShowSQL(prev => ({ ...prev, [tableName]: sqlToShow }));
        
        toast({
          title: "Требуется ручное выполнение",
          description: "SQL код сгенерирован. Скопируйте и выполните его в Supabase SQL Editor.",
        });
      } else {
        toast({
          title: "Ошибки при добавлении полей",
          description: `Ошибки: ${result.errors.join(', ')}`,
          variant: "destructive"
        });
      }
      
    } catch (error: any) {
      logger.error('❌ Ошибка добавления полей:', error);
      toast({
        title: "Критическая ошибка",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Создание аналитических представлений
  const createViews = async () => {
    setLoading(true);
    try {
      const results = await Promise.all([
        createAnalyticsView('deals'),
        createAnalyticsView('tasks')
      ]);

      const success = results.every(r => r.success);
      if (success) {
        toast({
          title: "Представления созданы",
          description: "Аналитические представления успешно созданы",
        });
      } else {
        toast({
          title: "Частичный успех",
          description: "Некоторые представления не удалось создать",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Ошибка создания представлений",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Переключение выбора поля
  const toggleField = (tableName: string, fieldName: string) => {
    const key = `${tableName}_${fieldName}`;
    setSelectedFields(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Копирование SQL в буфер обмена
  const copySQL = async (sql: string) => {
    try {
      await navigator.clipboard.writeText(sql);
      toast({
        title: "SQL скопирован",
        description: "SQL код скопирован в буфер обмена",
      });
    } catch (error) {
      logger.error('Ошибка копирования в буфер:', error);
      toast({
        title: "Ошибка копирования",
        description: "Не удалось скопировать в буфер обмена",
        variant: "destructive"
      });
    }
  };

  // Автоматический анализ при монтировании
  useEffect(() => {
    analyzeSchema();
  }, []);

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Управление схемой базы данных
          </CardTitle>
          <CardDescription>
            Автоматический анализ данных и адаптация схемы под новые поля из Bitrix24
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={analyzeSchema} disabled={loading} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Анализируем...' : 'Обновить анализ'}
            </Button>
            <Button onClick={createViews} disabled={loading} variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              Создать представления
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Анализ для каждой таблицы */}
      {analyses.map(analysis => (
        <Card key={analysis.tableName}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Table className="w-5 h-5" />
                Таблица: {analysis.tableName}
              </div>
              <Badge variant={analysis.newFields.length > 0 ? "destructive" : "default"}>
                {analysis.newFields.length} новых полей
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Предложения */}
            {analysis.suggestions.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">💡 Рекомендации:</h4>
                {analysis.suggestions.map((suggestion, index) => (
                  <Alert key={index} className="mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription>{suggestion}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {/* Новые поля */}
            {analysis.newFields.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">🆕 Новые поля для добавления:</h4>
                  <Button 
                    onClick={() => addSelectedFields(analysis.tableName)}
                    disabled={loading || Object.keys(selectedFields).every(key => !key.startsWith(analysis.tableName) || !selectedFields[key])}
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Добавить выбранные
                  </Button>
                </div>

                <div className="grid gap-2">
                  {analysis.newFields.map(field => {
                    const fieldKey = `${analysis.tableName}_${field}`;
                    const isSelected = selectedFields[fieldKey];
                    const fieldType = analysis.fieldTypes[field];
                    
                    return (
                      <div 
                        key={field}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => toggleField(analysis.tableName, field)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 border-2 rounded ${
                              isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                            }`}>
                              {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                            </div>
                            <code className="text-sm font-mono">{field}</code>
                          </div>
                          <Badge variant="outline">{fieldType}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <Alert>
                <CheckCircle className="w-4 h-4" />
                <AlertDescription>
                  {analysis.analyzed ? 
                    '✅ Все поля уже учтены в схеме базы данных' : 
                    'ℹ️ Анализ не выполнен'
                  }
                </AlertDescription>
              </Alert>
            )}

            {/* SQL для ручного выполнения */}
            {showSQL[analysis.tableName] && (
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    SQL для выполнения в Supabase
                  </h4>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copySQL(showSQL[analysis.tableName])}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Копировать
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open('https://supabase.com/dashboard/projects', '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Открыть Supabase
                    </Button>
                  </div>
                </div>
                <pre className="text-sm bg-white p-3 border rounded overflow-x-auto">
                  <code>{showSQL[analysis.tableName]}</code>
                </pre>
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Скопируйте код выше и выполните его в Supabase → SQL Editor для добавления полей
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Информация */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>💡 Как это работает:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Система анализирует все поля из загруженных данных Bitrix24</li>
              <li>Автоматически определяет типы данных (текст, число, дата, и т.д.)</li>
              <li>Предлагает добавить поля с высокой заполненностью (>30%)</li>
              <li>Важные поля добавляются автоматически, остальные - по запросу</li>
              <li>Все данные сохраняются в raw_data (JSONB) - ничего не теряется</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}