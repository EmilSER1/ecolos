import { useMemo } from "react";
import { Deal } from "@/types/crm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DEPARTMENTS, STAGE_ORDER, STAGE_GROUPS, ALLOWED_BY_PERSON, GROUPS } from "@/lib/constants";
import { fmt } from "@/lib/utils";
import { Download } from "lucide-react";
import { exportTableToExcel } from "@/lib/export";

interface MismatchTabProps {
  deals: Deal[];
}

export function MismatchTab({ deals }: MismatchTabProps) {
  const getStageClass = (stage: string) => {
    if (STAGE_GROUPS["Проектирование"].includes(stage)) return "bg-stage-proj text-stage-proj-fg";
    if (STAGE_GROUPS["Тендер"].includes(stage)) return "bg-stage-tender text-stage-tender-fg";
    return "bg-stage-real text-stage-real-fg";
  };

  const getPersonClass = (person: string) => {
    if (GROUPS.Tender.includes(person)) return "bg-name-tender text-name-tender-fg font-bold";
    if (GROUPS.MPO.includes(person)) return "bg-name-mpo text-name-mpo-fg font-bold";
    return "bg-name-op text-name-op-fg font-bold";
  };

  const tableData = useMemo(() => {
    const depts = Object.keys(DEPARTMENTS);
    const rows: any[] = [];

    const grand: Record<string, number> = Object.fromEntries(STAGE_ORDER.map((s) => [s, 0]));
    let grandTotal = 0;

    depts.forEach((dep) => {
      const ppl = DEPARTMENTS[dep as keyof typeof DEPARTMENTS];
      let depTotals: Record<string, number> = Object.fromEntries(STAGE_ORDER.map((s) => [s, 0]));
      let depSum = 0;

      ppl.forEach((p) => {
        const personDeals = deals.filter((r) => r["Ответственный"] === p);
        const counts: Record<string, number> = Object.fromEntries(STAGE_ORDER.map((s) => [s, 0]));

        personDeals.forEach((r) => {
          const st = r["Стадия сделки"];
          if (counts[st] != null) counts[st] += 1;
        });

        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        depSum += total;

        STAGE_ORDER.forEach((s) => (depTotals[s] += counts[s]));

        const allowed = ALLOWED_BY_PERSON[p] || [];
        const cells = STAGE_ORDER.map((s) => {
          const v = counts[s] || 0;
          const bad = v > 0 && !allowed.includes(s);
          return { value: v, bad, stage: s };
        });

        rows.push({ type: "person", name: p, cells, total, personClass: getPersonClass(p) });
      });

      STAGE_ORDER.forEach((s) => (grand[s] += depTotals[s]));
      grandTotal += depSum;

      const depCells = STAGE_ORDER.map((s) => ({
        value: depTotals[s],
        bad: false,
        stage: s,
      }));

      rows.push({ type: "dept", name: `Итого ${dep}`, cells: depCells, total: depSum });
    });

    const grandCells = STAGE_ORDER.map((s) => ({
      value: grand[s],
      bad: false,
      stage: s,
    }));

    return { rows, grandCells, grandTotal };
  }, [deals]);

  const handleExport = () => {
    const table = document.getElementById("mismatch-table");
    if (table) {
      exportTableToExcel(table, "mismatch.xls");
    }
  };

  if (deals.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Данные по сделкам не найдены</p>
          <p className="text-sm text-muted-foreground">
            Выбери <b>CSV сделки</b> в шапке — импорт начнётся сразу.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Все сделки по стадиям (несоответствия красным)</CardTitle>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Экспорт XLS
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table id="mismatch-table" className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th rowSpan={2} className="border border-border bg-card p-2 text-left">
                    Ответственный
                  </th>
                  <th
                    colSpan={STAGE_GROUPS["Проектирование"].length}
                    className="border border-border bg-stage-proj p-2 text-center text-stage-proj-fg"
                  >
                    Проектирование
                  </th>
                  <th
                    colSpan={STAGE_GROUPS["Тендер"].length}
                    className="border border-border bg-stage-tender p-2 text-center text-stage-tender-fg"
                  >
                    Тендер
                  </th>
                  <th
                    colSpan={STAGE_GROUPS["Реализация"].length}
                    className="border border-border bg-stage-real p-2 text-center text-stage-real-fg"
                  >
                    Реализация
                  </th>
                  <th rowSpan={2} className="border border-border bg-card p-2 text-center">
                    Итого
                  </th>
                </tr>
                <tr>
                  {STAGE_ORDER.map((s, i) => (
                    <th key={s} className={`border border-border ${getStageClass(s)} p-2 text-center`}>
                      {i + 1}. {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.rows.map((row, idx) => (
                  <tr key={idx} className={row.type === "dept" ? "bg-muted" : idx % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                    <th
                      className={`border border-border p-2 text-left ${
                        row.type === "person" ? row.personClass : "bg-muted font-bold"
                      }`}
                    >
                      {row.name}
                    </th>
                    {row.cells.map((cell: any, ci: number) => (
                      <td
                        key={ci}
                        className={`border border-border p-2 text-center ${getStageClass(cell.stage)}`}
                      >
                        {cell.value > 0 && (
                          <span className={cell.bad ? "font-bold text-destructive" : "font-semibold"}>
                            {fmt(cell.value)}
                          </span>
                        )}
                      </td>
                    ))}
                    <th className="border border-border bg-muted p-2 text-center font-bold">
                      {fmt(row.total)}
                    </th>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th className="border border-border bg-accent p-2 text-left font-bold">Общий итог</th>
                  {tableData.grandCells.map((cell, idx) => (
                    <td
                      key={idx}
                      className={`border border-border p-2 text-center font-bold ${getStageClass(
                        cell.stage
                      )}`}
                    >
                      {fmt(cell.value)}
                    </td>
                  ))}
                  <th className="border border-border bg-accent p-2 text-center font-bold">
                    {fmt(tableData.grandTotal)}
                  </th>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
