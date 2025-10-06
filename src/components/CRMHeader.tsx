import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Link2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CRMHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onDealImport: (file: File, mode: "replace" | "merge") => Promise<void>;
  onTaskImport: (file: File) => Promise<void>;
  dealMode: "replace" | "merge";
  onDealModeChange: (mode: "replace" | "merge") => void;
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
  onDealImport,
  onTaskImport,
  dealMode,
  onDealModeChange,
}: CRMHeaderProps) {
  const navigate = useNavigate();
  const dealInputRef = useRef<HTMLInputElement>(null);
  const taskInputRef = useRef<HTMLInputElement>(null);

  const handleDealFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onDealImport(file, dealMode);
      e.target.value = "";
    }
  };

  const handleTaskFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onTaskImport(file);
      e.target.value = "";
    }
  };

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
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/bitrix")}
          className="border-orange-500/50 hover:bg-orange-500/10"
        >
          <Link2 className="mr-2 h-4 w-4" />
          Bitrix24
        </Button>

        <div className="flex items-center gap-2">
          <input
            ref={dealInputRef}
            type="file"
            accept=".csv"
            onChange={handleDealFileChange}
            className="hidden"
          />
          <Button
            variant="default"
            size="sm"
            onClick={() => dealInputRef.current?.click()}
            className="bg-gradient-to-br from-primary to-cyan-400"
          >
            <Upload className="mr-2 h-4 w-4" />
            CSV сделки
          </Button>

          <input
            ref={taskInputRef}
            type="file"
            accept=".csv"
            onChange={handleTaskFileChange}
            className="hidden"
          />
          <Button
            variant="default"
            size="sm"
            onClick={() => taskInputRef.current?.click()}
            className="bg-gradient-to-br from-primary to-cyan-400"
          >
            <Upload className="mr-2 h-4 w-4" />
            CSV задачи
          </Button>
        </div>

        <Select value={dealMode} onValueChange={(v) => onDealModeChange(v as "replace" | "merge")}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="replace">Заменить всё</SelectItem>
            <SelectItem value="merge">Объединить</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </header>
  );
}
