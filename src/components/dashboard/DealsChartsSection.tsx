import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CHART_COLORS, CHART_THEME, CHART_AXIS_STYLE, CHART_DIMENSIONS, DISPLAY_LIMITS, UI_COLORS } from "@/lib/chart-constants";
import { UI_TEXTS } from "@/lib/messages";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface DealsChartsSectionProps {
  deptsData: Array<{ name: string; value: number }>;
  personsData: Array<{ name: string; value: number }>;
  monthsData: Array<{ name: string; value: number }>;
  stagesData: Array<{ name: string; value: number }>;
}


/**
 * Компонент для отображения графиков сделок
 */
export function DealsChartsSection({
  deptsData,
  personsData,
  monthsData,
  stagesData
}: DealsChartsSectionProps) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{UI_TEXTS.CHARTS.DEPARTMENTS_DISTRIBUTION}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={CHART_DIMENSIONS.STATS_CHART_HEIGHT}>
              <PieChart>
                <Pie
                  data={deptsData.slice(0, DISPLAY_LIMITS.MAX_DEPARTMENTS_IN_PIE)}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill={UI_COLORS.BARS.PRIMARY}
                  dataKey="value"
                >
                  {deptsData.slice(0, DISPLAY_LIMITS.MAX_DEPARTMENTS_IN_PIE).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={CHART_THEME} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{UI_TEXTS.CHARTS.TOP_EMPLOYEES}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={CHART_DIMENSIONS.STATS_CHART_HEIGHT}>
              <BarChart data={personsData.slice(0, DISPLAY_LIMITS.MAX_TOP_EMPLOYEES)}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" {...CHART_AXIS_STYLE} />
                <YAxis {...CHART_AXIS_STYLE} />
                <Tooltip contentStyle={CHART_THEME} />
                <Bar dataKey="value" fill={UI_COLORS.BARS.PRIMARY} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{UI_TEXTS.CHARTS.MONTHLY_DYNAMICS}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={CHART_DIMENSIONS.LINE_CHART_HEIGHT}>
              <LineChart data={monthsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" {...CHART_AXIS_STYLE} />
                <YAxis {...CHART_AXIS_STYLE} />
                <Tooltip contentStyle={CHART_THEME} />
                <Line type="monotone" dataKey="value" stroke={UI_COLORS.BARS.PRIMARY} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{UI_TEXTS.CHARTS.STAGES_BREAKDOWN}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={CHART_DIMENSIONS.LINE_CHART_HEIGHT}>
              <BarChart data={stagesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" {...CHART_AXIS_STYLE} />
                <YAxis dataKey="name" type="category" {...CHART_AXIS_STYLE} width={CHART_DIMENSIONS.VERTICAL_AXIS_WIDTH} />
                <Tooltip contentStyle={CHART_THEME} />
                <Bar dataKey="value" fill={UI_COLORS.BARS.PRIMARY} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}