import { useMemo, useState } from "react";
import { Deal } from "@/types/crm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEPARTMENTS, STAGE_ORDER, ALLOWED_BY_PERSON } from "@/lib/constants";
import { fmt, stageClass, personNameClass } from "@/lib/utils";
import { Download, ShieldAlert, Search } from "lucide-react";
import { exportTableToExcel } from "@/lib/export";

interface MismatchTabProps {
  deals: Deal[];
}

export function MismatchTab({ deals }: MismatchTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyMismatches, setShowOnlyMismatches] = useState(false);

  const tableData = useMemo(() => {
    const depts = Object.keys(DEPARTMENTS);
    const rows: any[] = [];

    const grand: Record<string, number> = Object.fromEntries(STAGE_ORDER.map((s) => [s, 0]));
    let grandTotal = 0;
    let totalMismatches = 0;

    depts.forEach((dep) => {
      const ppl = DEPARTMENTS[dep as keyof typeof DEPARTMENTS];
      let depTotals: Record<string, number> = Object.fromEntries(STAGE_ORDER.map((s) => [s, 0]));
      let depSum = 0;
      let depMismatches = 0;

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
          if (bad) {
            depMismatches += v;
            totalMismatches += v;
          }
          return { value: v, bad, stage: s };
        });

        const personMismatches = cells.filter(c => c.bad).reduce((sum, c) => sum + c.value, 0);
        
        // Фильтрация
        const matchesSearch = searchTerm === "" || p.toLowerCase().includes(searchTerm.toLowerCase());
        const shouldShow = showOnlyMismatches ? personMismatches > 0 : true;

        if (matchesSearch && shouldShow) {
          rows.push({ 
            type: "person", 
            name: p, 
            department: dep,
            cells, 
            total, 
            mismatches: personMismatches,
            personClass: personNameClass(p) 
          });
        }
      });

      STAGE_ORDER.forEach((s) => (grand[s] += depTotals[s]));
      grandTotal += depSum;

      const depCells = STAGE_ORDER.map((s) => ({
        value: depTotals[s],
        bad: false,
        stage: s,
      }));

      if (rows.some(r => r.department === dep)) {
        rows.push({ 
          type: "dept", 
          name: `Итого ${dep}`, 
          department: dep,
          cells: depCells, 
          total: depSum,
          mismatches: depMismatches
        });
      }
    });

    const grandCells = STAGE_ORDER.map((s) => ({
      value: grand[s],
      bad: false,
      stage: s,
    }));

    return { rows, grandCells, grandTotal, totalMismatches };
  }, [deals, searchTerm, showOnlyMismatches]);

  const handleExport = () => {
    const table = document.getElementById("mismatch-table");
    if (table) {
      exportTableToExcel(table, "mismatch.xls");
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
          <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-semibold text-muted-foreground">Нет данных по сделкам</h3>
          <p className="text-sm text-muted-foreground">Нажмите "Загрузить данные" вверху для получения актуальных данных из Bitrix24.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-500" />
              <CardTitle>Ролевые несоответствия (красным выделены нарушения)</CardTitle>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={handleExport} size="sm">
                <Download className="mr-2 h-4 w-4" />
                Экспорт
              </Button>
            </div>
          </div>
          
          {/* Статистика */}
          {tableData.totalMismatches > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="text-sm text-red-800">
                <strong>Обнаружено нарушений:</strong> {fmt(tableData.totalMismatches)} сделок у {
                  tableData.rows.filter(r => r.type === "person" && r.mismatches > 0).length
                } сотрудников
              </div>
            </div>
          )}
          
          {/* Фильтры */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по сотруднику..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="show-mismatches"
                checked={showOnlyMismatches}
                onChange={(e) => setShowOnlyMismatches(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="show-mismatches" className="text-sm font-medium">
                Только с нарушениями
              </label>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table id="mismatch-table" className="w-full border-collapse text-xs table-fixed min-w-[800px]">
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
                  <th colSpan={STAGE_ORDER.filter(s => ["Предварительные переговоры", "Определение потребностей", "Коммерческое предложение"].includes(s)).length} 
                      className="border border-border bg-blue-100 text-blue-800 p-1 text-center font-semibold">
                    Проектирование
                  </th>
                  <th colSpan={STAGE_ORDER.filter(s => ["Переговоры и принятие решений", "Согласование договора"].includes(s)).length}
                      className="border border-border bg-yellow-100 text-yellow-800 p-1 text-center font-semibold">
                    Тендер
                  </th>
                  <th colSpan={STAGE_ORDER.filter(s => !["Предварительные переговоры", "Определение потребностей", "Коммерческое предложение", "Переговоры и принятие решений", "Согласование договора"].includes(s)).length}
                      className="border border-border bg-green-100 text-green-800 p-1 text-center font-semibold">
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
                      row.type === "person" 
                        ? `${row.personClass} bg-background` 
                        : "bg-muted font-bold"
                    }`}>
                      <div className="truncate font-medium" title={row.name}>
                        {row.name}
                        {row.type === "person" && row.mismatches > 0 && (
                          <div className="text-[10px] text-red-600 font-bold">
                            {row.mismatches} нар.
                          </div>
                        )}
                      </div>
                    </th>
                    {row.cells.map((cell: any, ci: number) => (
                      <td
                        key={ci}
                        className={`border border-border p-1 text-center text-xs ${stageClass(cell.stage)} ${
                          cell.bad ? "bg-red-100" : ""
                        }`}
                      >
                        {cell.value > 0 && (
                          <span className={cell.bad ? "font-bold text-red-700" : "font-semibold"}>
                            {fmt(cell.value)}
                          </span>
                        )}
                      </td>
                    ))}
                    <th className="border border-border bg-muted p-1 text-center font-bold text-xs">
                      {fmt(row.total)}
                      {row.type === "person" && row.mismatches > 0 && (
                        <div className="text-[10px] text-red-600">
                          ({row.mismatches})
                        </div>
                      )}
                    </th>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted">
                  <th className="border border-border p-2 text-left font-bold text-xs sticky left-0 z-10 bg-muted">
                    <div className="font-bold">Общий итог</div>
                    <div className="text-[10px] text-red-600">
                      {tableData.totalMismatches > 0 && `${fmt(tableData.totalMismatches)} нар.`}
                    </div>
                  </th>
                  {tableData.grandCells.map((cell, idx) => (
                    <td
                      key={idx}
                      className={`border border-border p-1 text-center font-bold text-xs ${stageClass(cell.stage)}`}
                    >
                      {fmt(cell.value)}
                    </td>
                  ))}
                  <th className="border border-border bg-muted p-1 text-center font-bold text-xs">
                    {fmt(tableData.grandTotal)}
                  </th>
                </tr>
              </tfoot>
            </table>
          </div>
          
          {/* Легенда */}
          <div className="mt-4 text-xs text-muted-foreground">
            <p><strong>Примечание:</strong> Красным фоном выделены ячейки с нарушениями ролевого доступа. 
            В скобках указано количество нарушений для каждого сотрудника.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}