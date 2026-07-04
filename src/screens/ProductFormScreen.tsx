import { useState, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Text,
  TextInput,
  Switch,
  Button,
  Menu,
  Snackbar,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

import { useInventory } from '../hooks/useInventory';
import { RootStackParamList } from '../navigation/types';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
import { savePhotoToStorage } from '../database/photoStorage';
import { generateId } from '../database';

type ProductFormScreenRouteProp = RouteProp<RootStackParamList, 'ProductForm'>;
type ProductFormScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ProductForm'
>;

function ProductFormScreen() {
  const navigation = useNavigation<ProductFormScreenNavigationProp>();
  const route = useRoute<ProductFormScreenRouteProp>();
  const insets = useSafeAreaInsets();

  const itemId = route.params?.itemId;
  const itemType = route.params?.itemType;
  const isEditMode = !!itemId;

  // Custom hook untuk operasi database
  const {
    getItem,
    addProduct,
    addCommodity,
    updateProduct,
    updateCommodity,
    deleteProduct,
    deleteCommodity,
    categories,
    refetch,
  } = useInventory();

  // State Form
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('');
  const [costPrice, setCostPrice] = useState('0');
  const [sellingPrice, setSellingPrice] = useState('0');
  const [stock, setStock] = useState('0');
  const [minStock, setMinStock] = useState('1');
  const [isCommodity, setIsCommodity] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);

  // UI States
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [barcodeScannerVisible, setBarcodeScannerVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Load data lama jika dalam mode Edit — hanya sekali saat mount
  useEffect(() => {
    if (isEditMode && itemId && itemType) {
      const item = getItem(itemId, itemType);
      if (item) {
        setName(item.name);
        setBarcode(item.barcode || '');
        setCategory(item.category || '');
        setSellingPrice(item.price.toString());
        setStock(item.stock.toString());
        setMinStock(item.minStock.toString());
        setIsCommodity(item.type === 'COMMODITY');
        if (item.type === 'PRODUCT' && item.costPrice !== undefined) {
          setCostPrice(item.costPrice.toString());
        }
        if (item.photo) {
          setPhoto(item.photo);
        }
      }
    }
  }, [isEditMode, itemId, itemType, getItem]);

  const handleSave = async () => {
    if (!name.trim()) return;

    setSaving(true);

    const parsedSellingPrice = Number(sellingPrice) || 0;
    const parsedCostPrice = Number(costPrice) || 0;
    const parsedStock = Number(stock) || 0;
    const parsedMinStock = Number(minStock) || 0;
    const finalCategory = category.trim() || 'Lainnya';
    const finalBarcode = barcode.trim() || null;

    let finalPhoto = photo;

    try {
      if (photo) {
        const photoId = isEditMode && itemId ? itemId : generateId();
        finalPhoto = await savePhotoToStorage(photo, photoId);
      }

      if (isEditMode && itemId && itemType) {
        if (isCommodity) {
          await updateCommodity({
            id: itemId,
            data: {
              barcode: finalBarcode,
              name: name.trim(),
              default_price: parsedSellingPrice,
              stock: parsedStock,
              category: finalCategory,
              min_stock: parsedMinStock,
            },
          });
        } else {
          await updateProduct({
            id: itemId,
            data: {
              barcode: finalBarcode,
              name: name.trim(),
              cost_price: parsedCostPrice,
              selling_price: parsedSellingPrice,
              stock: parsedStock,
              category: finalCategory,
              min_stock: parsedMinStock,
              photo: finalPhoto,
            },
          });
        }
      } else {
        if (isCommodity) {
          await addCommodity({
            barcode: finalBarcode,
            name: name.trim(),
            default_price: parsedSellingPrice,
            stock: parsedStock,
            category: finalCategory,
            min_stock: parsedMinStock,
          });
        } else {
          await addProduct({
            barcode: finalBarcode,
            name: name.trim(),
            cost_price: parsedCostPrice,
            selling_price: parsedSellingPrice,
            stock: parsedStock,
            category: finalCategory,
            min_stock: parsedMinStock,
            photo: finalPhoto,
          });
        }
      }
      refetch();
      navigation.goBack();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setSnackbarMessage(`Gagal menyimpan: ${message}`);
      setSnackbarVisible(true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!itemId) return;

    Alert.alert(
      'Hapus Item',
      `Yakin ingin menghapus "${name.trim() || 'item ini'}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              if (itemType === 'COMMODITY') {
                await deleteCommodity(itemId);
              } else {
                await deleteProduct(itemId);
              }
              refetch();
              navigation.goBack();
            } catch {
              Alert.alert('Gagal', 'Gagal menghapus item');
            }
          },
        },
      ],
    );
  };

  const handlePickPhoto = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, response => {
      if (response.assets?.[0]?.uri) {
        setPhoto(response.assets[0].uri);
      }
    });
  };

  const handleTakePhoto = () => {
    launchCamera({ mediaType: 'photo', quality: 0.7 }, response => {
      if (response.assets?.[0]?.uri) {
        setPhoto(response.assets[0].uri);
      }
    });
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
  };

  // Bersihkan opsi kategori agar tidak duplikat dengan "Semua"
  const availableCategories = categories.filter(cat => cat !== 'Semua');

  return (
    <View style={[styles.safeArea, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flexContainer}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* FOTO PRODUK */}
          <View style={styles.photoSection}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handlePickPhoto}
              style={styles.photoPicker}
            >
              {photo ? (
                <Image source={{ uri: photo }} style={styles.photoPreview} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Icon name="camera-plus" size={40} color="#9CA3AF" />
                  <Text style={styles.photoPlaceholderText}>Foto Produk</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.photoActions}>
              <Button
                mode="outlined"
                onPress={handleTakePhoto}
                icon="camera"
                style={styles.photoActionBtn}
                contentStyle={styles.photoActionContent}
              >
                Kamera
              </Button>
              <Button
                mode="outlined"
                onPress={handlePickPhoto}
                icon="image"
                style={styles.photoActionBtn}
                contentStyle={styles.photoActionContent}
              >
                Galeri
              </Button>
              {photo && (
                <Button
                  mode="text"
                  onPress={handleRemovePhoto}
                  icon="close"
                  textColor="#DC2626"
                  style={styles.photoActionBtn}
                  contentStyle={styles.photoActionContent}
                >
                  Hapus
                </Button>
              )}
            </View>
          </View>

          {/* Switch Produk Komoditas Warga */}
          <View style={styles.commoditySwitchContainer}>
            <View style={styles.commoditySwitchLeft}>
              <Icon
                name="leaf"
                size={20}
                color="#16A34A"
                style={styles.commodityIcon}
              />
              <Text style={styles.commodityText}>Produk Komoditas Warga</Text>
            </View>
            <Switch
              value={isCommodity}
              onValueChange={setIsCommodity}
              color="#16A34A"
            />
          </View>

          <View style={styles.divider} />

          {/* BAGIAN 1: INFORMASI DASAR */}
          <View style={styles.sectionHeader}>
            <Icon name="clipboard-text-outline" size={20} color="#374151" />
            <Text style={styles.sectionTitle}>INFORMASI DASAR</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nama Produk</Text>
            <TextInput
              placeholder="Contoh: Beras Pandan Wangi 5kg"
              value={name}
              onChangeText={setName}
              mode="outlined"
              outlineColor="#E5E7EB"
              activeOutlineColor="#000000"
              style={styles.textInput}
              contentStyle={styles.textInputContent}
            />
          </View>

          {!isCommodity && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>SKU / Barcode</Text>
              <TextInput
                placeholder="Masukkan atau scan barcode"
                value={barcode}
                onChangeText={setBarcode}
                mode="outlined"
                outlineColor="#E5E7EB"
                activeOutlineColor="#000000"
                style={styles.textInput}
                contentStyle={styles.textInputContent}
                right={
                  <TextInput.Icon
                    icon="barcode-scan"
                    color="#000000"
                    size={20}
                    onPress={() => setBarcodeScannerVisible(true)}
                  />
                }
              />
            </View>
          )}

          {!isCommodity && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Kategori</Text>
              <Menu
                visible={categoryMenuVisible}
                onDismiss={() => setCategoryMenuVisible(false)}
                anchor={
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setCategoryMenuVisible(true)}
                    style={styles.dropdownTrigger}
                  >
                    <Text
                      style={
                        category
                          ? styles.dropdownText
                          : styles.dropdownPlaceholder
                      }
                    >
                      {category || 'Pilih Kategori'}
                    </Text>
                    <Icon name="chevron-down" size={20} color="#6B7280" />
                  </TouchableOpacity>
                }
              >
                {availableCategories.map(cat => (
                  <Menu.Item
                    key={cat}
                    onPress={() => {
                      setCategory(cat);
                      setCategoryMenuVisible(false);
                    }}
                    title={cat}
                  />
                ))}
                <Menu.Item
                  onPress={() => {
                    setCategoryMenuVisible(false);
                    // Buka input teks baru secara langsung dengan state
                    setCategory('');
                  }}
                  title="+ Buat Kategori Baru"
                />
              </Menu>
              {/* Input teks kategori jika kategori tidak ada di list atau ingin buat baru */}
              {!availableCategories.includes(category) && (
                <TextInput
                  placeholder="Tulis Kategori Baru..."
                  value={category}
                  onChangeText={setCategory}
                  mode="outlined"
                  outlineColor="#E5E7EB"
                  activeOutlineColor="#000000"
                  style={[styles.textInput, styles.marginTop8]}
                  contentStyle={styles.textInputContent}
                />
              )}
            </View>
          )}

          <View style={styles.divider} />

          {/* BAGIAN 2: HARGA & INVENTORI */}
          <View style={styles.sectionHeader}>
            <Icon name="cash-multiple" size={20} color="#10B981" />
            <Text style={styles.sectionTitle}>HARGA & INVENTORI</Text>
          </View>

          {/* Sembunyikan harga beli jika tipe komoditas karena DB komoditas hanya ada default_price */}
          {!isCommodity && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Harga Beli</Text>
              <TextInput
                value={costPrice}
                onChangeText={setCostPrice}
                keyboardType="numeric"
                mode="outlined"
                outlineColor="#E5E7EB"
                activeOutlineColor="#000000"
                selectTextOnFocus
                style={styles.textInput}
                contentStyle={styles.textInputContent}
                left={
                  <TextInput.Affix text="Rp " textStyle={styles.affixStyle} />
                }
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Harga Jual</Text>
            <TextInput
              value={sellingPrice}
              onChangeText={setSellingPrice}
              keyboardType="numeric"
              mode="outlined"
              outlineColor="#E5E7EB"
              activeOutlineColor="#000000"
              selectTextOnFocus
              style={styles.textInput}
              contentStyle={styles.textInputContent}
              left={
                <TextInput.Affix text="Rp " textStyle={styles.affixStyle} />
              }
            />
          </View>

          {!isCommodity && (
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, styles.halfInput]}>
                <Text style={styles.inputLabel}>Stok Awal</Text>
                <TextInput
                  value={stock}
                  onChangeText={setStock}
                  keyboardType="numeric"
                  mode="outlined"
                  outlineColor="#E5E7EB"
                  activeOutlineColor="#000000"
                  selectTextOnFocus
                  style={styles.textInput}
                  contentStyle={styles.textInputContent}
                />
              </View>

              <View style={[styles.inputGroup, styles.halfInput]}>
                <Text style={styles.inputLabel}>Min. Stok</Text>
                <TextInput
                  value={minStock}
                  onChangeText={setMinStock}
                  keyboardType="numeric"
                  mode="outlined"
                  outlineColor="#E5E7EB"
                  activeOutlineColor="#000000"
                  selectTextOnFocus
                  style={styles.textInput}
                  contentStyle={styles.textInputContent}
                  textColor="#DC2626"
                />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Sticky Simpan Button di bagian bawah */}
        <View style={styles.footerContainer}>
          {isEditMode && (
            <Button
              mode="outlined"
              onPress={handleDelete}
              style={styles.deleteButton}
              labelStyle={styles.deleteButtonLabel}
              textColor="#DC2626"
            >
              Hapus
            </Button>
          )}
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.saveButton}
            labelStyle={styles.saveButtonLabel}
            disabled={saving}
            loading={saving}
          >
            {saving ? 'Menyimpan...' : 'Simpan Produk'}
          </Button>
        </View>
      </KeyboardAvoidingView>

      <BarcodeScannerModal
        visible={barcodeScannerVisible}
        onClose={() => setBarcodeScannerVisible(false)}
        onBarcodeScanned={code => {
          setBarcode(code);
          setBarcodeScannerVisible(false);
        }}
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  photoSection: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  photoPicker: {
    width: 140,
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  photoActionBtn: {
    borderColor: '#D1D5DB',
    borderRadius: 8,
  },
  photoActionContent: {
    height: 36,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flexContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4B5563',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    height: 48,
  },
  marginTop8: {
    marginTop: 8,
  },
  textInputContent: {
    paddingHorizontal: 12,
  },
  affixStyle: {
    fontWeight: '700',
    color: '#111827',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 5,
    height: 48,
    paddingHorizontal: 12,
  },
  dropdownText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  dropdownPlaceholder: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 20,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  commoditySwitchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  commoditySwitchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commodityIcon: {
    marginRight: 8,
  },
  commodityText: {
    color: '#14532D',
    fontWeight: '700',
    fontSize: 14,
  },
  footerContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    flex: 1,
  },
  saveButtonLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  deleteButton: {
    borderColor: '#DC2626',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
  },
  deleteButtonLabel: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '800',
  },
});

export default ProductFormScreen;
