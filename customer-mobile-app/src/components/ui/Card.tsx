import React, { memo, ReactNode, useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SPACING, BORDER_RADIUS } from '../../utils/constants';
import { useColors } from '../../hooks/useColors';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
}

function CardComponent({ children, style }: CardProps) {
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return <View style={[styles.card, style]}>{children}</View>;
}

function createStyles(COLORS: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    card: {
      backgroundColor: COLORS.white,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
    },
  });
}

export const Card = memo(CardComponent);
