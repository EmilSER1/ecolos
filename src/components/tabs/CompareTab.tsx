import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFileComparison } from "@/hooks/use-file-comparison";
import { DealComparison } from "@/components/comparison/DealComparison";
import { TaskComparison } from "@/components/comparison/TaskComparison";
import { Download, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { exportMultipleTablesToExcel } from "@/lib/export";

export function CompareTab() {
  const { dealFiles, taskFiles, loading, loadFiles, compareDeals, compareTasks } = useFileComparison();
  const [selectedDealFile1, setSelectedDealFile1] = useState<string>("");
  const [selectedDealFile2, setSelectedDealFile2] = useState<string>("");
  const [selectedTaskFile1, setSelectedTaskFile1] = useState<string>("");
  const [selectedTaskFile2, setSelectedTaskFile2] = useState<string>("");
  const [dealComparison, setDealComparison] = useState<ReturnType<typeof compareDeals> | null>(null);
  const [taskComparison, setTaskComparison] = useState<ReturnType<typeof compareTasks> | null>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const handleCompareDealFiles = () => {
    if (!selectedDealFile1 || !selectedDealFile2) {
      toast({
        title: "Ошибка",
        description: "Выберите два файла для сравнения",
        variant: "destructive",
      });
      return;
    }

    const file1 = dealFiles.find(f => f.id === selectedDealFile1);
    const file2 = dealFiles.find(f => f.id === selectedDealFile2);

    if (!file1 || !file2) {
      toast({
        title: "Ошибка",
        description: "Файлы не найдены",
        variant: "destructive",
      });
      return;
    }

    const comparison = compareDeals(file1, file2);
    setDealComparison(comparison);
    toast({
      title: "Готово",
      description: "Сравнение сделок выполнено успешно",
    });
  };

  const handleCompareTaskFiles = () => {
    if (!selectedTaskFile1 || !selectedTaskFile2) {
      toast({
        title: "Ошибка",
        description: "Выберите два файла для сравнения",
        variant: "destructive",
      });
      return;
    }

    const file1 = taskFiles.find(f => f.id === selectedTaskFile1);
    const file2 = taskFiles.find(f => f.id === selectedTaskFile2);

    if (!file1 || !file2) {
      toast({
        title: "Ошибка",
        description: "Файлы не найдены",
        variant: "destructive",
      });
      return;
    }

    const comparison = compareTasks(file1, file2);
    setTaskComparison(comparison);
    toast({
      title: "Готово",
      description: "Сравнение задач выполнено успешно",
    });
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
      <Card>
        <CardHeader>
          <CardTitle>Сравнение файлов</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="deals" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="deals">Сделки</TabsTrigger>
              <TabsTrigger value="tasks">Задачи</TabsTrigger>
            </TabsList>

            <TabsContent value="deals" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Первый файл (старый)</label>
                  <Select value={selectedDealFile1} onValueChange={setSelectedDealFile1}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите файл" />
                    </SelectTrigger>
                    <SelectContent>
                      {dealFiles.map(file => (
                        <SelectItem key={file.id} value={file.id}>
                          {file.file_name} ({new Date(file.uploaded_at).toLocaleDateString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Второй файл (новый)</label>
                  <Select value={selectedDealFile2} onValueChange={setSelectedDealFile2}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите файл" />
                    </SelectTrigger>
                    <SelectContent>
                      {dealFiles.map(file => (
                        <SelectItem key={file.id} value={file.id}>
                          {file.file_name} ({new Date(file.uploaded_at).toLocaleDateString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleCompareDealFiles} className="w-full">
                Сравнить файлы сделок
              </Button>

              {dealComparison && (
                <div className="mt-6">
                  <DealComparison
                    comparison={dealComparison}
                    file1Name={dealFiles.find(f => f.id === selectedDealFile1)?.file_name || ""}
                    file2Name={dealFiles.find(f => f.id === selectedDealFile2)?.file_name || ""}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Первый файл (старый)</label>
                  <Select value={selectedTaskFile1} onValueChange={setSelectedTaskFile1}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите файл" />
                    </SelectTrigger>
                    <SelectContent>
                      {taskFiles.map(file => (
                        <SelectItem key={file.id} value={file.id}>
                          {file.file_name} ({new Date(file.uploaded_at).toLocaleDateString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Второй файл (новый)</label>
                  <Select value={selectedTaskFile2} onValueChange={setSelectedTaskFile2}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите файл" />
                    </SelectTrigger>
                    <SelectContent>
                      {taskFiles.map(file => (
                        <SelectItem key={file.id} value={file.id}>
                          {file.file_name} ({new Date(file.uploaded_at).toLocaleDateString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleCompareTaskFiles} className="w-full">
                Сравнить файлы задач
              </Button>

              {taskComparison && (
                <div className="mt-6">
                  <TaskComparison
                    comparison={taskComparison}
                    file1Name={taskFiles.find(f => f.id === selectedTaskFile1)?.file_name || ""}
                    file2Name={taskFiles.find(f => f.id === selectedTaskFile2)?.file_name || ""}
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
