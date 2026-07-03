import { useState, useCallback, useLayoutEffect } from 'react';
import { ScrollView, View, StyleSheet, StatusBar, TouchableOpacity, RefreshControl } from 'react-native';

import { Text, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRecentTransactions, useTransactionSummary } from '../hooks/useTransactions';
import type { RootStackParamList } from '../navigation/types';
import DataManagementModal from '../components/DataManagementModal';

const formatRupiah = (num: number) => {
  return 'Rp ' + num.toLocaleString('id-ID');
};

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const shortId = (id: string) => {
  return '#' + id.slice(0, 7).toUpperCase();
};

function ReportScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    data: summary,
    isRefetching: summaryRefetching,
    refetch: summaryRefetch,
  } = useTransactionSummary();
  const {
    data: transactions,
    isRefetching: transactionsRefetching,
    refetch: transactionsRefetch,
  } = useRecentTransactions(5);
  const [dataModalVisible, setDataModalVisible] = useState(false);

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

  return (
    <View style={styles.flexContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f2f2f2" />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
        }
      >
        {/* Date Filter */}
        <View style={styles.dateFilterContainer}>
          <TouchableOpacity style={styles.dateFilterButtonActive}>
            <Text style={styles.dateFilterButtonTextActive}>Hari Ini</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateFilterButton}>
            <Text style={styles.dateFilterButtonText}>Minggu Ini</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateFilterButton}>
            <Text style={styles.dateFilterButtonText}>Bulan Ini</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateFilterButton}>
            <Text style={styles.dateFilterButtonText}>Kustom</Text>
          </TouchableOpacity>
        </View>

        {/* Sales Summary */}
        <View style={[styles.card, styles.totalSalesCard]}>
          <View>
            <Text>TOTAL PENJUALAN</Text>
            <Text variant="headlineLarge">
              {summary ? formatRupiah(summary.totalSales) : 'Rp 0'}
            </Text>
          </View>
          <View style={styles.cashIconPlaceholder} />
        </View>

        <View style={styles.summaryCardsContainer}>
          <View style={styles.summaryCard}>
            <Text>TRANSAKSI</Text>
            <Text variant="titleLarge">{summary?.totalTransactions ?? 0}</Text>
          </View>
          <View style={[styles.summaryCard, styles.greenBorder]}>
            <Text>TOTAL NET</Text>
            <Text variant="titleLarge">
              {summary ? formatRupiah(summary.totalNet) : 'Rp 0'}
            </Text>
            <Text>Pendapatan bersih</Text>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsHeader}>
          <Text variant="titleLarge">Transaksi Terakhir</Text>
          <TouchableOpacity onPress={() => navigation.navigate('TransactionList')}>
            <Text style={styles.linkText}>Lihat Semua</Text>
          </TouchableOpacity>
        </View>

        {!transactions || transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Belum ada transaksi</Text>
          </View>
        ) : (
          transactions.map((tx) => {
            const isCitizen = tx.type === 'CITIZEN' || tx.type === 'MIXED';
            const tagLabel = tx.type === 'CITIZEN' ? 'WARGA' : tx.type === 'MIXED' ? 'CAMPURAN' : 'TOKO';

            return (
              <View
                key={tx.id}
                style={[styles.transactionCard, isCitizen ? styles.greenBorderLeft : null]}
              >
                <View>
                  <View style={styles.transactionTagContainer}>
                    <Text style={styles.transactionId}>{shortId(tx.id)}</Text>
                    <Text style={isCitizen ? styles.tagCitizen : styles.tagToko}>
                      {tagLabel}
                    </Text>
                  </View>
                  <Text>
                    {formatTime(tx.created_at)} &bull; {tx.itemCount} Item
                    {tx.itemNames ? ` (${tx.itemNames})` : ''}
                  </Text>
                </View>
                <View style={styles.transactionAmountContainer}>
                  <Text>{formatRupiah(tx.net_amount)}</Text>
                </View>
              </View>
            );
          })
        )}

      </ScrollView>

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
    backgroundColor: '#f2f2f2', // Light grey background for the whole screen
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#f2f2f2',
  },
  dateFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
    backgroundColor: '#e0e0e0', // Light grey background for the container
    borderRadius: 8,
    padding: 4, // Smaller padding to make buttons look like they're inside
  },
  dateFilterButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
  },
  dateFilterButtonActive: {
    backgroundColor: '#333', // Dark background for active button
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
  },
  dateFilterButtonText: {
    color: '#333', // Dark text for inactive buttons
    fontWeight: 'bold',
  },
  dateFilterButtonTextActive: {
    color: '#fff', // White text for active button
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
  },
  totalSalesCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cashIconPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    width: '48%',
  },
  greenBorder: {
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginTop: 5,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#333', // Dark grey for Penjualan Toko
    borderRadius: 5,
  },
  progressBarFillGreen: {
    height: '100%',
    backgroundColor: '#4CAF50', // Green for Komoditas Warga
    borderRadius: 5,
  },
  bulletAndText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greenBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 5,
  },
  salesValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  emptyContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  greenText: {
    color: '#4CAF50',
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  linkText: {
    color: '#007AFF', // A common blue for links
  },
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greenBorderLeft: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  transactionTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  transactionId: {
    fontWeight: 'bold',
    marginRight: 10,
  },
  tagToko: {
    backgroundColor: '#333',
    color: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
  },
  tagCitizen: {
    backgroundColor: '#4CAF50',
    color: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
  },
  tagUnpaid: {
    backgroundColor: '#f44336', // Red for unpaid
    color: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  weeklyInsightCard: {
    backgroundColor: '#263238', // Dark blue-grey from the image
    borderRadius: 8,
    padding: 16,
    marginTop: 10,
    marginBottom: 20,
  },
  weeklyInsightTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  weeklyInsightText: {
    color: '#ccc',
    marginBottom: 15,
  },
  detailButton: {
    backgroundColor: '#4CAF50',
    color: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    textAlign: 'center',
    alignSelf: 'flex-start',
  },
});

export default ReportScreen;
