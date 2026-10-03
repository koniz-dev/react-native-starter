import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/Colors';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return props[colorScheme] ?? Colors[colorScheme][colorName];
}
