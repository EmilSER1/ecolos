import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DealComparison as DealComparisonType } from "@/hooks/use-file-comparison";
import { StageTransitions } from "./StageTransitions";

interface DealComparisonProps {
  comparison: DealComparisonType;
  file1Name: string;
  file2Name: string;
}

export function DealComparison({ comparison, file1Name, file2Name }: DealComparisonProps) {
  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-500";
    if (change < 0) return "text-red-500";
    return "text-muted-foreground";
  };

  const formatChange = (change: number) => {
    if (change > 0) return `+${change}`;
    return change.toString();
  };

  // Подсчитываем значения для файлов A и B
  const getFileCounts = () => {
    const file1Stages: Record<string, number> = {};
    const file2Stages: Record<string, number> = {};
    
    Object.entries(comparison.stageChanges).forEach(([stage, change]) => {
      const file2Count = Math.abs(change) + (change < 0 ? 0 : change);
      const file1Count = file2Count - change;
      file1Stages[stage] = file1Count;
      file2Stages[stage] = file2Count;
    });
    
    return { file1Stages, file2Stages };
  };

  const { file1Stages, file2Stages } = getFileCounts();

  return (
    <div className="space-y-6">
      {/* Перемещения по стадиям */}
      <StageTransitions 
        transitions={comparison.stageTransitions} 
        file1Name={file1Name}
        file2Name={file2Name}
      />

      {/* Точное сравнение А/В - Стадии */}
      <Card>
        <CardHeader>
          <CardTitle>Стадии • Файлы</CardTitle>
          <div className="flex gap-4 text-sm text-muted-foreground mt-2">
            <span>A: {file1Name}</span>
            <span>B: {file2Name}</span>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[250px]">Стадия</TableHead>
                <TableHead className="text-right min-w-[80px]">A</TableHead>
                <TableHead className="text-right min-w-[80px]">B</TableHead>
                <TableHead className="text-right min-w-[80px]">Δ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(comparison.stageChanges)
                .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                .map(([stage, change]) => (
                  <TableRow key={stage}>
                    <TableCell className="font-medium">{stage}</TableCell>
                    <TableCell className="text-right">{file1Stages[stage] || 0}</TableCell>
                    <TableCell className="text-right">{file2Stages[stage] || 0}</TableCell>
                    <TableCell className={`text-right font-medium ${getChangeColor(change)}`}>
                      {formatChange(change)}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Отделы • Файлы */}
      <Card>
        <CardHeader>
          <CardTitle>Отделы • Файлы</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Отдел</TableHead>
                <TableHead className="text-right min-w-[80px]">A</TableHead>
                <TableHead className="text-right min-w-[80px]">B</TableHead>
                <TableHead className="text-right min-w-[80px]">Δ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(comparison.departmentChanges)
                .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                .map(([dept, change]) => {
                  const file2Count = Math.abs(change) + (change < 0 ? 0 : change);
                  const file1Count = file2Count - change;
                  return (
                    <TableRow key={dept}>
                      <TableCell className="font-medium">{dept}</TableCell>
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

      {/* Ответственные */}
      <Card>
        <CardHeader>
          <CardTitle>Ответственные</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Ответственный</TableHead>
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

      {/* Новые и удаленные сделки */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-500">
              Новые сделки ({comparison.newDeals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {comparison.newDeals.slice(0, 100).map((deal, idx) => (
                <div key={idx} className="text-sm border-b border-border/50 py-2">
                  <div className="font-medium">{deal["ID сделки"]}</div>
                  <div className="text-xs text-muted-foreground">
                    {deal["Стадия сделки"]} • {deal["Ответственный"]} • {deal["Отдел"]}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">
              Исчезнувшие сделки ({comparison.removedDeals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {comparison.removedDeals.slice(0, 100).map((deal, idx) => (
                <div key={idx} className="text-sm border-b border-border/50 py-2">
                  <div className="font-medium">{deal["ID сделки"]}</div>
                  <div className="text-xs text-muted-foreground">
                    {deal["Стадия сделки"]} • {deal["Ответственный"]} • {deal["Отдел"]}
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
