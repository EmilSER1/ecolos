import { useState } from "react";
import { loadDealFilesFromCloud, loadTaskFilesFromCloud, CloudDealFile, CloudTaskFile } from "@/lib/cloud-storage";
import { Deal, Task } from "@/types/crm";

export interface StageTransition {
  dealId: string;
  oldStage: string;
  newStage: string;
  responsible: string;
  department: string;
}

export interface DealComparison {
  totalChange: number;
  stageChanges: Record<string, number>;
  assigneeChanges: Record<string, number>;
  departmentChanges: Record<string, number>;
  newDeals: Deal[];
  removedDeals: Deal[];
  stageTransitions: StageTransition[];
}

export interface TaskComparison {
  totalChange: number;
  statusChanges: Record<string, number>;
  assigneeChanges: Record<string, number>;
  creatorChanges: Record<string, number>;
  newTasks: Task[];
  removedTasks: Task[];
}

export function useFileComparison() {
  const [dealFiles, setDealFiles] = useState<CloudDealFile[]>([]);
  const [taskFiles, setTaskFiles] = useState<CloudTaskFile[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const [deals, tasks] = await Promise.all([
        loadDealFilesFromCloud(),
        loadTaskFilesFromCloud(),
      ]);
      setDealFiles(deals);
      setTaskFiles(tasks);
    } catch (error) {
      console.error("Error loading files:", error);
    } finally {
      setLoading(false);
    }
  };

  const compareDeals = (file1: CloudDealFile, file2: CloudDealFile): DealComparison => {
    const deals1 = file1.file_data;
    const deals2 = file2.file_data;

    // Изменения по стадиям
    const stageChanges: Record<string, number> = {};
    const countByStage = (deals: Deal[]) => {
      const counts: Record<string, number> = {};
      deals.forEach(deal => {
        counts[deal["Стадия сделки"]] = (counts[deal["Стадия сделки"]] || 0) + 1;
      });
      return counts;
    };
    const stages1 = countByStage(deals1);
    const stages2 = countByStage(deals2);
    const allStages = new Set([...Object.keys(stages1), ...Object.keys(stages2)]);
    allStages.forEach(stage => {
      stageChanges[stage] = (stages2[stage] || 0) - (stages1[stage] || 0);
    });

    // Изменения по ответственным
    const assigneeChanges: Record<string, number> = {};
    const countByAssignee = (deals: Deal[]) => {
      const counts: Record<string, number> = {};
      deals.forEach(deal => {
        counts[deal["Ответственный"]] = (counts[deal["Ответственный"]] || 0) + 1;
      });
      return counts;
    };
    const assignees1 = countByAssignee(deals1);
    const assignees2 = countByAssignee(deals2);
    const allAssignees = new Set([...Object.keys(assignees1), ...Object.keys(assignees2)]);
    allAssignees.forEach(assignee => {
      assigneeChanges[assignee] = (assignees2[assignee] || 0) - (assignees1[assignee] || 0);
    });

    // Изменения по отделам
    const departmentChanges: Record<string, number> = {};
    const countByDepartment = (deals: Deal[]) => {
      const counts: Record<string, number> = {};
      deals.forEach(deal => {
        counts[deal["Отдел"]] = (counts[deal["Отдел"]] || 0) + 1;
      });
      return counts;
    };
    const departments1 = countByDepartment(deals1);
    const departments2 = countByDepartment(deals2);
    const allDepartments = new Set([...Object.keys(departments1), ...Object.keys(departments2)]);
    allDepartments.forEach(dept => {
      departmentChanges[dept] = (departments2[dept] || 0) - (departments1[dept] || 0);
    });

    // Новые и удаленные сделки
    const ids1 = new Set(deals1.map(d => d["ID сделки"]).filter(Boolean));
    const ids2 = new Set(deals2.map(d => d["ID сделки"]).filter(Boolean));
    const newDeals = deals2.filter(d => d["ID сделки"] && !ids1.has(d["ID сделки"]));
    const removedDeals = deals1.filter(d => d["ID сделки"] && !ids2.has(d["ID сделки"]));

    // Перемещения по стадиям (сделки с одинаковым ID, но разными стадиями)
    const stageTransitions: StageTransition[] = [];
    const dealsMap1 = new Map(deals1.map(d => [d["ID сделки"], d]));
    const dealsMap2 = new Map(deals2.map(d => [d["ID сделки"], d]));

    dealsMap2.forEach((deal2, id) => {
      if (!id) return;
      const deal1 = dealsMap1.get(id);
      if (deal1 && deal1["Стадия сделки"] !== deal2["Стадия сделки"]) {
        stageTransitions.push({
          dealId: id,
          oldStage: deal1["Стадия сделки"] || "—",
          newStage: deal2["Стадия сделки"] || "—",
          responsible: deal2["Ответственный"] || "—",
          department: deal2["Отдел"] || "—",
        });
      }
    });

    return {
      totalChange: deals2.length - deals1.length,
      stageChanges,
      assigneeChanges,
      departmentChanges,
      newDeals,
      removedDeals,
      stageTransitions,
    };
  };

  const compareTasks = (file1: CloudTaskFile, file2: CloudTaskFile): TaskComparison => {
    const tasks1 = file1.file_data;
    const tasks2 = file2.file_data;

    // Изменения по статусам
    const statusChanges: Record<string, number> = {};
    const countByStatus = (tasks: Task[]) => {
      const counts: Record<string, number> = {};
      tasks.forEach(task => {
        counts[task["Статус"]] = (counts[task["Статус"]] || 0) + 1;
      });
      return counts;
    };
    const statuses1 = countByStatus(tasks1);
    const statuses2 = countByStatus(tasks2);
    const allStatuses = new Set([...Object.keys(statuses1), ...Object.keys(statuses2)]);
    allStatuses.forEach(status => {
      statusChanges[status] = (statuses2[status] || 0) - (statuses1[status] || 0);
    });

    // Изменения по исполнителям
    const assigneeChanges: Record<string, number> = {};
    const countByAssignee = (tasks: Task[]) => {
      const counts: Record<string, number> = {};
      tasks.forEach(task => {
        counts[task["Исполнитель"]] = (counts[task["Исполнитель"]] || 0) + 1;
      });
      return counts;
    };
    const assignees1 = countByAssignee(tasks1);
    const assignees2 = countByAssignee(tasks2);
    const allAssignees = new Set([...Object.keys(assignees1), ...Object.keys(assignees2)]);
    allAssignees.forEach(assignee => {
      assigneeChanges[assignee] = (assignees2[assignee] || 0) - (assignees1[assignee] || 0);
    });

    // Изменения по постановщикам
    const creatorChanges: Record<string, number> = {};
    const countByCreator = (tasks: Task[]) => {
      const counts: Record<string, number> = {};
      tasks.forEach(task => {
        counts[task["Постановщик"]] = (counts[task["Постановщик"]] || 0) + 1;
      });
      return counts;
    };
    const creators1 = countByCreator(tasks1);
    const creators2 = countByCreator(tasks2);
    const allCreators = new Set([...Object.keys(creators1), ...Object.keys(creators2)]);
    allCreators.forEach(creator => {
      creatorChanges[creator] = (creators2[creator] || 0) - (creators1[creator] || 0);
    });

    // Новые и удаленные задачи
    const ids1 = new Set(tasks1.map(t => t.ID));
    const ids2 = new Set(tasks2.map(t => t.ID));
    const newTasks = tasks2.filter(t => !ids1.has(t.ID));
    const removedTasks = tasks1.filter(t => !ids2.has(t.ID));

    return {
      totalChange: tasks2.length - tasks1.length,
      statusChanges,
      assigneeChanges,
      creatorChanges,
      newTasks,
      removedTasks,
    };
  };

  return {
    dealFiles,
    taskFiles,
    loading,
    loadFiles,
    compareDeals,
    compareTasks,
  };
}
