import { useApp } from '../context/AppContext';

export const useTheme = () => {
  const { theme, toggleTheme } = useApp();
  return {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
  };
};
