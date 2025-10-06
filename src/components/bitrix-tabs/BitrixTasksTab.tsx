import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Task } from "@/types/crm";

interface BitrixTasksTabProps {
  tasks: Task[];
}

export function BitrixTasksTab({ tasks }: BitrixTasksTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Задачи из Bitrix24</CardTitle>
          <Button size="sm" variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Обновить
          </Button>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-muted-foreground">
              Здесь будут отображаться задачи, загруженные из Bitrix24.
              Перейдите во вкладку "Настройки" и нажмите "Загрузить задачи".
            </p>
          ) : (
            <p className="text-muted-foreground">
              Загружено задач: {tasks.length}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
