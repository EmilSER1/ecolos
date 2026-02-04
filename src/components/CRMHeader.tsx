import { Button } from "@/components/ui/button";
import { Link2, Download, RefreshCw, Database } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CRMHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLoadData?: () => void;
  onLoadDemo?: () => void;
  loading?: boolean;
}

const tabs = [
  { id: "dashboard", label: "Дашборд" },
  { id: "mismatch", label: "Несоответствия" },
  { id: "stale", label: "200+ дней" },
  { id: "tasks", label: "Задачи" },
  { id: "compare", label: "Сравнение" },
  { id: "files", label: "Файлы" },
];

export function CRMHeader({
  activeTab,
  onTabChange,
  onLoadData,
  onLoadDemo,
  loading = false,
}: CRMHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-border bg-background/90 p-3 backdrop-blur-lg">
      <h1 className="text-lg font-semibold bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
        CRM Portal
      </h1>

      <nav className="ml-auto flex gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "outline"}
            size="sm"
            onClick={() => onTabChange(tab.id)}
            className={activeTab === tab.id ? "bg-gradient-to-br from-primary to-cyan-400" : ""}
          >
            {tab.label}
          </Button>
        ))}
      </nav>

      <div className="flex flex-wrap items-center gap-3 border-l border-border pl-3">
        {onLoadData && (
          <Button
            variant="default"
            size="sm"
            onClick={onLoadData}
            disabled={loading}
            className="bg-gradient-to-br from-green-500 to-emerald-400 hover:from-green-600 hover:to-emerald-500"
          >
            {loading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {loading ? "Загрузка..." : "Загрузить данные"}
          </Button>
        )}
        
        {onLoadDemo && (
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadDemo}
            className="border-blue-500/50 hover:bg-blue-500/10"
          >
            <Database className="mr-2 h-4 w-4" />
            Демо данные
          </Button>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/bitrix")}
          className="border-orange-500/50 hover:bg-orange-500/10"
        >
          <Link2 className="mr-2 h-4 w-4" />
          Bitrix24
        </Button>
      </div>
    </header>
  );
}
