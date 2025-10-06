import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StageTransition } from "@/hooks/use-file-comparison";
import { ArrowRight } from "lucide-react";

interface StageTransitionsProps {
  transitions: StageTransition[];
  file1Name: string;
  file2Name: string;
}

export function StageTransitions({ transitions, file1Name, file2Name }: StageTransitionsProps) {
  if (transitions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Перемещения по стадиям</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Нет сделок, изменивших стадию</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Перемещения по стадиям ({transitions.length})</CardTitle>
        <div className="text-sm text-muted-foreground mt-2">
          Сделки, изменившие стадию между {file1Name} и {file2Name}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto">
          <Table id="stage-transitions-table">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[100px]">ID</TableHead>
                <TableHead className="min-w-[200px]">Было</TableHead>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead className="min-w-[200px]">Стало</TableHead>
                <TableHead className="min-w-[150px]">Ответственный (тек.)</TableHead>
                <TableHead className="min-w-[150px]">Отдел (тек.)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transitions.map((transition, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{transition.dealId}</TableCell>
                  <TableCell className="text-muted-foreground">{transition.oldStage}</TableCell>
                  <TableCell>
                    <ArrowRight className="w-4 h-4 text-primary" />
                  </TableCell>
                  <TableCell className="font-medium text-primary">{transition.newStage}</TableCell>
                  <TableCell>{transition.responsible}</TableCell>
                  <TableCell>{transition.department}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
