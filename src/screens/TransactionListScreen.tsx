import { View, FlatList, StyleSheet, StatusBar } from 'react-native';

import { Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRecentTransactions } from '../hooks/useTransactions';

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

function TransactionListScreen() {
  const { data: transactions } = useRecentTransactions(50);

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      {!transactions || transactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="receipt" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>Belum ada transaksi</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isCitizen = item.type === 'CITIZEN' || item.type === 'MIXED';
            const tagLabel = item.type === 'CITIZEN' ? 'WARGA' : item.type === 'MIXED' ? 'CAMPURAN' : 'TOKO';

            return (
              <View style={[styles.card, isCitizen ? styles.greenBorderLeft : null]}>
                <View style={styles.cardTop}>
                  <View style={styles.tagRow}>
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
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#111827',
  },
  greenBorderLeft: {
    borderLeftColor: '#16A34A',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionId: {
    fontWeight: '700',
    fontSize: 13,
    color: '#111827',
  },
  tagToko: {
    backgroundColor: '#111827',
    color: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 11,
    fontWeight: '700',
    overflow: 'hidden',
  },
  tagCitizen: {
    backgroundColor: '#16A34A',
    color: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 11,
    fontWeight: '700',
    overflow: 'hidden',
  },
  netAmount: {
    fontWeight: '800',
    fontSize: 14,
    color: '#111827',
  },
  meta: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default TransactionListScreen;
