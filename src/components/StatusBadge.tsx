interface StatusBadgeProps {
  status: '완료' | '진행중';
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const isComplete = status === '완료';
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${
        isComplete
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      }`}
    >
      {status}
    </span>
  );
};
