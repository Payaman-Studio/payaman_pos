import { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {
  Text,
  TextInput,
  Card,
  FAB,
  Portal,
  Dialog,
  Button,
  RadioButton,
  ActivityIndicator,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useInventory, InventoryItem } from '../hooks/useInventory';

// Komponen pembantu untuk menampilkan thumbnail produk/komoditas secara visual premium
function ProductThumbnail({ name, category, type }: { name: string; category: string | null; type: 'PRODUCT' | 'COMMODITY' }) {
  let backgroundColor = '#F3F4F6';
  let iconName = 'package-variant';
  let iconColor = '#9CA3AF';

  const lowerName = name.toLowerCase();
  const lowerCat = category?.toLowerCase() || '';

  if (lowerCat.includes('sayur') || lowerName.includes('bayam') || lowerName.includes('kangkung')) {
    backgroundColor = '#DCFCE7'; // Hijau pastel
    iconName = 'leaf';
    iconColor = '#16A34A';
  } else if (lowerName.includes('minyak') || lowerName.includes('goreng')) {
    backgroundColor = '#FEF9C3'; // Kuning pastel
    iconName = 'oil';
    iconColor = '#CA8A04';
  } else if (lowerName.includes('beras') || lowerName.includes('premium')) {
    backgroundColor = '#F5E6D3'; // Cokelat pastel
    iconName = 'barley';
    iconColor = '#9A3412';
  } else if (lowerName.includes('telur')) {
    backgroundColor = '#FFEDD5'; // Oranye pastel
    iconName = 'egg';
    iconColor = '#EA580C';
  } else if (lowerName.includes('gula')) {
    backgroundColor = '#E0F2FE'; // Biru muda pastel
    iconName = 'grain';
    iconColor = '#0284C7';
  } else if (lowerCat.includes('camilan') || lowerName.includes('krupuk') || lowerName.includes('keripik')) {
    backgroundColor = '#FCE7F3'; // Pink pastel
    iconName = 'cookie';
    iconColor = '#DB2777';
  } else if (type === 'COMMODITY') {
    backgroundColor = '#F0FDFA'; // Teal pastel
    iconName = 'fruit-grapes';
    iconColor = '#0D9488';
  }

  return (
    <View style={[styles.thumbnail, { backgroundColor }]}>
      <Icon name={iconName} size={28} color={iconColor} />
    </View>
  );
}

function InventoryScreen() {
  // States untuk filter
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // States untuk dialog tambah barang
  const [visible, setVisible] = useState(false);
  const [newItemType, setNewItemType] = useState<'PRODUCT' | 'COMMODITY'>('PRODUCT');
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stock, setStock] = useState('');
  const [categoryInput, setCategoryInput] = useState('');

  const {
    inventoryItems,
    lowStockCount,
    categories,
    isLoading,
    addProduct,
    addCommodity,
    refetch,
  } = useInventory({
    search,
    category: selectedCategory,
    lowStockOnly,
  });

  const handleOpenDialog = () => {
    setName('');
    setBarcode('');
    setCostPrice('');
    setSellingPrice('');
    setStock('');
    setCategoryInput('');
    setVisible(true);
  };

  const handleCloseDialog = () => setVisible(false);

  const handleSaveItem = async () => {
    if (!name || !sellingPrice || !stock) return;

    try {
      if (newItemType === 'PRODUCT') {
        await addProduct({
          barcode: barcode || null,
          name,
          cost_price: Number(costPrice) || 0,
          selling_price: Number(sellingPrice),
          stock: Number(stock),
          category: categoryInput || 'Lainnya',
        });
      } else {
        await addCommodity({
          barcode: barcode || null,
          name,
          default_price: Number(sellingPrice),
          stock: Number(stock),
          category: categoryInput || 'Lainnya',
        });
      }
      refetch();
      handleCloseDialog();
    } catch {
      // Tangani error secara aman
    }
  };

  // Format ke mata uang Rupiah
  const formatRupiah = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  // Render Item untuk FlatList
  const renderItem = ({ item }: { item: InventoryItem }) => {
    return (
      <Card style={styles.card} mode="outlined">
        <View style={styles.cardContent}>
          <ProductThumbnail name={item.name} category={item.category} type={item.type} />
          
          <View style={styles.detailsContainer}>
            <Text variant="titleMedium" style={styles.itemName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.barcode && (
              <Text variant="bodySmall" style={styles.skuText}>
                SKU: {item.barcode}
              </Text>
            )}
            
            <View style={styles.stockContainer}>
              {item.isLowStock && (
                <Icon name="alert-circle-outline" size={14} color="#DC2626" style={styles.alertIcon} />
              )}
              <Text
                variant="bodyMedium"
                style={[
                  styles.stockText,
                  item.isLowStock ? styles.lowStockText : styles.normalStockText,
                ]}
              >
                {item.stock} {item.unit}
              </Text>
            </View>
          </View>

          <View style={styles.priceContainer}>
            <Text variant="titleMedium" style={styles.priceText}>
              {formatRupiah(item.price)}
            </Text>
            <Text variant="bodySmall" style={styles.unitText}>
              {item.type === 'PRODUCT' ? 'per unit' : `per ${item.unit}`}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Custom Header Toko */}
      <View style={styles.headerBar}>
        <Icon name="store" size={22} color="#000000" />
        <Text style={styles.headerTitle}>WAROENG</Text>
      </View>

      <View style={styles.container}>
        {/* Judul Halaman */}
        <Text variant="headlineLarge" style={styles.pageTitle}>
          Inventori
        </Text>

        {/* Search Input */}
        <TextInput
          placeholder="Cari produk..."
          value={search}
          onChangeText={setSearch}
          mode="outlined"
          outlineColor="#E5E7EB"
          activeOutlineColor="#000000"
          style={styles.searchBar}
          contentStyle={styles.searchBarContent}
          left={<TextInput.Icon icon="magnify" color="#9CA3AF" size={20} />}
        />

        {/* Kategori Filter Pills */}
        <View style={styles.categoriesWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  activeOpacity={0.8}
                  onPress={() => setSelectedCategory(cat)}
                  style={[
                    styles.categoryPill,
                    isActive ? styles.categoryPillActive : styles.categoryPillInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      isActive ? styles.categoryTextActive : styles.categoryTextInactive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Banner Alert Stok Rendah */}
        {lowStockCount > 0 && (
          <View style={styles.alertBanner}>
            <View style={styles.alertBannerLeft}>
              <Icon name="alert" size={20} color="#991B1B" style={styles.alertBannerIcon} />
              <Text style={styles.alertBannerText}>
                {lowStockCount} items stok rendah
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setLowStockOnly(!lowStockOnly)}
            >
              <Text style={styles.alertBannerLink}>
                {lowStockOnly ? 'Tampilkan Semua' : 'Lihat Detail'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Main List / Content */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#000000" />
          </View>
        ) : inventoryItems.length === 0 ? (
          <View style={styles.centerContainer}>
            <Icon name="package-variant-closed" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>Tidak ada item ditemukan</Text>
          </View>
        ) : (
          <FlatList
            data={inventoryItems}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* FAB Tambah Barang */}
        <FAB
          icon="plus"
          color="#FFFFFF"
          style={styles.fab}
          onPress={handleOpenDialog}
        />

        {/* Modal Dialog Form Tambah Barang */}
        <Portal>
          <Dialog visible={visible} onDismiss={handleCloseDialog} style={styles.dialog}>
            <Dialog.Title style={styles.dialogTitle}>Tambah Item Baru</Dialog.Title>
            <Dialog.Content>
              <ScrollView showsVerticalScrollIndicator={false} style={styles.dialogScroll}>
                {/* Radio Button Pilihan Tipe Item */}
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={styles.radioButtonContainer}
                    onPress={() => setNewItemType('PRODUCT')}
                  >
                    <RadioButton
                      value="PRODUCT"
                      status={newItemType === 'PRODUCT' ? 'checked' : 'unchecked'}
                      color="#000000"
                    />
                    <Text>Produk (Barang Pabrik)</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.radioButtonContainer}
                    onPress={() => setNewItemType('COMMODITY')}
                  >
                    <RadioButton
                      value="COMMODITY"
                      status={newItemType === 'COMMODITY' ? 'checked' : 'unchecked'}
                      color="#000000"
                    />
                    <Text>Komoditas (Eceran/Timbangan)</Text>
                  </TouchableOpacity>
                </View>

                {/* Form Inputs */}
                <TextInput
                  label="Nama Item *"
                  value={name}
                  onChangeText={setName}
                  mode="outlined"
                  activeOutlineColor="#000000"
                  style={styles.input}
                />

                <TextInput
                  label="SKU / Barcode"
                  value={barcode}
                  onChangeText={setBarcode}
                  mode="outlined"
                  activeOutlineColor="#000000"
                  style={styles.input}
                />

                <TextInput
                  label="Kategori (misal: Sembako, Sayuran)"
                  value={categoryInput}
                  onChangeText={setCategoryInput}
                  mode="outlined"
                  activeOutlineColor="#000000"
                  style={styles.input}
                />

                <View style={styles.rowInputs}>
                  <TextInput
                    label="Stok Awal *"
                    value={stock}
                    onChangeText={setStock}
                    keyboardType="numeric"
                    mode="outlined"
                    activeOutlineColor="#000000"
                    style={[styles.input, styles.halfInput]}
                  />

                  <TextInput
                    label="Harga Jual *"
                    value={sellingPrice}
                    onChangeText={setSellingPrice}
                    keyboardType="numeric"
                    mode="outlined"
                    activeOutlineColor="#000000"
                    style={[styles.input, styles.halfInput]}
                  />
                </View>

                {newItemType === 'PRODUCT' && (
                  <TextInput
                    label="Harga Modal (Cost Price)"
                    value={costPrice}
                    onChangeText={setCostPrice}
                    keyboardType="numeric"
                    mode="outlined"
                    activeOutlineColor="#000000"
                    style={styles.input}
                  />
                )}
              </ScrollView>
            </Dialog.Content>
            
            <Dialog.Actions>
              <Button onPress={handleCloseDialog} textColor="#4B5563">Batal</Button>
              <Button onPress={handleSaveItem} textColor="#000000" style={styles.saveBtn} labelStyle={styles.saveBtnLabel}>Simpan</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </SafeAreaView>
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
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginLeft: 8,
    color: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 16,
  },
  pageTitle: {
    fontWeight: '800',
    color: '#111827',
    marginTop: 16,
    marginBottom: 16,
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    height: 48,
    marginBottom: 16,
  },
  searchBarContent: {
    paddingLeft: 0,
  },
  categoriesWrapper: {
    marginHorizontal: -16,
    marginBottom: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryPillActive: {
    backgroundColor: '#000000',
  },
  categoryPillInactive: {
    backgroundColor: '#E5E7EB',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  categoryTextInactive: {
    color: '#4B5563',
  },
  alertBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    marginBottom: 16,
  },
  alertBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertBannerIcon: {
    marginRight: 8,
  },
  alertBannerText: {
    color: '#991B1B',
    fontWeight: '700',
    fontSize: 14,
  },
  alertBannerLink: {
    color: '#991B1B',
    fontWeight: '700',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  listContainer: {
    paddingBottom: 80,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderColor: '#E5E7EB',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  itemName: {
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  skuText: {
    color: '#9CA3AF',
    marginBottom: 4,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIcon: {
    marginRight: 4,
  },
  stockText: {
    fontWeight: '700',
  },
  lowStockText: {
    color: '#DC2626',
  },
  normalStockText: {
    color: '#4B5563',
  },
  priceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  priceText: {
    fontWeight: '800',
    color: '#111827',
  },
  unitText: {
    color: '#9CA3AF',
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    borderRadius: 16,
  },
  centerContainer: {
    flex: 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },
  dialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  dialogTitle: {
    fontWeight: '800',
    fontSize: 18,
    color: '#111827',
  },
  dialogScroll: {
    maxHeight: 350,
  },
  radioGroup: {
    flexDirection: 'column',
    marginBottom: 12,
    gap: 6,
  },
  radioButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  saveBtn: {
    backgroundColor: '#000000',
    borderRadius: 8,
  },
  saveBtnLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default InventoryScreen;
