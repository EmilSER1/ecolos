import { useState, useMemo } from "react";
import { Deal } from "@/types/crm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download } from "lucide-react";
import { exportTableToExcel } from "@/lib/export";

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
    return deals
      .filter((r) => {
        const d = parseDate(r["Дата создания"]);
        if (!d) return false;
        const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
        return diff >= days;
      })
      .map((r) => {
        const d = parseDate(r["Дата создания"]);
        const daysOpen = d ? Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)) : 0;
        return { ...r, daysOpen };
      })
      .sort((a, b) => b.daysOpen - a.daysOpen);
  }, [deals, days]);

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
          <p className="text-muted-foreground">Нет сделок открытых более {days} дней</p>
        ) : (
          <div className="overflow-auto">
            <table id="stale-table" className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-card">
                  <th className="border border-border bg-muted p-3 text-left font-semibold">ID сделки</th>
                  <th className="border border-border bg-muted p-3 text-left font-semibold">Ответственный</th>
                  <th className="border border-border bg-muted p-3 text-left font-semibold">Стадия сделки</th>
                  <th className="border border-border bg-muted p-3 text-left font-semibold">Отдел</th>
                  <th className="border border-border bg-muted p-3 text-left font-semibold">Дата создания</th>
                  <th className="border border-border bg-muted p-3 text-right font-semibold">Дней открыта</th>
                </tr>
              </thead>
              <tbody>
                {staleDeals.map((deal, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                    <td className="border border-border p-3">{deal["ID сделки"]}</td>
                    <td className="border border-border p-3">{deal["Ответственный"]}</td>
                    <td className="border border-border p-3">{deal["Стадия сделки"]}</td>
                    <td className="border border-border p-3">{deal["Отдел"]}</td>
                    <td className="border border-border p-3">{deal["Дата создания"]}</td>
                    <td className="border border-border p-3 text-right font-bold text-destructive">{deal.daysOpen}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
