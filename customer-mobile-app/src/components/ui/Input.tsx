import React, { memo, useCallback, useMemo } from 'react';
import {
  TextInput,
  Text,
  View,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { SPACING, BORDER_RADIUS, FONT_SIZE } from '../../utils/constants';
import { useColors } from '../../hooks/useColors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

function InputComponent({ label, error, containerStyle, style, ...props }: InputProps) {
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : null,
          style,
        ]}
        placeholderTextColor={COLORS.textTertiary}
        autoCapitalize="none"
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

function createStyles(COLORS: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      marginBottom: SPACING.md,
    },
    label: {
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
      paddingVertical: SPACING.sm + 4,
      fontSize: FONT_SIZE.body,
      color: COLORS.text,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      height: 48,
    },
    inputError: {
      borderColor: COLORS.error,
    },
    error: {
      fontSize: FONT_SIZE.caption,
      color: COLORS.error,
      marginTop: SPACING.xs,
    },
  });
}

export const Input = memo(InputComponent);
