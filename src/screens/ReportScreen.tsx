import { useState, useCallback, useLayoutEffect, useMemo } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput as RNTextInput,
} from 'react-native';

import { Text, Button, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRecentTransactions, useTransactionSummary, Period } from '../hooks/useTransactions';
import type { RootStackParamList } from '../navigation/types';
import { TransactionWithDetails } from '../hooks/useTransactions';
import DataManagementModal from '../components/DataManagementModal';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../constants/theme';

const formatRupiah = (num: number) => 'Rp ' + num.toLocaleString('id-ID');

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const shortId = (id: string) => '#' + id.slice(0, 7).toUpperCase();

const periodLabels: Record<Period, string> = {
  today: 'Hari Ini',
  week: 'Minggu Ini',
  month: 'Bulan Ini',
  custom: 'Kustom',
};

const typeIcons: Record<string, { icon: string; color: string }> = {
  TOKO: { icon: 'store', color: colors.gray900 },
  CITIZEN: { icon: 'fruit-grapes', color: colors.green600 },
  MIXED: { icon: 'swap-horizontal', color: colors.gray900 },
};

function ReportScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [period, setPeriod] = useState<Period>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [dataModalVisible, setDataModalVisible] = useState(false);

  const {
    data: summary,
    isRefetching: summaryRefetching,
    refetch: summaryRefetch,
  } = useTransactionSummary(period, customFrom, customTo);
  const {
    data: transactions,
    isRefetching: transactionsRefetching,
    refetch: transactionsRefetch,
  } = useRecentTransactions(5);

  const isRefetching = summaryRefetching || transactionsRefetching;
  const onRefresh = useCallback(() => {
    summaryRefetch();
    transactionsRefetch();
  }, [summaryRefetch, transactionsRefetch]);

  const headerRight = useCallback(
    () => (
      <TouchableOpacity onPress={() => setDataModalVisible(true)}>
        <IconButton icon="database-cog-outline" size={24} />
      </TouchableOpacity>
    ),
    [setDataModalVisible],
  );

  useLayoutEffect(() => {
    navigation.setOptions({ headerRight });
  }, [navigation, headerRight]);

  // Mini chart data
  const chartMax = useMemo(() => {
    if (!summary?.dailyTotals?.length) return 1;
    return Math.max(...summary.dailyTotals.map((d) => d.total), 1);
  }, [summary?.dailyTotals]);

  const handlePeriodPress = useCallback((p: Period) => {
    if (p === 'custom') {
      setCustomModalVisible(true);
    } else {
      setPeriod(p);
    }
  }, []);

  const applyCustom = useCallback(() => {
    if (customFrom && customTo) {
      setPeriod('custom');
    }
    setCustomModalVisible(false);
  }, [customFrom, customTo]);



  return (
    <View style={styles.flexContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.gray50} />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
        }
      >
        {/* Date Filter */}
        <View style={styles.dateFilterContainer}>
          {(['today', 'week', 'month', 'custom'] as Period[]).map((p) => {
            const isActive = p === period;
            return (
              <TouchableOpacity
                key={p}
                style={[styles.dateFilterButton, isActive && styles.dateFilterButtonActive]}
                onPress={() => handlePeriodPress(p)}
              >
                <Text style={[styles.dateFilterButtonText, isActive && styles.dateFilterButtonTextActive]}>
                  {periodLabels[p]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Hero Card — Total Penjualan */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>TOTAL PENJUALAN</Text>
          <Text style={styles.heroValue}>
            {summary ? formatRupiah(summary.totalSales) : 'Rp 0'}
          </Text>

          {summary && summary.changePercent !== null && (
            <View style={styles.heroComparison}>
              <Icon
                name={summary.changePercent >= 0 ? 'trending-up' : 'trending-down'}
                size={16}
                color={summary.changePercent >= 0 ? colors.green500 : colors.red500}
              />
              <Text
                style={[
                  styles.heroComparisonText,
                  { color: summary.changePercent >= 0 ? colors.green500 : colors.red500 },
                ]}
              >
                {summary.changePercent >= 0 ? '+' : ''}{summary.changePercent}% dari periode sebelumnya
              </Text>
            </View>
          )}

          {/* Mini bar chart */}
          {summary?.dailyTotals && summary.dailyTotals.length > 0 && (
            <View style={styles.chartContainer}>
              {summary.dailyTotals.map((day, idx) => {
                const barHeight = Math.max((day.total / chartMax) * 60, 4);
                const dayLabel = new Date(day.date).toLocaleDateString('id-ID', { weekday: 'short' });
                return (
                  <View key={idx} style={styles.chartBar}>
                    <View style={[styles.chartBarFill, { height: barHeight }]} />
                    <Text style={styles.chartBarLabel}>{dayLabel}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryCardsContainer}>
          <View style={[styles.summaryCard, styles.summaryCardGray]}>
            <Text style={styles.summaryCardLabel}>TRANSAKSI</Text>
            <Text style={styles.summaryCardValue}>{summary?.totalTransactions ?? 0}</Text>
            <Text style={styles.summaryCardSubtext}>Total transaksi</Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryCardGreen]}>
            <Text style={styles.summaryCardLabel}>TOTAL NET</Text>
            <Text style={styles.summaryCardValue}>
              {summary ? formatRupiah(summary.totalNet) : 'Rp 0'}
            </Text>
            <Text style={styles.summaryCardSubtext}>Pendapatan bersih</Text>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsHeader}>
          <Text style={styles.transactionsTitle}>Transaksi Terakhir</Text>
          <TouchableOpacity onPress={() => navigation.navigate('TransactionList')}>
            <Text style={styles.linkText}>Lihat Semua</Text>
          </TouchableOpacity>
        </View>

        {!transactions || transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Belum ada transaksi</Text>
          </View>
        ) : (
          transactions.map((tx: TransactionWithDetails) => {
            const isCitizen = tx.type === 'CITIZEN' || tx.type === 'MIXED';
            const tagLabel = tx.type === 'CITIZEN' ? 'WARGA' : tx.type === 'MIXED' ? 'CAMPURAN' : 'TOKO';
            const iconCfg = typeIcons[tx.type] || typeIcons.TOKO;

            return (
              <TouchableOpacity
                key={tx.id}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('TransactionDetail', { transactionId: tx.id })}
              >
                <View style={[styles.transactionCard, isCitizen ? styles.greenBorderLeft : null]}>
                  <View style={styles.transactionLeft}>
                    <View style={[styles.transactionIconCircle, { backgroundColor: iconCfg.color + '20' }]}>
                      <Icon name={iconCfg.icon} size={16} color={iconCfg.color} />
                    </View>
                    <View style={styles.transactionInfo}>
                      <View style={styles.transactionTagRow}>
                        <Text style={styles.transactionId}>{shortId(tx.id)}</Text>
                        <Text style={isCitizen ? styles.tagCitizen : styles.tagToko}>
                          {tagLabel}
                        </Text>
                      </View>
                      <Text style={styles.transactionMeta}>
                        {formatTime(tx.created_at)} &bull; {tx.itemCount} Item
                        {tx.itemNames ? ` (${tx.itemNames})` : ''}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.transactionAmount}>{formatRupiah(tx.net_amount)}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Custom Date Modal */}
      <Modal
        visible={customModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pilih Rentang Tanggal</Text>

            <Text style={styles.modalLabel}>Dari</Text>
            <RNTextInput
              style={styles.modalInput}
              placeholder="YYYY-MM-DD"
              value={customFrom}
              onChangeText={setCustomFrom}
              maxLength={10}
            />

            <Text style={styles.modalLabel}>Sampai</Text>
            <RNTextInput
              style={styles.modalInput}
              placeholder="YYYY-MM-DD"
              value={customTo}
              onChangeText={setCustomTo}
              maxLength={10}
            />

            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => setCustomModalVisible(false)}
                style={styles.modalButton}
              >
                Batal
              </Button>
              <Button
                mode="contained"
                onPress={applyCustom}
                style={[styles.modalButton, { backgroundColor: colors.black }]}
                labelStyle={{ color: colors.white }}
              >
                Terapkan
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      <DataManagementModal
        visible={dataModalVisible}
        onDismiss={() => setDataModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.gray50,
  },
  // Date Filter
  dateFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: spacing.lg,
    backgroundColor: colors.gray200,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
  },
  dateFilterButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md - 1,
    borderRadius: borderRadius.sm,
  },
  dateFilterButtonActive: {
    backgroundColor: colors.gray900,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md - 1,
    borderRadius: borderRadius.sm,
  },
  dateFilterButtonText: {
    color: colors.gray900,
    fontWeight: fontWeight.bold,
  },
  dateFilterButtonTextActive: {
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
  // Hero Card
  heroCard: {
    backgroundColor: colors.black,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: 10,
  },
  heroLabel: {
    color: colors.gray400,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  heroValue: {
    color: colors.white,
    fontSize: 28,
    fontWeight: fontWeight.black,
  },
  heroComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  heroComparisonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginLeft: 4,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: colors.gray700,
    height: 90,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  chartBarFill: {
    width: 8,
    backgroundColor: colors.green500,
    borderRadius: 4,
    minHeight: 4,
  },
  chartBarLabel: {
    fontSize: 9,
    color: colors.gray500,
    marginTop: 4,
  },
  // Summary Cards
  summaryCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryCard: {
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    width: '48%',
  },
  summaryCardGray: {
    backgroundColor: colors.gray100,
  },
  summaryCardGreen: {
    backgroundColor: colors.green100,
  },
  summaryCardLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.gray500,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  summaryCardValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.extrabold,
    color: colors.gray900,
  },
  summaryCardSubtext: {
    fontSize: fontSize.sm,
    color: colors.gray500,
    marginTop: 2,
  },
  // Transactions
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  transactionsTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    color: colors.gray900,
  },
  linkText: {
    color: colors.blue,
    fontWeight: fontWeight.semibold,
  },
  emptyContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: 32,
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyText: {
    color: colors.gray400,
    fontSize: fontSize.md,
  },
  transactionCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greenBorderLeft: {
    borderLeftWidth: 4,
    borderLeftColor: colors.green600,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  transactionId: {
    fontWeight: fontWeight.bold,
    marginRight: spacing.sm,
    fontSize: fontSize.md,
    color: colors.gray900,
  },
  tagToko: {
    backgroundColor: colors.gray900,
    color: colors.white,
    paddingHorizontal: spacing.sm - 2,
    paddingVertical: 2,
    borderRadius: borderRadius.sm - 2,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    overflow: 'hidden',
  },
  tagCitizen: {
    backgroundColor: colors.green600,
    color: colors.white,
    paddingHorizontal: spacing.sm - 2,
    paddingVertical: 2,
    borderRadius: borderRadius.sm - 2,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    overflow: 'hidden',
  },
  transactionMeta: {
    fontSize: fontSize.sm,
    color: colors.gray500,
  },
  transactionAmount: {
    fontWeight: fontWeight.extrabold,
    fontSize: fontSize.md,
    color: colors.gray900,
    marginLeft: spacing.sm,
  },
  // Custom Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.xxl,
    width: '80%',
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray900,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.gray700,
    marginBottom: spacing.xs,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: borderRadius.sm,
    padding: spacing.sm + 2,
    fontSize: fontSize.md,
    marginBottom: spacing.md,
    color: colors.gray900,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  modalButton: {
    borderRadius: borderRadius.md,
  },
});

export default ReportScreen;
