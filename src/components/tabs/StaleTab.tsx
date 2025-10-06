import { useState, useMemo } from "react";
import { Deal } from "@/types/crm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download } from "lucide-react";

interface StaleTabProps {
  deals: Deal[];
}

export function StaleTab({ deals }: StaleTabProps) {
  const [days, setDays] = useState(200);

  const staleDeals = useMemo(() => {
    const now = new Date();
    return deals.filter((r) => {
      const d = new Date(r["Дата изменения"] || r["Дата создания"] || "");
      if (!d || isNaN(+d)) return false;
      return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) > days;
    });
  }, [deals, days]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
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
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Найдено сделок: {staleDeals.length}</p>
      </CardContent>
    </Card>
  );
}
