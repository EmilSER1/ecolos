import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TaskComparison as TaskComparisonType } from "@/hooks/use-file-comparison";
import { Download } from "lucide-react";
import { exportMultipleTablesToExcel } from "@/lib/export";

interface TaskComparisonProps {
  comparison: TaskComparisonType;
  file1Name: string;
  file2Name: string;
}

export function TaskComparison({ comparison, file1Name, file2Name }: TaskComparisonProps) {
  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-500";
    if (change < 0) return "text-red-500";
    return "text-muted-foreground";
  };

  const formatChange = (change: number) => {
    if (change > 0) return `+${change}`;
    return change.toString();
  };

  const handleExport = () => {
    exportMultipleTablesToExcel(
      ["#task-statuses-table", "#task-assignees-table", "#task-creators-table"],
      `task-comparison-${file1Name}-${file2Name}.xls`
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Экспорт всех таблиц в Excel
        </Button>
      </div>
      {/* Точное сравнение А/В - Статусы */}
      <Card>
        <CardHeader>
          <CardTitle>Статусы • Файлы</CardTitle>
          <div className="flex gap-4 text-sm text-muted-foreground mt-2">
            <span>A: {file1Name}</span>
            <span>B: {file2Name}</span>
          </div>
        </CardHeader>
        <CardContent>
          <Table id="task-statuses-table">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Статус</TableHead>
                <TableHead className="text-right min-w-[80px]">A</TableHead>
                <TableHead className="text-right min-w-[80px]">B</TableHead>
                <TableHead className="text-right min-w-[80px]">Δ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(comparison.statusChanges)
                .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                .map(([status, change]) => {
                  const file2Count = Math.abs(change) + (change < 0 ? 0 : change);
                  const file1Count = file2Count - change;
                  return (
                    <TableRow key={status}>
                      <TableCell className="font-medium">{status}</TableCell>
                      <TableCell className="text-right">{file1Count}</TableCell>
                      <TableCell className="text-right">{file2Count}</TableCell>
                      <TableCell className={`text-right font-medium ${getChangeColor(change)}`}>
                        {formatChange(change)}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Исполнители */}
      <Card>
        <CardHeader>
          <CardTitle>Исполнители</CardTitle>
        </CardHeader>
        <CardContent>
          <Table id="task-assignees-table">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Исполнитель</TableHead>
                <TableHead className="text-right min-w-[80px]">A</TableHead>
                <TableHead className="text-right min-w-[80px]">B</TableHead>
                <TableHead className="text-right min-w-[80px]">Δ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(comparison.assigneeChanges)
                .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                .slice(0, 20)
                .map(([assignee, change]) => {
                  const file2Count = Math.abs(change) + (change < 0 ? 0 : change);
                  const file1Count = file2Count - change;
                  return (
                    <TableRow key={assignee}>
                      <TableCell className="font-medium">{assignee}</TableCell>
                      <TableCell className="text-right">{file1Count}</TableCell>
                      <TableCell className="text-right">{file2Count}</TableCell>
                      <TableCell className={`text-right font-medium ${getChangeColor(change)}`}>
                        {formatChange(change)}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Постановщики */}
      <Card>
        <CardHeader>
          <CardTitle>Постановщики</CardTitle>
        </CardHeader>
        <CardContent>
          <Table id="task-creators-table">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Постановщик</TableHead>
                <TableHead className="text-right min-w-[80px]">A</TableHead>
                <TableHead className="text-right min-w-[80px]">B</TableHead>
                <TableHead className="text-right min-w-[80px]">Δ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(comparison.creatorChanges)
                .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                .slice(0, 20)
                .map(([creator, change]) => {
                  const file2Count = Math.abs(change) + (change < 0 ? 0 : change);
                  const file1Count = file2Count - change;
                  return (
                    <TableRow key={creator}>
                      <TableCell className="font-medium">{creator}</TableCell>
                      <TableCell className="text-right">{file1Count}</TableCell>
                      <TableCell className="text-right">{file2Count}</TableCell>
                      <TableCell className={`text-right font-medium ${getChangeColor(change)}`}>
                        {formatChange(change)}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Новые и удаленные задачи */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-500">
              Новые задачи ({comparison.newTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {comparison.newTasks.slice(0, 100).map((task, idx) => (
                <div key={idx} className="text-sm border-b border-border/50 py-2">
                  <div className="font-medium">{task.Название}</div>
                  <div className="text-xs text-muted-foreground">
                    {task.Статус} • {task.Исполнитель} • {task.Постановщик}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">
              Исчезнувшие задачи ({comparison.removedTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {comparison.removedTasks.slice(0, 100).map((task, idx) => (
                <div key={idx} className="text-sm border-b border-border/50 py-2">
                  <div className="font-medium">{task.Название}</div>
                  <div className="text-xs text-muted-foreground">
                    {task.Статус} • {task.Исполнитель} • {task.Постановщик}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
