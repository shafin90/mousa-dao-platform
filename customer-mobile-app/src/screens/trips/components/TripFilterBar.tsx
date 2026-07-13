import React, { memo, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useColors } from '../../../hooks/useColors';
import { SPACING, BORDER_RADIUS, FONT_SIZE } from '../../../utils/constants';

const SORT_OPTIONS = ['Price', 'Departure', 'Arrival'] as const;

interface TripFilterBarProps {
  activeSort: string;
  onSortChange: (sort: string) => void;
}

function TripFilterBarComponent({ activeSort, onSortChange }: TripFilterBarProps) {
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Sort by:</Text>
      <View style={styles.options}>
        {SORT_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.chip, activeSort === option && styles.chipActive]}
            onPress={() => onSortChange(option)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, activeSort === option && styles.chipTextActive]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
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
    label: {
      fontSize: FONT_SIZE.caption,
      color: COLORS.textSecondary,
      marginRight: SPACING.sm,
      fontWeight: '600',
    },
    options: {
      flexDirection: 'row',
      gap: SPACING.sm,
    },
    chip: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs + 2,
      borderRadius: BORDER_RADIUS.sm,
      backgroundColor: COLORS.card,
    },
    chipActive: {
      backgroundColor: COLORS.primary,
    },
    chipText: {
      fontSize: FONT_SIZE.caption,
      fontWeight: '600',
      color: COLORS.textSecondary,
    },
    chipTextActive: {
      color: COLORS.whiteText,
    },
  });
}

export const TripFilterBar = memo(TripFilterBarComponent);
