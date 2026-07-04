import { useCallback } from 'react';
import { View, FlatList, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';

import { Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRecentTransactions, TransactionWithDetails } from '../hooks/useTransactions';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../constants/theme';

const formatRupiah = (num: number) => {
  return 'Rp ' + num.toLocaleString('id-ID');
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const tgl = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  const jam = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${tgl} ${jam}`;
};

const shortId = (id: string) => {
  return '#' + id.slice(0, 7).toUpperCase();
};

const typeIcons: Record<string, { icon: string; color: string }> = {
  TOKO: { icon: 'store', color: colors.gray900 },
  CITIZEN: { icon: 'fruit-grapes', color: colors.green600 },
  MIXED: { icon: 'swap-horizontal', color: colors.gray900 },
};

function TransactionListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data: transactions } = useRecentTransactions(50);

  const renderTransactionItem = useCallback(
    ({ item }: { item: TransactionWithDetails }) => {
      const isCitizen = item.type === 'CITIZEN' || item.type === 'MIXED';
      const tagLabel = item.type === 'CITIZEN' ? 'WARGA' : item.type === 'MIXED' ? 'CAMPURAN' : 'TOKO';
      const iconCfg = typeIcons[item.type] || typeIcons.TOKO;

      return (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('TransactionDetail', { transactionId: item.id })}
        >
          <View style={[styles.card, isCitizen ? styles.greenBorderLeft : null]}>
            <View style={styles.cardTop}>
              <View style={styles.tagRow}>
                <View style={[styles.typeIconCircle, { backgroundColor: iconCfg.color + '20' }]}>
                  <Icon name={iconCfg.icon} size={14} color={iconCfg.color} />
                </View>
                <Text style={styles.transactionId}>{shortId(item.id)}</Text>
                <Text style={isCitizen ? styles.tagCitizen : styles.tagToko}>
                  {tagLabel}
                </Text>
              </View>
              <Text style={styles.netAmount}>{formatRupiah(item.net_amount)}</Text>
            </View>
            <Text style={styles.meta}>
              {formatDate(item.created_at)} &bull; {item.itemCount} Item
              {item.itemNames ? ` (${item.itemNames})` : ''}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [navigation],
  );

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.gray50} />

      {!transactions || transactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="receipt" size={48} color={colors.gray300} />
          <Text style={styles.emptyText}>Belum ada transaksi</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={renderTransactionItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    color: colors.gray400,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  listContent: {
    padding: spacing.lg,
    gap: 10,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md + 2,
    borderLeftWidth: 4,
    borderLeftColor: colors.gray900,
  },
  greenBorderLeft: {
    borderLeftColor: colors.green600,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm - 2,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  typeIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionId: {
    fontWeight: fontWeight.bold,
    fontSize: 13,
    color: colors.gray900,
  },
  tagToko: {
    backgroundColor: colors.gray900,
    color: colors.white,
    paddingHorizontal: spacing.sm - 2,
    paddingVertical: 2,
    borderRadius: borderRadius.sm - 2,
    fontSize: fontSize.xs + 1,
    fontWeight: fontWeight.bold,
    overflow: 'hidden',
  },
  tagCitizen: {
    backgroundColor: colors.green600,
    color: colors.white,
    paddingHorizontal: spacing.sm - 2,
    paddingVertical: 2,
    borderRadius: borderRadius.sm - 2,
    fontSize: fontSize.xs + 1,
    fontWeight: fontWeight.bold,
    overflow: 'hidden',
  },
  netAmount: {
    fontWeight: fontWeight.extrabold,
    fontSize: fontSize.md,
    color: colors.gray900,
  },
  meta: {
    fontSize: fontSize.sm,
    color: colors.gray500,
  },
});

export default TransactionListScreen;
