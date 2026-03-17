import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  dark: boolean;
  toggle: () => void;
}

export const ThemeToggle = ({ dark, toggle }: ThemeToggleProps) => (
  <button
    onClick={toggle}
    className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center cursor-pointer shadow-sm hover:shadow-md transition-shadow"
    aria-label="Toggle dark mode"
  >
    {dark ? (
      <Sun size={18} className="text-yellow-400" />
    ) : (
      <Moon size={18} className="text-gray-500" />
    )}
  </button>
);
