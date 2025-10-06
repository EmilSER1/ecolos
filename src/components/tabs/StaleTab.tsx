import { useState, useMemo } from "react";
import { Deal } from "@/types/crm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download } from "lucide-react";
import { exportTableToExcel } from "@/lib/export";
import { STAGE_ORDER, STAGE_GROUPS, DEPARTMENTS, ALLOWED_BY_PERSON } from "@/lib/constants";
import { fmt, stageClass, personNameClass } from "@/lib/utils";

interface StaleTabProps {
  deals: Deal[];
}

export function StaleTab({ deals }: StaleTabProps) {
  const [days, setDays] = useState(200);

  const parseDate = (v: string | null): Date | null => {
    if (!v) return null;
    const s = String(v);
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    const m2 = s.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
    if (m2) return new Date(+m2[3], +m2[2] - 1, +m2[1]);
    const ts = Date.parse(s);
    return isNaN(ts) ? null : new Date(ts);
  };

  const staleDeals = useMemo(() => {
    const now = new Date();
    return deals.filter((r) => {
      const d = parseDate(r["Дата изменения"] || r["Дата создания"]);
      if (!d) return false;
      const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      return diff > days;
    });
  }, [deals, days]);

  const tableData = useMemo(() => {
    const depts = Object.keys(DEPARTMENTS);
    const rows: Array<{ type: "person" | "dept"; name: string; counts: Record<string, number>; total: number; personClass?: string }> = [];
    const grand: Record<string, number> = Object.fromEntries(STAGE_ORDER.map((s) => [s, 0]));
    let grandTotal = 0;

    depts.forEach((dept) => {
      const people = DEPARTMENTS[dept as keyof typeof DEPARTMENTS];
      const depTotals: Record<string, number> = Object.fromEntries(STAGE_ORDER.map((s) => [s, 0]));
      let depSum = 0;

      people.forEach((p) => {
        const personDeals = staleDeals.filter((r) => r["Ответственный"] === p);
        const counts: Record<string, number> = Object.fromEntries(STAGE_ORDER.map((s) => [s, 0]));
        personDeals.forEach((r) => {
          const st = r["Стадия сделки"];
          if (counts[st] != null) counts[st] += 1;
        });
        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        depSum += total;
        STAGE_ORDER.forEach((s) => (depTotals[s] += counts[s]));
        
        rows.push({
          type: "person",
          name: p,
          counts,
          total,
          personClass: personNameClass(p),
        });
      });

      STAGE_ORDER.forEach((s) => (grand[s] += depTotals[s]));
      grandTotal += depSum;
      
      rows.push({
        type: "dept",
        name: `Итого ${dept}`,
        counts: depTotals,
        total: depSum,
      });
    });

    return { rows, grand, grandTotal };
  }, [staleDeals]);

  const handleExport = () => {
    const table = document.getElementById("stale-table");
    if (table) {
      exportTableToExcel(table, "stale-deals.xls");
    }
  };

  if (deals.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Нет данных по сделкам</p>
          <p className="text-sm text-muted-foreground">Импортируйте CSV сделки</p>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
        <CardTitle>Более {days} дней без изменений</CardTitle>
        <div className="flex items-center gap-2">
          <label className="text-sm">Дней:</label>
          <Input
            type="number"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-24"
            min={1}
          />
          {staleDeals.length > 0 && (
            <Button onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Экспорт XLS
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {staleDeals.length === 0 ? (
          <p className="text-muted-foreground">Нет сделок более {days} дней без изменений</p>
        ) : (
          <div className="w-full">
            <table id="stale-table" className="w-full border-collapse text-xs sm:text-sm table-fixed">
              <colgroup>
                <col className="w-[200px] sm:w-[250px]" />
                {STAGE_ORDER.map((s) => (
                  <col key={s} />
                ))}
                <col className="w-[100px]" />
              </colgroup>
              <thead>
                <tr>
                  <th rowSpan={2} className="border border-border bg-muted p-2 text-left font-semibold align-bottom">
                    Ответственный
                  </th>
                  <th colSpan={STAGE_GROUPS.Проектирование.length} className="border border-border bg-stage-proj text-stage-proj-fg p-2 text-center font-semibold">
                    Проектирование
                  </th>
                  <th colSpan={STAGE_GROUPS.Тендер.length} className="border border-border bg-stage-tender text-stage-tender-fg p-2 text-center font-semibold">
                    Тендер
                  </th>
                  <th colSpan={STAGE_GROUPS.Реализация.length} className="border border-border bg-stage-real text-stage-real-fg p-2 text-center font-semibold">
                    Реализация
                  </th>
                  <th rowSpan={2} className="border border-border bg-muted p-2 text-right font-semibold align-bottom">
                    Итого
                  </th>
                </tr>
                <tr>
                  {STAGE_ORDER.map((s, i) => (
                    <th key={s} className={`border border-border ${stageClass(s)} p-1 text-center font-medium text-[10px] sm:text-xs`}>
                      <div className="whitespace-normal leading-tight">{i + 1}. {s}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.rows.map((row, idx) => (
                  <tr key={idx}>
                    <th className={`border border-border p-2 text-left text-xs sm:text-sm ${row.type === "dept" ? "bg-muted font-bold" : row.personClass}`}>
                      <div className="truncate" title={row.name}>{row.name}</div>
                    </th>
                    {STAGE_ORDER.map((s) => {
                      const v = row.counts[s] || 0;
                      return (
                        <td key={s} className={`border border-border ${stageClass(s)} p-1 text-center text-xs`}>
                          {v > 0 && <span className="font-semibold">{fmt(v)}</span>}
                        </td>
                      );
                    })}
                    <th className="border border-border bg-muted p-2 text-right font-bold">
                      {fmt(row.total)}
                    </th>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th className="border border-border bg-muted p-2 text-left font-bold text-xs sm:text-sm">
                    <div className="truncate">Общий итог</div>
                  </th>
                  {STAGE_ORDER.map((s) => (
                    <td key={s} className={`border border-border ${stageClass(s)} p-1 text-center font-bold text-xs`}>
                      {fmt(tableData.grand[s])}
                    </td>
                  ))}
                  <th className="border border-border bg-muted p-2 text-right font-bold">
                    {fmt(tableData.grandTotal)}
                  </th>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
