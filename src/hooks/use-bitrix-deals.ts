import { useState } from "react";
import { Deal, Task } from "@/types/crm";
import { normalizeDeals } from "@/lib/normalizers";
import { toast } from "@/hooks/use-toast";

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

  // Маппинг стадий Bitrix24 на русские названия
  const stageMapping: Record<string, string> = {
    "NEW": "Новая",
    "PREPARATION": "Сбор данных/подготовка ТКП",
    "PREPAYMENT_INVOICE": "ТКП отправлено",
    "EXECUTING": "В работе",
    "FINAL_INVOICE": "ТКП согласовано",
    "WON": "Договор подписан",
    "LOSE": "Сделка провалена",
    "APOLOGY": "Анализ причины провала",
    "C1:NEW": "Новая",
    "C1:PREPARATION": "Сбор данных/подготовка ТКП",
    "C1:PREPAYMENT_INVOICE": "ТКП отправлено",
    "C1:EXECUTING": "В работе",
    "C1:FINAL_INVOICE": "ТКП согласовано",
    "C1:WON": "Договор подписан",
    "C1:LOSE": "Сделка провалена",
    "C1:UC_DZ4HAS": "Договор на согласовании",
    "C1:UC_55KDZG": "Выдано проектировщику",
    "C1:UC_UGT6PW": "В экспертизе",
    "C1:UC_XMGQ14": "Экспертиза пройдена",
    "C1:UC_ZRMBG8": "Идет тендер",
    "C1:UC_GWWM7C": "Производство",
    "C1:UC_5ZZJBY": "Отгружено",
    "C1:UC_W8XFJK": "ШМ и ПН",
  };

export function useBitrixDeals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [fieldMetadata, setFieldMetadata] = useState<FieldMetadata>({});
  const [stageMetadata, setStageMetadata] = useState<StageMetadata>({});

  const fetchDealsFromBitrix = async (webhookUrl: string) => {
    setLoading(true);
    try {
      // Сначала находим ID воронки ПРОДАЖИ
      console.log("Загружаем список воронок...");
      const categoriesResponse = await fetch(`${webhookUrl}crm.dealcategory.list.json`);
      let salesCategoryId = "0"; // По умолчанию основная воронка
      
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        if (categoriesData.result) {
          const salesCategory = categoriesData.result.find((cat: any) => 
            cat.NAME && cat.NAME.toLowerCase().includes('продаж')
          );
          if (salesCategory) {
            salesCategoryId = salesCategory.ID;
            console.log("Найдена воронка ПРОДАЖИ с ID:", salesCategoryId);
          }
        }
      }

      // Загружаем метаданные полей
      console.log("Загружаем метаданные полей...");
      const fieldsResponse = await fetch(`${webhookUrl}crm.deal.fields.json`);
      const metadata: FieldMetadata = {};
      
      if (fieldsResponse.ok) {
        const fieldsData = await fieldsResponse.json();
        if (fieldsData.result) {
          console.log("=== ОТЛАДКА МЕТАДАННЫХ ПОЛЕЙ ===");
          let fieldsWithItems = 0;
          
          for (const [key, value] of Object.entries(fieldsData.result)) {
            const field = value as any;
            const fieldMeta: any = {
              title: field.formLabel || field.listLabel || field.title || key,
              type: field.type || "string",
            };
            
            // Обрабатываем разные типы полей со списками
            // Типы: list, enumeration, crm_status и другие
            if (field.items) {
              fieldMeta.items = {};
              
              // items может быть массивом массивов [[ID, Name], ...] или объектом
              if (Array.isArray(field.items)) {
                field.items.forEach((item: any) => {
                  // Если это массив из 2 элементов [ID, Name]
                  if (Array.isArray(item) && item.length === 2) {
                    fieldMeta.items[String(item[0])] = String(item[1]);
                  }
                  // Или объект с ID и VALUE
                  else if (typeof item === 'object' && item !== null) {
                    const val = item as any;
                    if (val.ID !== undefined && (val.VALUE || val.NAME || val.TITLE)) {
                      fieldMeta.items[val.ID] = val.VALUE || val.NAME || val.TITLE;
                    }
                  }
                });
              } else if (typeof field.items === 'object' && Object.keys(field.items).length > 0) {
                for (const [itemId, itemValue] of Object.entries(field.items)) {
                  if (typeof itemValue === 'string') {
                    fieldMeta.items[itemId] = itemValue;
                  } else if (typeof itemValue === 'object' && itemValue !== null) {
                    // items могут быть объектами с разными структурами
                    const val = itemValue as any;
                    fieldMeta.items[itemId] = val.VALUE || val.NAME || val.TITLE || itemId;
                  }
                }
              }
              if (Object.keys(fieldMeta.items).length > 0) {
                fieldsWithItems++;
                
                // Логируем первые 3 поля со списками для отладки
                if (fieldsWithItems <= 3) {
                  console.log(`Поле "${key}" (${fieldMeta.title}):`, {
                    type: field.type,
                    itemsCount: Object.keys(fieldMeta.items).length,
                    firstItems: Object.entries(fieldMeta.items).slice(0, 3)
                  });
                }
              }
            }
            
            metadata[key] = fieldMeta;
          }
          
          console.log("Всего полей:", Object.keys(metadata).length);
          console.log("Полей со списками:", fieldsWithItems);
          
          // Выводим примеры полей со списками
          const fieldsWithItemsArray = Object.entries(metadata)
            .filter(([_, m]) => m.items && Object.keys(m.items).length > 0)
            .slice(0, 5);
          console.log("Примеры полей со списками:", fieldsWithItemsArray.map(([k, m]) => ({
            key: k,
            title: m.title,
            itemsCount: Object.keys(m.items || {}).length
          })));
        }
        setFieldMetadata(metadata);
      }

      // Загружаем стадии с цветами для воронки ПРОДАЖИ
      console.log("Загружаем стадии воронки ПРОДАЖИ...");
      const stagesResponse = await fetch(`${webhookUrl}crm.dealcategory.stage.list.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: salesCategoryId })
      });
      
      const stageData: StageMetadata = {};
      const stageNameMapping: Record<string, string> = {};
      
      if (stagesResponse.ok) {
        const stagesData = await stagesResponse.json();
        if (stagesData.result) {
          stagesData.result.forEach((stage: any) => {
            stageData[stage.STATUS_ID] = {
              name: stage.NAME,
              color: stage.COLOR || "#808080"
            };
            stageNameMapping[stage.STATUS_ID] = stage.NAME;
          });
        }
        setStageMetadata(stageData);
        console.log("Загружено стадий:", Object.keys(stageData).length);
      }

      // Загружаем сделки только из воронки ПРОДАЖИ
      console.log("Загружаем сделки из воронки ПРОДАЖИ...");
      let allDeals: any[] = [];
      let start = 0;
      const limit = 50;
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(
          `${webhookUrl}crm.deal.list.json`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              start,
              filter: { CATEGORY_ID: salesCategoryId },
              select: ["*", "UF_*"] // Явно запрашиваем все поля включая пользовательские
            })
          }
        );
        
        if (!response.ok) {
          throw new Error("Ошибка подключения к Bitrix24");
        }

        const data = await response.json();
        
        if (!data.result) {
          throw new Error("Неверный формат ответа от Bitrix24");
        }

        allDeals = allDeals.concat(data.result);
        
        // Проверяем, есть ли еще данные
        if (data.result.length < limit || data.next === undefined) {
          hasMore = false;
        } else {
          start += limit;
        }
      }

      // Получаем информацию о всех пользователях
      const userIds = [...new Set(allDeals.map((deal: any) => deal.ASSIGNED_BY_ID))].filter(Boolean);
      const userMap = new Map();
      
      if (userIds.length > 0) {
        // Загружаем пользователей частями по 50
        for (let i = 0; i < userIds.length; i += 50) {
          const chunk = userIds.slice(i, i + 50);
          const usersResponse = await fetch(`${webhookUrl}user.get.json?${chunk.map(id => `ID[]=${id}`).join('&')}`);
          const usersData = await usersResponse.json();
          
          if (usersData.result) {
            usersData.result.forEach((user: any) => {
              userMap.set(user.ID, `${user.NAME} ${user.LAST_NAME}`.trim());
            });
          }
        }
      }

      // Получаем информацию о контактах
      const contactIds = [...new Set(allDeals.map((deal: any) => deal.CONTACT_ID))].filter(Boolean);
      const contactMap = new Map();
      
      if (contactIds.length > 0) {
        for (let i = 0; i < contactIds.length; i += 50) {
          const chunk = contactIds.slice(i, i + 50);
          const contactsResponse = await fetch(`${webhookUrl}crm.contact.list.json?${chunk.map(id => `ID[]=${id}`).join('&')}`);
          const contactsData = await contactsResponse.json();
          
          if (contactsData.result) {
            contactsData.result.forEach((contact: any) => {
              contactMap.set(contact.ID, `${contact.NAME || ''} ${contact.LAST_NAME || ''}`.trim());
            });
          }
        }
      }

      console.log("Загружено сделок:", allDeals.length);
      if (allDeals.length > 0) {
        console.log("=== ПРИМЕР ПЕРВОЙ СДЕЛКИ ИЗ BITRIX24 ===");
        console.log("Все ключи:", Object.keys(allDeals[0]));
        console.log("Пользовательские поля (UF_CRM_*):", Object.keys(allDeals[0]).filter(k => k.startsWith('UF_CRM_')));
        console.log("Полные данные первой сделки:", allDeals[0]);
      }
      
      // Преобразуем данные Bitrix в формат Deal
      const bitrixDeals = allDeals.map((deal: any) => {
        const stageId = deal.STAGE_ID || "";
        const stageName = stageNameMapping[stageId] || stageId;
        
        // Создаем объект со ВСЕМИ полями из Bitrix24
        const dealData: any = {};
        
        // Копируем абсолютно ВСЕ поля из оригинальной сделки
        Object.keys(deal).forEach(key => {
          dealData[key] = deal[key];
        });
        
        
        // Специальные маппинги для читаемости
        dealData["ID сделки"] = deal.ID;
        dealData["Название"] = deal.TITLE || "—";
        dealData["Ответственный"] = userMap.get(deal.ASSIGNED_BY_ID) || "Неизвестно";
        dealData["Стадия сделки"] = stageName;
        dealData["Дата создания"] = deal.DATE_CREATE || null;
        dealData["Дата изменения"] = deal.DATE_MODIFY || null;
        dealData["Отдел"] = deal.UF_CRM_1589877847 || "—";
        dealData["Сумма"] = deal.OPPORTUNITY || "0";
        dealData["Валюта"] = deal.CURRENCY_ID || "RUB";
        dealData["Компания"] = deal.COMPANY_TITLE || "—";
        dealData["Комментарии"] = deal.COMMENTS || "—";
        dealData["Контакт"] = contactMap.get(deal.CONTACT_ID) || "—";
        dealData["Дата начала"] = deal.BEGINDATE || null;
        dealData["Дата закрытия"] = deal.CLOSEDATE || null;
        dealData["Тип"] = deal.TYPE_ID || "—";
        dealData["Вероятность"] = deal.PROBABILITY ? `${deal.PROBABILITY}%` : "—";
        dealData["Источник"] = deal.SOURCE_ID || "—";

        return dealData;
      });

      if (bitrixDeals.length > 0) {
        console.log("=== ПРИМЕР ОБРАБОТАННОЙ СДЕЛКИ ===");
        console.log("Все ключи обработанной сделки:", Object.keys(bitrixDeals[0]));
        console.log("Количество полей:", Object.keys(bitrixDeals[0]).length);
        console.log("Пользовательские поля в обработанной сделке:", 
          Object.keys(bitrixDeals[0]).filter(k => k.startsWith('UF_CRM_')));
      }

      // НЕ используем normalizeDeals - она удаляет пользовательские поля!
      // Для Bitrix24 данные уже нормализованы
      setDeals(bitrixDeals as any);

      toast({
        title: "Сделки загружены",
        description: `Загружено ${bitrixDeals.length} сделок из воронки ПРОДАЖИ`,
      });

      return { success: true, count: bitrixDeals.length };
    } catch (error: any) {
      console.error("Error fetching Bitrix deals:", error);
      toast({
        title: "Ошибка загрузки",
        description: error.message || "Не удалось загрузить сделки из Bitrix24",
        variant: "destructive",
      });
      return { success: false, count: 0 };
    } finally {
      setLoading(false);
    }
  };

  const fetchTasksFromBitrix = async (webhookUrl: string) => {
    setLoading(true);
    try {
      // Загружаем все задачи с пагинацией
      let allTasks: any[] = [];
      let start = 0;
      const limit = 50;
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(
          `${webhookUrl}tasks.task.list.json?` +
          `start=${start}&` +
          `SELECT[]=ID&SELECT[]=TITLE&SELECT[]=STATUS&SELECT[]=CREATED_BY&` +
          `SELECT[]=RESPONSIBLE_ID&SELECT[]=CREATED_DATE&SELECT[]=CLOSED_DATE&` +
          `SELECT[]=DESCRIPTION&SELECT[]=PRIORITY&SELECT[]=GROUP_ID`
        );
        
        if (!response.ok) {
          throw new Error("Ошибка подключения к Bitrix24");
        }

        const data = await response.json();
        
        if (!data.result || !data.result.tasks) {
          throw new Error("Неверный формат ответа от Bitrix24");
        }

        allTasks = allTasks.concat(data.result.tasks);
        
        // Проверяем, есть ли еще данные
        if (data.result.tasks.length < limit || data.next === undefined) {
          hasMore = false;
        } else {
          start += limit;
        }
      }

      // Получаем информацию о всех пользователях
      const userIds = [...new Set([
        ...allTasks.map((task: any) => task.createdBy),
        ...allTasks.map((task: any) => task.responsibleId)
      ])].filter(Boolean);
      
      const userMap = new Map();
      
      if (userIds.length > 0) {
        // Загружаем пользователей частями по 50
        for (let i = 0; i < userIds.length; i += 50) {
          const chunk = userIds.slice(i, i + 50);
          const usersResponse = await fetch(`${webhookUrl}user.get.json?${chunk.map(id => `ID[]=${id}`).join('&')}`);
          const usersData = await usersResponse.json();
          
          if (usersData.result) {
            usersData.result.forEach((user: any) => {
              userMap.set(user.ID, `${user.NAME} ${user.LAST_NAME}`.trim());
            });
          }
        }
      }

      // Статусы задач на русском
      const statusMapping: Record<string, string> = {
        "2": "В работе",
        "3": "Ждет выполнения",
        "4": "Завершена (требуется контроль)",
        "5": "Завершена",
        "6": "Отложена",
        "7": "Отклонена"
      };

      // Преобразуем данные Bitrix в формат Task
      const bitrixTasks: Task[] = allTasks.map((task: any) => ({
        ID: task.id,
        Название: task.title || "",
        Постановщик: userMap.get(task.createdBy) || "Неизвестно",
        Исполнитель: userMap.get(task.responsibleId) || "Неизвестно",
        Статус: statusMapping[task.status] || "Неизвестно",
        "Дата создания": task.createdDate || "",
        "Дата закрытия": task.closedDate || ""
      }));

      setTasks(bitrixTasks);

      toast({
        title: "Задачи загружены",
        description: `Загружено ${bitrixTasks.length} задач из Bitrix24`,
      });

      return { success: true, count: bitrixTasks.length };
    } catch (error: any) {
      console.error("Error fetching Bitrix tasks:", error);
      toast({
        title: "Ошибка загрузки",
        description: error.message || "Не удалось загрузить задачи из Bitrix24",
        variant: "destructive",
      });
      return { success: false, count: 0 };
    } finally {
      setLoading(false);
    }
  };

  return {
    deals,
    tasks,
    loading,
    fetchDealsFromBitrix,
    fetchTasksFromBitrix,
    fieldMetadata,
    stageMetadata,
  };
}
