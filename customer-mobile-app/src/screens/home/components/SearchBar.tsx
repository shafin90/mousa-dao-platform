import React, { memo, useCallback, useMemo, useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SPACING, BORDER_RADIUS, FONT_SIZE } from '../../../utils/constants';
import { useColors } from '../../../hooks/useColors';

interface SearchBarProps {
  onSearch: (origin: string, destination: string) => void;
}

function SearchBarComponent({ onSearch }: SearchBarProps) {
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');

  const handleSearch = useCallback(() => {
    if (origin.trim() && destination.trim()) {
      onSearch(origin.trim(), destination.trim());
    }
  }, [origin, destination, onSearch]);

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>From</Text>
          <TextInput
            style={styles.input}
            value={origin}
            onChangeText={setOrigin}
            placeholder="Departure City"
            placeholderTextColor={COLORS.textTertiary}
          />
        </View>
        <View style={styles.swapContainer}>
          <Text style={styles.swapIcon}>⇄</Text>
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>To</Text>
          <TextInput
            style={styles.input}
            value={destination}
            onChangeText={setDestination}
            placeholder="Arrival City"
            placeholderTextColor={COLORS.textTertiary}
          />
        </View>
      </View>
      <TouchableOpacity
        style={[styles.searchButton, (!origin.trim() || !destination.trim()) && styles.searchButtonDisabled]}
        onPress={handleSearch}
        disabled={!origin.trim() || !destination.trim()}
        activeOpacity={0.7}
      >
        <Text style={styles.searchButtonText}>Search Buses</Text>
      </TouchableOpacity>
    </View>
  );
}

function createStyles(COLORS: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.sm,
    },
    inputContainer: {
      flex: 1,
    },
    inputLabel: {
      fontSize: FONT_SIZE.caption,
      fontWeight: '600',
      color: COLORS.textSecondary,
      marginBottom: SPACING.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    input: {
      backgroundColor: COLORS.card,
      borderRadius: BORDER_RADIUS.sm,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm + 2,
      fontSize: FONT_SIZE.body,
      color: COLORS.text,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      height: 44,
    },
    swapContainer: {
      paddingHorizontal: SPACING.sm,
      paddingTop: SPACING.md + SPACING.xs,
    },
    swapIcon: {
      fontSize: 20,
      color: COLORS.primary,
    },
    searchButton: {
      backgroundColor: COLORS.primary,
      borderRadius: BORDER_RADIUS.sm,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchButtonDisabled: {
      opacity: 0.5,
    },
    searchButtonText: {
      color: COLORS.whiteText,
      fontSize: FONT_SIZE.headline,
      fontWeight: '600',
    },
  });
}

export const SearchBar = memo(SearchBarComponent);
