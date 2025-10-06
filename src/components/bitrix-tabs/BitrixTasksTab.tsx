import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Task } from "@/types/crm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface BitrixTasksTabProps {
  tasks: Task[];
}

export function BitrixTasksTab({ tasks }: BitrixTasksTabProps) {
  const getStatusColor = (status: string) => {
    if (status.includes("Завершена")) return "bg-green-500/10 text-green-500";
    if (status.includes("В работе")) return "bg-blue-500/10 text-blue-500";
    if (status.includes("Ждет")) return "bg-yellow-500/10 text-yellow-500";
    if (status.includes("Отложена")) return "bg-gray-500/10 text-gray-500";
    if (status.includes("Отклонена")) return "bg-red-500/10 text-red-500";
    return "bg-gray-500/10 text-gray-500";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Задачи из Bitrix24 ({tasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-muted-foreground">
              Здесь будут отображаться задачи, загруженные из Bitrix24.
              Перейдите во вкладку "Настройки" и нажмите "Загрузить задачи".
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Название</TableHead>
                    <TableHead>Постановщик</TableHead>
                    <TableHead>Исполнитель</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата создания</TableHead>
                    <TableHead>Дата закрытия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-sm">{task.ID}</TableCell>
                      <TableCell className="max-w-[250px] truncate">{task.Название}</TableCell>
                      <TableCell>{task.Постановщик}</TableCell>
                      <TableCell>{task.Исполнитель}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(task.Статус)}>
                          {task.Статус}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {task["Дата создания"] ? new Date(task["Дата создания"]).toLocaleDateString("ru-RU") : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {task["Дата закрытия"] ? new Date(task["Дата закрытия"]).toLocaleDateString("ru-RU") : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
