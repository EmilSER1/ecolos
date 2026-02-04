import { Card, CardContent } from "@/components/ui/card";
import { fmt } from "@/lib/utils";
import { UI_TEXTS } from "@/lib/messages";

interface StatsCardsProps {
  stats: {
    total: number;
    people: number;
    mismatches: number;
    avgSum: number;
    maxSum: number;
    minSum: number;
  };
}

/**
 * Компонент для отображения карточек статистики сделок
 */
export function StatsCards({ stats }: StatsCardsProps) {
  const statsConfig = [
    {
      title: UI_TEXTS.STATS.TOTAL_DEALS,
      value: fmt(stats.total),
      color: "blue",
      icon: "square"
    },
    {
      title: UI_TEXTS.STATS.EMPLOYEES_COUNT,
      value: fmt(stats.people),
      color: "green",
      icon: "circle"
    },
    {
      title: UI_TEXTS.STATS.MISMATCHES,
      value: fmt(stats.mismatches),
      color: "red",
      icon: "square-rounded"
    },
    {
      title: UI_TEXTS.STATS.AVG_SUM,
      value: stats.avgSum > 0 ? fmt(Math.round(stats.avgSum)) : "—",
      color: "purple",
      icon: "rounded-lg"
    },
    {
      title: UI_TEXTS.STATS.MAX_SUM,
      value: stats.maxSum > 0 ? fmt(stats.maxSum) : "—",
      color: "orange",
      icon: "rounded-xl"
    }
  ];

  const getIconClasses = (icon: string) => {
    switch (icon) {
      case "circle": return "rounded-full";
      case "square": return "rounded";
      case "square-rounded": return "rounded-sm";
      case "rounded-lg": return "rounded-lg";
      case "rounded-xl": return "rounded-xl";
      default: return "rounded";
    }
  };

  return (
    <>
      <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-6">
        {UI_TEXTS.STATS.DEALS_TITLE}
      </h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statsConfig.map((stat, index) => (
          <Card key={stat.title} className={`stat-card border-${stat.color}-100 hover:border-${stat.color}-200`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-sm font-medium text-${stat.color}-600 mb-1`}>
                    {stat.title}
                  </div>
                  <div className={`text-3xl font-bold text-${stat.color}-900`}>
                    {stat.value}
                  </div>
                </div>
                <div className={`w-12 h-12 bg-${stat.color}-100 rounded-full flex items-center justify-center`}>
                  <div className={`w-6 h-6 bg-${stat.color}-500 ${getIconClasses(stat.icon)}`}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground">{UI_TEXTS.STATS.MIN_SUM}</div>
            <div className="text-3xl font-bold">
              {stats.minSum > 0 ? fmt(stats.minSum) : "—"}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}