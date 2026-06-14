import { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import {
  Text,
  TextInput,
  Card,
  Button,
  Portal,
  Dialog,
  IconButton,
  Snackbar,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useCashier, CartItem } from '../hooks/useCashier';
import { useInventory } from '../hooks/useInventory';

function CashierScreen() {
  const insets = useSafeAreaInsets();
  
  // Custom Hooks
  const { inventoryItems } = useInventory();
  const {
    cartItems,
    cashReceived,
    totalSales,
    totalPurchases,
    finalAmount,
    changeAmount,
    setCashReceived,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    checkout,
    isSubmitting,
  } = useCashier();

  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [editQtyModalVisible, setEditQtyModalVisible] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  // Form States: Tambah Manual
  const [manualName, setManualName] = useState('');
  const [manualPriceRaw, setManualPriceRaw] = useState('0');
  const [manualQty, setManualQty] = useState(1);
  const [manualUnit, setManualUnit] = useState<'Pcs' | 'Kg'>('Pcs');
  const [manualDirection] = useState<'OUT' | 'IN'>('OUT');
  const [numpadTarget, setNumpadTarget] = useState<'price' | 'qty'>('price');
  
  // States untuk edit item komoditas terpilih di keranjang
  const [selectedCartItem, setSelectedCartItem] = useState<CartItem | null>(null);
  const [editQtyInput, setEditQtyInput] = useState('');

  // Feedback States
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Format ke mata uang Rupiah
  const formatRupiah = (num: number) => {
    const isNegative = num < 0;
    const absVal = Math.abs(num);
    const formatted = 'Rp ' + absVal.toLocaleString('id-ID');
    return isNegative ? `-${formatted}` : formatted;
  };

  const showFeedback = (msg: string) => {
    setSnackbarMessage(msg);
    setSnackbarVisible(true);
  };

  const manualPriceValue = parseInt(manualPriceRaw, 10) || 0;
  const manualSubtotal = manualPriceValue * manualQty;

  const handleNumpadPress = useCallback((key: string) => {
    if (numpadTarget === 'price') {
      setManualPriceRaw(prev => {
        if (key === 'backspace') {
          const next = prev.slice(0, -1);
          return next === '' ? '0' : next;
        }
        if (key === '000') return prev === '0' ? '0' : prev + '000';
        if (prev === '0') return key;
        return prev + key;
      });
    } else {
      // target === 'qty'
      setManualQty(prev => {
        if (key === 'backspace') {
          const next = Math.floor(prev / 10);
          return next === 0 ? 1 : next;
        }
        if (key === '000') return prev * 1000;
        return prev * 10 + parseInt(key, 10);
      });
    }
  }, [numpadTarget]);

  const resetManualForm = () => {
    setManualName('');
    setManualPriceRaw('0');
    setManualQty(1);
    setManualUnit('Pcs');
    setNumpadTarget('price');
  };

  // Tambah item manual ke keranjang
  const handleAddManualItem = () => {
    if (!manualName.trim() || manualPriceValue <= 0) return;

    addToCart(
      {
        id: `manual-${Date.now()}`,
        name: manualName.trim(),
        price: manualPriceValue,
        type: 'PRODUCT',
        unit: manualUnit,
        barcode: null,
      },
      manualQty,
      manualDirection
    );

    resetManualForm();
    setManualModalVisible(false);
    showFeedback('Item manual ditambahkan');
  };

  // Simpan kuantitas komoditas edit
  const handleSaveEditQty = () => {
    if (selectedCartItem) {
      updateQuantity(selectedCartItem.id, Number(editQtyInput) || 0);
      setEditQtyModalVisible(false);
      setSelectedCartItem(null);
    }
  };

  // Checkout Transaksi
  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    
    // Validasi nominal bayar jika pelanggan harus bayar
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

  const searchResults = searchQuery.trim()
    ? inventoryItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.barcode && item.barcode.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 15)
    : [];

  // Render list item keranjang kasir
  const renderCartItem = ({ item }: { item: CartItem }) => {
    const isOut = item.flowDirection === 'OUT';
    const totalItemPrice = item.price * item.quantity;

    return (
      <Card
        style={[
          styles.cartCard,
          isOut ? styles.cartCardProduct : styles.cartCardCommodity,
        ]}
        mode="outlined"
      >
        <View style={styles.cartCardContent}>
          {/* Info Barang */}
          <View style={styles.cartDetailsContainer}>
            <View style={styles.cartNameRow}>
              {!isOut && (
                <View style={styles.beliTag}>
                  <Text style={styles.beliTagText}>BELI</Text>
                </View>
              )}
              <Text variant="titleMedium" style={styles.cartItemName} numberOfLines={1}>
                {item.name}
              </Text>
            </View>
            <Text variant="bodyMedium" style={styles.cartQtyText}>
              {item.quantity} {item.unit} x {item.price.toLocaleString('id-ID')}
            </Text>
          </View>

          {/* Kolom Aksi Kanan */}
          <View style={styles.cartActionContainer}>
            <Text variant="titleMedium" style={styles.cartItemTotal}>
              {formatRupiah(isOut ? totalItemPrice : -totalItemPrice)}
            </Text>

            {isOut ? (
              // Tombol tambah/kurang untuk produk
              <View style={styles.qtyControls}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => updateQuantity(item.id, item.quantity - 1)}
                  style={styles.qtyBtn}
                >
                  <Icon name="minus" size={16} color="#4B5563" />
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => updateQuantity(item.id, item.quantity + 1)}
                  style={styles.qtyBtn}
                >
                  <Icon name="plus" size={16} color="#4B5563" />
                </TouchableOpacity>
              </View>
            ) : (
              // Tombol edit/hapus untuk komoditas (karena kuantitas desimal)
              <View style={styles.qtyControls}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedCartItem(item);
                    setEditQtyInput(item.quantity.toString());
                    setEditQtyModalVisible(true);
                  }}
                  style={styles.qtyEditBtn}
                >
                  <Icon name="pencil-outline" size={16} color="#4B5563" />
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => removeFromCart(item.id)}
                  style={styles.qtyDeleteBtn}
                >
                  <Icon name="delete-outline" size={16} color="#DC2626" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Card>
    );
  };

  const isWarungPay = finalAmount < 0;

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header Kasir */}
      <View style={styles.headerBar}>
        <IconButton
          icon="sync"
          size={22}
          iconColor="#000000"
          style={styles.headerBtn}
          onPress={() => {
            clearCart();
            showFeedback('Keranjang dikosongkan');
          }}
        />
        <Text style={styles.headerTitle}>WAROENG</Text>
        <IconButton
          icon="barcode-scan"
          size={22}
          iconColor="#000000"
          style={styles.headerBtn}
          onPress={() => showFeedback('Pindai Barcode siap (Demo)')}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flexContainer}
      >
        <View style={styles.mainContainer}>
          {/* INPUT SCAN / CARI — selalu aktif */}
          <View style={styles.searchWrapper}>
            <View style={styles.searchRow}>
              <TextInput
                placeholder="Scan barcode atau cari produk/komoditas..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                mode="outlined"
                outlineColor="#E5E7EB"
                activeOutlineColor="#000000"
                style={styles.searchInput}
                contentStyle={styles.searchInputContent}
                left={<TextInput.Icon icon="barcode" color="#9CA3AF" />}
                right={
                  searchQuery ? (
                    <TextInput.Icon
                      icon="close"
                      color="#9CA3AF"
                      onPress={() => setSearchQuery('')}
                    />
                  ) : undefined
                }
                autoFocus
              />

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.manualBtn}
                onPress={() => setManualModalVisible(true)}
              >
                <Icon name="playlist-plus" size={20} color="#000000" />
              </TouchableOpacity>
            </View>

            {/* Dropdown hasil pencarian */}
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
                          <Text style={styles.searchResultName}>{item.name}</Text>
                          <Text style={styles.searchResultMeta}>
                            {isProduct ? 'Produk' : 'Komoditas'} — Stok: {item.stock} {item.unit}
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

          {/* LIST KERANJANG */}
          <View style={styles.cartHeaderRow}>
            <Text style={styles.cartHeaderTitle}>KERANJANG TRANSAKSI</Text>
            <Text style={styles.cartHeaderCount}>{cartItems.length} ITEM</Text>
          </View>

          {cartItems.length === 0 ? (
            <View style={styles.emptyCartContainer}>
              <Icon name="cart-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyCartText}>Keranjang belanja kosong</Text>
            </View>
          ) : (
            <FlatList
              data={cartItems}
              renderItem={renderCartItem}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.cartList}
            />
          )}

          {/* RINGKASAN PEMBAYARAN */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Belanja</Text>
              <Text style={styles.summaryValue}>{formatRupiah(totalSales)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Beli Komoditas</Text>
              <Text style={[styles.summaryValue, styles.textGreen]}>
                {formatRupiah(-totalPurchases)}
              </Text>
            </View>


            <View style={styles.divider} />

            {/* Input Tunai Diterima jika pelanggan harus bayar */}
            {!isWarungPay && finalAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tunai Diterima</Text>
                <TextInput
                  value={cashReceived}
                  onChangeText={setCashReceived}
                  keyboardType="numeric"
                  mode="outlined"
                  outlineColor="#D1D5DB"
                  activeOutlineColor="#000000"
                  style={styles.cashInput}
                  contentStyle={styles.cashInputContent}
                  left={<TextInput.Affix text="Rp " textStyle={styles.affixStyle} />}
                />
              </View>
            )}

            {!isWarungPay && finalAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>KEMBALIAN</Text>
                <Text style={styles.changeAmountText}>{changeAmount.toLocaleString('id-ID')}</Text>
              </View>
            )}

            <View style={styles.divider} />

            {/* Status Transaksi Dinamis */}
            <View style={styles.netAmountRow}>
              <View style={styles.netLabelLeft}>
                {isWarungPay && (
                  <Icon name="information-outline" size={20} color="#DC2626" style={styles.infoIcon} />
                )}
                <Text style={isWarungPay ? styles.payStatusRed : styles.payStatusBlack}>
                  {isWarungPay ? 'WARUNG HARUS BAYAR' : 'PELANGGAN HARUS BAYAR'}
                </Text>
              </View>
              <Text style={[styles.netAmountVal, isWarungPay ? styles.textRed : styles.textBlack]}>
                {formatRupiah(finalAmount)}
              </Text>
            </View>

            {/* Tombol Aksi Checkout */}
            <Button
              mode="contained"
              icon={isWarungPay ? 'cash-multiple' : 'cash-register'}
              onPress={handleCheckout}
              disabled={isSubmitting || cartItems.length === 0}
              loading={isSubmitting}
              style={[styles.checkoutBtn, isWarungPay ? styles.checkoutBtnGreen : styles.checkoutBtnBlack]}
              labelStyle={styles.checkoutBtnLabel}
            >
              {isWarungPay ? 'Serahkan Uang ke Pelanggan' : 'Terima Pembayaran'}
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Portal>
        {/* Modal: Edit Kuantitas Komoditas */}
        <Dialog visible={editQtyModalVisible} onDismiss={() => setEditQtyModalVisible(false)} style={styles.dialog}>
          <Dialog.Title style={styles.dialogTitle}>Ubah Jumlah Komoditas</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.editQtyItemName}>{selectedCartItem?.name}</Text>
            <TextInput
              label={`Jumlah (${selectedCartItem?.unit}) *`}
              value={editQtyInput}
              onChangeText={setEditQtyInput}
              keyboardType="numeric"
              mode="outlined"
              activeOutlineColor="#000000"
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditQtyModalVisible(false)} textColor="#4B5563">Batal</Button>
            <Button onPress={handleSaveEditQty} textColor="#000000" style={styles.saveBtn} labelStyle={styles.saveBtnLabel}>Simpan</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Modal 3: Tambah Produk Manual — Bottom Sheet Native */}
      <Modal
        visible={manualModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          resetManualForm();
          setManualModalVisible(false);
        }}
      >
        <View style={styles.bsOverlay}>
          <TouchableOpacity
            style={styles.bsDismissArea}
            activeOpacity={1}
            onPress={() => {
              resetManualForm();
              setManualModalVisible(false);
            }}
          />
          <View style={[styles.bsContainer, { paddingBottom: insets.bottom + 8 }]}>
            {/* Header */}
            <View style={styles.bsHeader}>
              <Text style={styles.bsTitle}>Tambah Produk Manual</Text>
              <TouchableOpacity
                onPress={() => {
                  resetManualForm();
                  setManualModalVisible(false);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="close" size={22} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* NAMA PRODUK */}
              <Text style={styles.bsFieldLabel}>NAMA PRODUK</Text>
              <TextInput
                placeholder="Contoh: Bayam Segar"
                value={manualName}
                onChangeText={setManualName}
                mode="outlined"
                outlineColor="#E5E7EB"
                activeOutlineColor="#111827"
                style={styles.bsNameInput}
                contentStyle={styles.bsNameInputContent}
              />

              {/* HARGA & SATUAN */}
              <View style={styles.bsRowFields}>
                <View style={styles.bsFieldHarga}>
                  <Text style={styles.bsFieldLabel}>HARGA SATUAN</Text>
                  <TouchableOpacity
                    style={[
                      styles.bsHargaBox,
                      numpadTarget === 'price' && styles.bsHargaBoxActive,
                    ]}
                    onPress={() => setNumpadTarget('price')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.bsHargaText}>
                      Rp {manualPriceValue.toLocaleString('id-ID')}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.bsFieldSatuan}>
                  <Text style={styles.bsFieldLabel}>SATUAN</Text>
                  <View style={styles.bsUnitToggle}>
                    <TouchableOpacity
                      style={[
                        styles.bsUnitBtn,
                        manualUnit === 'Pcs' && styles.bsUnitBtnActive,
                      ]}
                      onPress={() => setManualUnit('Pcs')}
                    >
                      <Text
                        style={[
                          styles.bsUnitBtnText,
                          manualUnit === 'Pcs' && styles.bsUnitBtnTextActive,
                        ]}
                      >
                        Pcs
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.bsUnitBtn,
                        manualUnit === 'Kg' && styles.bsUnitBtnActive,
                      ]}
                      onPress={() => setManualUnit('Kg')}
                    >
                      <Text
                        style={[
                          styles.bsUnitBtnText,
                          manualUnit === 'Kg' && styles.bsUnitBtnTextActive,
                        ]}
                      >
                        Kg
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* JUMLAH */}
              <Text style={styles.bsFieldLabel}>JUMLAH ({manualUnit.toUpperCase()})</Text>
              <View style={styles.bsQtyRow}>
                <TouchableOpacity
                  style={styles.bsQtyBtn}
                  onPress={() => setManualQty(prev => Math.max(1, prev - 1))}
                >
                  <Icon name="minus" size={22} color="#374151" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.bsQtyDisplay,
                    numpadTarget === 'qty' && styles.bsQtyDisplayActive,
                  ]}
                  onPress={() => setNumpadTarget('qty')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.bsQtyText}>{manualQty}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.bsQtyBtn}
                  onPress={() => setManualQty(prev => prev + 1)}
                >
                  <Icon name="plus" size={22} color="#374151" />
                </TouchableOpacity>
              </View>

              {/* CUSTOM NUMPAD */}
              <View style={styles.numpadGrid}>
                {['1','2','3','4','5','6','7','8','9','000','0','backspace'].map(key => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.numpadKey,
                      key === 'backspace' && styles.numpadKeyDelete,
                    ]}
                    onPress={() => handleNumpadPress(key)}
                    activeOpacity={0.6}
                  >
                    {key === 'backspace' ? (
                      <Icon name="backspace-outline" size={22} color="#DC2626" />
                    ) : (
                      <Text style={styles.numpadKeyText}>{key}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* FOOTER SUBTOTAL & TAMBAH */}
            <View style={styles.bsFooter}>
              <View style={styles.bsFooterInfo}>
                <View>
                  <Text style={styles.bsFooterLabelLeft}>SUBTOTAL</Text>
                  <Text style={styles.bsFooterSubtotal}>
                    Rp {manualSubtotal.toLocaleString('id-ID')}
                  </Text>
                </View>
                <View style={styles.bsFooterRight}>
                  <Text style={styles.bsFooterLabelRight}>BARANG</Text>
                  <Text style={styles.bsFooterQty}>
                    {manualQty} {manualUnit}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.bsAddBtn,
                  (!manualName.trim() || manualPriceValue <= 0) && styles.bsAddBtnDisabled,
                ]}
                onPress={handleAddManualItem}
                disabled={!manualName.trim() || manualPriceValue <= 0}
                activeOpacity={0.85}
              >
                <Icon name="cart" size={20} color="#FFFFFF" style={styles.bsAddBtnIcon} />
                <Text style={styles.bsAddBtnText}>TAMBAH KE KERANJANG</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#000000',
  },
  headerBtn: {
    margin: 0,
  },
  flexContainer: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchWrapper: {
    position: 'relative',
    zIndex: 100,
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    height: 48,
  },
  searchInputContent: {
    fontSize: 15,
  },
  manualBtn: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  searchDropdown: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    maxHeight: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F3F4F6',
  },
  searchResultLeft: {
    flex: 1,
  },
  searchResultName: {
    fontWeight: '700',
    fontSize: 14,
    color: '#111827',
    marginBottom: 2,
  },
  searchResultMeta: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  searchResultPrice: {
    fontWeight: '700',
    color: '#111827',
    marginLeft: 12,
  },
  cartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cartHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  cartHeaderCount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4B5563',
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyCartText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '600',
  },
  cartList: {
    gap: 10,
    paddingBottom: 20,
  },
  cartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderColor: '#E5E7EB',
  },
  cartCardProduct: {
    borderLeftWidth: 4,
    borderLeftColor: '#111827',
  },
  cartCardCommodity: {
    backgroundColor: '#DCFCE7',
    borderLeftWidth: 4,
    borderLeftColor: '#16A34A',
    borderColor: '#BBF7D0',
  },
  cartCardContent: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  cartDetailsContainer: {
    flex: 1,
  },
  cartNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  beliTag: {
    backgroundColor: '#16A34A',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  beliTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  cartItemName: {
    fontWeight: '700',
    color: '#111827',
  },
  cartQtyText: {
    color: '#4B5563',
  },
  cartActionContainer: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  cartItemTotal: {
    fontWeight: '700',
    color: '#111827',
  },
  qtyControls: {
    flexDirection: 'row',
    gap: 6,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyEditBtn: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyDeleteBtn: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    paddingBottom: 16,
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  divider: {
    height: 0.5,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  cashInput: {
    width: 120,
    backgroundColor: '#FFFFFF',
    height: 36,
  },
  cashInputContent: {
    paddingHorizontal: 8,
    fontSize: 14,
    textAlign: 'right',
  },
  affixStyle: {
    fontSize: 14,
  },
  changeAmountText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
  },
  netAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  netLabelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 6,
  },
  payStatusRed: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
  },
  payStatusBlack: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
  },
  netAmountVal: {
    fontSize: 26,
    fontWeight: '900',
  },
  textRed: {
    color: '#DC2626',
  },
  textBlack: {
    color: '#111827',
  },
  checkoutBtn: {
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
  },
  checkoutBtnGreen: {
    backgroundColor: '#1E5E3A', // Hijau tua
  },
  checkoutBtnBlack: {
    backgroundColor: '#000000',
  },
  checkoutBtnLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    maxHeight: '80%',
  },
  dialogTitle: {
    fontWeight: '800',
    fontSize: 18,
    color: '#111827',
  },
  dialogInput: {
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  saveBtn: {
    backgroundColor: '#000000',
    borderRadius: 8,
  },
  saveBtnLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  editQtyItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 12,
  },
  textGreen: {
    color: '#16A34A',
  },
  // ── Bottom Sheet: Tambah Manual ──────────────────────────────
  bsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  bsDismissArea: {
    flex: 1,
  },
  bsContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '92%',
  },
  bsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  bsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  bsFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.6,
    marginBottom: 6,
    marginTop: 14,
  },
  bsNameInput: {
    backgroundColor: '#F9FAFB',
    height: 52,
  },
  bsNameInputContent: {
    fontSize: 15,
  },
  bsRowFields: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
  },
  bsFieldHarga: {
    flex: 1,
  },
  bsFieldSatuan: {
    width: 120,
  },
  bsHargaBox: {
    height: 54,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  bsHargaBoxActive: {
    borderColor: '#111827',
    backgroundColor: '#F9FAFB',
  },
  bsHargaText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  bsUnitToggle: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
    height: 54,
  },
  bsUnitBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  bsUnitBtnActive: {
    backgroundColor: '#111827',
  },
  bsUnitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  bsUnitBtnTextActive: {
    color: '#FFFFFF',
  },
  bsQtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bsQtyBtn: {
    width: 52,
    height: 52,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  bsQtyDisplay: {
    flex: 1,
    height: 52,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  bsQtyDisplayActive: {
    borderColor: '#111827',
    backgroundColor: '#F9FAFB',
  },
  bsQtyText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  numpadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
    gap: 8,
  },
  numpadKey: {
    width: '30.5%',
    height: 60,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numpadKeyDelete: {
    backgroundColor: '#FEF2F2',
  },
  numpadKeyText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#111827',
  },
  bsFooter: {
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 12,
  },
  bsFooterInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  bsFooterLabelLeft: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  bsFooterSubtotal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  bsFooterRight: {
    alignItems: 'flex-end',
  },
  bsFooterLabelRight: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  bsFooterQty: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  bsAddBtn: {
    flexDirection: 'row',
    backgroundColor: '#1E5E3A',
    borderRadius: 10,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bsAddBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  bsAddBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  bsAddBtnIcon: {
    marginRight: 8,
  },
});

export default CashierScreen;
