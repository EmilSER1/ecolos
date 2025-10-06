import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Deal } from "@/types/crm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FieldMetadata {
  [key: string]: {
    title: string;
    type: string;
  };
}

interface StageMetadata {
  [key: string]: {
    name: string;
    color: string;
  };
}

interface BitrixDealsTabProps {
  deals: Deal[];
  fieldMetadata: FieldMetadata;
  stageMetadata: StageMetadata;
}

export function BitrixDealsTab({ deals, fieldMetadata, stageMetadata }: BitrixDealsTabProps) {
  const [selectedStage, setSelectedStage] = useState<string>("all");

  const getStageColorFromBitrix = (stageName: string): string => {
    // Ищем стадию по имени в метаданных
    const stageEntry = Object.entries(stageMetadata).find(([_, data]) => data.name === stageName);
    if (stageEntry && stageEntry[1].color) {
      const color = stageEntry[1].color;
      // Конвертируем hex цвет в tailwind классы
      return `border-2` + ` text-foreground`;
    }
    return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  };

  // Получаем человекочитаемое название для поля
  const getFieldTitle = (key: string): string => {
    // Стандартные маппинги для базовых полей
    const standardMappings: Record<string, string> = {
      "ID сделки": "ID сделки",
      "Название": "Название",
      "Ответственный": "Ответственный",
      "Стадия сделки": "Стадия сделки",
      "Дата создания": "Дата создания",
      "Дата изменения": "Дата изменения",
      "Отдел": "Отдел",
      "Сумма": "Сумма",
      "Валюта": "Валюта",
      "Компания": "Компания",
      "Комментарии": "Комментарии",
      "Контакт": "Контакт",
      "Дата начала": "Дата начала",
      "Дата закрытия": "Дата закрытия",
      "Тип": "Тип",
      "Вероятность": "Вероятность",
      "Источник": "Источник",
    };

    // Сначала проверяем стандартные маппинги
    if (standardMappings[key]) {
      return standardMappings[key];
    }

    // Для пользовательских полей используем метаданные
    if (key.startsWith('UF_CRM_') && fieldMetadata[key]) {
      return fieldMetadata[key].title;
    }

    return key;
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

  // Получаем все колонки, включая пользовательские поля
  const allColumns = useMemo(() => {
    if (deals.length === 0) return [];
    
    // Собираем все уникальные ключи из всех сделок
    const allKeys = new Set<string>();
    deals.forEach(deal => {
      Object.keys(deal).forEach(key => allKeys.add(key));
    });
    
    console.log("=== АНАЛИЗ КОЛОНОК ТАБЛИЦЫ ===");
    console.log("Всего уникальных полей во всех сделках:", allKeys.size);
    console.log("Все поля:", Array.from(allKeys));
    
    const ufFields = Array.from(allKeys).filter(k => k.startsWith('UF_CRM_'));
    console.log("Найдено пользовательских полей (UF_CRM_*):", ufFields.length);
    console.log("Список пользовательских полей:", ufFields);
    
    // Все ключи - это и есть наши колонки
    return Array.from(allKeys);
  }, [deals]);
  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      <Card className="m-4 mb-0 flex-shrink-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Сделки из Bitrix24 ({filteredDeals.length} из {deals.length})</CardTitle>
          {deals.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Фильтр по стадии:</span>
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Все стадии" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
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
      </Card>

      {deals.length === 0 ? (
        <div className="flex-1 flex items-center justify-center m-4">
          <p className="text-muted-foreground">
            Здесь будут отображаться сделки, загруженные из Bitrix24.
            Перейдите во вкладку "Настройки" и нажмите "Загрузить сделки".
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden m-4 mt-4 border rounded-md bg-background relative">
          <div className="absolute inset-0 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-20 shadow-sm">
                <TableRow>
                  {allColumns.map(column => (
                    <TableHead key={column} className="min-w-[120px] whitespace-nowrap font-semibold">
                      {getFieldTitle(column)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeals.map((deal, idx) => {
                  const dealData = deal as any;
                  return (
                    <TableRow key={idx}>
                      {allColumns.map(column => {
                        const value = dealData[column];
                        
                        // Специальная обработка для стадии с цветами из Bitrix
                        if (column === "Стадия сделки") {
                          const stageEntry = Object.entries(stageMetadata).find(([_, data]) => data.name === value);
                          const bgColor = stageEntry && stageEntry[1].color ? stageEntry[1].color : "#808080";
                          
                          return (
                            <TableCell key={column}>
                              <Badge 
                                variant="outline" 
                                style={{ 
                                  backgroundColor: bgColor,
                                  color: "white",
                                  borderColor: bgColor
                                }}
                              >
                                {value}
                              </Badge>
                            </TableCell>
                          );
                        }
                        
                        // Специальная обработка для суммы
                        if (column === "Сумма") {
                          return (
                            <TableCell key={column} className="text-right">
                              {Number(value || 0).toLocaleString("ru-RU")}
                            </TableCell>
                          );
                        }
                        
                        // Специальная обработка для дат
                        if (column.includes("Дата")) {
                          return (
                            <TableCell key={column} className="text-sm text-muted-foreground whitespace-nowrap">
                              {value ? new Date(value).toLocaleDateString("ru-RU") : "—"}
                            </TableCell>
                          );
                        }
                        
                        // ID с моноширинным шрифтом
                        if (column === "ID сделки") {
                          return (
                            <TableCell key={column} className="font-mono text-sm">
                              {value || "—"}
                            </TableCell>
                          );
                        }
                        
                        // Обычные поля с переносом слов
                        return (
                          <TableCell key={column} className="break-words whitespace-normal max-w-[300px]">
                            {value || "—"}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
