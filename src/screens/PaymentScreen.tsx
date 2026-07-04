import { useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../constants/theme';
import { RootStackParamList } from '../navigation/types';
import { NumericKeypad } from '../components/cashier/NumericKeypad';
import { useCashierContext } from '../contexts/CashierContext';

function parseCashValue(raw: string): number {
  return parseInt(raw.replace(/[^0-9]/g, ''), 10) || 0;
}

const QUICK_AMOUNTS = [10000, 20000, 50000, 100000];

function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    finalAmount,
    cashReceived,
    setCashReceived,
    checkout,
    isSubmitting,
  } = useCashierContext();

  const currentValue = parseCashValue(cashReceived);
  const isSufficient = currentValue >= finalAmount;

  const handleNumpadPress = useCallback(
    (key: string) => {
      setCashReceived((prev: string) => {
        if (key === 'backspace') {
          const next = prev.slice(0, -1);
          return next === '' ? '' : next;
        }
        if (key === '000') return prev === '' ? '' : prev + '000';
        return prev + key;
      });
    },
    [setCashReceived],
  );

  const handleAddAmount = (amount: number) => {
    const next = currentValue + amount;
    setCashReceived(String(next));
  };

  const handleConfirm = async () => {
    try {
      await checkout();
      navigation.goBack();
    } catch {
      // checkout handles its own feedback
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Pembayaran Tunai</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.closeBtn}>Batal</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.totalLabel}>TOTAL TAGIHAN</Text>
        <Text style={styles.totalAmount}>
          Rp {finalAmount.toLocaleString('id-ID')}
        </Text>

        <Text style={styles.sectionLabel}>NOMINAL TUNAI</Text>
        <View style={styles.quickRow}>
          {QUICK_AMOUNTS.map(amount => (
            <TouchableOpacity
              key={amount}
              style={styles.quickChip}
              onPress={() => handleAddAmount(amount)}
              activeOpacity={0.7}
            >
              <Text style={styles.quickChipText}>
                {amount.toLocaleString('id-ID')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.cashDisplay} activeOpacity={0.8}>
          <Text style={styles.cashDisplayText}>
            Rp {currentValue.toLocaleString('id-ID')}
          </Text>
        </TouchableOpacity>

        <NumericKeypad onPress={handleNumpadPress} />

        <View style={[styles.changeRow, !isSufficient && styles.changeRowInsufficient]}>
          <Text style={[styles.changeLabel, !isSufficient && styles.changeLabelInsufficient]}>
            {isSufficient ? 'KEMBALIAN' : 'KURANG'}
          </Text>
          <Text style={[styles.changeValue, !isSufficient && styles.changeValueInsufficient]}>
            Rp {Math.abs(currentValue - finalAmount).toLocaleString('id-ID')}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handleConfirm}
          disabled={!isSufficient || isSubmitting}
          loading={isSubmitting}
          style={[
            styles.confirmBtn,
            !isSufficient && styles.confirmBtnDisabled,
          ]}
          labelStyle={styles.confirmBtnLabel}
        >
          {isSufficient ? 'Konfirmasi Pembayaran' : 'Nominal Belum Cukup'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.extrabold,
    color: colors.gray900,
  },
  closeBtn: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray500,
  },
  totalLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.gray500,
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: fontWeight.black,
    color: colors.gray900,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.gray500,
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  quickChip: {
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.gray150,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  quickChipText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.gray900,
  },
  cashDisplay: {
    height: 60,
    borderWidth: 2,
    borderColor: colors.gray200,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  cashDisplayText: {
    fontSize: 28,
    fontWeight: fontWeight.extrabold,
    color: colors.gray900,
    textAlign: 'center',
  },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.green50,
    borderRadius: borderRadius.lg,
  },
  changeRowInsufficient: {
    backgroundColor: colors.red50,
  },
  changeLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.extrabold,
    color: colors.green600,
  },
  changeLabelInsufficient: {
    color: colors.red500,
  },
  changeValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    color: colors.green700,
  },
  changeValueInsufficient: {
    color: colors.red500,
  },
  footer: {
    paddingTop: spacing.md + 2,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    marginTop: spacing.md,
  },
  confirmBtn: {
    backgroundColor: colors.darkGreen,
    borderRadius: borderRadius.lg,
    height: 52,
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: colors.gray400,
  },
  confirmBtnLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.white,
  },
});

export default PaymentScreen;
