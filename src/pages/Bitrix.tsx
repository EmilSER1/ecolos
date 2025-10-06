import { useState } from "react";
import { BitrixHeader } from "@/components/BitrixHeader";
import { BitrixDashboardTab } from "@/components/bitrix-tabs/BitrixDashboardTab";
import { BitrixDealsTab } from "@/components/bitrix-tabs/BitrixDealsTab";
import { BitrixTasksTab } from "@/components/bitrix-tabs/BitrixTasksTab";
import { BitrixSettingsTab } from "@/components/bitrix-tabs/BitrixSettingsTab";

const Bitrix = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-background">
      <BitrixHeader activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="container mx-auto p-4">
        {activeTab === "dashboard" && <BitrixDashboardTab />}
        {activeTab === "deals" && <BitrixDealsTab />}
        {activeTab === "tasks" && <BitrixTasksTab />}
        {activeTab === "settings" && <BitrixSettingsTab />}
      </main>
    </div>
  );
};

export default Bitrix;
