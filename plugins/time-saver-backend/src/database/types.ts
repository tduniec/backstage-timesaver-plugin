import { DateTime } from 'luxon';

export type TemplateTimeSavings = {
  id?: string;
  team: string;
  role: string;
  createdAt: DateTime;
  createdBy: string;
  timeSaved: number;
  templateName: string;
  templateTaskId: string;
  templateTaskStatus: string;
};

export type TemplateTimeSavingsCollection = TemplateTimeSavings[];

export type TemplateTimeSavingsDbRow = {
  id?: string;
  team: string;
  role: string;
  created_at: string;
  created_by: string;
  time_saved: number;
  template_name: string;
  template_task_id: string;
  template_task_status: string;
};

export type TemplateTimeSavingsDistinctRbRow = {
  id?: string;
  team?: string;
  role?: string;
  created_at?: string;
  created_by?: string;
  time_saved?: number;
  template_name?: string;
  template_task_id?: string;
  template_task_status?: string;
};

export type TimeSavedStatisticsDbRow = {
  team?: string;
  template_name?: string;
  time_saved?: string | undefined;
};

export type TimeSavedStatistics = {
  team?: string;
  templateName?: string;
  timeSaved: number;
};

export type GroupSavingsDivisionDbRow = {
  team: string;
  total_time_saved: number;
  percentage: number;
};

export type GroupSavingsDivision = {
  team: string;
  percentage: number;
};

export type RawDbTimeSummary = {
  team?: string;
  template_name?: string;
  date?: string;
  total_time_saved?: number;
};

export type TimeSummary = {
  team?: string;
  templateName?: string;
  date: DateTime;
  totalTimeSaved: number;
};

export type TemplateCountDbRow = {
  count: number;
};

export type TotalTimeSavedDbRow = {
  sum: number;
};

export type IQuery = {
  start?: string;
  end?: string;
};
