import { useState, useMemo } from "react";
import { Task } from "@/types/crm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";
import { fmt } from "@/lib/utils";

interface TasksTabProps {
  tasks: Task[];
}

export function TasksTab({ tasks }: TasksTabProps) {
  const [fromCreated, setFromCreated] = useState("");
  const [toCreated, setToCreated] = useState("");
  const [fromClosed, setFromClosed] = useState("");
  const [toClosed, setToClosed] = useState("");
  const [selectedCreator, setSelectedCreator] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const parseDate = (s: string): Date | null => {
    if (!s) return null;
    const str = String(s).trim();
    
    // DD.MM.YYYY HH:MM:SS or DD.MM.YYYY HH:MM or DD.MM.YYYY
    let m = str.match(/^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
    if (m) {
      return new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
    }
    
    // YYYY-MM-DD HH:MM:SS or YYYY-MM-DD HH:MM or YYYY-MM-DD
    m = str.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
    if (m) {
      return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
    }
    
    const ts = Date.parse(str);
    return isNaN(ts) ? null : new Date(ts);
  };

  const uniqueTasks = useMemo(() => {
    const map = new Map<string, Task>();
    tasks.forEach((t) => {
      const id = t.ID != null && t.ID !== "" ? String(t.ID) : null;
      if (!id) return;
      if (!map.has(id)) map.set(id, t);
    });
    return Array.from(map.values());
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return uniqueTasks.filter((t) => {
      const dc = parseDate(t["Дата создания"]);
      const dz = parseDate(t["Дата закрытия"]);

      // Фильтр по дате создания
      if (fromCreated) {
        const fc = new Date(fromCreated);
        if (!dc || dc < fc) return false;
      }
      if (toCreated) {
        const tc = new Date(toCreated);
        if (!dc || dc > tc) return false;
      }

      // Фильтр по дате закрытия
      if (fromClosed || toClosed) {
        if (!dz) return false;
        if (fromClosed) {
          const fz = new Date(fromClosed);
          if (dz < fz) return false;
        }
        if (toClosed) {
          const tz = new Date(toClosed);
          if (dz > tz) return false;
        }
      }

      // Фильтр по постановщику
      if (selectedCreator && (t.Постановщик || "") !== selectedCreator) return false;
      
      // Фильтр по исполнителю
      if (selectedAssignee && (t.Исполнитель || "") !== selectedAssignee) return false;
      
      // Фильтр по статусу
      if (selectedStatus && (t.Статус || "") !== selectedStatus) return false;

      return true;
    });
  }, [uniqueTasks, fromCreated, toCreated, fromClosed, toClosed, selectedCreator, selectedAssignee, selectedStatus]);

  const creators = useMemo(() => {
    return ["", ...new Set(uniqueTasks.map((t) => t.Постановщик || "").filter(Boolean))].sort();
  }, [uniqueTasks]);

  const assignees = useMemo(() => {
    return ["", ...new Set(uniqueTasks.map((t) => t.Исполнитель || "").filter(Boolean))].sort();
  }, [uniqueTasks]);

  const statuses = useMemo(() => {
    return ["", ...new Set(uniqueTasks.map((t) => t.Статус || "").filter(Boolean))].sort();
  }, [uniqueTasks]);

  // Таблица 1: Сам себе (постановщик = исполнитель)
  const selfAssignedData = useMemo(() => {
    const self = filteredTasks.filter(
      (t) => t.Постановщик && t.Исполнитель && t.Постановщик === t.Исполнитель
    );
    const counts: Record<string, number> = {};
    self.forEach((t) => {
      const key = t.Исполнитель || "—";
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filteredTasks]);

  // Таблица 2: По постановщикам
  const creatorData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredTasks.forEach((t) => {
      const key = t.Постановщик || "—";
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filteredTasks]);

  // Таблица 3: По исполнителям
  const assigneeData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredTasks.forEach((t) => {
      const key = t.Исполнитель || "—";
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filteredTasks]);

  // Таблица 4: Статусы × Исполнители
  const statusAssigneeMatrix = useMemo(() => {
    const statusList = [...new Set(filteredTasks.map((t) => t.Статус || "—"))].sort();
    const assigneeList = [...new Set(filteredTasks.map((t) => t.Исполнитель || "—"))].sort();

    const matrix: Record<string, Record<string, number>> = {};
    assigneeList.forEach((a) => {
      matrix[a] = {};
      statusList.forEach((s) => {
        matrix[a][s] = 0;
      });
    });

    filteredTasks.forEach((t) => {
      const a = t.Исполнитель || "—";
      const s = t.Статус || "—";
      if (matrix[a] && matrix[a][s] != null) {
        matrix[a][s] += 1;
      }
    });

    return { statusList, assigneeList, matrix };
  }, [filteredTasks]);

  const handleExport = () => {
    const tables = ["#table-self", "#table-creator", "#table-assignee", "#table-status"];
    const body = tables.map((sel) => document.querySelector(sel)?.outerHTML || "").join("<br><br>");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${body}</body></html>`;
    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "tasks_summary.xls";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  };

  if (tasks.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Нет данных по задачам</p>
          <p className="text-sm text-muted-foreground">Импортируйте CSV задачи</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <CardTitle>Задачи — счётчики</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <label className="text-sm whitespace-nowrap">Создана с:</label>
              <Input
                type="date"
                value={fromCreated}
                onChange={(e) => setFromCreated(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm">по:</label>
              <Input
                type="date"
                value={toCreated}
                onChange={(e) => setToCreated(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm whitespace-nowrap">Закрыта с:</label>
              <Input
                type="date"
                value={fromClosed}
                onChange={(e) => setFromClosed(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm">по:</label>
              <Input
                type="date"
                value={toClosed}
                onChange={(e) => setToClosed(e.target.value)}
                className="w-40"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Select value={selectedCreator} onValueChange={setSelectedCreator}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Все постановщики" />
              </SelectTrigger>
              <SelectContent>
                {creators.map((c) => (
                  <SelectItem key={c || "all"} value={c}>
                    {c || "Все постановщики"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Все исполнители" />
              </SelectTrigger>
              <SelectContent>
                {assignees.map((a) => (
                  <SelectItem key={a || "all"} value={a}>
                    {a || "Все исполнители"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Все статусы" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s || "all"} value={s}>
                    {s || "Все статусы"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Экспорт XLS
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Таблица 1: Сам себе */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">1) Сам себе</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto">
                  <table id="table-self" className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border p-2 text-left">Сотрудник</th>
                        <th className="border border-border p-2 text-right">Кол-во задач</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selfAssignedData.map(([name, count], idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                          <td className="border border-border p-2">{name}</td>
                          <td className="border border-border p-2 text-right font-bold">{count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Таблица 2: По постановщикам */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">2) По постановщикам</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto">
                  <table id="table-creator" className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border p-2 text-left">Постановщик</th>
                        <th className="border border-border p-2 text-right">Кол-во задач</th>
                      </tr>
                    </thead>
                    <tbody>
                      {creatorData.map(([name, count], idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                          <td className="border border-border p-2">{name}</td>
                          <td className="border border-border p-2 text-right font-bold">{count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Таблица 3: По исполнителям */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">3) По исполнителям</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto">
                  <table id="table-assignee" className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border p-2 text-left">Исполнитель</th>
                        <th className="border border-border p-2 text-right">Кол-во задач</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assigneeData.map(([name, count], idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                          <td className="border border-border p-2">{name}</td>
                          <td className="border border-border p-2 text-right font-bold">{count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Таблица 4: Статусы × Исполнители */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">4) Статусы × Исполнители</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto">
                  <table id="table-status" className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border p-2 text-left">Исполнитель</th>
                        {statusAssigneeMatrix.statusList.map((s) => (
                          <th key={s} className="border border-border p-2 text-center">
                            {s}
                          </th>
                        ))}
                        <th className="border border-border p-2 text-right">Итого</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statusAssigneeMatrix.assigneeList.map((assignee, idx) => {
                        const sum = statusAssigneeMatrix.statusList.reduce(
                          (acc, s) => acc + (statusAssigneeMatrix.matrix[assignee][s] || 0),
                          0
                        );
                        return (
                          <tr key={idx} className={idx % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                            <th className="border border-border p-2 text-left font-medium">{assignee}</th>
                            {statusAssigneeMatrix.statusList.map((s) => {
                              const v = statusAssigneeMatrix.matrix[assignee][s] || 0;
                              return (
                                <td key={s} className="border border-border p-2 text-center">
                                  {v > 0 && <span className="font-bold">{v}</span>}
                                </td>
                              );
                            })}
                            <th className="border border-border p-2 text-right font-bold">{sum}</th>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
