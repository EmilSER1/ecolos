import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { fmt } from "@/lib/utils";
import { CHART_COLORS, CHART_THEME, CHART_AXIS_STYLE, CHART_DIMENSIONS, UI_COLORS } from "@/lib/chart-constants";
import { UI_TEXTS } from "@/lib/messages";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface TasksStats {
  total: number;
  completedTasks: number;
  activeTasks: number;
  statusData: Array<{ name: string; value: number }>;
  executorData: Array<{ name: string; value: number }>;
  creatorData: Array<{ name: string; value: number }>;
}

interface TasksSectionProps {
  taskStats: TasksStats;
}


/**
 * Компонент для отображения статистики и графиков по задачам
 */
export function TasksSection({ taskStats }: TasksSectionProps) {
  const completionPercentage = taskStats.total > 0 
    ? Math.round((taskStats.completedTasks / taskStats.total) * 100) 
    : 0;

  return (
    <>
      <h3 className="text-lg font-semibold mt-8">{UI_TEXTS.STATS.TASKS_TITLE}</h3>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground">{UI_TEXTS.STATS.TOTAL_TASKS}</div>
            <div className="text-3xl font-bold">{fmt(taskStats.total)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground">{UI_TEXTS.STATS.COMPLETED_TASKS}</div>
            <div className="text-3xl font-bold text-green-500">{fmt(taskStats.completedTasks)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground">{UI_TEXTS.STATS.ACTIVE_TASKS}</div>
            <div className="text-3xl font-bold text-yellow-500">{fmt(taskStats.activeTasks)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground">{UI_TEXTS.STATS.COMPLETION_PERCENT}</div>
            <div className="text-3xl font-bold">{completionPercentage}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{UI_TEXTS.CHARTS.TASKS_BY_STATUS}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={CHART_DIMENSIONS.TASK_CHART_HEIGHT}>
              <PieChart>
                <Pie
                  data={taskStats.statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius + 25;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <text 
                        x={x} 
                        y={y} 
                        fill="hsl(var(--foreground))" 
                        textAnchor={x > cx ? 'start' : 'end'} 
                        dominantBaseline="central"
                        className="text-xs"
                      >
                        {`${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                  outerRadius={80}
                  fill={UI_COLORS.BARS.PRIMARY}
                  dataKey="value"
                >
                  {taskStats.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={CHART_THEME} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {taskStats.statusData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-semibold">{fmt(item.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{UI_TEXTS.CHARTS.TOP_EXECUTORS}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={CHART_DIMENSIONS.TASK_CHART_HEIGHT}>
              <BarChart data={taskStats.executorData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" {...CHART_AXIS_STYLE} />
                <YAxis dataKey="name" type="category" {...CHART_AXIS_STYLE} width={CHART_DIMENSIONS.VERTICAL_AXIS_WIDTH} />
                <Tooltip contentStyle={CHART_THEME} />
                <Bar dataKey="value" fill={UI_COLORS.BARS.BLUE} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{UI_TEXTS.CHARTS.TOP_CREATORS}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={CHART_DIMENSIONS.TASK_CHART_HEIGHT}>
              <BarChart data={taskStats.creatorData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" {...CHART_AXIS_STYLE} />
                <YAxis dataKey="name" type="category" {...CHART_AXIS_STYLE} width={CHART_DIMENSIONS.VERTICAL_AXIS_WIDTH} />
                <Tooltip contentStyle={CHART_THEME} />
                <Bar dataKey="value" fill={UI_COLORS.BARS.BLUE} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}