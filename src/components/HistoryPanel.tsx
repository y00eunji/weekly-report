import { Clock, Trash2, Edit3 } from 'lucide-react';
import type { SavedReport } from '../types/report';

interface HistoryPanelProps {
  history: SavedReport[];
  onLoad: (report: SavedReport) => void;
  onDelete: (id: string) => void;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${mins}`;
};

export const HistoryPanel = ({ history, onLoad, onDelete }: HistoryPanelProps) => {
  if (history.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-gray-400 dark:text-gray-500">
        저장된 보고서가 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {history.map((report) => {
        const groupCount =
          (report.data.this_week?.length || 0) + (report.data.next_week?.length || 0);
        return (
          <div
            key={report.id}
            className="group flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-primary/40 transition-colors"
          >
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onLoad(report)}>
              <div className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 truncate">
                {report.data.name || '이름 없음'} — {report.data.date}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                <Clock size={10} />
                {formatDate(report.updatedAt)}
                <span className="text-gray-300 dark:text-gray-600">|</span>
                그룹 {groupCount}개
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onLoad(report)}
                className="p-1.5 rounded-lg border-none bg-transparent text-gray-400 hover:text-primary cursor-pointer transition-colors"
                title="불러오기"
              >
                <Edit3 size={14} />
              </button>
              <button
                onClick={() => onDelete(report.id)}
                className="p-1.5 rounded-lg border-none bg-transparent text-gray-400 hover:text-red-500 cursor-pointer transition-colors"
                title="삭제"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
