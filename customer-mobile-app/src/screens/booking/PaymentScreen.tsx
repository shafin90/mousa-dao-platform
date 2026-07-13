import React, { memo, useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePayment } from '../../hooks/usePayment';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { PaymentForm } from './components/PaymentForm';
import { useColors } from '../../hooks/useColors';
import { SPACING, BORDER_RADIUS, FONT_SIZE } from '../../utils/constants';
import { formatCurrency } from '../../utils/format';

function PaymentScreen() {
  const navigation = useNavigation<any>();
  const { booking, isProcessing, processPayment } = usePayment();
  const [selectedMethod, setSelectedMethod] = useState('credit_card');
  const [success, setSuccess] = useState(false);
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const handlePay = useCallback(async () => {
    const result = await processPayment(selectedMethod as any);
    if (result) {
      setSuccess(true);
      setTimeout(() => {
        navigation.navigate('MainTabs', { screen: 'TicketsTab' });
      }, 1500);
    }
  }, [processPayment, selectedMethod, navigation]);

  const totalAmount = useMemo(() => booking?.totalPrice ?? 0, [booking?.totalPrice]);

  if (success) {
    return (
      <ScreenWrapper>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successSubtitle}>
            Your booking has been confirmed. Check your tickets.
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={styles.title}>Payment</Text>
        <Text style={styles.subtitle}>Complete your booking</Text>
      </View>

      {booking && (
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            Booking #{booking.id.slice(-6).toUpperCase()}
          </Text>
          <Text style={styles.summaryAmount}>
            {formatCurrency(totalAmount)}
          </Text>
        </View>
      )}

      <PaymentForm
        selectedMethod={selectedMethod}
        onSelectMethod={setSelectedMethod}
        onPay={handlePay}
        totalAmount={totalAmount}
        isProcessing={isProcessing}
      />
    </ScreenWrapper>
  );
}

function createStyles(COLORS: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    header: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.cardBorder,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: COLORS.text,
    },
    subtitle: {
      fontSize: 15,
      color: COLORS.textSecondary,
      marginTop: SPACING.xs,
    },
    summary: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      backgroundColor: COLORS.card,
      marginHorizontal: SPACING.md,
      marginTop: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
    },
    summaryText: {
      fontSize: FONT_SIZE.body,
      color: COLORS.textSecondary,
    },
    summaryAmount: {
      fontSize: FONT_SIZE.title,
      fontWeight: '700',
      color: COLORS.text,
    },
    successContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.xl,
    },
    successIcon: {
      fontSize: 64,
      color: COLORS.success,
      marginBottom: SPACING.md,
      fontWeight: '700',
    },
    successTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: COLORS.text,
      marginBottom: SPACING.sm,
    },
    successSubtitle: {
      fontSize: 15,
      color: COLORS.textSecondary,
      textAlign: 'center',
    },
  });
}

export default memo(PaymentScreen);
