import { useState, useEffect } from "react";
import { useSupabaseData } from "@/hooks/use-supabase-data";
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
  
  // Используем Supabase для аналитики (основные данные)
  const { 
    deals: supabaseDeals, 
    tasks: supabaseTasks, 
    loading: supabaseLoading,
    refresh: refreshSupabaseData,
    createSnapshot,
    snapshotStats
  } = useSupabaseData();
  
  // Bitrix хук для загрузки данных из Bitrix24
  const { 
    fetchDealsFromBitrix,
    fetchTasksFromBitrix,
    clearCache
  } = useBitrixDeals();

  // Используем данные из Supabase для отображения
  const deals = supabaseDeals;
  const tasks = supabaseTasks;
  const loading = supabaseLoading;

  const handleLoadData = async () => {
    const webhookUrl = localStorage.getItem('bitrix_webhook_url');
    if (!webhookUrl) {
      console.log('❌ Webhook URL не найден в localStorage');
      alert('Сначала настройте webhook URL в разделе Bitrix24');
      return;
    }

    console.log('▶️ Начинаем загрузку данных с URL:', webhookUrl);
    
    toast({
      title: "🚀 Начинаем полную синхронизацию",
      description: "Загружаем сделки и задачи из Bitrix24...",
    });
    
    try {
      // 1. Загружаем данные из Bitrix24 (они автоматически сохранятся в Supabase)
      const results = await Promise.all([
        fetchDealsFromBitrix(webhookUrl),
        fetchTasksFromBitrix(webhookUrl)
      ]);
      
      console.log('✅ Загрузка из Bitrix24 завершена:', {
        deals: results[0],
        tasks: results[1]
      });

      // 2. Обновляем данные из Supabase для аналитики
      logger.info('🔄 Обновление данных из Supabase...');
      await refreshSupabaseData();
      
      const totalRecords = (results[0].count || 0) + (results[1].count || 0);
      toast({
        title: "🎉 Синхронизация завершена!",
        description: `Загружено: ${results[0].count || 0} сделок, ${results[1].count || 0} задач. Всего: ${totalRecords} записей.`,
      });
      
    } catch (error) {
      console.error('❌ Ошибка загрузки данных:', error);
      toast({
        title: "Ошибка загрузки",
        description: String(error),
        variant: "destructive"
      });
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
        console.log('🚀 Автоматическая загрузка данных из Supabase и Bitrix24...');
        console.log('📍 Webhook URL найден:', webhookUrl);
        setInitialLoadAttempted(true);
        
        // Сначала пробуем загрузить из Supabase, потом из Bitrix24 если нужно
        if (deals.length === 0) {
          console.log('📊 Нет данных в Supabase, загружаем из Bitrix24...');
          handleLoadData();
        } else {
          console.log('✅ Данные найдены в Supabase, автозагрузка из Bitrix24 не требуется');
        }
      } else if (!webhookUrl) {
        console.log('⚠️ Webhook URL не настроен, используем только данные из Supabase');
        setInitialLoadAttempted(true);
      }
    }
  }, [initialLoadAttempted, loading, deals.length]); // Отслеживаем состояние загрузки и данные

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
          {activeTab === "dashboard" && <DashboardTab 
            deals={deals} 
            tasks={tasks} 
            onClearCache={() => {
              clearCache(); // Очищаем localStorage
              refreshSupabaseData(); // Обновляем из Supabase
            }}
            onRefresh={refreshSupabaseData}
            onFullSync={handleLoadData}
            snapshotStats={snapshotStats}
          />}
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
