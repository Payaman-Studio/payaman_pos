import { useCallback } from 'react';
import { View, ScrollView, StyleSheet, StatusBar, Alert } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTransactionDetail } from '../hooks/useTransactions';
import { RootStackParamList } from '../navigation/types';
import * as dbTransactions from '../database/dbTransactions';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../constants/theme';

type RoutePropType = RouteProp<RootStackParamList, 'TransactionDetail'>;

const formatRupiah = (num: number) => 'Rp ' + num.toLocaleString('id-ID');

const formatDateTime = (dateStr: string) => {
  const d = new Date(dateStr);
  const tgl = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const jam = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${tgl}, ${jam}`;
};

const shortId = (id: string) => '#' + id.slice(0, 7).toUpperCase();

const typeConfig: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  TOKO: { label: 'TOKO', icon: 'store', color: colors.white, bg: colors.gray900 },
  CITIZEN: { label: 'WARGA', icon: 'fruit-grapes', color: colors.white, bg: colors.green600 },
  MIXED: { label: 'CAMPURAN', icon: 'swap-horizontal', color: colors.white, bg: colors.gray900 },
};

function TransactionDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RoutePropType>();
  const insets = useSafeAreaInsets();
  const { transactionId } = route.params;

  const { data: detail, isLoading } = useTransactionDetail(transactionId);

  const handleDelete = useCallback(() => {
    if (!detail) return;
    Alert.alert(
      'Hapus Transaksi',
      `Yakin ingin menghapus transaksi ${shortId(detail.id)}?\n\nStok item akan dikembalikan secara otomatis.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await dbTransactions.removeWithRestore(detail.id);
              navigation.goBack();
            } catch {
              Alert.alert('Gagal', 'Gagal menghapus transaksi');
            }
          },
        },
      ],
    );
  }, [detail, navigation]);

  if (isLoading || !detail) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.black} />
      </View>
    );
  }

  const typeCfg = typeConfig[detail.type] || typeConfig.TOKO;
  const hasInItems = detail.items.some((i) => i.flow_direction === 'IN');
  const changeAmount = detail.total_paid - detail.net_amount;

  return (
    <View style={[styles.safeArea, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.gray50} />
      <ScrollView style={styles.container}>
        {/* Header: Badge tipe + nomor transaksi */}
        <View style={styles.headerSection}>
          <View style={[styles.typeBadge, { backgroundColor: typeCfg.bg }]}>
            <Icon name={typeCfg.icon} size={14} color={typeCfg.color} style={styles.iconMargin} />
            <Text style={[styles.typeBadgeText, { color: typeCfg.color }]}>{typeCfg.label}</Text>
          </View>
          <Text style={styles.transactionId}>{shortId(detail.id)}</Text>
          <Text style={styles.transactionDate}>{formatDateTime(detail.created_at)}</Text>
        </View>

        {/* Dashed separator */}
        <View style={styles.dashedSeparator} />

        {/* Item list */}
        {detail.items.map((item) => (
          <View key={item.id}>
            <View style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <View style={styles.itemNameRow}>
                  {item.flow_direction === 'IN' ? (
                    <Icon name="arrow-down-bold" size={14} color={colors.green600} style={styles.iconMargin} />
                  ) : (
                    <Icon name="arrow-up-bold" size={14} color={colors.gray900} style={styles.iconMargin} />
                  )}
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                </View>
                {item.flow_direction === 'IN' && (
                  <Text style={styles.inLabel}>Beli dari warga</Text>
                )}
              </View>
              <Text style={styles.itemQty}>{item.quantity} × {formatRupiah(item.price_at_sale)}</Text>
              <Text style={[styles.itemSubtotal, item.flow_direction === 'IN' && styles.inSubtotal]}>
                {formatRupiah(item.subtotal)}
              </Text>
            </View>
            <View style={styles.itemDivider} />
          </View>
        ))}

        {/* Dashed separator */}
        <View style={styles.dashedSeparator} />

        {/* Ringkasan */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Penjualan</Text>
            <Text style={styles.summaryValue}>{formatRupiah(detail.total_sales)}</Text>
          </View>

          {hasInItems && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Beli Komoditas</Text>
              <Text style={styles.summaryValue}>{formatRupiah(detail.total_purchases)}</Text>
            </View>
          )}

          <View style={styles.totalNetRow}>
            <Text style={styles.totalNetLabel}>Total Net</Text>
            <Text style={styles.totalNetValue}>{formatRupiah(detail.net_amount)}</Text>
          </View>
        </View>

        {/* Dashed separator */}
        <View style={styles.dashedSeparator} />

        {/* Pembayaran */}
        <View style={styles.paymentSection}>
          <Text style={styles.paymentTitle}>Pembayaran</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Tunai Diterima</Text>
            <Text style={styles.paymentValue}>{formatRupiah(detail.total_paid)}</Text>
          </View>
          {changeAmount >= 0 && (
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Kembalian</Text>
              <Text style={styles.changeValue}>{formatRupiah(changeAmount)}</Text>
            </View>
          )}
        </View>

        {/* Hapus */}
        <Button
          mode="outlined"
          onPress={handleDelete}
          textColor={colors.red500}
          style={styles.deleteButton}
          labelStyle={styles.deleteButtonLabel}
          icon="delete-outline"
        >
          Hapus Transaksi
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  typeBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  transactionId: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  transactionDate: {
    fontSize: fontSize.md,
    color: colors.gray500,
  },
  dashedSeparator: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray300,
    borderStyle: 'dashed',
    marginBottom: spacing.lg,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  itemInfo: {
    flex: 1,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.gray900,
    flex: 1,
  },
  inLabel: {
    fontSize: fontSize.xs,
    color: colors.green600,
    marginTop: 2,
    marginLeft: 18,
  },
  itemQty: {
    fontSize: fontSize.sm,
    color: colors.gray500,
    marginHorizontal: spacing.sm,
  },
  itemSubtotal: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.gray900,
    minWidth: 80,
    textAlign: 'right',
  },
  inSubtotal: {
    color: colors.green600,
  },
  itemDivider: {
    height: 1,
    backgroundColor: colors.gray100,
    marginBottom: spacing.sm,
  },
  summarySection: {
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: fontSize.md,
    color: colors.gray500,
  },
  summaryValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.gray900,
  },
  totalNetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  totalNetLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.gray900,
  },
  totalNetValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.black,
  },
  paymentSection: {
    marginBottom: spacing.xxl,
  },
  paymentTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.gray700,
    marginBottom: spacing.sm,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  paymentLabel: {
    fontSize: fontSize.md,
    color: colors.gray500,
  },
  paymentValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.gray900,
  },
  changeValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.green600,
  },
  iconMargin: {
    marginRight: 4,
  },
  deleteButton: {
    borderColor: colors.red500,
    borderRadius: borderRadius.md,
    height: 48,
    justifyContent: 'center',
  },
  deleteButtonLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.red500,
  },
});

export default TransactionDetailScreen;
