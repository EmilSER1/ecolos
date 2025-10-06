import { useState } from "react";
import { BitrixHeader } from "@/components/BitrixHeader";
import { BitrixDashboardTab } from "@/components/bitrix-tabs/BitrixDashboardTab";
import { BitrixDealsTab } from "@/components/bitrix-tabs/BitrixDealsTab";
import { BitrixTasksTab } from "@/components/bitrix-tabs/BitrixTasksTab";
import { BitrixSettingsTab } from "@/components/bitrix-tabs/BitrixSettingsTab";
import { useBitrixDeals } from "@/hooks/use-bitrix-deals";
import { Loader2 } from "lucide-react";

const Bitrix = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { deals, tasks, loading, fetchDealsFromBitrix, fetchTasksFromBitrix, fieldMetadata, stageMetadata } = useBitrixDeals();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <BitrixHeader activeTab={activeTab} onTabChange={setActiveTab} />

      <main className={activeTab === "deals" ? "" : "container mx-auto p-4"}>
        {activeTab === "dashboard" && <BitrixDashboardTab deals={deals} tasks={tasks} />}
        {activeTab === "deals" && <BitrixDealsTab deals={deals} fieldMetadata={fieldMetadata} stageMetadata={stageMetadata} />}
        {activeTab === "tasks" && <BitrixTasksTab tasks={tasks} />}
        {activeTab === "settings" && (
          <BitrixSettingsTab 
            onFetchDeals={fetchDealsFromBitrix}
            onFetchTasks={fetchTasksFromBitrix}
          />
        )}
      </main>
    </div>
  );
};

export default Bitrix;
