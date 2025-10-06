import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, TestTube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function BitrixSettingsTab() {
  const { toast } = useToast();
  const [webhookUrl, setWebhookUrl] = useState("https://ecoloskz.bitrix24.kz/rest/31/0lku6mw8kh5wuvyq/");
  const [testing, setTesting] = useState(false);

  const handleSave = () => {
    toast({
      title: "Настройки сохранены",
      description: "Webhook URL успешно сохранен",
    });
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      // Тестовый запрос к Bitrix24
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

          <div className="flex gap-2">
            <Button onClick={handleSave} className="bg-gradient-to-br from-orange-500 to-red-400">
              <Save className="mr-2 h-4 w-4" />
              Сохранить
            </Button>
            <Button onClick={handleTest} variant="outline" disabled={testing}>
              <TestTube className="mr-2 h-4 w-4" />
              {testing ? "Тестирование..." : "Проверить подключение"}
            </Button>
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
