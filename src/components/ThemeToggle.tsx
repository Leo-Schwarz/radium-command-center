import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] text-gray-500 dark:text-white/40 hover:text-gray-800 dark:hover:text-white/70 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors border border-transparent hover:border-gray-200 dark:hover:border-white/[0.08]"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
}
