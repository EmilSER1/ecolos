import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Deal } from "@/types/crm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface FieldMetadata {
  [key: string]: {
    title: string;
    type: string;
    items?: { [key: string]: string }; // Для списков: ID -> Название
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
  const [columnSearch, setColumnSearch] = useState<string>("");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    "ID сделки",
    "Название", 
    "Ответственный",
    "Стадия сделки",
    "Сумма",
    "Компания",
    "Дата создания"
  ]);

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

  // Получаем все доступные колонки с сортировкой
  const allAvailableColumns = useMemo(() => {
    if (deals.length === 0) return [];
    
    const allKeys = new Set<string>();
    deals.forEach(deal => {
      Object.keys(deal).forEach(key => allKeys.add(key));
    });
    
    // Сортируем: сначала важные поля, потом пользовательские
    const keysArray = Array.from(allKeys);
    const importantFields = [
      "ID сделки", "Название", "Ответственный", "Стадия сделки", 
      "Сумма", "Компания", "Контакт", "Дата создания", "Дата изменения"
    ];
    
    const important = keysArray.filter(k => importantFields.includes(k));
    const userFields = keysArray.filter(k => k.startsWith('UF_CRM_')).sort();
    const other = keysArray.filter(k => !importantFields.includes(k) && !k.startsWith('UF_CRM_')).sort();
    
    return [...important, ...userFields, ...other];
  }, [deals]);

  // Фильтруем колонки по поиску
  const filteredColumns = useMemo(() => {
    if (!columnSearch) return allAvailableColumns;
    
    const searchLower = columnSearch.toLowerCase();
    return allAvailableColumns.filter(col => {
      const title = getFieldTitle(col).toLowerCase();
      return title.includes(searchLower) || col.toLowerCase().includes(searchLower);
    });
  }, [allAvailableColumns, columnSearch]);

  // Колонки для отображения (только выбранные)
  const displayColumns = useMemo(() => {
    return selectedColumns.filter(col => allAvailableColumns.includes(col));
  }, [selectedColumns, allAvailableColumns]);
  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      <Card className="m-4 mb-0 flex-shrink-0">
        <CardHeader className="space-y-4">
          <div className="flex flex-row items-center justify-between">
            <CardTitle>Сделки из Bitrix24 ({filteredDeals.length} из {deals.length})</CardTitle>
            {deals.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Стадия:</span>
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
          </div>
          
          {deals.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Выбрано колонок:</span>
                <Badge variant="secondary">{selectedColumns.length} из {allAvailableColumns.length}</Badge>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по колонкам..."
                  value={columnSearch}
                  onChange={(e) => setColumnSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="max-h-[200px] overflow-y-auto border rounded-md p-3 bg-muted/20">
                <div className="flex flex-wrap gap-2">
                  {filteredColumns.map(col => {
                    const isSelected = selectedColumns.includes(col);
                    const title = getFieldTitle(col);
                    return (
                      <Badge
                        key={col}
                        variant={isSelected ? "default" : "outline"}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedColumns(prev => prev.filter(c => c !== col));
                          } else {
                            setSelectedColumns(prev => [...prev, col]);
                          }
                        }}
                        title={col}
                      >
                        {title}
                      </Badge>
                    );
                  })}
                  {filteredColumns.length === 0 && (
                    <span className="text-sm text-muted-foreground">
                      Ничего не найдено
                    </span>
                  )}
                </div>
              </div>
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
                  {displayColumns.map(column => (
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
                      {displayColumns.map(column => {
                        let value = dealData[column];
                        const contactMap = dealData._contactMap;
                        const companyMap = dealData._companyMap;
                        const meta = fieldMetadata[column];
                        
                        // Преобразуем значения списков из ID в текст
                        if (meta?.items && value !== null && value !== undefined && value !== "") {
                          const items = meta.items!;
                          
                          // Может быть одно значение или массив
                          if (Array.isArray(value)) {
                            value = value.map(v => items[v] || v).join(", ");
                          } else if (items[value]) {
                            value = items[value];
                          }
                        }
                        
                        // Резолвим контакты и компании через маппинги
                        // Проверяем по типу поля или по содержимому значения
                        if (contactMap && companyMap) {
                          const fieldType = meta?.type || '';
                          const fieldTitle = (meta?.title || column).toLowerCase();
                          
                          // Определяем, является ли поле контактом или компанией
                          const isContactField = fieldType.includes('contact') || 
                                                fieldTitle.includes('контакт') || 
                                                fieldTitle.includes('contact');
                          
                          const isCompanyField = fieldType.includes('company') || 
                                               fieldTitle.includes('компан') || 
                                               fieldTitle.includes('company') ||
                                               fieldTitle.includes('заказчик') ||
                                               fieldTitle.includes('подрядчик') ||
                                               fieldTitle.includes('проектировщик');
                          
                          // Резолвим массивы ID
                          if (Array.isArray(value) && value.length > 0) {
                            const names = value.map(v => {
                              const strId = String(v);
                              if (/^\d+$/.test(strId)) {
                                return contactMap.get(strId) || companyMap.get(strId) || v;
                              }
                              return v;
                            }).filter(Boolean);
                            if (names.length > 0) value = names.join(", ");
                          }
                          // Резолвим одиночные ID
                          else if (value && /^\d+$/.test(String(value).trim())) {
                            const strId = String(value).trim();
                            const contactName = contactMap.get(strId);
                            const companyName = companyMap.get(strId);
                            
                            // Приоритет отдаем в зависимости от типа поля
                            if (isContactField && contactName) {
                              value = contactName;
                            } else if (isCompanyField && companyName) {
                              value = companyName;
                            } else if (contactName) {
                              value = contactName;
                            } else if (companyName) {
                              value = companyName;
                            }
                          }
                        }
                        
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
