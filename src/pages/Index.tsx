import { useState, useEffect } from "react";
import { useBitrixDeals } from "@/hooks/use-bitrix-deals";
import { CRMHeader } from "@/components/CRMHeader";
import { DashboardTab } from "@/components/tabs/DashboardTab";
import { MismatchTab } from "@/components/tabs/MismatchTab";
import { StaleTab } from "@/components/tabs/StaleTab";
import { TasksTab } from "@/components/tabs/TasksTab";
import { CompareTab } from "@/components/tabs/CompareTab";
import { FilesTab } from "@/components/tabs/FilesTab";
import { Loader2 } from "lucide-react";
import { logger } from "@/lib/logger";
import { STORAGE_KEYS } from "@/lib/bitrix-constants";
import { ERROR_MESSAGES, INFO_MESSAGES, LOG_MESSAGES, UI_TEXTS } from "@/lib/messages";
import { loadDemoData } from "@/lib/demo-data";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { 
    deals, 
    tasks, 
    loading, 
    fetchDealsFromBitrix,
    fetchTasksFromBitrix,
    clearCache
  } = useBitrixDeals();

  const handleLoadData = async () => {
    const webhookUrl = localStorage.getItem('bitrix_webhook_url');
    if (!webhookUrl) {
      console.log('❌ Webhook URL не найден в localStorage');
      alert('Сначала настройте webhook URL в разделе Bitrix24');
      return;
    }

    console.log('▶️ Начинаем загрузку данных с URL:', webhookUrl);
    
    try {
      // Загружаем сделки и задачи параллельно
      const results = await Promise.all([
        fetchDealsFromBitrix(webhookUrl),
        fetchTasksFromBitrix(webhookUrl)
      ]);
      
      console.log('✅ Загрузка завершена:', {
        deals: results[0],
        tasks: results[1]
      });
    } catch (error) {
      console.error('❌ Ошибка загрузки данных:', error);
      alert('Ошибка загрузки данных: ' + error);
    }
  };

  const handleLoadDemo = () => {
    try {
      const demoData = loadDemoData();
      
      toast({
        title: "Демо данные загружены",
        description: `Загружено ${demoData.deals.length} сделок и ${demoData.tasks.length} задач для демонстрации`,
      });
      
      // Перезагружаем страницу чтобы компоненты подхватили новые данные
      window.location.reload();
    } catch (error) {
      console.error('❌ Ошибка загрузки демо данных:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить демо данные",
        variant: "destructive"
      });
    }
  };

  // Флаг для отслеживания первоначальной загрузки
  const [initialLoadAttempted, setInitialLoadAttempted] = useState(false);

  // Автоматическая загрузка данных при старте, если есть webhook
  useEffect(() => {
    if (!initialLoadAttempted) {
      const webhookUrl = localStorage.getItem('bitrix_webhook_url');
      if (webhookUrl && !loading) {
        console.log('🚀 Автоматическая загрузка данных из Bitrix24...');
        console.log('📍 Webhook URL найден:', webhookUrl);
        setInitialLoadAttempted(true);
        handleLoadData();
      } else if (!webhookUrl) {
        console.log('⚠️ Webhook URL не настроен, автоматическая загрузка пропущена');
        setInitialLoadAttempted(true);
      }
    }
  }, [initialLoadAttempted, loading]); // Отслеживаем состояние загрузки

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Загружаем данные...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-blue-50/30 to-indigo-50/50">
      <CRMHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLoadData={handleLoadData}
        onLoadDemo={handleLoadDemo}
        loading={loading}
      />

      <main className="container mx-auto p-6 animate-slide-in">
        <div className="rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 shadow-elegant p-6">
          {activeTab === "dashboard" && <DashboardTab deals={deals} tasks={tasks} onClearCache={clearCache} />}
          {activeTab === "mismatch" && <MismatchTab deals={deals} />}
          {activeTab === "stale" && <StaleTab deals={deals} />}
          {activeTab === "tasks" && <TasksTab tasks={tasks} />}
          {activeTab === "compare" && <CompareTab />}
          {activeTab === "files" && <FilesTab />}
        </div>
      </main>
    </div>
  );
};

export default Index;
