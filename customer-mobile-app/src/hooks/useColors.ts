import { useThemeStore } from '../store/themeStore';
import { lightColors, darkColors } from '../utils/constants';

export function useColors() {
  const isDark = useThemeStore((s) => s.isDark);
  return isDark ? darkColors : lightColors;
}
