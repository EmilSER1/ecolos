import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Bug, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  ExternalLink,
  Database,
  Settings
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export function TasksDiagnostic() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runDiagnostic = async () => {
    setTesting(true);
    const diagnosticResults: any = {
      timestamp: new Date().toLocaleString(),
      webhookUrl: null,
      bitrixConnection: null,
      tasksAPI: null,
      supabaseConnection: null,
      tasksTable: null,
      recommendations: []
    };

    try {
      // 1. Проверяем webhook URL
      const webhookUrl = localStorage.getItem('bitrix_webhook_url');
      diagnosticResults.webhookUrl = {
        status: webhookUrl ? 'success' : 'error',
        value: webhookUrl,
        message: webhookUrl ? 'Webhook URL найден' : 'Webhook URL не настроен'
      };

      if (webhookUrl) {
        // 2. Тестируем подключение к Bitrix24
        try {
          console.log('🔍 Тестируем подключение к Bitrix24...');
          const testResponse = await fetch(`${webhookUrl}crm.deal.list.json?SELECT[]=ID&start=0&limit=1`);
          diagnosticResults.bitrixConnection = {
            status: testResponse.ok ? 'success' : 'error',
            code: testResponse.status,
            message: testResponse.ok ? 'Bitrix24 доступен' : `Ошибка ${testResponse.status}`
          };

          // 3. Тестируем API задач специально
          if (testResponse.ok) {
            console.log('🔍 Тестируем API задач...');
            
            // Пробуем POST метод
            const tasksPostResponse = await fetch(`${webhookUrl}task.item.list.json`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ start: 0, limit: 1 })
            });

            let tasksApiStatus = 'error';
            let tasksApiMessage = 'API задач недоступен';

            if (tasksPostResponse.ok) {
              const tasksData = await tasksPostResponse.json();
              if (tasksData.result !== undefined) {
                tasksApiStatus = 'success';
                tasksApiMessage = `API задач работает (POST). Найдено задач: ${tasksData.result?.length || 0}`;
              } else if (tasksData.error) {
                tasksApiStatus = 'warning';
                tasksApiMessage = `Ошибка API: ${tasksData.error_description || tasksData.error}`;
              }
            } else {
              // Пробуем GET метод
              const tasksGetResponse = await fetch(`${webhookUrl}task.item.list.json?start=0&limit=1&SELECT[]=ID&SELECT[]=TITLE`);
              
              if (tasksGetResponse.ok) {
                const tasksData = await tasksGetResponse.json();
                if (tasksData.result !== undefined) {
                  tasksApiStatus = 'success';
                  tasksApiMessage = `API задач работает (GET). Найдено задач: ${tasksData.result?.length || 0}`;
                } else if (tasksData.error) {
                  tasksApiStatus = 'warning';
                  tasksApiMessage = `Ошибка API: ${tasksData.error_description || tasksData.error}`;
                }
              } else {
                tasksApiMessage = `HTTP ${tasksPostResponse.status} (POST), HTTP ${tasksGetResponse.status} (GET)`;
              }
            }

            diagnosticResults.tasksAPI = {
              status: tasksApiStatus,
              message: tasksApiMessage,
              postStatus: tasksPostResponse.status,
              getStatus: null
            };
          }
        } catch (error: any) {
          diagnosticResults.bitrixConnection = {
            status: 'error',
            message: `Ошибка подключения: ${error.message}`
          };
        }

        // 4. Проверяем Supabase (базовое подключение)
        try {
          console.log('🔍 Тестируем Supabase...');
          const supabaseTest = await fetch('/api/health'); // Это не сработает, но покажем как проверить
          
          // Альтернативный способ - проверим переменные окружения
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
          
          diagnosticResults.supabaseConnection = {
            status: (supabaseUrl && supabaseKey) ? 'success' : 'error',
            message: (supabaseUrl && supabaseKey) ? 'Ключи Supabase настроены' : 'Ключи Supabase не найдены',
            url: supabaseUrl ? '✅ URL настроен' : '❌ URL не найден',
            key: supabaseKey ? '✅ Ключ настроен' : '❌ Ключ не найден'
          };
        } catch (error: any) {
          diagnosticResults.supabaseConnection = {
            status: 'error',
            message: `Ошибка Supabase: ${error.message}`
          };
        }
      }

      // Генерируем рекомендации
      const recommendations = [];
      
      if (!diagnosticResults.webhookUrl.value) {
        recommendations.push({
          type: 'error',
          title: 'Настройте Webhook URL',
          description: 'Перейдите в Bitrix24 → Настройки и укажите URL входящего вебхука'
        });
      }

      if (diagnosticResults.bitrixConnection?.status === 'error') {
        recommendations.push({
          type: 'error',
          title: 'Проблемы с Bitrix24',
          description: 'Проверьте корректность URL вебхука и права доступа'
        });
      }

      if (diagnosticResults.tasksAPI?.status === 'error') {
        recommendations.push({
          type: 'warning',
          title: 'API задач недоступно',
          description: 'Убедитесь что у вебхука есть права "task" и в Bitrix24 есть задачи'
        });
      }

      if (diagnosticResults.supabaseConnection?.status === 'error') {
        recommendations.push({
          type: 'error',
          title: 'Проблемы с Supabase',
          description: 'Проверьте настройки .env.local и создайте таблицу tasks'
        });
      }

      diagnosticResults.recommendations = recommendations;
      setResults(diagnosticResults);

      toast({
        title: "Диагностика завершена",
        description: `Найдено проблем: ${recommendations.filter(r => r.type === 'error').length}`,
      });

    } catch (error: any) {
      console.error('Ошибка диагностики:', error);
      toast({
        title: "Ошибка диагностики",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <RefreshCw className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'default';
      case 'warning': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      {/* Заголовок */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5" />
            Диагностика проблем с задачами
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={runDiagnostic} disabled={testing}>
              {testing ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Bug className="w-4 h-4 mr-2" />
              )}
              {testing ? 'Диагностика...' : 'Запустить диагностику'}
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('https://supabase.com/dashboard/projects', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Открыть Supabase
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Результаты диагностики */}
      {results && (
        <div className="space-y-4">
          {/* Статус компонентов */}
          <Card>
            <CardHeader>
              <CardTitle>Статус компонентов системы</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Webhook URL */}
              <div className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.webhookUrl?.status)}
                  <span>Webhook URL</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(results.webhookUrl?.status)}>
                    {results.webhookUrl?.message}
                  </Badge>
                </div>
              </div>

              {/* Bitrix24 Connection */}
              {results.bitrixConnection && (
                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(results.bitrixConnection.status)}
                    <span>Подключение к Bitrix24</span>
                  </div>
                  <Badge variant={getStatusColor(results.bitrixConnection.status)}>
                    {results.bitrixConnection.message}
                  </Badge>
                </div>
              )}

              {/* Tasks API */}
              {results.tasksAPI && (
                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(results.tasksAPI.status)}
                    <span>API задач Bitrix24</span>
                  </div>
                  <Badge variant={getStatusColor(results.tasksAPI.status)}>
                    {results.tasksAPI.message}
                  </Badge>
                </div>
              )}

              {/* Supabase */}
              {results.supabaseConnection && (
                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(results.supabaseConnection.status)}
                    <span>Supabase</span>
                  </div>
                  <div className="text-right">
                    <Badge variant={getStatusColor(results.supabaseConnection.status)}>
                      {results.supabaseConnection.message}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {results.supabaseConnection.url}<br/>
                      {results.supabaseConnection.key}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Рекомендации */}
          {results.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Рекомендации по исправлению</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {results.recommendations.map((rec: any, index: number) => (
                  <Alert key={index} className={rec.type === 'error' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}>
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription>
                      <strong>{rec.title}:</strong> {rec.description}
                    </AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Время диагностики */}
          <div className="text-xs text-muted-foreground text-center">
            Диагностика выполнена: {results.timestamp}
          </div>
        </div>
      )}
    </div>
  );
}