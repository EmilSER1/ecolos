import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Loader2 } from "lucide-react";
import { loadDealFilesFromCloud, loadTaskFilesFromCloud, deleteDealFile, deleteTaskFile } from "@/lib/cloud-storage";
import { toast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SnapshotManager } from "@/components/SnapshotManager";

export function FilesTab() {
  const [dealFiles, setDealFiles] = useState<any[]>([]);
  const [taskFiles, setTaskFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: "deal" | "task"; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const [deals, tasks] = await Promise.all([
        loadDealFilesFromCloud(),
        loadTaskFilesFromCloud()
      ]);
      setDealFiles(deals);
      setTaskFiles(tasks);
    } catch (error) {
      console.error("Error loading files:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список файлов",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleDeleteClick = (id: string, type: "deal" | "task", name: string) => {
    setDeleteTarget({ id, type, name });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const result = deleteTarget.type === "deal" 
        ? await deleteDealFile(deleteTarget.id)
        : await deleteTaskFile(deleteTarget.id);

      if (result.success) {
        toast({
          title: "Успех",
          description: "Файл успешно удален",
        });
        await loadFiles();
      } else {
        toast({
          title: "Ошибка",
          description: result.error || "Не удалось удалить файл",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить файл",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Управление снимками данных */}
      <SnapshotManager />

      {/* Файлы сделок */}
      <Card>
        <CardHeader>
          <CardTitle>Файлы сделок ({dealFiles.length}) - Устарело</CardTitle>
        </CardHeader>
        <CardContent>
          {dealFiles.length === 0 ? (
            <p className="text-muted-foreground">Нет загруженных файлов</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название файла</TableHead>
                  <TableHead>Количество записей</TableHead>
                  <TableHead>Дата загрузки</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dealFiles.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-medium">{file.file_name}</TableCell>
                    <TableCell>{file.file_data?.length || 0}</TableCell>
                    <TableCell>{new Date(file.uploaded_at).toLocaleString('ru-RU')}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(file.id, "deal", file.file_name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Файлы задач */}
      <Card>
        <CardHeader>
          <CardTitle>Файлы задач ({taskFiles.length}) - Устарело</CardTitle>
        </CardHeader>
        <CardContent>
          {taskFiles.length === 0 ? (
            <p className="text-muted-foreground">Нет загруженных файлов</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название файла</TableHead>
                  <TableHead>Количество записей</TableHead>
                  <TableHead>Дата загрузки</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taskFiles.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-medium">{file.file_name}</TableCell>
                    <TableCell>{file.file_data?.length || 0}</TableCell>
                    <TableCell>{new Date(file.uploaded_at).toLocaleString('ru-RU')}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(file.id, "task", file.file_name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Диалог подтверждения удаления */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы собираетесь удалить файл <strong>{deleteTarget?.name}</strong>. 
              Это действие невозможно отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
