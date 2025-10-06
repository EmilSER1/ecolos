import { useState } from "react";
import { Deal, Task } from "@/types/crm";
import { normalizeDeals } from "@/lib/normalizers";
import { toast } from "@/hooks/use-toast";

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
          for (const [key, value] of Object.entries(fieldsData.result)) {
            const field = value as any;
            metadata[key] = {
              title: field.formLabel || field.listLabel || field.title || key,
              type: field.type || "string",
            };
          }
        }
        setFieldMetadata(metadata);
        console.log("Метаданные полей загружены:", Object.keys(metadata).length);
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
              filter: { CATEGORY_ID: salesCategoryId }
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

      console.log("Пример первой сделки (все поля):", allDeals[0]);
      
      // Преобразуем данные Bitrix в формат Deal
      const bitrixDeals = allDeals.map((deal: any) => {
        const stageId = deal.STAGE_ID || "";
        const stageName = stageNameMapping[stageId] || stageId;
        
        // Базовые поля
        const dealData: any = {
          "ID сделки": deal.ID,
          "Название": deal.TITLE || "—",
          "Ответственный": userMap.get(deal.ASSIGNED_BY_ID) || "Неизвестно",
          "Стадия сделки": stageName,
          "Дата создания": deal.DATE_CREATE || null,
          "Дата изменения": deal.DATE_MODIFY || null,
          "Отдел": deal.UF_CRM_1589877847 || "—",
          "Сумма": deal.OPPORTUNITY || "0",
          "Валюта": deal.CURRENCY_ID || "RUB",
          "Компания": deal.COMPANY_TITLE || "—",
          "Комментарии": deal.COMMENTS || "—",
          "Контакт": contactMap.get(deal.CONTACT_ID) || "—",
          "Дата начала": deal.BEGINDATE || null,
          "Дата закрытия": deal.CLOSEDATE || null,
          "Тип": deal.TYPE_ID || "—",
          "Вероятность": deal.PROBABILITY ? `${deal.PROBABILITY}%` : "—",
          "Источник": deal.SOURCE_ID || "—",
        };

        // Добавляем ВСЕ пользовательские поля (UF_CRM_*)
        Object.keys(deal).forEach(key => {
          if (key.startsWith('UF_CRM_')) {
            // Обрабатываем значение поля
            let value = deal[key];
            
            // Если это массив, преобразуем в строку
            if (Array.isArray(value)) {
              value = value.join(', ');
            }
            
            // Если это объект, преобразуем в JSON-строку
            if (value && typeof value === 'object') {
              value = JSON.stringify(value);
            }
            
            dealData[key] = value || "—";
          }
        });

        return dealData;
      });

      console.log("Пример обработанной сделки:", bitrixDeals[0]);
      console.log("Все ключи первой сделки:", Object.keys(bitrixDeals[0]));

      // Нормализуем данные
      const { rows: normalized } = normalizeDeals(bitrixDeals);
      
      setDeals(normalized);

      toast({
        title: "Сделки загружены",
        description: `Загружено ${normalized.length} сделок из Bitrix24`,
      });

      return { success: true, count: normalized.length };
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
