import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, Users, Calendar } from "lucide-react";
import { Deal, Task } from "@/types/crm";
import { useMemo } from "react";

interface BitrixDashboardTabProps {
  deals: Deal[];
  tasks: Task[];
}

export function BitrixDashboardTab({ deals, tasks }: BitrixDashboardTabProps) {
  const stats = useMemo(() => {
    const uniqueManagers = new Set(deals.map(d => d.Ответственный)).size;
    const activeTasks = tasks.filter(t => t.Статус !== "Завершена").length;
    const lastSync = deals.length > 0 || tasks.length > 0 
      ? new Date().toLocaleString("ru-RU") 
      : null;

    return {
      totalDeals: deals.length,
      activeTasks,
      managers: uniqueManagers,
      lastSync
    };
  }, [deals, tasks]);
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего сделок</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDeals}</div>
            <p className="text-xs text-muted-foreground">Из Bitrix24</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активные задачи</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTasks}</div>
            <p className="text-xs text-muted-foreground">В работе</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Менеджеров</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.managers}</div>
            <p className="text-xs text-muted-foreground">Всего пользователей</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Последняя синхронизация</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lastSync ? stats.lastSync.split(',')[0] : "—"}</div>
            <p className="text-xs text-muted-foreground">{stats.lastSync ? stats.lastSync.split(',')[1] : "Данные не загружены"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Добро пожаловать в Bitrix24 Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Здесь вы сможете автоматически загружать данные из Bitrix24, настраивать расписание синхронизации
            и просматривать отчеты. Начните с настройки вебхука во вкладке "Настройки".
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
