import { supabase } from "@/integrations/supabase/client";
import { Deal, Task, FileMeta } from "@/types/crm";

export interface CloudDealFile {
  id: string;
  file_name: string;
  file_data: Deal[];
  metadata: FileMeta;
  uploaded_at: string;
}

export interface CloudTaskFile {
  id: string;
  file_name: string;
  file_data: Task[];
  uploaded_at: string;
}

// Сохранение файла сделок в облако
export async function saveDealFileToCloud(
  fileName: string,
  deals: Deal[],
  metadata: FileMeta
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("deal_files")
      .insert({
        file_name: fileName,
        file_data: deals as any,
        metadata: metadata as any,
      });

    if (error) {
      console.error("Error saving deal file:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e: any) {
    console.error("Error saving deal file:", e);
    return { success: false, error: e.message };
  }
}

// Сохранение файла задач в облако
export async function saveTaskFileToCloud(
  fileName: string,
  tasks: Task[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("task_files")
      .insert({
        file_name: fileName,
        file_data: tasks as any,
      });

    if (error) {
      console.error("Error saving task file:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e: any) {
    console.error("Error saving task file:", e);
    return { success: false, error: e.message };
  }
}

// Получение всех файлов сделок из облака
export async function loadDealFilesFromCloud(): Promise<CloudDealFile[]> {
  try {
    const { data, error } = await supabase
      .from("deal_files")
      .select("*")
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("Error loading deal files:", error);
      return [];
    }

    return (data || []).map(file => ({
      id: file.id,
      file_name: file.file_name,
      file_data: file.file_data as unknown as Deal[],
      metadata: file.metadata as unknown as FileMeta,
      uploaded_at: file.uploaded_at,
    }));
  } catch (e) {
    console.error("Error loading deal files:", e);
    return [];
  }
}

// Получение всех файлов задач из облака
export async function loadTaskFilesFromCloud(): Promise<CloudTaskFile[]> {
  try {
    const { data, error } = await supabase
      .from("task_files")
      .select("*")
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("Error loading task files:", error);
      return [];
    }

    return (data || []).map(file => ({
      id: file.id,
      file_name: file.file_name,
      file_data: file.file_data as unknown as Task[],
      uploaded_at: file.uploaded_at,
    }));
  } catch (e) {
    console.error("Error loading task files:", e);
    return [];
  }
}

// Получение файла сделок по ID
export async function getDealFileById(id: string): Promise<CloudDealFile | null> {
  try {
    const { data, error } = await supabase
      .from("deal_files")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error loading deal file:", error);
      return null;
    }

    return {
      id: data.id,
      file_name: data.file_name,
      file_data: data.file_data as unknown as Deal[],
      metadata: data.metadata as unknown as FileMeta,
      uploaded_at: data.uploaded_at,
    };
  } catch (e) {
    console.error("Error loading deal file:", e);
    return null;
  }
}

// Получение файла задач по ID
export async function getTaskFileById(id: string): Promise<CloudTaskFile | null> {
  try {
    const { data, error } = await supabase
      .from("task_files")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error loading task file:", error);
      return null;
    }

    return {
      id: data.id,
      file_name: data.file_name,
      file_data: data.file_data as unknown as Task[],
      uploaded_at: data.uploaded_at,
    };
  } catch (e) {
    console.error("Error loading task file:", e);
    return null;
  }
}

// Получение последнего файла сделок
export async function getLatestDealFile(): Promise<CloudDealFile | null> {
  try {
    const { data, error } = await supabase
      .from("deal_files")
      .select("*")
      .order("uploaded_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("Error loading latest deal file:", error);
      return null;
    }

    return {
      id: data.id,
      file_name: data.file_name,
      file_data: data.file_data as unknown as Deal[],
      metadata: data.metadata as unknown as FileMeta,
      uploaded_at: data.uploaded_at,
    };
  } catch (e) {
    console.error("Error loading latest deal file:", e);
    return null;
  }
}

// Получение последнего файла задач
export async function getLatestTaskFile(): Promise<CloudTaskFile | null> {
  try {
    const { data, error } = await supabase
      .from("task_files")
      .select("*")
      .order("uploaded_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("Error loading latest task file:", error);
      return null;
    }

    return {
      id: data.id,
      file_name: data.file_name,
      file_data: data.file_data as unknown as Task[],
      uploaded_at: data.uploaded_at,
    };
  } catch (e) {
    console.error("Error loading latest task file:", e);
    return null;
  }
}

// Удаление файла сделок
export async function deleteDealFile(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("deal_files")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting deal file:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e: any) {
    console.error("Error deleting deal file:", e);
    return { success: false, error: e.message };
  }
}

// Удаление файла задач
export async function deleteTaskFile(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("task_files")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting task file:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e: any) {
    console.error("Error deleting task file:", e);
    return { success: false, error: e.message };
  }
}
