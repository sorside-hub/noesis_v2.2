import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light';

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = 'noesis_theme';

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'dark';
  });

  const applyTheme = (mode: ThemeMode) => {
    try {
      document.documentElement.setAttribute('data-theme', mode);
      if (mode === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem(THEME_STORAGE_KEY, mode);

      // Update meta theme-color dynamically for mobile PWA bar
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', mode === 'dark' ? '#131313' : '#F7F7F8');
      }

      // Update favicon dynamically
      const favicon = document.querySelector('link[rel="icon"]');
      if (favicon) {
        favicon.setAttribute('href', mode === 'dark' ? '/logo-dark-kotak.webp' : '/logo-light-kotak.webp');
      }

      // Update apple-touch-icon dynamically
      const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
      if (appleTouchIcon) {
        appleTouchIcon.setAttribute('href', mode === 'dark' ? '/logo-dark-kotak.webp' : '/logo-light-kotak.webp');
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  return useContext(ThemeContext);
};
