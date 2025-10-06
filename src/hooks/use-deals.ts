import { useState } from "react";
import { Deal, Task } from "@/types/crm";
import { readFileSmart, parseCSVText } from "@/lib/csv-parser";
import { normalizeDeals, mergeDeals } from "@/lib/normalizers";
import { calcAutoMeta } from "@/lib/storage";
import { saveDealFileToCloud, saveTaskFileToCloud } from "@/lib/cloud-storage";
import { toast } from "@/hooks/use-toast";

export function useDeals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const importDeals = async (file: File, mode: "replace" | "merge") => {
    try {
      const text = await readFileSmart(file);
      const rows = parseCSVText(text);
      const { rows: normalized, info } = normalizeDeals(rows);

      if (mode === "replace") {
        setDeals(normalized);
      } else {
        setDeals((prev) => mergeDeals(prev, normalized));
      }

      // Сохраняем в облако
      const metadata = calcAutoMeta(normalized);
      const cloudResult = await saveDealFileToCloud(file.name, normalized, metadata);
      
      if (cloudResult.success) {
        toast({
          title: "Сделки импортированы",
          description: `Загружено: ${normalized.length}, пропущено: ${info.ignored}. Сохранено в облако.`,
        });
      } else {
        toast({
          title: "Сделки импортированы",
          description: `Загружено: ${normalized.length}, пропущено: ${info.ignored}. Предупреждение: не удалось сохранить в облако.`,
          variant: "destructive",
        });
      }

      return { success: true, count: normalized.length, ignored: info.ignored };
    } catch (e) {
      console.error(e);
      toast({
        title: "Ошибка импорта",
        description: "Не удалось импортировать сделки",
        variant: "destructive",
      });
      return { success: false, count: 0, ignored: 0 };
    }
  };

  const importTasks = async (file: File) => {
    try {
      const text = await readFileSmart(file);
      const rows = parseCSVText(text);
      
      const normalizeTasks = (rows: Record<string, string>[]): Task[] => {
        const norm = (s: string) =>
          String(s || "")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();
        const cols: Record<string, string> = {};
        Object.keys(rows[0] || {}).forEach((c) => (cols[c] = norm(c)));

        const pick = (a: string[]) => {
          for (const [orig, n] of Object.entries(cols)) {
            if (a.some((x) => n.includes(x))) return orig;
          }
          return null;
        };

        const cId = pick(["id", "ид", "номер", "task id", "key"]);
        const cCr = pick(["постановщик", "creator", "created by", "автор"]);
        const cAs = pick(["исполнитель", "assignee", "ответственный"]);
        const cSt = pick(["статус", "status"]);
        const cTi = pick(["название", "тема", "задача", "title", "summary"]);
        const cCrD = pick(["дата создания", "создан", "created"]);
        const cClD = pick(["дата закрытия", "закрыт", "closed", "completed"]);

        return rows.map((r) => ({
          ID: r[cId ?? ""] || r["ID"] || "",
          Название: r[cTi ?? ""] || r["Название"] || "",
          Постановщик: r[cCr ?? ""] || r["Постановщик"] || "",
          Исполнитель: r[cAs ?? ""] || r["Исполнитель"] || "",
          Статус: r[cSt ?? ""] || r["Статус"] || "",
          "Дата создания": r[cCrD ?? ""] || r["Дата создания"] || "",
          "Дата закрытия": r[cClD ?? ""] || r["Дата закрытия"] || "",
        }));
      };

      const normalized = normalizeTasks(rows);
      setTasks(normalized);
      
      // Сохраняем в облако
      const cloudResult = await saveTaskFileToCloud(file.name, normalized);
      
      if (cloudResult.success) {
        toast({
          title: "Задачи импортированы",
          description: `Загружено: ${normalized.length}. Сохранено в облако.`,
        });
      } else {
        toast({
          title: "Задачи импортированы",
          description: `Загружено: ${normalized.length}. Предупреждение: не удалось сохранить в облако.`,
          variant: "destructive",
        });
      }

      return { success: true, count: normalized.length };
    } catch (e) {
      console.error(e);
      toast({
        title: "Ошибка импорта",
        description: "Не удалось импортировать задачи",
        variant: "destructive",
      });
      return { success: false, count: 0 };
    }
  };

  return {
    deals,
    tasks,
    importDeals,
    importTasks,
  };
}
