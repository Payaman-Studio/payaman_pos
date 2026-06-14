import { ScrollView, View, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';

function ReportScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.flexContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerTitleContainer}>
          <IconButton icon="store" size={24} />
          <Text variant="headlineMedium">Laporan</Text>
        </View>
        <IconButton icon="dots-vertical" size={24} />
      </View>
      <ScrollView style={styles.container}>
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
            <Text variant="headlineLarge">Rp 4.250.000</Text>
          </View>
          <View style={styles.cashIconPlaceholder} />
        </View>

        <View style={styles.summaryCardsContainer}>
          <View style={styles.summaryCard}>
            <Text>TRANSAKSI</Text>
            <Text variant="titleLarge">142</Text>
            <View style={styles.trendContainer}>
                <IconButton icon="arrow-up" size={16} color="green" style={{ margin: 0, padding: 0 }} />
                <Text style={styles.greenText}>+12% vs kemarin</Text>
            </View>
          </View>
          <View style={[styles.summaryCard, styles.greenBorder]}>
            <Text>KEUNTUNGAN</Text>
            <Text variant="titleLarge">Rp 842.500</Text>
            <Text>Estimasi bersih</Text>
          </View>
        </View>

        {/* Sales Breakdown */}
        <View style={styles.card}>
          <Text variant="titleMedium">Pemisahan Penjualan</Text>
          <View style={styles.progressBarContainer}>
            <Text>Penjualan Toko</Text>
            <Text>75%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressBarFill, { width: '75%' }]} />
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.bulletAndText}>
                <View style={styles.greenBullet} />
                <Text>Komoditas Warga</Text>
            </View>
            <Text>25%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressBarFillGreen, { width: '25%' }]} />
          </View>
          <View style={styles.salesValueContainer}>
            <View>
              <Text>Standard</Text>
              <Text>Rp 3.187.500</Text>
            </View>
            <View>
              <Text>Citizen</Text>
              <Text style={styles.greenText}>Rp 1.062.500</Text>
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsHeader}>
          <Text variant="titleLarge">Transaksi Terakhir</Text>
          <Text style={styles.linkText}>Lihat Semua</Text>
        </View>

        <View style={styles.transactionCard}>
          <View>
            <View style={styles.transactionTagContainer}>
              <Text style={styles.transactionId}>#TRX-0822</Text>
              <Text style={styles.tagToko}>TOKO</Text>
            </View>
            <Text>14:20 • 3 Items (Beras, Minyak...)</Text>
          </View>
          <View style={styles.transactionAmountContainer}>
            <Text>Rp 85.000</Text>
            <Text>Cash</Text>
          </View>
        </View>

        <View style={[styles.transactionCard, styles.greenBorderLeft]}>
          <View>
            <View style={styles.transactionTagContainer}>
              <Text style={styles.transactionId}>#TRX-0821</Text>
              <Text style={styles.tagCitizen}>CITIZEN</Text>
            </View>
            <Text>13:45 • 1 Item (Keripik Tempe Bu Siti)</Text>
          </View>
          <View style={styles.transactionAmountContainer}>
            <Text>Rp 25.000</Text>
            <Text>QRIS</Text>
          </View>
        </View>

        <View style={styles.transactionCard}>
          <View>
            <View style={styles.transactionTagContainer}>
              <Text style={styles.transactionId}>#TRX-0820</Text>
              <Text style={styles.tagUnpaid}>UNPAID</Text>
            </View>
            <Text>12:10 • 5 Items (Gula, Teh, Kopi...)</Text>
          </View>
          <View style={styles.transactionAmountContainer}>
            <Text>Rp 122.500</Text>
            <Text>Tempo 3 Hari</Text>
          </View>
        </View>

        {/* Weekly Insight */}
        <View style={styles.weeklyInsightCard}>
          <Text style={styles.weeklyInsightTitle}>Insight Mingguan</Text>
          <Text style={styles.weeklyInsightText}>
            Produk 'Minyak Goreng Kita' menyumbang 15% dari total volume penjualan hari ini.
          </Text>
          <Text style={styles.detailButton}>Detail Per Item</Text>
        </View>

      </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
