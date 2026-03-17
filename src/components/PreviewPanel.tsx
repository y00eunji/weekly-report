import { Plus } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { FullReportData } from '../types/report';
import { SortableGroupCard } from './GroupCard';

interface PreviewPanelProps {
  data: FullReportData;
  onUpdate: (
    sectionKey: string,
    groupIdx: number,
    field: string,
    value: string | { itemIdx: number; field: string; value: string },
  ) => void;
  onReorder: (sectionKey: string, fromIndex: number, toIndex: number) => void;
  onReorderItems: (sectionKey: string, groupIdx: number, fromIndex: number, toIndex: number) => void;
}

export const PreviewPanel = ({ data, onUpdate, onReorder, onReorderItems }: PreviewPanelProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const sections = [
    { key: 'this_week' as const, label: '금주 실적', groups: data.this_week || [] },
    { key: 'next_week' as const, label: '차주 계획', groups: data.next_week || [] },
  ];

  const handleGroupDragEnd = (sectionKey: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = Number(String(active.id).split('-').pop());
    const toIndex = Number(String(over.id).split('-').pop());
    onReorder(sectionKey, fromIndex, toIndex);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {sections.map(({ key, label, groups }) => (
        <div key={key} className="min-w-0">
          <div className="text-[13px] font-bold text-primary mb-2.5 tracking-wide">
            {label}
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleGroupDragEnd(key)}
          >
            <SortableContext
              items={groups.map((_, i) => `${key}-group-${i}`)}
              strategy={verticalListSortingStrategy}
            >
              {groups.map((g, gIdx) => (
                <SortableGroupCard
                  key={`${key}-group-${gIdx}`}
                  id={`${key}-group-${gIdx}`}
                  group={g}
                  sectionKey={key}
                  groupIdx={gIdx}
                  onUpdate={onUpdate}
                  onReorderItems={onReorderItems}
                />
              ))}
            </SortableContext>
          </DndContext>
          <button
            onClick={() => onUpdate(key, 0, 'add_group', '')}
            className="w-full py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-white/15 bg-transparent text-gray-400 dark:text-gray-500 text-xs font-medium cursor-pointer hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus size={14} />
            그룹 추가
          </button>
        </div>
      ))}
    </div>
  );
};
