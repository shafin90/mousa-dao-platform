import React, { memo, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useColors } from '../../../hooks/useColors';
import { SPACING, BORDER_RADIUS, FONT_SIZE } from '../../../utils/constants';

interface TripDetailHeaderProps {
  origin: string;
  destination: string;
  onBack: () => void;
}

function TripDetailHeaderComponent({ origin, destination, onBack }: TripDetailHeaderProps) {
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <View style={styles.routeContainer}>
        <Text style={styles.route}>{origin}</Text>
        <Text style={styles.arrow}>→</Text>
        <Text style={styles.route}>{destination}</Text>
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
      paddingVertical: SPACING.sm + 4,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.cardBorder,
    },
    backButton: {
      paddingRight: SPACING.sm,
    },
    backText: {
      fontSize: FONT_SIZE.body,
      color: COLORS.primary,
      fontWeight: '600',
    },
    routeContainer: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    route: {
      fontSize: FONT_SIZE.headline,
      fontWeight: '700',
      color: COLORS.text,
    },
    arrow: {
      fontSize: FONT_SIZE.title,
      color: COLORS.textSecondary,
    },
  });
}

export const TripDetailHeader = memo(TripDetailHeaderComponent);
