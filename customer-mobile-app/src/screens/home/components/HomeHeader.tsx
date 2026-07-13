import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SPACING, FONT_SIZE } from '../../../utils/constants';
import { useColors } from '../../../hooks/useColors';

function HomeHeaderComponent() {
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Good morning</Text>
      <Text style={styles.title}>Where would you like to go?</Text>
    </View>
  );
}

function createStyles(COLORS: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: SPACING.md,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.sm,
    },
    greeting: {
      fontSize: FONT_SIZE.body,
      color: COLORS.textSecondary,
      marginBottom: SPACING.xs,
    },
    title: {
      fontSize: FONT_SIZE.title + 2,
      fontWeight: '700',
      color: COLORS.text,
    },
  });
}

export const HomeHeader = memo(HomeHeaderComponent);
