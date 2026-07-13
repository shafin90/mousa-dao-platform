import React, { memo, ReactNode, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '../../hooks/useColors';

interface SafeViewProps {
  children: ReactNode;
}

function SafeViewComponent({ children }: SafeViewProps) {
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      {children}
    </SafeAreaView>
  );
}

function createStyles(COLORS: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
  });
}

export const SafeView = memo(SafeViewComponent);
