import React, { memo, useCallback, useMemo } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { SPACING, BORDER_RADIUS, FONT_SIZE } from '../../utils/constants';
import { useColors } from '../../hooks/useColors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

function ButtonComponent({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const handlePress = useCallback(() => {
    if (!disabled && !loading) onPress();
  }, [disabled, loading, onPress]);

  const bgColor = variant === 'primary' ? COLORS.primary
    : variant === 'secondary' ? COLORS.card
    : variant === 'danger' ? COLORS.error
    : 'transparent';

  const txtColor = variant === 'primary' || variant === 'danger' ? COLORS.whiteText
    : variant === 'secondary' ? COLORS.text
    : COLORS.primary;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        { backgroundColor: disabled ? COLORS.card : bgColor },
        variant === 'ghost' && styles.ghost,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={txtColor} size="small" />
      ) : (
        <Text style={[styles.text, { color: disabled ? COLORS.textTertiary : txtColor }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function createStyles(COLORS: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    base: {
      paddingVertical: SPACING.sm + 4,
      paddingHorizontal: SPACING.lg,
      borderRadius: BORDER_RADIUS.sm,
      alignItems: 'center',
      justifyContent: 'center',
      height: 48,
    },
    ghost: {
      borderWidth: 0,
    },
    text: {
      fontSize: FONT_SIZE.headline,
      fontWeight: '600',
    },
  });
}

export const Button = memo(ButtonComponent);
