import { useState, useMemo } from "react";
import { Deal } from "@/types/crm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Clock, AlertTriangle } from "lucide-react";
import { exportTableToExcel } from "@/lib/export";
import { STAGE_ORDER, STAGE_GROUPS, DEPARTMENTS } from "@/lib/constants";
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

  // Функция для сокращения названий стадий
  const getShortStageName = (stage: string, index: number): string => {
    const shortNames: Record<string, string> = {
      "Предварительные переговоры": "Перегов.",
      "Определение потребностей": "Потребн.",
      "Коммерческое предложение": "КП",
      "Переговоры и принятие решений": "Решение",
      "Согласование договора": "Договор", 
      "Заключение договора": "Заключ.",
      "Исполнение обязательств": "Исполн.",
      "Повторные продажи": "Повтор.",
      "Проектирование": "Проект",
      "Тендер": "Тендер",
      "Реализация": "Реализ."
    };
    
    return shortNames[stage] || `${index + 1}.${stage.substring(0, 8)}`;
  };

  if (deals.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-center space-y-3">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-semibold text-muted-foreground">Нет данных по сделкам</h3>
          <p className="text-sm text-muted-foreground">Нажмите "Загрузить данные" вверху для получения актуальных данных из Bitrix24.</p>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <CardTitle>Устаревшие сделки (более {days} дней)</CardTitle>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">Дней:</label>
              <Input
                type="number"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-20"
                min={1}
              />
            </div>
            {staleDeals.length > 0 && (
              <Button onClick={handleExport} size="sm">
                <Download className="mr-2 h-4 w-4" />
                Экспорт
              </Button>
            )}
          </div>
        </div>
        {staleDeals.length > 0 && (
          <div className="text-sm text-muted-foreground">
            Найдено {fmt(staleDeals.length)} сделок без изменений из {fmt(deals.length)} общих сделок
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {staleDeals.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-700 mb-2">Отлично!</h3>
            <p className="text-muted-foreground">
              Нет сделок без изменений более {days} дней
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table id="stale-table" className="w-full border-collapse text-xs table-fixed min-w-[800px]">
              <colgroup>
                <col className="w-[180px]" />
                {STAGE_ORDER.map(() => (
                  <col key={Math.random()} className="w-[80px]" />
                ))}
                <col className="w-[80px]" />
              </colgroup>
              <thead>
                <tr>
                  <th rowSpan={2} className="border border-border bg-muted p-2 text-left font-semibold align-bottom sticky left-0 z-10">
                    <div className="font-semibold">Ответственный</div>
                  </th>
                  <th colSpan={STAGE_GROUPS.Проектирование.length} className="border border-border bg-blue-100 text-blue-800 p-1 text-center font-semibold">
                    Проектирование
                  </th>
                  <th colSpan={STAGE_GROUPS.Тендер.length} className="border border-border bg-yellow-100 text-yellow-800 p-1 text-center font-semibold">
                    Тендер
                  </th>
                  <th colSpan={STAGE_GROUPS.Реализация.length} className="border border-border bg-green-100 text-green-800 p-1 text-center font-semibold">
                    Реализация
                  </th>
                  <th rowSpan={2} className="border border-border bg-muted p-2 text-center font-semibold align-bottom">
                    <div className="transform -rotate-90 whitespace-nowrap">Итого</div>
                  </th>
                </tr>
                <tr>
                  {STAGE_ORDER.map((s, i) => (
                    <th key={s} className={`border border-border ${stageClass(s)} p-1 text-center font-medium`}>
                      <div className="whitespace-nowrap text-[10px] leading-tight transform -rotate-45 origin-bottom-left h-16 flex items-end justify-center">
                        <span className="transform rotate-45">{getShortStageName(s, i)}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.rows.map((row, idx) => (
                  <tr key={idx} className={row.type === "dept" ? "bg-muted/50" : ""}>
                    <th className={`border border-border p-2 text-left text-xs sticky left-0 z-10 ${
                      row.type === "dept" 
                        ? "bg-muted font-bold" 
                        : `${row.personClass} bg-background`
                    }`}>
                      <div className="truncate font-medium" title={row.name}>
                        {row.name}
                      </div>
                    </th>
                    {STAGE_ORDER.map((s) => {
                      const v = row.counts[s] || 0;
                      return (
                        <td key={s} className={`border border-border ${stageClass(s)} p-1 text-center`}>
                          {v > 0 && (
                            <span className="font-semibold text-xs">
                              {fmt(v)}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <th className="border border-border bg-muted p-1 text-center font-bold text-xs">
                      {fmt(row.total)}
                    </th>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted">
                  <th className="border border-border p-2 text-left font-bold text-xs sticky left-0 z-10 bg-muted">
                    <div className="font-bold">Общий итог</div>
                  </th>
                  {STAGE_ORDER.map((s) => (
                    <td key={s} className={`border border-border ${stageClass(s)} p-1 text-center font-bold text-xs`}>
                      {fmt(tableData.grand[s])}
                    </td>
                  ))}
                  <th className="border border-border bg-muted p-1 text-center font-bold text-xs">
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