import { Plus, GripVertical, X } from 'lucide-react';
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
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ReportGroup, ReportItem, SectionKey } from '../types/report';
import { StatusBadge } from './StatusBadge';

interface GroupCardProps {
  group: ReportGroup;
  sectionKey: SectionKey;
  groupIdx: number;
  onUpdate: (
    sectionKey: SectionKey,
    groupIdx: number,
    field: string,
    value: string | { itemIdx: number; field: keyof ReportItem; value: string },
  ) => void;
  onReorderItems: (sectionKey: SectionKey, groupIdx: number, fromIndex: number, toIndex: number) => void;
}

// Sortable item row
const SortableItem = ({
  id,
  item,
  itemIdx,
  onItemChange,
  onDeleteItem,
}: {
  id: string;
  item: ReportItem;
  itemIdx: number;
  onItemChange: (itemIdx: number, field: keyof ReportItem, value: string) => void;
  onDeleteItem: (itemIdx: number) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="group/item flex items-center gap-1 mb-1 pl-1">
      <button
        {...attributes}
        {...listeners}
        className="border-none bg-transparent text-gray-300 dark:text-gray-600 cursor-grab active:cursor-grabbing p-0 shrink-0 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
      >
        <GripVertical size={12} />
      </button>
      <input
        value={item.text}
        onChange={(e) => onItemChange(itemIdx, 'text', e.target.value)}
        placeholder="내용을 입력하세요"
        className="flex-1 min-w-0 border-none bg-transparent text-xs text-gray-600 dark:text-gray-300 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600"
      />
      <button
        onClick={() =>
          onItemChange(itemIdx, 'status', item.status === '완료' ? '진행중' : '완료')
        }
        className="border-none bg-none cursor-pointer p-0 shrink-0"
      >
        <StatusBadge status={item.status} />
      </button>
      <button
        onClick={() => onDeleteItem(itemIdx)}
        className="border-none bg-transparent text-gray-300 dark:text-gray-600 cursor-pointer p-0 shrink-0 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover/item:opacity-100"
      >
        <X size={12} />
      </button>
    </div>
  );
};

// Sortable group wrapper (used by PreviewPanel)
export const SortableGroupCard = ({
  id,
  ...props
}: GroupCardProps & { id: string }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <GroupCard {...props} dragHandleProps={{ attributes, listeners }} />
    </div>
  );
};

import type { DraggableAttributes } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';

interface DragHandleProps {
  attributes: DraggableAttributes;
  listeners: SyntheticListenerMap | undefined;
}

const GroupCard = ({
  group,
  sectionKey,
  groupIdx,
  onUpdate,
  onReorderItems,
  dragHandleProps,
}: GroupCardProps & { dragHandleProps?: DragHandleProps }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(sectionKey, groupIdx, 'group_title', e.target.value);
  };

  const handleItemChange = (itemIdx: number, field: keyof ReportItem, value: string) => {
    onUpdate(sectionKey, groupIdx, 'item', { itemIdx, field, value });
  };

  const handleDeleteItem = (itemIdx: number) => {
    onUpdate(sectionKey, groupIdx, 'delete_item', { itemIdx, field: 'text', value: '' });
  };

  const handleItemDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = Number(String(active.id).split('-').pop());
    const toIndex = Number(String(over.id).split('-').pop());
    onReorderItems(sectionKey, groupIdx, fromIndex, toIndex);
  };

  return (
    <div className="group/card mb-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
      <div className="flex items-center gap-1 mb-2">
        {dragHandleProps && (
          <button
            {...dragHandleProps.attributes}
            {...dragHandleProps.listeners}
            className="border-none bg-transparent text-gray-300 dark:text-gray-600 cursor-grab active:cursor-grabbing p-0 shrink-0 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
          >
            <GripVertical size={14} />
          </button>
        )}
        <input
          value={group.group_title}
          onChange={handleTitleChange}
          className="w-full border-none bg-transparent text-[13px] font-bold text-gray-900 dark:text-gray-100 outline-none"
        />
        <button
          onClick={() => onUpdate(sectionKey, groupIdx, 'delete_group', '')}
          className="border-none bg-transparent text-gray-300 dark:text-gray-600 cursor-pointer p-0 shrink-0 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover/card:opacity-100"
        >
          <X size={14} />
        </button>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleItemDragEnd}
      >
        <SortableContext
          items={group.items.map((_, i) => `${sectionKey}-${groupIdx}-item-${i}`)}
          strategy={verticalListSortingStrategy}
        >
          {group.items.map((item, iIdx) => (
            <SortableItem
              key={`${sectionKey}-${groupIdx}-item-${iIdx}`}
              id={`${sectionKey}-${groupIdx}-item-${iIdx}`}
              item={item}
              itemIdx={iIdx}
              onItemChange={handleItemChange}
              onDeleteItem={handleDeleteItem}
            />
          ))}
        </SortableContext>
      </DndContext>
      <button
        onClick={() => onUpdate(sectionKey, groupIdx, 'add_item', '')}
        className="mt-1.5 pl-2 border-none bg-transparent text-gray-400 dark:text-gray-500 text-[11px] cursor-pointer hover:text-primary transition-colors flex items-center gap-1"
      >
        <Plus size={12} />
        항목 추가
      </button>
    </div>
  );
};
