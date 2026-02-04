import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Database, Clock, Trash2 } from "lucide-react";
import { STORAGE_KEYS } from "@/lib/bitrix-constants";

interface DataSyncStatusProps {
  onRefresh?: () => void;
  onClearCache?: () => void;
}

export function DataSyncStatus({ onRefresh, onClearCache }: DataSyncStatusProps) {
  const [syncStatus, setSyncStatus] = useState({
    dealsCount: 0,
    tasksCount: 0,
    dealsLastUpdate: null as Date | null,
    tasksLastUpdate: null as Date | null,
  });

  const updateSyncStatus = () => {
    try {
      // Проверяем кешированные данные
      const cachedDeals = localStorage.getItem(STORAGE_KEYS.CACHED_DEALS);
      const cachedTasks = localStorage.getItem(STORAGE_KEYS.CACHED_TASKS);
      const dealsTimestamp = localStorage.getItem(STORAGE_KEYS.CACHED_DEALS_TIMESTAMP);
      const tasksTimestamp = localStorage.getItem(STORAGE_KEYS.CACHED_TASKS_TIMESTAMP);

      const dealsData = cachedDeals ? JSON.parse(cachedDeals) : [];
      const tasksData = cachedTasks ? JSON.parse(cachedTasks) : [];

      setSyncStatus({
        dealsCount: Array.isArray(dealsData) ? dealsData.length : 0,
        tasksCount: Array.isArray(tasksData) ? tasksData.length : 0,
        dealsLastUpdate: dealsTimestamp ? new Date(parseInt(dealsTimestamp)) : null,
        tasksLastUpdate: tasksTimestamp ? new Date(parseInt(tasksTimestamp)) : null,
      });
    } catch (error) {
      console.error('Ошибка обновления статуса синхронизации:', error);
    }
  };

  // Обновляем статус при монтировании и каждые 5 секунд
  useEffect(() => {
    updateSyncStatus();
    const interval = setInterval(updateSyncStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date | null) => {
    if (!date) return "Не загружено";
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isDataFresh = (date: Date | null) => {
    if (!date) return false;
    const now = new Date();
    const diffMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
    return diffMinutes < 60; // Данные свежие, если загружены менее часа назад
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="w-5 h-5" />
              Состояние данных
            </CardTitle>
            <CardDescription>
              Синхронизация между страницами Bitrix24 и Дашборда
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                updateSyncStatus();
                onRefresh?.();
              }}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Обновить
            </Button>
            {(syncStatus.dealsCount > 0 || syncStatus.tasksCount > 0) && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearCache}
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Очистить
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Статус сделок */}
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-blue-900">Сделки</span>
              <Badge variant={syncStatus.dealsCount > 0 ? "default" : "secondary"}>
                {syncStatus.dealsCount}
              </Badge>
            </div>
            <div className="text-sm text-blue-700 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(syncStatus.dealsLastUpdate)}
            </div>
            {syncStatus.dealsLastUpdate && (
              <Badge 
                variant={isDataFresh(syncStatus.dealsLastUpdate) ? "default" : "outline"} 
                className="mt-2 text-xs"
              >
                {isDataFresh(syncStatus.dealsLastUpdate) ? "Свежие" : "Устарели"}
              </Badge>
            )}
          </div>

          {/* Статус задач */}
          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-green-900">Задачи</span>
              <Badge variant={syncStatus.tasksCount > 0 ? "default" : "secondary"}>
                {syncStatus.tasksCount}
              </Badge>
            </div>
            <div className="text-sm text-green-700 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(syncStatus.tasksLastUpdate)}
            </div>
            {syncStatus.tasksLastUpdate && (
              <Badge 
                variant={isDataFresh(syncStatus.tasksLastUpdate) ? "default" : "outline"} 
                className="mt-2 text-xs"
              >
                {isDataFresh(syncStatus.tasksLastUpdate) ? "Свежие" : "Устарели"}
              </Badge>
            )}
          </div>
        </div>

        {/* Инструкции */}
        {syncStatus.dealsCount === 0 && syncStatus.tasksCount === 0 && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-sm text-amber-800">
              💡 Данные не загружены. Перейдите в раздел <strong>Bitrix24 → Настройки</strong> для загрузки данных из Bitrix24.
            </p>
          </div>
        )}
        
        {(syncStatus.dealsCount > 0 || syncStatus.tasksCount > 0) && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <p className="text-sm text-green-800">
              ✅ Данные синхронизированы между всеми страницами приложения.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}