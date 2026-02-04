import { useState } from "react";
import { Deal, Task } from "@/types/crm";
import { normalizeDeals } from "@/lib/normalizers";
import { toast } from "@/hooks/use-toast";
import { createSnapshot, getWeekRange } from "@/lib/snapshots";
import { logger } from "@/lib/logger";
import { 
  BITRIX_STAGE_MAPPING, 
  TASK_STATUS_MAPPING, 
  TASK_PRIORITY_MAPPING,
  BITRIX_API_CONFIG,
  TASK_FIELDS,
  CONTACT_FIELDS,
  COMPANY_FIELDS,
  MAX_TASK_DESCRIPTION_LENGTH,
  STORAGE_KEYS
} from "@/lib/bitrix-constants";
import { ERROR_MESSAGES, TOAST_MESSAGES, LOG_MESSAGES, INFO_MESSAGES } from "@/lib/messages";

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
      logger.loading(LOG_MESSAGES.LOADING_FUNNELS);
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
            logger.info(LOG_MESSAGES.SALES_FUNNEL_FOUND(salesCategoryId));
          }
        }
      }

      // Загружаем метаданные полей
      logger.loading(LOG_MESSAGES.LOADING_FIELD_METADATA);
      const fieldsResponse = await fetch(`${webhookUrl}crm.deal.fields.json`);
      const metadata: FieldMetadata = {};
      
      if (fieldsResponse.ok) {
        const fieldsData = await fieldsResponse.json();
        if (fieldsData.result) {
          logger.group("=== ОТЛАДКА МЕТАДАННЫХ ПОЛЕЙ ===", () => {
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
                fieldsWithItems++;
              
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
                    logger.debug(`Поле "${key}" (${fieldMeta.title}):`, {
                    type: field.type,
                    itemsCount: Object.keys(fieldMeta.items).length,
                    firstItems: Object.entries(fieldMeta.items).slice(0, 3)
                  });
                }
              }
            }
            
            metadata[key] = fieldMeta;
          }
          
            logger.info("Всего полей:", Object.keys(metadata).length);
            logger.info("Полей со списками:", fieldsWithItems);
          
          // Выводим примеры полей со списками
          const fieldsWithItemsArray = Object.entries(metadata)
            .filter(([_, m]) => m.items && Object.keys(m.items).length > 0)
            .slice(0, 5);
            logger.debug("Примеры полей со списками:", fieldsWithItemsArray.map(([k, m]) => ({
            key: k,
            title: m.title,
            itemsCount: Object.keys(m.items || {}).length
          })));
          });
        }
        setFieldMetadata(metadata);
      }

      // Загружаем стадии с цветами для воронки ПРОДАЖИ
      logger.loading(LOG_MESSAGES.LOADING_FUNNEL_STAGES);
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
        logger.info("Загружено стадий:", Object.keys(stageData).length);
      }

      // Загружаем сделки только из воронки ПРОДАЖИ
      logger.loading(LOG_MESSAGES.LOADING_DEALS);
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
          throw new Error(ERROR_MESSAGES.BITRIX_CONNECTION_ERROR);
        }

        const data = await response.json();
        
        if (!data.result) {
          throw new Error(ERROR_MESSAGES.BITRIX_INVALID_RESPONSE);
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

      // Получаем информацию о контактах (собираем ID из всех возможных полей)
      const contactIdsSet = new Set<string>();
      allDeals.forEach((deal: any) => {
        // Одиночный контакт
        if (deal.CONTACT_ID) contactIdsSet.add(String(deal.CONTACT_ID));
        
        // Множественные контакты
        if (deal.CONTACT_IDS && Array.isArray(deal.CONTACT_IDS)) {
          deal.CONTACT_IDS.forEach((id: any) => contactIdsSet.add(String(id)));
        }
        
        // Проверяем пользовательские поля на наличие контактов
        Object.entries(deal).forEach(([key, value]) => {
          if (key.startsWith('UF_CRM_') && value) {
            // Если значение - массив ID
            if (Array.isArray(value)) {
              value.forEach(v => {
                if (v && !isNaN(Number(v))) contactIdsSet.add(String(v));
              });
            }
            // Если значение - одиночный ID
            else if (!isNaN(Number(value))) {
              contactIdsSet.add(String(value));
            }
          }
        });
      });
      
      const contactIds = Array.from(contactIdsSet).filter(Boolean);
      const contactMap = new Map();
      
      if (contactIds.length > 0) {
        logger.loading(`Загружаем ${contactIds.length} контактов...`);
        let processedContacts = 0;
        for (let i = 0; i < contactIds.length; i += BITRIX_API_CONFIG.USER_BATCH_SIZE) {
          const chunk = contactIds.slice(i, i + BITRIX_API_CONFIG.USER_BATCH_SIZE);
          logger.info(`Загрузка контактов: ${i + 1}-${Math.min(i + BITRIX_API_CONFIG.USER_BATCH_SIZE, contactIds.length)} из ${contactIds.length}`);
          
          try {
            // Используем POST запрос для больших списков ID
            const requestBody = {
              filter: {
                "ID": chunk
              },
              select: CONTACT_FIELDS
            };
            
            const contactsResponse = await fetch(`${webhookUrl}crm.contact.list.json`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody)
            });
            
            const contactsData = await contactsResponse.json();
            
            if (contactsData.result && Array.isArray(contactsData.result)) {
            contactsData.result.forEach((contact: any) => {
                if (contact.ID) {
              const name = `${contact.NAME || ''} ${contact.LAST_NAME || ''}`.trim() || contact.ID;
              contactMap.set(String(contact.ID), name);
                  processedContacts++;
                }
              });
              logger.debug(`Блок ${i}-${i+BITRIX_API_CONFIG.USER_BATCH_SIZE}: получено ${contactsData.result.length} контактов`);
            } else {
              logger.warn(`Ошибка загрузки контактов ${i}-${i+BITRIX_API_CONFIG.USER_BATCH_SIZE}:`, contactsData);
            }
          } catch (error) {
            logger.error(`Ошибка при загрузке контактов ${i}-${i+BITRIX_API_CONFIG.USER_BATCH_SIZE}:`, error);
          }
        }
        logger.success(`Загружено контактов: ${contactMap.size} из ${contactIds.length} (обработано: ${processedContacts})`);
      }

      // Получаем информацию о компаниях
      const companyIdsSet = new Set<string>();
      allDeals.forEach((deal: any) => {
        if (deal.COMPANY_ID) companyIdsSet.add(String(deal.COMPANY_ID));
        
        // Проверяем пользовательские поля на наличие компаний
        Object.entries(deal).forEach(([key, value]) => {
          if (key.startsWith('UF_CRM_') && value) {
            // Проверяем метаданные поля, чтобы понять, ссылается ли оно на компании
            const fieldMeta = metadata[key];
            const isCompanyField = fieldMeta && (
              fieldMeta.title?.toLowerCase().includes('компан') ||
              fieldMeta.title?.toLowerCase().includes('организац') ||
              fieldMeta.title?.toLowerCase().includes('подрядчик') ||
              fieldMeta.title?.toLowerCase().includes('застройщик') ||
              fieldMeta.type === 'crm_company' ||
              key.includes('COMPANY')
            );
            
            if (isCompanyField) {
            if (Array.isArray(value)) {
              value.forEach(v => {
                if (v && !isNaN(Number(v))) companyIdsSet.add(String(v));
              });
            } else if (!isNaN(Number(value))) {
              companyIdsSet.add(String(value));
              }
            }
          }
        });
      });
      
      const companyIds = Array.from(companyIdsSet).filter(Boolean);
      const companyMap = new Map();
      
      if (companyIds.length > 0) {
        logger.loading(`Загружаем ${companyIds.length} компаний...`);
        let processedCompanies = 0;
        for (let i = 0; i < companyIds.length; i += BITRIX_API_CONFIG.COMPANY_BATCH_SIZE) {
          const chunk = companyIds.slice(i, i + BITRIX_API_CONFIG.COMPANY_BATCH_SIZE);
          logger.info(`Загрузка компаний: ${i + 1}-${Math.min(i + BITRIX_API_CONFIG.COMPANY_BATCH_SIZE, companyIds.length)} из ${companyIds.length}`);
          
          try {
            // Используем POST запрос для больших списков ID
            const requestBody = {
              filter: {
                "ID": chunk
              },
              select: COMPANY_FIELDS
            };
            
            const companiesResponse = await fetch(`${webhookUrl}crm.company.list.json`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody)
            });
            
            const companiesData = await companiesResponse.json();
            
            if (companiesData.result && Array.isArray(companiesData.result)) {
            companiesData.result.forEach((company: any) => {
                if (company.ID) {
              const name = company.TITLE || company.ID;
              companyMap.set(String(company.ID), name);
                  processedCompanies++;
                }
              });
              logger.debug(`Блок ${i}-${i+BITRIX_API_CONFIG.COMPANY_BATCH_SIZE}: получено ${companiesData.result.length} компаний`);
            } else {
              logger.warn(`Ошибка загрузки компаний ${i}-${i+BITRIX_API_CONFIG.COMPANY_BATCH_SIZE}:`, companiesData);
            }
          } catch (error) {
            logger.error(`Ошибка при загрузке компаний ${i}-${i+BITRIX_API_CONFIG.COMPANY_BATCH_SIZE}:`, error);
          }
        }
        logger.success(`Загружено компаний: ${companyMap.size} из ${companyIds.length} (обработано: ${processedCompanies})`);
      }

      logger.info("Загружено сделок:", allDeals.length);
      if (allDeals.length > 0) {
        logger.group("=== ПРИМЕР ПЕРВОЙ СДЕЛКИ ИЗ BITRIX24 ===", () => {
          logger.debug("Все ключи:", Object.keys(allDeals[0]));
          logger.debug("Пользовательские поля (UF_CRM_*):", Object.keys(allDeals[0]).filter(k => k.startsWith('UF_CRM_')));
          logger.debug("Полные данные первой сделки:", allDeals[0]);
        });
      }
      
      // Преобразуем данные Bitrix в формат Deal
      const bitrixDeals = allDeals.map((deal: any) => {
        const stageId = deal.STAGE_ID || "";
        const stageName = stageNameMapping[stageId] || stageId;
        
        // Создаем объект со ВСЕМИ полями из Bitrix24
        const dealData: any = {};
        
        // Копируем абсолютно ВСЕ поля из оригинальной сделки
        Object.keys(deal).forEach(key => {
          let value = deal[key];
          
          // Обрабатываем поля со списками (преобразуем ID в текст)
          if (key.startsWith('UF_CRM_') && metadata[key]?.items) {
            const fieldItems = metadata[key].items;
            
            if (value) {
              if (Array.isArray(value)) {
                // Массив значений - преобразуем каждое
                value = value.map(val => fieldItems[val] || val).join(', ');
              } else {
                // Одиночное значение
                value = fieldItems[value] || value;
              }
            }
          }
          
          dealData[key] = value;
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
        
        // Компания - берем из COMPANY_TITLE или резолвим из COMPANY_ID
        if (deal.COMPANY_TITLE) {
          dealData["Компания"] = deal.COMPANY_TITLE;
        } else if (deal.COMPANY_ID) {
          dealData["Компания"] = companyMap.get(String(deal.COMPANY_ID)) || deal.COMPANY_ID;
        } else {
          dealData["Компания"] = "—";
        }
        
        dealData["Комментарии"] = deal.COMMENTS || "—";
        
        // Контакт - обрабатываем одиночный и множественный
        if (deal.CONTACT_IDS && Array.isArray(deal.CONTACT_IDS) && deal.CONTACT_IDS.length > 0) {
          const contactNames = deal.CONTACT_IDS
            .map((id: any) => contactMap.get(String(id)) || id)
            .filter(Boolean);
          dealData["Контакт"] = contactNames.length > 0 ? contactNames.join(", ") : "—";
        } else if (deal.CONTACT_ID) {
          dealData["Контакт"] = contactMap.get(String(deal.CONTACT_ID)) || deal.CONTACT_ID;
        } else {
          dealData["Контакт"] = "—";
        }
        
        // Сохраняем маппинги для использования в компоненте
        dealData._contactMap = contactMap;
        dealData._companyMap = companyMap;
        dealData["Дата начала"] = deal.BEGINDATE || null;
        dealData["Дата закрытия"] = deal.CLOSEDATE || null;
        dealData["Тип"] = deal.TYPE_ID || "—";
        dealData["Вероятность"] = deal.PROBABILITY ? `${deal.PROBABILITY}%` : "—";
        dealData["Источник"] = deal.SOURCE_ID || "—";

        return dealData;
      });

      if (bitrixDeals.length > 0) {
        logger.group("=== ПРИМЕР ОБРАБОТАННОЙ СДЕЛКИ ===", () => {
          logger.debug("Все ключи обработанной сделки:", Object.keys(bitrixDeals[0]));
          logger.debug("Количество полей:", Object.keys(bitrixDeals[0]).length);
          logger.debug("Пользовательские поля в обработанной сделке:", 
          Object.keys(bitrixDeals[0]).filter(k => k.startsWith('UF_CRM_')));
        });
      }

      // НЕ используем normalizeDeals - она удаляет пользовательские поля!
      // Для Bitrix24 данные уже нормализованы
      setDeals(bitrixDeals as any);

      // Создаем снимок данных для текущей недели
      const weekRange = getWeekRange();
      logger.snapshot(LOG_MESSAGES.CREATING_SNAPSHOT(weekRange.label, 'сделок'));
      
      try {
        const snapshotResult = await createSnapshot(bitrixDeals as any, [], weekRange);
        if (snapshotResult.success) {
          logger.success(LOG_MESSAGES.SNAPSHOT_CREATED(snapshotResult.snapshot?.id || 'unknown', 'сделок'));
          toast({
            title: TOAST_MESSAGES.DEALS.SUCCESS_TITLE,
            description: TOAST_MESSAGES.DEALS.SUCCESS_DESCRIPTION(bitrixDeals.length),
          });
        } else {
          logger.warn(LOG_MESSAGES.SNAPSHOT_ERROR(snapshotResult.error || 'unknown', 'сделок'));
          toast({
            title: TOAST_MESSAGES.DEALS.SUCCESS_NO_SNAPSHOT_TITLE,
            description: TOAST_MESSAGES.DEALS.SUCCESS_NO_SNAPSHOT_DESCRIPTION(bitrixDeals.length),
          });
        }
      } catch (error) {
        logger.error('Ошибка создания снимка сделок:', error);
      toast({
          title: TOAST_MESSAGES.DEALS.SUCCESS_NO_SNAPSHOT_TITLE,
          description: TOAST_MESSAGES.DEALS.SUCCESS_NO_SNAPSHOT_DESCRIPTION(bitrixDeals.length),
      });
      }

      return { success: true, count: bitrixDeals.length };
    } catch (error: any) {
      logger.error("Error fetching Bitrix deals:", error);
      toast({
        title: TOAST_MESSAGES.ERROR.TITLE,
        description: error.message || ERROR_MESSAGES.DEALS_LOAD_ERROR,
        variant: TOAST_MESSAGES.ERROR.VARIANT,
      });
      return { success: false, count: 0 };
    } finally {
      setLoading(false);
    }
  };

  const fetchTasksFromBitrix = async (webhookUrl: string) => {
    setLoading(true);
    try {
      logger.loading(LOG_MESSAGES.LOADING_TASKS);
      
      // Пробуем другой метод - через task.item.list
      let allTasks: any[] = [];
      let start = 0;
      const limit = BITRIX_API_CONFIG.BATCH_SIZE;
      let hasMore = true;

      while (hasMore) {
        try {
          // Используем POST-запрос для избежания CORS
          const response = await fetch(`${webhookUrl}task.item.list.json`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              start: start,
              limit: limit,
              select: TASK_FIELDS
            })
          });
          
          if (!response.ok) {
            // Если POST не работает, попробуем старый метод GET
            const getResponse = await fetch(
              `${webhookUrl}task.item.list.json?` +
              `start=${start}&limit=${limit}&` +
          `SELECT[]=ID&SELECT[]=TITLE&SELECT[]=STATUS&SELECT[]=CREATED_BY&` +
          `SELECT[]=RESPONSIBLE_ID&SELECT[]=CREATED_DATE&SELECT[]=CLOSED_DATE&` +
              `SELECT[]=DESCRIPTION&SELECT[]=PRIORITY`
            );
            if (!getResponse.ok) {
              throw new Error(ERROR_MESSAGES.BITRIX_CONNECTION_ERROR);
            }
            const data = await getResponse.json();
            
            if (data.result && Array.isArray(data.result)) {
              allTasks = allTasks.concat(data.result);
              logger.info(`Загружено задач: ${start + 1}-${start + data.result.length} (всего: ${allTasks.length})`);
              
              if (data.result.length < limit) {
                hasMore = false;
              } else {
                start += limit;
              }
            } else {
              hasMore = false;
            }
          } else {
        const data = await response.json();
        
            if (data.result && Array.isArray(data.result)) {
              allTasks = allTasks.concat(data.result);
              logger.info(`Загружено задач: ${start + 1}-${start + data.result.length} (всего: ${allTasks.length})`);
              
              if (data.result.length < limit) {
          hasMore = false;
        } else {
          start += limit;
        }
            } else {
              hasMore = false;
            }
          }
        } catch (error) {
          logger.error(`Ошибка при загрузке задач ${start}-${start+limit}:`, error);
          hasMore = false;
        }
      }

      logger.success(`Всего загружено задач: ${allTasks.length}`);
      
      if (allTasks.length === 0) {
        logger.warn(INFO_MESSAGES.NO_TASKS_FOUND);
        setTasks([]);
        return { success: true, count: 0 };
      }

      // Получаем информацию о всех пользователях
      const userIds = [...new Set([
        ...allTasks.map((task: any) => task.CREATED_BY),
        ...allTasks.map((task: any) => task.RESPONSIBLE_ID)
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


      // Функция для форматирования даты
      const formatTaskDate = (dateString: string): string => {
        if (!dateString) return '—';
        try {
          const date = new Date(dateString);
          return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        } catch {
          return dateString;
        }
      };

      // Преобразуем данные Bitrix в формат Task
      const bitrixTasks: Task[] = allTasks.map((task: any) => ({
        ID: task.ID || task.id,
        Название: task.TITLE || task.title || "",
        Постановщик: userMap.get(String(task.CREATED_BY)) || task.CREATED_BY || "—",
        Исполнитель: userMap.get(String(task.RESPONSIBLE_ID)) || task.RESPONSIBLE_ID || "—",
        Статус: TASK_STATUS_MAPPING[String(task.STATUS)] || TASK_STATUS_MAPPING[String(task.status)] || "Неизвестно",
        Приоритет: TASK_PRIORITY_MAPPING[String(task.PRIORITY)] || TASK_PRIORITY_MAPPING[String(task.priority)] || "Обычный",
        "Дата создания": formatTaskDate(task.CREATED_DATE || task.createdDate),
        "Дата закрытия": formatTaskDate(task.CLOSED_DATE || task.closedDate),
        Описание: (task.DESCRIPTION || task.description || '').substring(0, MAX_TASK_DESCRIPTION_LENGTH) + 
                  ((task.DESCRIPTION || task.description || '').length > MAX_TASK_DESCRIPTION_LENGTH ? '...' : '')
      }));

      setTasks(bitrixTasks);

      // Создаем снимок задач для текущей недели
      const weekRange = getWeekRange();
      logger.snapshot(LOG_MESSAGES.CREATING_SNAPSHOT(weekRange.label, 'задач'));
      
      try {
        const snapshotResult = await createSnapshot([], bitrixTasks, weekRange);
        if (snapshotResult.success) {
          logger.success(LOG_MESSAGES.SNAPSHOT_CREATED(snapshotResult.snapshot?.id || 'unknown', 'задач'));
          toast({
            title: TOAST_MESSAGES.TASKS.SUCCESS_TITLE,
            description: TOAST_MESSAGES.TASKS.SUCCESS_DESCRIPTION(bitrixTasks.length),
          });
        } else {
          logger.warn(LOG_MESSAGES.SNAPSHOT_ERROR(snapshotResult.error || 'unknown', 'задач'));
          toast({
            title: TOAST_MESSAGES.TASKS.SUCCESS_NO_SNAPSHOT_TITLE,
            description: TOAST_MESSAGES.TASKS.SUCCESS_NO_SNAPSHOT_DESCRIPTION(bitrixTasks.length),
          });
        }
      } catch (error) {
        logger.error('Ошибка создания снимка задач:', error);
      toast({
          title: TOAST_MESSAGES.TASKS.SUCCESS_NO_SNAPSHOT_TITLE,
          description: TOAST_MESSAGES.TASKS.SUCCESS_NO_SNAPSHOT_DESCRIPTION(bitrixTasks.length),
      });
      }

      return { success: true, count: bitrixTasks.length };
    } catch (error: any) {
      logger.error("Error fetching Bitrix tasks:", error);
      toast({
        title: TOAST_MESSAGES.ERROR.TITLE,
        description: error.message || ERROR_MESSAGES.TASKS_LOAD_ERROR,
        variant: TOAST_MESSAGES.ERROR.VARIANT,
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
    loadData: async () => {
      const webhookUrl = localStorage.getItem(STORAGE_KEYS.BITRIX_WEBHOOK_URL);
      if (webhookUrl) {
        await Promise.all([
          fetchDealsFromBitrix(webhookUrl),
          fetchTasksFromBitrix(webhookUrl)
        ]);
      }
    }
  };
}

// Экспортируем типы для использования в компоненте
export type { FieldMetadata, StageMetadata };
