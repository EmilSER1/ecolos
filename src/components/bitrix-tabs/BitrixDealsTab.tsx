import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Deal } from "@/types/crm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BitrixDealsTabProps {
  deals: Deal[];
}

export function BitrixDealsTab({ deals }: BitrixDealsTabProps) {
  const [selectedStage, setSelectedStage] = useState<string>("all");

  const getStageColor = (stage: string) => {
    if (stage.includes("Новая")) return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    if (stage.includes("работе")) return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    if (stage.includes("подписан")) return "bg-green-500/10 text-green-500 border-green-500/20";
    if (stage.includes("провалена")) return "bg-red-500/10 text-red-500 border-red-500/20";
    return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  };

  // Получаем уникальные стадии
  const uniqueStages = useMemo(() => {
    const stages = [...new Set(deals.map(deal => deal["Стадия сделки"]))];
    return stages.sort();
  }, [deals]);

  // Фильтруем сделки по выбранной стадии
  const filteredDeals = useMemo(() => {
    if (selectedStage === "all") return deals;
    return deals.filter(deal => deal["Стадия сделки"] === selectedStage);
  }, [deals, selectedStage]);
  return (
    <div className="space-y-4">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Сделки из Bitrix24 ({filteredDeals.length} из {deals.length})</CardTitle>
          {deals.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Фильтр по стадии:</span>
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Все стадии" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все стадии</SelectItem>
                  {uniqueStages.map(stage => (
                    <SelectItem key={stage} value={stage}>
                      {stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {deals.length === 0 ? (
            <p className="text-muted-foreground">
              Здесь будут отображаться сделки, загруженные из Bitrix24.
              Перейдите во вкладку "Настройки" и нажмите "Загрузить сделки".
            </p>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[80px]">ID</TableHead>
                    <TableHead className="min-w-[200px]">Название</TableHead>
                    <TableHead className="min-w-[150px]">Ответственный</TableHead>
                    <TableHead className="min-w-[180px]">Стадия</TableHead>
                    <TableHead className="min-w-[120px]">Отдел</TableHead>
                    <TableHead className="min-w-[120px] text-right">Сумма</TableHead>
                    <TableHead className="min-w-[80px]">Валюта</TableHead>
                    <TableHead className="min-w-[150px]">Компания</TableHead>
                    <TableHead className="min-w-[150px]">Контакт</TableHead>
                    <TableHead className="min-w-[200px]">Комментарии</TableHead>
                    <TableHead className="min-w-[100px]">Тип</TableHead>
                    <TableHead className="min-w-[100px]">Вероятность</TableHead>
                    <TableHead className="min-w-[100px]">Источник</TableHead>
                    <TableHead className="min-w-[120px]">Дата создания</TableHead>
                    <TableHead className="min-w-[120px]">Дата изменения</TableHead>
                    <TableHead className="min-w-[120px]">Дата начала</TableHead>
                    <TableHead className="min-w-[120px]">Дата закрытия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeals.map((deal, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-sm">{deal["ID сделки"]}</TableCell>
                      <TableCell className="max-w-[200px] break-words whitespace-normal">{deal.Название}</TableCell>
                      <TableCell className="break-words whitespace-normal">{deal.Ответственный}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStageColor(deal["Стадия сделки"])}>
                          {deal["Стадия сделки"]}
                        </Badge>
                      </TableCell>
                      <TableCell className="break-words whitespace-normal">{deal.Отдел}</TableCell>
                      <TableCell className="text-right">{Number(deal.Сумма).toLocaleString("ru-RU")}</TableCell>
                      <TableCell>{deal.Валюта}</TableCell>
                      <TableCell className="break-words whitespace-normal">{deal.Компания}</TableCell>
                      <TableCell className="break-words whitespace-normal">{deal.Контакт}</TableCell>
                      <TableCell className="max-w-[200px] break-words whitespace-normal">{deal.Комментарии}</TableCell>
                      <TableCell className="break-words whitespace-normal">{deal.Тип}</TableCell>
                      <TableCell>{deal.Вероятность}</TableCell>
                      <TableCell className="break-words whitespace-normal">{deal.Источник}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {deal["Дата создания"] ? new Date(deal["Дата создания"]).toLocaleDateString("ru-RU") : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {deal["Дата изменения"] ? new Date(deal["Дата изменения"]).toLocaleDateString("ru-RU") : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {deal["Дата начала"] ? new Date(deal["Дата начала"]).toLocaleDateString("ru-RU") : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {deal["Дата закрытия"] ? new Date(deal["Дата закрытия"]).toLocaleDateString("ru-RU") : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
