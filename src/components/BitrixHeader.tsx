import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BitrixHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "dashboard", label: "Дашборд" },
  { id: "deals", label: "Сделки" },
  { id: "tasks", label: "Задачи" },
  { id: "settings", label: "Настройки" },
];

export function BitrixHeader({ activeTab, onTabChange }: BitrixHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-border bg-background/90 p-3 backdrop-blur-lg">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/")}
        className="mr-2"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад
      </Button>

      <h1 className="text-lg font-semibold bg-gradient-to-r from-orange-500 to-red-400 bg-clip-text text-transparent">
        Bitrix24 Integration
      </h1>

      <nav className="ml-auto flex gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "outline"}
            size="sm"
            onClick={() => onTabChange(tab.id)}
            className={activeTab === tab.id ? "bg-gradient-to-br from-orange-500 to-red-400" : ""}
          >
            {tab.label}
          </Button>
        ))}
      </nav>
    </header>
  );
}
