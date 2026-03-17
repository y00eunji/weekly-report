interface PulseLoaderProps {
  text: string;
}

export const PulseLoader = ({ text }: PulseLoaderProps) => (
  <div className="flex flex-col items-center gap-4 py-10">
    <div className="w-10 h-10 rounded-full border-3 border-gray-200 dark:border-gray-700 border-t-primary animate-spin" />
    <span className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">{text}</span>
  </div>
);
