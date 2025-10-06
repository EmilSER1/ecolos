import { useState } from "react";
import { Deal, Task } from "@/types/crm";
import { normalizeDeals } from "@/lib/normalizers";
import { calcAutoMeta } from "@/lib/storage";
import { saveDealFileToCloud, saveTaskFileToCloud } from "@/lib/cloud-storage";
import { toast } from "@/hooks/use-toast";

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

  const fetchDealsFromBitrix = async (webhookUrl: string) => {
    setLoading(true);
    try {
      // Загружаем все сделки с пагинацией
      let allDeals: any[] = [];
      let start = 0;
      const limit = 50;
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(
          `${webhookUrl}crm.deal.list.json?` +
          `start=${start}&` +
          `SELECT[]=ID&SELECT[]=TITLE&SELECT[]=STAGE_ID&SELECT[]=ASSIGNED_BY_ID&` +
          `SELECT[]=DATE_CREATE&SELECT[]=DATE_MODIFY&SELECT[]=UF_CRM_1589877847&` +
          `SELECT[]=OPPORTUNITY&SELECT[]=CURRENCY_ID&SELECT[]=COMMENTS&SELECT[]=COMPANY_TITLE`
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

      // Преобразуем данные Bitrix в формат Deal с русскими названиями стадий
      const bitrixDeals = allDeals.map((deal: any) => {
        const stageId = deal.STAGE_ID || "";
        const stageName = stageMapping[stageId] || stageId;
        
        return {
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
        };
      });

      // Нормализуем данные
      const { rows: normalized } = normalizeDeals(bitrixDeals);
      
      setDeals(normalized);

      // Сохраняем в облако
      const metadata = calcAutoMeta(normalized);
      const fileName = `bitrix_deals_${new Date().toISOString().split('T')[0]}.json`;
      await saveDealFileToCloud(fileName, normalized, metadata);

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

      // Сохраняем в облако
      const fileName = `bitrix_tasks_${new Date().toISOString().split('T')[0]}.json`;
      await saveTaskFileToCloud(fileName, bitrixTasks);

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
  };
}
