import { useState } from "react";
import { useDeals } from "@/hooks/use-deals";
import { CRMHeader } from "@/components/CRMHeader";
import { DashboardTab } from "@/components/tabs/DashboardTab";
import { MismatchTab } from "@/components/tabs/MismatchTab";
import { StaleTab } from "@/components/tabs/StaleTab";
import { TasksTab } from "@/components/tabs/TasksTab";
import { CompareTab } from "@/components/tabs/CompareTab";
import { FilesTab } from "@/components/tabs/FilesTab";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dealMode, setDealMode] = useState<"replace" | "merge">("replace");
  const { deals, tasks, loading, importDeals, importTasks } = useDeals();

  const handleDealImport = async (file: File, mode: "replace" | "merge") => {
    await importDeals(file, mode);
  };

  const handleTaskImport = async (file: File) => {
    await importTasks(file);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CRMHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onDealImport={handleDealImport}
        onTaskImport={handleTaskImport}
        dealMode={dealMode}
        onDealModeChange={setDealMode}
      />

      <main className="container mx-auto p-4">
        {activeTab === "dashboard" && <DashboardTab deals={deals} tasks={tasks} />}
        {activeTab === "mismatch" && <MismatchTab deals={deals} />}
        {activeTab === "stale" && <StaleTab deals={deals} />}
        {activeTab === "tasks" && <TasksTab tasks={tasks} />}
        {activeTab === "compare" && <CompareTab />}
        {activeTab === "files" && <FilesTab />}
      </main>
    </div>
  );
};

export default Index;
