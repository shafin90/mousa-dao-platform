import React, { memo, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useColors } from '../../../hooks/useColors';
import { SPACING, BORDER_RADIUS, FONT_SIZE } from '../../../utils/constants';
import { FONT_SIZE as FONT } from '../../../utils/constants';

interface TripHeaderProps {
  title: string;
  onBack: () => void;
}

function TripHeaderComponent({ title, onBack }: TripHeaderProps) {
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <View style={styles.spacer} />
    </View>
  );
}

function createStyles(COLORS: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.cardBorder,
    },
    backButton: {
      paddingRight: SPACING.sm,
    },
    backText: {
      fontSize: FONT.body,
      color: COLORS.primary,
      fontWeight: '600',
    },
    title: {
      flex: 1,
      fontSize: FONT.headline,
      fontWeight: '700',
      color: COLORS.text,
      textAlign: 'center',
    },
    spacer: {
      width: 60,
    },
  });
}

export const TripHeader = memo(TripHeaderComponent);
