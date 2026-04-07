export interface ReportItem {
  text: string;
  status: '완료' | '진행중';
}

export interface ReportGroup {
  group_title: string;
  items: ReportItem[];
}

export type SectionKey = 'this_week' | 'next_week';

export interface ParsedReport {
  this_week: ReportGroup[];
  next_week: ReportGroup[];
}

export interface FullReportData extends ParsedReport {
  name: string;
  date: string;
}

export type Phase = 'idle' | 'parsing' | 'preview' | 'generating' | 'done' | 'error';

export interface SavedReport {
  id: string;
  data: FullReportData;
  createdAt: string;
  updatedAt: string;
}
