import {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  IconButton,
  Snackbar,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useInventory } from '../../hooks/useInventory';
import type { CartItem } from '../../hooks/useCashier';
import { useCashierContext } from '../../contexts/CashierContext';
import BarcodeScannerModal from '../../components/BarcodeScannerModal';
import { EditQtyDialog } from '../../components/cashier/EditQtyDialog';
import { ManualAddBottomSheet } from '../../components/cashier/ManualAddBottomSheet';
import { ProductGridTile } from '../../components/cashier/ProductGridTile';
import { CartPanel } from '../../components/cashier/CartPanel';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
} from '../../constants/theme';
import { RootStackParamList } from '../../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';

function CashierTabletLayout() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { inventoryItems } = useInventory();
  const {
    cartItems,
    cashReceived,
    totalSales,
    totalPurchases,
    finalAmount,
    setCashReceived,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    checkout,
    isSubmitting,
  } = useCashierContext();

  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [editQtyModalVisible, setEditQtyModalVisible] = useState(false);
  const [barcodeScannerVisible, setBarcodeScannerVisible] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [searchQuery]);

  const [selectedCartItem, setSelectedCartItem] = useState<CartItem | null>(
    null,
  );
  const [editQtyInput, setEditQtyInput] = useState('');

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const formatRupiah = (num: number) => {
    const isNegative = num < 0;
    const absVal = Math.abs(num);
    const formatted = 'Rp ' + absVal.toLocaleString('id-ID');
    return isNegative ? `-${formatted}` : formatted;
  };

  const showFeedback = useCallback((msg: string) => {
    setSnackbarMessage(msg);
    setSnackbarVisible(true);
  }, []);

  const handleBarcodeScanned = useCallback(
    (barcode: string) => {
      setBarcodeScannerVisible(false);
      const found = inventoryItems.find(item => item.barcode === barcode);
      if (found) {
        const isProduct = found.type === 'PRODUCT';
        addToCart(found, 1, isProduct ? 'OUT' : 'IN');
        showFeedback(`${found.name} ditambahkan via barcode`);
      } else {
        setSearchQuery(barcode);
        showFeedback(`Barcode ${barcode} tidak ditemukan`);
      }
    },
    [inventoryItems, addToCart, showFeedback],
  );

  const handleManualAdd = useCallback(
    (name: string, price: number, qty: number, unit: 'Pcs' | 'Kg') => {
      addToCart(
        {
          id: `manual-${Date.now()}`,
          name,
          price,
          type: 'PRODUCT',
          unit,
          barcode: null,
        },
        qty,
        'OUT',
      );
      showFeedback('Item manual ditambahkan');
    },
    [addToCart, showFeedback],
  );

  const handleSaveEditQty = () => {
    if (selectedCartItem) {
      updateQuantity(selectedCartItem.id, Number(editQtyInput) || 0);
      setEditQtyModalVisible(false);
      setSelectedCartItem(null);
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    if (finalAmount > 0 && Number(cashReceived) < finalAmount) {
      showFeedback('Pembayaran tunai belum mencukupi');
      return;
    }

    try {
      await checkout();
      showFeedback('Transaksi berhasil diselesaikan');
    } catch {
      showFeedback('Gagal menyelesaikan transaksi');
    }
  };

  const handleOpenPayment = () => {
    navigation.navigate('Payment');
  };

  const filteredGrid = useMemo(
    () =>
      debouncedSearchQuery.trim()
        ? inventoryItems.filter(
            item =>
              item.name
                .toLowerCase()
                .includes(debouncedSearchQuery.toLowerCase()) ||
              (item.barcode &&
                item.barcode
                  .toLowerCase()
                  .includes(debouncedSearchQuery.toLowerCase())),
          )
        : inventoryItems,
    [inventoryItems, debouncedSearchQuery],
  );

  const isWarungPay = finalAmount < 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <View style={styles.splitContainer}>
        {/* Left Column — Product Grid */}
        <View style={styles.leftPane}>
          {/* Search Row */}
          <View style={styles.searchRow}>
            <TextInput
              placeholder="Cari Produk..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              mode="outlined"
              outlineColor={colors.gray200}
              activeOutlineColor={colors.black}
              style={styles.searchInput}
              contentStyle={styles.searchInputContent}
              right={
                <TextInput.Icon
                  icon="barcode-scan"
                  color={colors.black}
                  onPress={() => setBarcodeScannerVisible(true)}
                />
              }
            />

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.manualBtn}
              onPress={() => setManualModalVisible(true)}
            >
              <Icon name="plus" size={20} color={colors.black} />
            </TouchableOpacity>

            {cartItems.length > 0 && (
              <IconButton
                icon="cart-off"
                size={22}
                iconColor={colors.gray600}
                onPress={() => {
                  Alert.alert(
                    'Konfirmasi',
                    'Apakah Anda ingin mengosongkan keranjang?',
                    [
                      { text: 'Batal', style: 'cancel' },
                      {
                        text: 'Ya',
                        onPress: () => {
                          clearCart();
                          showFeedback('Keranjang dikosongkan');
                        },
                      },
                    ],
                  );
                }}
              />
            )}
          </View>

          {/* Product Grid */}
          <FlatList
            data={filteredGrid}
            keyExtractor={item => item.id}
            numColumns={3}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.gridContainer}
            columnWrapperStyle={styles.gridRow}
            ListEmptyComponent={
              <View style={styles.emptyGrid}>
                <Icon name="package-variant-closed" size={48} color={colors.gray300} />
                <Text style={styles.emptyGridText}>
                  {debouncedSearchQuery.trim()
                    ? 'Produk tidak ditemukan'
                    : 'Belum ada produk'}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <ProductGridTile
                item={item}
                onPress={() => {
                  const isProduct = item.type === 'PRODUCT';
                  addToCart(item, 1, isProduct ? 'OUT' : 'IN');
                  showFeedback(`${item.name} dimasukkan`);
                }}
                formatRupiah={formatRupiah}
              />
            )}
          />
        </View>

        {/* Right Column — Cart */}
        <View style={styles.rightPane}>
          <CartPanel
            cartItems={cartItems}
            formatRupiah={formatRupiah}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
            onEditCommodity={cartItem => {
              setSelectedCartItem(cartItem);
              setEditQtyInput(cartItem.quantity.toString());
              setEditQtyModalVisible(true);
            }}
            totalSales={totalSales}
            totalPurchases={totalPurchases}
            finalAmount={finalAmount}
            cashReceived={cashReceived}
            setCashReceived={setCashReceived}
            isWarungPay={isWarungPay}
            isSubmitting={isSubmitting}
            handleCheckout={handleCheckout}
            handleOpenPayment={handleOpenPayment}
          />
        </View>
      </View>

      <EditQtyDialog
        visible={editQtyModalVisible}
        onDismiss={() => {
          setEditQtyModalVisible(false);
          setSelectedCartItem(null);
        }}
        item={selectedCartItem}
        value={editQtyInput}
        onChangeText={setEditQtyInput}
        onSave={handleSaveEditQty}
      />

      <ManualAddBottomSheet
        visible={manualModalVisible}
        onClose={() => setManualModalVisible(false)}
        onAdd={handleManualAdd}
      />

      <BarcodeScannerModal
        visible={barcodeScannerVisible}
        onClose={() => setBarcodeScannerVisible(false)}
        onBarcodeScanned={handleBarcodeScanned}
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  splitContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPane: {
    flex: 3,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderRightWidth: 0.5,
    borderRightColor: colors.gray300,
  },
  rightPane: {
    flex: 2,
    paddingTop: spacing.md,
    backgroundColor: colors.gray100,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.white,
    height: 48,
  },
  searchInputContent: {
    fontSize: fontSize.lg,
  },
  manualBtn: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  gridContainer: {
    paddingBottom: spacing.xl,
  },
  gridRow: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  emptyGrid: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    gap: spacing.md,
  },
  emptyGridText: {
    color: colors.gray400,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
});

export default CashierTabletLayout;
