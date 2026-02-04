import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Database, Clock, Trash2 } from "lucide-react";
import { STORAGE_KEYS } from "@/lib/bitrix-constants";

interface DataSyncStatusProps {
  onRefresh?: () => void;
  onClearCache?: () => void;
  snapshotStats?: any;
}

export function DataSyncStatus({ onRefresh, onClearCache, snapshotStats }: DataSyncStatusProps) {
  const [syncStatus, setSyncStatus] = useState({
    dealsCount: 0,
    tasksCount: 0,
    dealsLastUpdate: null as Date | null,
    tasksLastUpdate: null as Date | null,
    supabaseConnected: false,
    lastSnapshot: null as any,
  });

  const updateSyncStatus = () => {
    try {
      // Получаем информацию из пропсов (переданную из useSupabaseData)
      const dealsData = JSON.parse(localStorage.getItem(STORAGE_KEYS.CACHED_DEALS) || '[]');
      const tasksData = JSON.parse(localStorage.getItem(STORAGE_KEYS.CACHED_TASKS) || '[]');
      const dealsTimestamp = localStorage.getItem(STORAGE_KEYS.CACHED_DEALS_TIMESTAMP);
      const tasksTimestamp = localStorage.getItem(STORAGE_KEYS.CACHED_TASKS_TIMESTAMP);

      setSyncStatus({
        dealsCount: Array.isArray(dealsData) ? dealsData.length : 0,
        tasksCount: Array.isArray(tasksData) ? tasksData.length : 0,
        dealsLastUpdate: dealsTimestamp ? new Date(parseInt(dealsTimestamp)) : null,
        tasksLastUpdate: tasksTimestamp ? new Date(parseInt(tasksTimestamp)) : null,
        supabaseConnected: !!snapshotStats,
        lastSnapshot: snapshotStats?.latestSnapshot || null,
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
              Данные из Bitrix24 → Supabase → Аналитика (с почасовыми снимками)
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
        {/* Статус подключения к Supabase */}
        <div className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-purple-900">База данных Supabase</span>
            <Badge variant={syncStatus.supabaseConnected ? "default" : "secondary"}>
              {syncStatus.supabaseConnected ? "Подключена" : "Не подключена"}
            </Badge>
          </div>
          {snapshotStats && (
            <div className="text-sm text-purple-700">
              📸 Всего снимков: {snapshotStats.totalSnapshots} | 
              📊 Среднее сделок: {snapshotStats.averageDeals} | 
              📋 Средне задач: {snapshotStats.averageTasks}
            </div>
          )}
        </div>

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
              💡 Данные не найдены в базе. Перейдите в раздел <strong>Bitrix24 → Настройки</strong> для загрузки данных из Bitrix24 в Supabase.
            </p>
          </div>
        )}
        
        {(syncStatus.dealsCount > 0 || syncStatus.tasksCount > 0) && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <p className="text-sm text-green-800">
              ✅ Данные загружены в базу Supabase. Почасовые снимки создаются автоматически.
              {syncStatus.lastSnapshot && (
                <span className="block mt-1">
                  📸 Последний снимок: {new Date(syncStatus.lastSnapshot.created_at).toLocaleString('ru-RU')}
                </span>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}