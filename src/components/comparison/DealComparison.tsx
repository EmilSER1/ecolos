import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { DealComparison as DealComparisonType } from "@/hooks/use-file-comparison";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface DealComparisonProps {
  comparison: DealComparisonType;
  file1Name: string;
  file2Name: string;
}

export function DealComparison({ comparison, file1Name, file2Name }: DealComparisonProps) {
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

  const stageChartData = Object.entries(comparison.stageChanges).map(([stage, change]) => ({
    stage,
    change,
  }));

  return (
    <div className="space-y-6">
      {/* Общая динамика */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Общая динамика сделок
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

      {/* Изменения по стадиям */}
      <Card>
        <CardHeader>
          <CardTitle>Изменения по стадиям</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              change: {
                label: "Изменение",
                color: "hsl(var(--chart-1))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="change" fill="var(--color-change)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead>Стадия</TableHead>
                <TableHead className="text-right">Изменение</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(comparison.stageChanges)
                .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                .map(([stage, change]) => (
                  <TableRow key={stage}>
                    <TableCell>{stage}</TableCell>
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

      {/* Изменения по ответственным */}
      <Card>
        <CardHeader>
          <CardTitle>Изменения по ответственным</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ответственный</TableHead>
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

      {/* Изменения по отделам */}
      <Card>
        <CardHeader>
          <CardTitle>Изменения по отделам</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Отдел</TableHead>
                <TableHead className="text-right">Изменение</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(comparison.departmentChanges)
                .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                .map(([dept, change]) => (
                  <TableRow key={dept}>
                    <TableCell>{dept}</TableCell>
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

      {/* Новые и удаленные сделки */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUp className="w-5 h-5 text-green-600" />
              Новые сделки ({comparison.newDeals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {comparison.newDeals.slice(0, 50).map((deal, idx) => (
                <div key={idx} className="text-sm border-b pb-2">
                  <div className="font-medium">{deal["ID сделки"]}</div>
                  <div className="text-muted-foreground">{deal["Ответственный"]} • {deal["Стадия сделки"]}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDown className="w-5 h-5 text-red-600" />
              Исчезнувшие сделки ({comparison.removedDeals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {comparison.removedDeals.slice(0, 50).map((deal, idx) => (
                <div key={idx} className="text-sm border-b pb-2">
                  <div className="font-medium">{deal["ID сделки"]}</div>
                  <div className="text-muted-foreground">{deal["Ответственный"]} • {deal["Стадия сделки"]}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
