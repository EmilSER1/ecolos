import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Database, Trash2, Download, Clock } from 'lucide-react';
import { useSnapshots } from '@/hooks/use-snapshots';
import { SnapshotSummary } from '@/types/snapshots';

interface SnapshotManagerProps {
  onSnapshotSelect?: (snapshot: any) => void;
}

export function SnapshotManager({ onSnapshotSelect }: SnapshotManagerProps) {
  const { 
    snapshots, 
    loading, 
    error, 
    loadSnapshot, 
    removeSnapshot, 
    getCurrentWeekRange 
  } = useSnapshots();

  const [selectedSnapshotId, setSelectedSnapshotId] = React.useState<string>('');

  const handleSnapshotSelect = async (snapshotId: string) => {
    if (!snapshotId) return;
    
    setSelectedSnapshotId(snapshotId);
    const result = await loadSnapshot(snapshotId);
    
    if (result && onSnapshotSelect) {
      onSnapshotSelect(result);
    }
  };

  const handleSnapshotDelete = async (snapshotId: string) => {
    if (confirm('Вы уверены, что хотите удалить этот снимок?')) {
      await removeSnapshot(snapshotId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const currentWeek = getCurrentWeekRange();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 animate-pulse" />
            <span>Загрузка снимков...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-600">
            Ошибка загрузки снимков: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Снимки данных
          </CardTitle>
          <CardDescription>
            Выберите снимок для просмотра данных на определенную неделю
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-sm">
              <strong>Текущая неделя:</strong> {currentWeek.label}
            </span>
          </div>

          <Select value={selectedSnapshotId} onValueChange={handleSnapshotSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите снимок недели" />
            </SelectTrigger>
            <SelectContent>
              {snapshots.map((snapshot) => (
                <SelectItem key={snapshot.id} value={snapshot.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>
                      {new Date(snapshot.week_start).toLocaleDateString('ru-RU')} - {' '}
                      {new Date(snapshot.week_end).toLocaleDateString('ru-RU')}
                    </span>
                    <Badge variant="secondary" className="ml-2">
                      {snapshot.deals_count} сделок, {snapshot.tasks_count} задач
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {snapshots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">История снимков</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {snapshots.map((snapshot) => (
                <div
                  key={snapshot.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">
                        {new Date(snapshot.week_start).toLocaleDateString('ru-RU')} - {' '}
                        {new Date(snapshot.week_end).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Создан: {formatDate(snapshot.created_at)}
                    </div>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {snapshot.deals_count} сделок
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {snapshot.tasks_count} задач
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSnapshotSelect(snapshot.id)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSnapshotDelete(snapshot.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {snapshots.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <Database className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Нет сохраненных снимков
            </h3>
            <p className="text-gray-500">
              Загрузите данные из Bitrix24, чтобы создать первый снимок
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}