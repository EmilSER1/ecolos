import { useMemo } from "react";
import { Deal } from "@/types/crm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ALLOWED_BY_PERSON, DEPARTMENTS, STAGE_ORDER } from "@/lib/constants";
import { fmt } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

interface DashboardTabProps {
  deals: Deal[];
}

export function DashboardTab({ deals }: DashboardTabProps) {
  const stats = useMemo(() => {
    const people = new Set(deals.map((r) => r["Ответственный"]).filter(Boolean));
    
    let mismatches = 0;
    deals.forEach((r) => {
      const p = r["Ответственный"];
      const s = r["Стадия сделки"];
      const allowed = ALLOWED_BY_PERSON[p] || [];
      if (s && allowed.length && !allowed.includes(s)) mismatches++;
    });

    return {
      total: deals.length,
      people: people.size,
      mismatches,
    };
  }, [deals]);

  const monthsData = useMemo(() => {
    const parseDate = (v: string | null): Date | null => {
      if (!v) return null;
      const s = String(v);
      const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
      const ts = Date.parse(s);
      return isNaN(ts) ? null : new Date(ts);
    };

    const months: Record<string, number> = {};
    deals.forEach((r) => {
      const d = parseDate(r["Дата создания"] || r["Дата изменения"]);
      if (!d) return;
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months[k] = (months[k] || 0) + 1;
    });

    return Object.entries(months)
      .filter((p) => p[1] > 0)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, value]) => ({ name, value }));
  }, [deals]);

  const deptsData = useMemo(() => {
    const byD: Record<string, number> = {};
    deals.forEach((r) => {
      const k = r["Отдел"] || "—";
      byD[k] = (byD[k] || 0) + 1;
    });
    return Object.entries(byD)
      .filter((e) => e[1] > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [deals]);

  const stagesData = useMemo(() => {
    const st: Record<string, number> = Object.fromEntries(STAGE_ORDER.map((s) => [s, 0]));
    deals.forEach((r) => {
      const s = r["Стадия сделки"];
      if (st[s] != null) st[s] += 1;
    });
    return Object.entries(st)
      .filter((e) => e[1] > 0)
      .map(([name, value]) => ({ name: name.slice(0, 20), value }));
  }, [deals]);

  const personsData = useMemo(() => {
    const byP: Record<string, number> = {};
    deals.forEach((r) => {
      const k = r["Ответственный"] || "—";
      byP[k] = (byP[k] || 0) + 1;
    });
    return Object.entries(byP)
      .filter((e) => e[1] > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name, value]) => ({ name, value }));
  }, [deals]);

  if (deals.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Нет данных для графиков</p>
          <p className="text-sm text-muted-foreground">Импортируй CSV сделки вверху</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground">Сделок</div>
            <div className="text-3xl font-bold">{fmt(stats.total)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground">Сотрудников</div>
            <div className="text-3xl font-bold">{fmt(stats.people)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground">Несоответствий</div>
            <div className="text-3xl font-bold text-destructive">{fmt(stats.mismatches)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>По месяцам</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                  }}
                />
                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>По отделам</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>По стадиям</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stagesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={120} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>По сотрудникам (топ-20)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={personsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={120} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
