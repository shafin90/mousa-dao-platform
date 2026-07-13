import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SPACING, BORDER_RADIUS, FONT_SIZE } from '../../../utils/constants';
import { useColors } from '../../../hooks/useColors';

interface QRCodeViewProps {
  value: string;
  size?: number;
}

function QRCodeViewComponent({ value, size = 180 }: QRCodeViewProps) {
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <View style={styles.container}>
      <QRCode
        value={value}
        size={size}
        backgroundColor={COLORS.whiteText}
        color={COLORS.black}
      />
      <Text style={styles.scanText}>Show this code to the conductor</Text>
    </View>
  );
}

function createStyles(COLORS: ReturnType<typeof useColors>) {
  return StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.md,
  },
  scanText: {
    fontSize: FONT_SIZE.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
});
}

export const QRCodeView = memo(QRCodeViewComponent);
