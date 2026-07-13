import React, { memo, ReactNode, useMemo } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeView } from '../ui/SafeView';
import { useColors } from '../../hooks/useColors';
import { useThemeStore } from '../../store/themeStore';

interface ScreenWrapperProps {
  children: ReactNode;
}

function ScreenWrapperComponent({ children }: ScreenWrapperProps) {
  const COLORS = useColors();
  const isDark = useThemeStore((s) => s.isDark);
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <SafeView>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={COLORS.background} />
      <View style={styles.content}>{children}</View>
    </SafeView>
  );
}

function createStyles(_COLORS: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    content: {
      flex: 1,
    },
  });
}

export const ScreenWrapper = memo(ScreenWrapperComponent);
