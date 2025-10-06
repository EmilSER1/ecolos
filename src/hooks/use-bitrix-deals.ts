import { useState } from "react";
import { Deal, Task } from "@/types/crm";
import { normalizeDeals } from "@/lib/normalizers";
import { calcAutoMeta } from "@/lib/storage";
import { saveDealFileToCloud, saveTaskFileToCloud } from "@/lib/cloud-storage";
import { toast } from "@/hooks/use-toast";

export function useBitrixDeals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDealsFromBitrix = async (webhookUrl: string) => {
    setLoading(true);
    try {
      // Получаем список сделок из Bitrix24
      const response = await fetch(`${webhookUrl}crm.deal.list.json?SELECT[]=ID&SELECT[]=TITLE&SELECT[]=STAGE_ID&SELECT[]=ASSIGNED_BY_ID&SELECT[]=DATE_CREATE&SELECT[]=DATE_MODIFY&SELECT[]=UF_CRM_1589877847`);
      
      if (!response.ok) {
        throw new Error("Ошибка подключения к Bitrix24");
      }

      const data = await response.json();
      
      if (!data.result) {
        throw new Error("Неверный формат ответа от Bitrix24");
      }

      // Получаем информацию о пользователях
      const userIds = [...new Set(data.result.map((deal: any) => deal.ASSIGNED_BY_ID))];
      const usersResponse = await fetch(`${webhookUrl}user.get.json?ID[]=${userIds.join('&ID[]=')}`);
      const usersData = await usersResponse.json();
      
      const userMap = new Map();
      if (usersData.result) {
        usersData.result.forEach((user: any) => {
          userMap.set(user.ID, `${user.NAME} ${user.LAST_NAME}`.trim());
        });
      }

      // Преобразуем данные Bitrix в формат Deal
      const bitrixDeals = data.result.map((deal: any) => ({
        "ID сделки": deal.ID,
        "Ответственный": userMap.get(deal.ASSIGNED_BY_ID) || "Неизвестно",
        "Стадия сделки": deal.STAGE_ID || "Не указана",
        "Дата создания": deal.DATE_CREATE || null,
        "Дата изменения": deal.DATE_MODIFY || null,
        "Отдел": deal.UF_CRM_1589877847 || "—"
      }));

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
      // Получаем список задач из Bitrix24
      const response = await fetch(`${webhookUrl}tasks.task.list.json?SELECT[]=ID&SELECT[]=TITLE&SELECT[]=STATUS&SELECT[]=CREATED_BY&SELECT[]=RESPONSIBLE_ID&SELECT[]=CREATED_DATE&SELECT[]=CLOSED_DATE`);
      
      if (!response.ok) {
        throw new Error("Ошибка подключения к Bitrix24");
      }

      const data = await response.json();
      
      if (!data.result || !data.result.tasks) {
        throw new Error("Неверный формат ответа от Bitrix24");
      }

      // Получаем информацию о пользователях
      const userIds = [...new Set([
        ...data.result.tasks.map((task: any) => task.createdBy),
        ...data.result.tasks.map((task: any) => task.responsibleId)
      ])];
      
      const usersResponse = await fetch(`${webhookUrl}user.get.json?ID[]=${userIds.join('&ID[]=')}`);
      const usersData = await usersResponse.json();
      
      const userMap = new Map();
      if (usersData.result) {
        usersData.result.forEach((user: any) => {
          userMap.set(user.ID, `${user.NAME} ${user.LAST_NAME}`.trim());
        });
      }

      // Преобразуем данные Bitrix в формат Task
      const bitrixTasks: Task[] = data.result.tasks.map((task: any) => ({
        ID: task.id,
        Название: task.title || "",
        Постановщик: userMap.get(task.createdBy) || "Неизвестно",
        Исполнитель: userMap.get(task.responsibleId) || "Неизвестно",
        Статус: task.status === "5" ? "Завершена" : "В работе",
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
