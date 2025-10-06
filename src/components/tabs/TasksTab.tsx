import { Task } from "@/types/crm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMemo } from "react";
import { Download } from "lucide-react";
import { exportTableToExcel } from "@/lib/export";

interface TasksTabProps {
  tasks: Task[];
}

export function TasksTab({ tasks }: TasksTabProps) {
  const stats = useMemo(() => {
    const byStatus: Record<string, number> = {};
    const byAssignee: Record<string, number> = {};
    const byCreator: Record<string, number> = {};

    tasks.forEach((t) => {
      byStatus[t.Статус] = (byStatus[t.Статус] || 0) + 1;
      byAssignee[t.Исполнитель] = (byAssignee[t.Исполнитель] || 0) + 1;
      byCreator[t.Постановщик] = (byCreator[t.Постановщик] || 0) + 1;
    });

    return {
      total: tasks.length,
      byStatus: Object.entries(byStatus).sort((a, b) => b[1] - a[1]),
      byAssignee: Object.entries(byAssignee).sort((a, b) => b[1] - a[1]).slice(0, 10),
      byCreator: Object.entries(byCreator).sort((a, b) => b[1] - a[1]).slice(0, 10),
    };
  }, [tasks]);

  const handleExport = () => {
    const table = document.getElementById("tasks-table");
    if (table) {
      exportTableToExcel(table, "tasks.xls");
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Нет данных по задачам</p>
          <p className="text-sm text-muted-foreground">Импортируйте CSV задачи</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Статистика задач</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-sm font-medium text-muted-foreground">Всего задач</div>
              <div className="text-3xl font-bold">{stats.total}</div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-sm font-medium text-muted-foreground">Статусов</div>
              <div className="text-3xl font-bold">{stats.byStatus.length}</div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-sm font-medium text-muted-foreground">Исполнителей</div>
              <div className="text-3xl font-bold">{stats.byAssignee.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>По статусам</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.byStatus.map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm">{status || "—"}</span>
                  <span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Топ-10 исполнителей</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.byAssignee.map(([name, count]) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-sm">{name || "—"}</span>
                  <span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Все задачи</CardTitle>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Экспорт XLS
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table id="tasks-table">
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
                    <TableCell>{task.ID}</TableCell>
                    <TableCell>{task.Название}</TableCell>
                    <TableCell>{task.Постановщик}</TableCell>
                    <TableCell>{task.Исполнитель}</TableCell>
                    <TableCell>{task.Статус}</TableCell>
                    <TableCell>{task["Дата создания"]}</TableCell>
                    <TableCell>{task["Дата закрытия"]}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
