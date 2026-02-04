import { useMemo, useState } from "react";
import { Deal, Task } from "@/types/crm";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { FilterControls } from "@/components/dashboard/FilterControls";
import { DealsChartsSection } from "@/components/dashboard/DealsChartsSection";
import { TasksSection } from "@/components/dashboard/TasksSection";
import { DataSyncStatus } from "@/components/DataSyncStatus";
import { UI_TEXTS } from "@/lib/messages";
import {
  filterDealsByDate,
  filterTasksByDate,
  calculateDealsStats,
  groupDealsByMonth,
  groupDealsByDepartment,
  groupDealsByStage,
  groupDealsByPerson,
  calculateTasksStats,
  exportToPDF
} from "@/lib/dashboard-utils";

interface DashboardTabProps {
  deals: Deal[];
  tasks: Task[];
  onClearCache?: () => void;
  onRefresh?: () => void;
  snapshotStats?: any;
}

/**
 * Главный компонент дашборда с аналитикой сделок и задач
 */
export function DashboardTab({ deals, tasks, onClearCache, onRefresh, snapshotStats }: DashboardTabProps) {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  // Фильтрация данных по датам
  const filteredDeals = useMemo(() => 
    filterDealsByDate(deals, startDate, endDate), 
    [deals, startDate, endDate]
  );

  const filteredTasks = useMemo(() => 
    filterTasksByDate(tasks, startDate, endDate), 
    [tasks, startDate, endDate]
  );

  // Обработчики
  const handleDateReset = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const handleExportPDF = () => exportToPDF("dashboard-content");

  // Вычисляемые данные
  const stats = useMemo(() => calculateDealsStats(filteredDeals), [filteredDeals]);
  const monthsData = useMemo(() => groupDealsByMonth(filteredDeals), [filteredDeals]);
  const deptsData = useMemo(() => groupDealsByDepartment(filteredDeals), [filteredDeals]);
  const stagesData = useMemo(() => groupDealsByStage(filteredDeals), [filteredDeals]);
  const personsData = useMemo(() => groupDealsByPerson(filteredDeals), [filteredDeals]);
  const taskStats = useMemo(() => calculateTasksStats(filteredTasks), [filteredTasks]);

  if (deals.length === 0) {
    return (
      <div className="space-y-6">
        <DataSyncStatus 
          onClearCache={onClearCache} 
          onRefresh={onRefresh}
          snapshotStats={snapshotStats}
        />
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">{UI_TEXTS.DASHBOARD.NO_DATA_TITLE}</p>
            <p className="text-sm text-muted-foreground">Загрузите данные из Bitrix24 или проверьте подключение к базе данных</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DataSyncStatus 
        onClearCache={onClearCache} 
        onRefresh={onRefresh}
        snapshotStats={snapshotStats}
      />
      
      <FilterControls
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onReset={handleDateReset}
        onExport={handleExportPDF}
      />

      <div id="dashboard-content" className="space-y-4">
        <StatsCards stats={stats} />

        <DealsChartsSection
          deptsData={deptsData}
          personsData={personsData}
          monthsData={monthsData}
          stagesData={stagesData}
        />

        {tasks.length > 0 && <TasksSection taskStats={taskStats} />}
      </div>
    </div>
  );
}