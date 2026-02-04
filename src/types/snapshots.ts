export interface DataSnapshot {
  id: string;
  created_at: string;
  week_start: string;
  week_end: string;
  deals_count: number;
  tasks_count: number;
  deals_data: any[];
  tasks_data: any[];
  metadata: {
    source: 'bitrix24';
    version: string;
    webhook_url?: string;
  };
}

export interface SnapshotSummary {
  id: string;
  created_at: string;
  week_start: string;
  week_end: string;
  deals_count: number;
  tasks_count: number;
}

export interface WeekRange {
  start: string;
  end: string;
  label: string;
}