import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { TaskComparison as TaskComparisonType } from "@/hooks/use-file-comparison";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface TaskComparisonProps {
  comparison: TaskComparisonType;
  file1Name: string;
  file2Name: string;
}

export function TaskComparison({ comparison, file1Name, file2Name }: TaskComparisonProps) {
  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="w-4 h-4 text-green-600" />;
    if (change < 0) return <ArrowDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getChangeBadge = (change: number) => {
    if (change > 0) return <Badge variant="default" className="bg-green-600">{change > 0 ? `+${change}` : change}</Badge>;
    if (change < 0) return <Badge variant="destructive">{change}</Badge>;
    return <Badge variant="secondary">{change}</Badge>;
  };

  const statusChartData = Object.entries(comparison.statusChanges).map(([status, change]) => ({
    status,
    change,
  }));

  return (
    <div className="space-y-6">
      {/* Общая динамика */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Общая динамика задач
            {getChangeIcon(comparison.totalChange)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {getChangeBadge(comparison.totalChange)}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Разница между {file2Name} и {file1Name}
          </p>
        </CardContent>
      </Card>

      {/* Изменения по статусам */}
      <Card>
        <CardHeader>
          <CardTitle>Изменения по статусам</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              change: {
                label: "Изменение",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="change" fill="var(--color-change)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Изменение</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(comparison.statusChanges)
                .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                .map(([status, change]) => (
                  <TableRow key={status}>
                    <TableCell>{status}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {getChangeIcon(change)}
                        {getChangeBadge(change)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Изменения по исполнителям */}
      <Card>
        <CardHeader>
          <CardTitle>Изменения по исполнителям</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Исполнитель</TableHead>
                <TableHead className="text-right">Изменение</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(comparison.assigneeChanges)
                .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                .slice(0, 10)
                .map(([assignee, change]) => (
                  <TableRow key={assignee}>
                    <TableCell>{assignee}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {getChangeIcon(change)}
                        {getChangeBadge(change)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Изменения по постановщикам */}
      <Card>
        <CardHeader>
          <CardTitle>Изменения по постановщикам</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Постановщик</TableHead>
                <TableHead className="text-right">Изменение</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(comparison.creatorChanges)
                .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                .slice(0, 10)
                .map(([creator, change]) => (
                  <TableRow key={creator}>
                    <TableCell>{creator}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {getChangeIcon(change)}
                        {getChangeBadge(change)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Новые и удаленные задачи */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUp className="w-5 h-5 text-green-600" />
              Новые задачи ({comparison.newTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {comparison.newTasks.slice(0, 50).map((task, idx) => (
                <div key={idx} className="text-sm border-b pb-2">
                  <div className="font-medium">{task.Название}</div>
                  <div className="text-muted-foreground">{task.Исполнитель} • {task.Статус}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDown className="w-5 h-5 text-red-600" />
              Исчезнувшие задачи ({comparison.removedTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {comparison.removedTasks.slice(0, 50).map((task, idx) => (
                <div key={idx} className="text-sm border-b pb-2">
                  <div className="font-medium">{task.Название}</div>
                  <div className="text-muted-foreground">{task.Исполнитель} • {task.Статус}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
