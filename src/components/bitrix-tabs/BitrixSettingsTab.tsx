import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, TestTube, Download, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BitrixSettingsTabProps {
  onFetchDeals: (webhookUrl: string) => Promise<{ success: boolean; count: number }>;
  onFetchTasks: (webhookUrl: string) => Promise<{ success: boolean; count: number }>;
}

export function BitrixSettingsTab({ onFetchDeals, onFetchTasks }: BitrixSettingsTabProps) {
  const { toast } = useToast();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [testing, setTesting] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Загружаем сохраненный URL при монтировании компонента
  useEffect(() => {
    const savedUrl = localStorage.getItem('bitrix_webhook_url');
    if (savedUrl) {
      setWebhookUrl(savedUrl);
      console.log('🔄 Загружен сохраненный webhook URL:', savedUrl);
    } else {
      // Устанавливаем URL по умолчанию и сразу сохраняем
      const defaultUrl = "https://ecoloskz.bitrix24.kz/rest/31/0lku6mw8kh5wuvyq/";
      setWebhookUrl(defaultUrl);
      localStorage.setItem('bitrix_webhook_url', defaultUrl);
      console.log('🆕 Установлен webhook URL по умолчанию:', defaultUrl);
    }
  }, []);

  const handleSave = () => {
    if (!webhookUrl.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите корректный Webhook URL",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem('bitrix_webhook_url', webhookUrl.trim());
    console.log('💾 Webhook URL сохранен:', webhookUrl.trim());
    
    toast({
      title: "Настройки сохранены",
      description: "Webhook URL успешно сохранен",
    });
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const response = await fetch(`${webhookUrl}crm.deal.list.json?FILTER[>ID]=0&SELECT[]=ID&SELECT[]=TITLE`);
      const data = await response.json();
      
      if (data.result) {
        toast({
          title: "Подключение успешно!",
          description: `Найдено сделок: ${data.result.length}`,
        });
      } else {
        throw new Error("Неверный формат ответа");
      }
    } catch (error) {
      toast({
        title: "Ошибка подключения",
        description: "Не удалось подключиться к Bitrix24. Проверьте URL вебхука.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleFetchDeals = async () => {
    setFetching(true);
    try {
      await onFetchDeals(webhookUrl);
    } finally {
      setFetching(false);
    }
  };

  const handleFetchTasks = async () => {
    setFetching(true);
    try {
      await onFetchTasks(webhookUrl);
    } finally {
      setFetching(false);
    }
  };

  const handleFetchAllData = async () => {
    setFetching(true);
    try {
      toast({
        title: "🚀 Начинаем полную синхронизацию",
        description: "Загружаем сделки и задачи из Bitrix24...",
      });

      console.log('🔄 Начинаем загрузку всех данных...');
      
      // Загружаем сделки и задачи параллельно для ускорения
      const [dealsResult, tasksResult] = await Promise.all([
        onFetchDeals(webhookUrl).catch(error => {
          console.error('❌ Ошибка загрузки сделок:', error);
          return { success: false, count: 0 };
        }),
        onFetchTasks(webhookUrl).catch(error => {
          console.error('❌ Ошибка загрузки задач:', error);
          return { success: false, count: 0 };
        })
      ]);

      // Показываем результат
      const totalSuccess = dealsResult.success || tasksResult.success;
      const totalCount = (dealsResult.count || 0) + (tasksResult.count || 0);

      if (totalSuccess) {
        toast({
          title: "✅ Синхронизация завершена!",
          description: `Загружено: ${dealsResult.count || 0} сделок, ${tasksResult.count || 0} задач. Всего: ${totalCount} записей.`,
        });
        console.log('✅ Полная синхронизация завершена:', {
          deals: dealsResult.count || 0,
          tasks: tasksResult.count || 0,
          total: totalCount
        });
      } else {
        toast({
          title: "⚠️ Синхронизация завершена с ошибками",
          description: "Не все данные удалось загрузить. Проверьте консоль для деталей.",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ Критическая ошибка при загрузке всех данных:', error);
      toast({
        title: "❌ Ошибка синхронизации",
        description: "Произошла критическая ошибка при загрузке данных",
        variant: "destructive"
      });
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Настройки Bitrix24</CardTitle>
          <CardDescription>
            Укажите URL вашего вебхука из Bitrix24 для автоматической загрузки данных
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <Input
              id="webhook-url"
              type="url"
              placeholder="https://your-portal.bitrix24.kz/rest/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Формат: https://portal.bitrix24.kz/rest/USER_ID/WEBHOOK_CODE/
            </p>
          </div>

          {/* Основные настройки */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave} className="bg-gradient-to-br from-orange-500 to-red-400">
              <Save className="mr-2 h-4 w-4" />
              Сохранить
            </Button>
            <Button onClick={handleTest} variant="outline" disabled={testing}>
              <TestTube className="mr-2 h-4 w-4" />
              {testing ? "Тестирование..." : "Проверить подключение"}
            </Button>
          </div>

          {/* Загрузка данных */}
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Загрузка данных</h4>
            
            {/* Основная кнопка */}
            <Button 
              onClick={handleFetchAllData} 
              disabled={fetching} 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3"
              size="lg"
            >
              <Database className="mr-2 h-5 w-5" />
              {fetching ? "🔄 Загружаем данные..." : "🚀 Загрузить все данные (сделки + задачи)"}
            </Button>

            {/* Раздельные кнопки */}
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleFetchDeals} variant="outline" disabled={fetching} size="sm">
                <Download className="mr-2 h-4 w-4" />
                {fetching ? "..." : "Только сделки"}
              </Button>
              <Button onClick={handleFetchTasks} variant="outline" disabled={fetching} size="sm">
                <Download className="mr-2 h-4 w-4" />
                {fetching ? "..." : "Только задачи"}
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              💡 Рекомендуется использовать "Загрузить все данные" для полной синхронизации
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Автоматическая синхронизация</CardTitle>
          <CardDescription>
            Настройте расписание для автоматической загрузки данных из Bitrix24
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Функционал автоматической синхронизации будет добавлен на следующем этапе.
            Пока доступна ручная загрузка данных через API.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
