import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function BitrixDealsTab() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Сделки из Bitrix24</CardTitle>
          <Button size="sm" variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Обновить
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Здесь будут отображаться сделки, загруженные из Bitrix24.
            Настройте вебхук во вкладке "Настройки", чтобы начать загрузку данных.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
