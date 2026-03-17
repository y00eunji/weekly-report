import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { DateRange } from 'react-day-picker';
import { ko } from 'react-day-picker/locale';

interface DateRangePickerProps {
  dateFrom: string; // YYYY-MM-DD
  dateTo: string;   // YYYY-MM-DD
  onChangeFrom: (value: string) => void;
  onChangeTo: (value: string) => void;
}

const toISO = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const parseDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const formatDisplay = (iso: string) => {
  const d = parseDate(iso);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
};

export function DateRangePicker({ dateFrom, dateTo, onChangeFrom, onChangeTo }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  // 'ready' = 기존 값 표시 중, 'picking-to' = 시작일 선택 완료, 종료일 대기
  const [phase, setPhase] = useState<'ready' | 'picking-to'>('ready');
  const [draft, setDraft] = useState<DateRange | undefined>(undefined);

  const displayed: DateRange | undefined = phase === 'ready'
    ? { from: parseDate(dateFrom), to: parseDate(dateTo) }
    : draft;

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setDraft(undefined);
      setPhase('ready');
    }
  };

  const handleDayClick = (day: Date) => {
    if (phase === 'ready') {
      // 첫 클릭: 기존 값 초기화하고 시작일로 설정
      setDraft({ from: day, to: undefined });
      setPhase('picking-to');
    } else {
      // 두 번째 클릭: 종료일 확정
      const from = draft?.from ?? day;
      const [start, end] = from > day ? [day, from] : [from, day];

      setDraft({ from: start, to: end });
      onChangeFrom(toISO(start));
      onChangeTo(toISO(end));
      setTimeout(() => {
        setOpen(false);
        setDraft(undefined);
        setPhase('ready');
      }, 500);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger
        className="flex items-center gap-2 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
      >
        <CalendarIcon className="size-4 text-gray-400 dark:text-gray-500 shrink-0" />
        <span>{formatDisplay(dateFrom)}</span>
        <span className="text-gray-400 dark:text-gray-500">~</span>
        <span>{formatDisplay(dateTo)}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="range"
          selected={displayed}
          onSelect={() => {/* 내부 range 로직 무시 */}}
          onDayClick={handleDayClick}
          defaultMonth={parseDate(dateFrom)}
          numberOfMonths={2}
          locale={ko}
        />
      </PopoverContent>
    </Popover>
  );
}
