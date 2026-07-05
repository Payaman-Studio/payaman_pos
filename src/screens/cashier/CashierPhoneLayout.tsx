import {
  useState,
  useCallback,
  useLayoutEffect,
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
  KeyboardAvoidingView,
  Platform,
  Alert,
  BackHandler,
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

function CashierPhoneLayout() {
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

  const headerRight = useCallback(() => {
    if (cartItems.length === 0) return undefined;
    return (
      <IconButton
        icon="cart-off"
        size={22}
        iconColor={colors.black}
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
    );
  }, [cartItems, clearCart, showFeedback]);

  useLayoutEffect(() => {
    navigation.setOptions({ headerRight });
  }, [navigation, headerRight]);

  // Double back to exit (Android hardware back)
  const backPressCountRef = useRef(0);
  useEffect(() => {
    const onBackPress = () => {
      if (backPressCountRef.current === 0) {
        backPressCountRef.current = 1;
        showFeedback('Tekan sekali lagi untuk keluar');
        setTimeout(() => { backPressCountRef.current = 0; }, 2000);
        return true;
      }
      return false;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [showFeedback]);

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

  const searchResults = useMemo(
    () =>
      debouncedSearchQuery.trim()
        ? inventoryItems
            .filter(
              item =>
                item.name
                  .toLowerCase()
                  .includes(debouncedSearchQuery.toLowerCase()) ||
                (item.barcode &&
                  item.barcode
                    .toLowerCase()
                    .includes(debouncedSearchQuery.toLowerCase())),
            )
            .slice(0, 15)
        : [],
    [inventoryItems, debouncedSearchQuery],
  );

  const isWarungPay = finalAmount < 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flexContainer}
      >
        <View style={styles.mainContainer}>
          <View style={styles.searchWrapper}>
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
                autoFocus
              />

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.manualBtn}
                onPress={() => setManualModalVisible(true)}
              >
                <Icon name="plus" size={20} color={colors.black} />
              </TouchableOpacity>
            </View>

            {searchResults.length > 0 && (
              <View style={styles.searchDropdown}>
                <FlatList
                  data={searchResults}
                  keyExtractor={item => item.id}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => {
                    const isProduct = item.type === 'PRODUCT';
                    return (
                      <TouchableOpacity
                        style={styles.searchResultItem}
                        onPress={() => {
                          addToCart(item, 1, isProduct ? 'OUT' : 'IN');
                          setSearchQuery('');
                          showFeedback(`${item.name} dimasukkan`);
                        }}
                      >
                        <View style={styles.searchResultLeft}>
                          <Text style={styles.searchResultName}>
                            {item.name}
                          </Text>
                          <Text style={styles.searchResultMeta}>
                            {isProduct ? 'Produk' : 'Komoditas'} — Stok:{' '}
                            {item.stock} {item.unit}
                          </Text>
                        </View>
                        <Text style={styles.searchResultPrice}>
                          {formatRupiah(item.price)}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            )}
          </View>

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
      </KeyboardAvoidingView>

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
  flexContainer: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    paddingTop: spacing.md,
  },
  searchWrapper: {
    position: 'relative',
    zIndex: 100,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.gray300,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
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
  searchDropdown: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: borderRadius.md,
    maxHeight: 240,
    shadowColor: colors.shadowBlack,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md + 2,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.gray100,
  },
  searchResultLeft: {
    flex: 1,
  },
  searchResultName: {
    fontWeight: fontWeight.bold,
    fontSize: fontSize.md,
    color: colors.gray900,
    marginBottom: 2,
  },
  searchResultMeta: {
    fontSize: fontSize.sm,
    color: colors.gray400,
  },
  searchResultPrice: {
    fontWeight: fontWeight.bold,
    color: colors.gray900,
    marginLeft: spacing.md,
  },
});

export default CashierPhoneLayout;
