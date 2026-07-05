import { FlatList, View, StyleSheet } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { CartItemCard } from './CartItemCard';
import type { CartItem } from '../../hooks/useCashier';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
} from '../../constants/theme';

interface CartPanelProps {
  cartItems: CartItem[];
  formatRupiah: (num: number) => string;
  updateQuantity: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  onEditCommodity: (item: CartItem) => void;
  totalSales: number;
  totalPurchases: number;
  finalAmount: number;
  cashReceived: string;
  setCashReceived: (val: string) => void;
  isWarungPay: boolean;
  isSubmitting: boolean;
  handleCheckout: () => void;
  handleOpenPayment: () => void;
}

export function CartPanel({
  cartItems,
  formatRupiah,
  updateQuantity,
  removeFromCart,
  onEditCommodity,
  totalSales,
  totalPurchases,
  finalAmount,
  cashReceived,
  setCashReceived,
  isWarungPay,
  isSubmitting,
  handleCheckout,
  handleOpenPayment,
}: CartPanelProps) {
  return (
    <View style={styles.container}>
      <View style={styles.cartHeaderRow}>
        <Text style={styles.cartHeaderTitle}>KERANJANG TRANSAKSI</Text>
        <Text style={styles.cartHeaderCount}>
          {cartItems.length} ITEM
        </Text>
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyCartContainer}>
          <Icon name="cart-outline" size={48} color={colors.gray300} />
          <Text style={styles.emptyCartText}>
            Keranjang belanja kosong
          </Text>
        </View>
      ) : (
        <FlatList
          data={cartItems}
          renderItem={({ item }) => (
            <CartItemCard
              item={item}
              formatRupiah={formatRupiah}
              onUpdateQuantity={updateQuantity}
              onRemove={removeFromCart}
              onEditCommodity={onEditCommodity}
            />
          )}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.cartList}
        />
      )}

      {cartItems.length > 0 && (
        <View style={styles.summaryContainer}>
          {totalPurchases > 0 && totalSales > 0 && (
            <>
              {totalSales > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Belanja</Text>
                  <Text style={styles.summaryValue}>
                    {formatRupiah(totalSales)}
                  </Text>
                </View>
              )}

              {totalPurchases > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    Total Beli Komoditas
                  </Text>
                  <Text style={[styles.summaryValue, styles.textGreen]}>
                    {formatRupiah(-totalPurchases)}
                  </Text>
                </View>
              )}
            </>
          )}

          <View style={styles.netAmountRow}>
            <View style={styles.netLabelLeft}>
              {isWarungPay && (
                <Icon
                  name="information-outline"
                  size={20}
                  color={colors.red500}
                  style={styles.infoIcon}
                />
              )}
              <Text
                style={
                  isWarungPay
                    ? styles.payStatusRed
                    : styles.payStatusBlack
                }
              >
                {isWarungPay ? 'WARUNG HARUS BAYAR' : 'TOTAL'}
              </Text>
            </View>
            <Text
              style={[
                styles.netAmountVal,
                isWarungPay ? styles.textRed : styles.textBlack,
              ]}
            >
              {formatRupiah(finalAmount)}
            </Text>
          </View>

          {isWarungPay && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tunai Diserahkan</Text>
              <TextInput
                selectTextOnFocus
                value={cashReceived}
                onChangeText={setCashReceived}
                keyboardType="numeric"
                mode="outlined"
                outlineColor={colors.gray300}
                activeOutlineColor={colors.black}
                style={styles.cashInput}
                contentStyle={styles.cashInputContent}
                left={
                  <TextInput.Affix
                    text="Rp "
                    textStyle={styles.affixStyle}
                  />
                }
              />
            </View>
          )}

          <View style={styles.divider} />

          <Button
            mode="contained"
            icon={isWarungPay ? 'cash-multiple' : 'cash-register'}
            onPress={isWarungPay ? handleCheckout : handleOpenPayment}
            disabled={isSubmitting}
            loading={isSubmitting}
            style={[
              styles.checkoutBtn,
              isWarungPay
                ? styles.checkoutBtnGreen
                : styles.checkoutBtnBlack,
            ]}
            labelStyle={styles.checkoutBtnLabel}
          >
            {isWarungPay
              ? 'Serahkan Uang ke Pelanggan'
              : 'Terima Pembayaran'}
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray100,
  },
  cartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  cartHeaderTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.extrabold,
    color: colors.gray500,
    letterSpacing: 0.5,
  },
  cartHeaderCount: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.extrabold,
    color: colors.gray600,
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyCartText: {
    color: colors.gray400,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  cartList: {
    gap: 10,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  summaryContainer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: fontSize.md,
    color: colors.gray600,
    fontWeight: fontWeight.medium,
  },
  summaryValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.gray900,
  },
  divider: {
    height: 0.5,
    backgroundColor: colors.gray200,
    marginVertical: spacing.sm,
  },
  cashInput: {
    width: 120,
    backgroundColor: colors.white,
    height: 36,
  },
  cashInputContent: {
    paddingHorizontal: spacing.sm,
    fontSize: fontSize.md,
    textAlign: 'right',
  },
  affixStyle: {
    fontSize: fontSize.md,
  },
  netAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  netLabelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: spacing.sm - 2,
  },
  payStatusRed: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.extrabold,
    color: colors.red500,
  },
  payStatusBlack: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.extrabold,
    color: colors.gray900,
  },
  netAmountVal: {
    fontSize: fontSize.price,
    fontWeight: fontWeight.black,
  },
  textRed: {
    color: colors.red500,
  },
  textBlack: {
    color: colors.gray900,
  },
  textGreen: {
    color: colors.green600,
  },
  checkoutBtn: {
    borderRadius: borderRadius.md,
    height: 48,
    justifyContent: 'center',
  },
  checkoutBtnGreen: {
    backgroundColor: colors.darkGreen,
  },
  checkoutBtnBlack: {
    backgroundColor: colors.black,
  },
  checkoutBtnLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.white,
  },
});
