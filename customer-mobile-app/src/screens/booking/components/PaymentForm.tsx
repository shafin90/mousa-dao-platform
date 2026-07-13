import React, { memo, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useColors } from '../../../hooks/useColors';
import { SPACING, BORDER_RADIUS, FONT_SIZE } from '../../../utils/constants';

const PAYMENT_METHODS = [
  { id: 'credit_card' as const, label: 'Credit Card', icon: '💳' },
  { id: 'debit_card' as const, label: 'Debit Card', icon: '🏦' },
  { id: 'mobile_wallet' as const, label: 'Mobile Wallet', icon: '📱' },
  { id: 'cash' as const, label: 'Cash', icon: '💵' },
];

interface PaymentFormProps {
  selectedMethod: string;
  onSelectMethod: (method: string) => void;
  onPay: () => void;
  totalAmount: number;
  isProcessing: boolean;
}

function PaymentFormComponent({
  selectedMethod,
  onSelectMethod,
  onPay,
  totalAmount,
  isProcessing,
}: PaymentFormProps) {
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Method</Text>

      <View style={styles.methods}>
        {PAYMENT_METHODS.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.methodCard,
              selectedMethod === method.id && styles.methodCardActive,
            ]}
            onPress={() => onSelectMethod(method.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.methodIcon}>{method.icon}</Text>
            <Text style={[
              styles.methodLabel,
              selectedMethod === method.id && styles.methodLabelActive,
            ]}>
              {method.label}
            </Text>
            {selectedMethod === method.id && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
        onPress={onPay}
        disabled={isProcessing}
        activeOpacity={0.7}
      >
        <Text style={styles.payButtonText}>
          {isProcessing ? 'Processing...' : `Pay CFA ${totalAmount.toLocaleString()}`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function createStyles(COLORS: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      padding: SPACING.md,
    },
    title: {
      fontSize: FONT_SIZE.headline,
      fontWeight: '700',
      color: COLORS.text,
      marginBottom: SPACING.md,
    },
    methods: {
      gap: SPACING.sm,
      marginBottom: SPACING.lg,
    },
    methodCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.sm,
      backgroundColor: COLORS.white,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
    },
    methodCardActive: {
      borderColor: COLORS.primary,
      backgroundColor: COLORS.primaryLight,
    },
    methodIcon: {
      fontSize: 24,
      marginRight: SPACING.sm,
    },
    methodLabel: {
      flex: 1,
      fontSize: FONT_SIZE.body,
      fontWeight: '600',
      color: COLORS.text,
    },
    methodLabelActive: {
      color: COLORS.primary,
    },
    checkmark: {
      fontSize: FONT_SIZE.headline,
      color: COLORS.primary,
      fontWeight: '700',
    },
    payButton: {
      backgroundColor: COLORS.primary,
      borderRadius: BORDER_RADIUS.sm,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
    },
    payButtonDisabled: {
      opacity: 0.6,
    },
    payButtonText: {
      fontSize: FONT_SIZE.headline,
      fontWeight: '700',
      color: COLORS.whiteText,
    },
  });
}

export const PaymentForm = memo(PaymentFormComponent);
