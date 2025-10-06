import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Deal } from "@/types/crm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface BitrixDealsTabProps {
  deals: Deal[];
}

export function BitrixDealsTab({ deals }: BitrixDealsTabProps) {
  const getStageColor = (stage: string) => {
    if (stage.includes("Новая")) return "bg-blue-500/10 text-blue-500";
    if (stage.includes("работе")) return "bg-yellow-500/10 text-yellow-500";
    if (stage.includes("подписан")) return "bg-green-500/10 text-green-500";
    if (stage.includes("провалена")) return "bg-red-500/10 text-red-500";
    return "bg-gray-500/10 text-gray-500";
  };
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Сделки из Bitrix24 ({deals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {deals.length === 0 ? (
            <p className="text-muted-foreground">
              Здесь будут отображаться сделки, загруженные из Bitrix24.
              Перейдите во вкладку "Настройки" и нажмите "Загрузить сделки".
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Название</TableHead>
                    <TableHead>Ответственный</TableHead>
                    <TableHead>Стадия</TableHead>
                    <TableHead>Отдел</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Валюта</TableHead>
                    <TableHead>Компания</TableHead>
                    <TableHead>Комментарии</TableHead>
                    <TableHead>Дата создания</TableHead>
                    <TableHead>Дата изменения</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deals.map((deal, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-sm">{deal["ID сделки"]}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{deal.Название}</TableCell>
                      <TableCell>{deal.Ответственный}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStageColor(deal["Стадия сделки"])}>
                          {deal["Стадия сделки"]}
                        </Badge>
                      </TableCell>
                      <TableCell>{deal.Отдел}</TableCell>
                      <TableCell className="text-right">{Number(deal.Сумма).toLocaleString("ru-RU")}</TableCell>
                      <TableCell>{deal.Валюта}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{deal.Компания}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{deal.Комментарии}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {deal["Дата создания"] ? new Date(deal["Дата создания"]).toLocaleDateString("ru-RU") : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {deal["Дата изменения"] ? new Date(deal["Дата изменения"]).toLocaleDateString("ru-RU") : "—"}
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
