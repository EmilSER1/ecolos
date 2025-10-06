import { useMemo, useState } from "react";
import { Deal, Task } from "@/types/crm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ALLOWED_BY_PERSON, DEPARTMENTS, STAGE_ORDER } from "@/lib/constants";
import { fmt, cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { CalendarIcon, Download } from "lucide-react";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface DashboardTabProps {
  deals: Deal[];
  tasks: Task[];
}

export function DashboardTab({ deals, tasks }: DashboardTabProps) {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const parseDate = (v: string | null): Date | null => {
    if (!v) return null;
    const s = String(v);
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    const ts = Date.parse(s);
    return isNaN(ts) ? null : new Date(ts);
  };

  const filteredDeals = useMemo(() => {
    if (!startDate && !endDate) return deals;
    
    return deals.filter((deal) => {
      const dealDate = parseDate(deal["Дата создания"] || deal["Дата изменения"]);
      if (!dealDate) return true;
      
      if (startDate && dealDate < startDate) return false;
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (dealDate > endOfDay) return false;
      }
      
      return true;
    });
  }, [deals, startDate, endDate]);

  const handleExportPDF = async () => {
    const element = document.getElementById("dashboard-content");
    if (!element) return;

    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [canvas.width, canvas.height]
    });
    
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save(`dashboard-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  const stats = useMemo(() => {
    const people = new Set(filteredDeals.map((r) => r["Ответственный"]).filter(Boolean));
    
    let mismatches = 0;
    const sums: number[] = [];
    
    filteredDeals.forEach((r) => {
      const p = r["Ответственный"];
      const s = r["Стадия сделки"];
      const allowed = ALLOWED_BY_PERSON[p] || [];
      if (s && allowed.length && !allowed.includes(s)) mismatches++;
      
      const sumStr = r["Бюджет сделки"] || r["Сумма"] || r["Цена"];
      if (sumStr) {
        const sum = parseFloat(String(sumStr).replace(/[^\d.-]/g, ""));
        if (!isNaN(sum) && sum > 0) sums.push(sum);
      }
    });

    const avgSum = sums.length > 0 ? sums.reduce((a, b) => a + b, 0) / sums.length : 0;
    const maxSum = sums.length > 0 ? Math.max(...sums) : 0;
    const minSum = sums.length > 0 ? Math.min(...sums) : 0;

    return {
      total: filteredDeals.length,
      people: people.size,
      mismatches,
      avgSum,
      maxSum,
      minSum,
    };
  }, [filteredDeals]);

  const monthsData = useMemo(() => {
    const months: Record<string, number> = {};
    filteredDeals.forEach((r) => {
      const d = parseDate(r["Дата создания"] || r["Дата изменения"]);
      if (!d) return;
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months[k] = (months[k] || 0) + 1;
    });

    return Object.entries(months)
      .filter((p) => p[1] > 0)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, value]) => ({ name, value }));
  }, [filteredDeals]);

  const deptsData = useMemo(() => {
    const byD: Record<string, number> = {};
    filteredDeals.forEach((r) => {
      const k = r["Отдел"] || "—";
      byD[k] = (byD[k] || 0) + 1;
    });
    return Object.entries(byD)
      .filter((e) => e[1] > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [filteredDeals]);

  const stagesData = useMemo(() => {
    const st: Record<string, number> = Object.fromEntries(STAGE_ORDER.map((s) => [s, 0]));
    filteredDeals.forEach((r) => {
      const s = r["Стадия сделки"];
      if (st[s] != null) st[s] += 1;
    });
    return Object.entries(st)
      .filter((e) => e[1] > 0)
      .map(([name, value]) => ({ name: name.slice(0, 20), value }));
  }, [filteredDeals]);

  const personsData = useMemo(() => {
    const byP: Record<string, number> = {};
    filteredDeals.forEach((r) => {
      const k = r["Ответственный"] || "—";
      byP[k] = (byP[k] || 0) + 1;
    });
    return Object.entries(byP)
      .filter((e) => e[1] > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name, value]) => ({ name, value }));
  }, [filteredDeals]);

  // Аналитика по задачам
  const taskStats = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    const executorCounts: Record<string, number> = {};
    const creatorCounts: Record<string, number> = {};
    let completedTasks = 0;
    let activeTasks = 0;

    tasks.forEach((task) => {
      const status = task.Статус || "—";
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      const executor = task.Исполнитель || "—";
      executorCounts[executor] = (executorCounts[executor] || 0) + 1;

      const creator = task.Постановщик || "—";
      creatorCounts[creator] = (creatorCounts[creator] || 0) + 1;

      if (task["Дата закрытия"]) completedTasks++;
      else activeTasks++;
    });

    const statusData = Object.entries(statusCounts)
      .filter((e) => e[1] > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));

    const executorData = Object.entries(executorCounts)
      .filter((e) => e[1] > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));

    const creatorData = Object.entries(creatorCounts)
      .filter((e) => e[1] > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));

    return {
      total: tasks.length,
      completedTasks,
      activeTasks,
      statusData,
      executorData,
      creatorData,
    };
  }, [tasks]);

  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

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
      <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
        <div className="flex gap-2 items-center flex-wrap">
          <span className="text-sm font-medium">Период:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "dd.MM.yyyy") : <span>Дата от</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "dd.MM.yyyy") : <span>Дата до</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          {(startDate || endDate) && (
            <Button
              variant="ghost"
              onClick={() => {
                setStartDate(undefined);
                setEndDate(undefined);
              }}
            >
              Сбросить
            </Button>
          )}
        </div>

        <Button onClick={handleExportPDF} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Экспорт в PDF
        </Button>
      </div>

      <div id="dashboard-content" className="space-y-4">
        <h3 className="text-lg font-semibold">Сделки</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Средняя сумма</div>
              <div className="text-3xl font-bold">{stats.avgSum > 0 ? fmt(Math.round(stats.avgSum)) : "—"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Макс. сумма</div>
              <div className="text-3xl font-bold">{stats.maxSum > 0 ? fmt(stats.maxSum) : "—"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Мин. сумма</div>
              <div className="text-3xl font-bold">{stats.minSum > 0 ? fmt(stats.minSum) : "—"}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Распределение по отделам</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={deptsData.slice(0, 5)}
                    cx="50%"
                    cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  style={{ fill: 'hsl(var(--foreground))' }}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {deptsData.slice(0, 5).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    color: "hsl(var(--foreground))",
                  }}
                />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Топ-5 сотрудников</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={personsData.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Динамика по месяцам</CardTitle>
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
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
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
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {tasks.length > 0 && (
          <>
            <h3 className="text-lg font-semibold mt-8">Задачи</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm font-medium text-muted-foreground">Всего задач</div>
                  <div className="text-3xl font-bold">{fmt(taskStats.total)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm font-medium text-muted-foreground">Выполнено</div>
                  <div className="text-3xl font-bold text-green-500">{fmt(taskStats.completedTasks)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm font-medium text-muted-foreground">В работе</div>
                  <div className="text-3xl font-bold text-yellow-500">{fmt(taskStats.activeTasks)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm font-medium text-muted-foreground">% выполнения</div>
                  <div className="text-3xl font-bold">
                    {taskStats.total > 0 ? Math.round((taskStats.completedTasks / taskStats.total) * 100) : 0}%
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Задачи по статусам</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={taskStats.statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                        style={{ fill: 'hsl(var(--foreground))' }}
                      >
                        {taskStats.statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Топ-10 исполнителей</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={taskStats.executorData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--chart-2))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Топ-10 постановщиков</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={taskStats.creatorData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--chart-3))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}