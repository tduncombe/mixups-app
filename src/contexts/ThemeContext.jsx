import React, { createContext, useContext, useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

/**
 * ==========================================
 * THEME CONTEXT
 * ==========================================
 */
const ThemeContext = createContext({ isDark: false, toggle: () => {} });

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('mixups_theme');
    return saved ? JSON.parse(saved) : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('mixups_theme', JSON.stringify(isDark));
  }, [isDark]);

  const toggle = () => setIsDark(p => !p);

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      <div className={isDark ? "dark" : ""}>
        <div className="min-h-screen transition-colors duration-200 bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900">
          {children}
        </div>
      </div>
    </ThemeContext.Provider>
  );
};

export const ThemeToggle = () => {
  const { isDark, toggle } = useContext(ThemeContext);
  return (
    <button
      onClick={toggle}
      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
      title="Toggle Dark Mode"
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
};
