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
import { Text, TextInput, Button, Menu, Snackbar } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

import { useInventory } from '../hooks/useInventory';
import { RootStackParamList } from '../navigation/types';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
import { savePhotoToStorage } from '../database/photoStorage';
import { generateId } from '../database';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
} from '../constants/theme';

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
  const [category, setCategory] = useState('Lainnya');
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
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [photoMenuVisible, setPhotoMenuVisible] = useState(false);

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

  const availableCategories = categories.filter(cat => cat !== 'Semua');

  return (
    <View style={[styles.safeArea, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flexContainer}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* 1. Segmented Control — Tipe Produk */}
          <View style={styles.typeSegmentedControl}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsCommodity(false)}
              style={[
                styles.typeSegment,
                !isCommodity && styles.typeSegmentActive,
              ]}
            >
              <Text
                style={[
                  styles.typeSegmentText,
                  !isCommodity && styles.typeSegmentTextActive,
                ]}
              >
                Produk Toko
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsCommodity(true)}
              style={[
                styles.typeSegment,
                isCommodity && styles.typeSegmentActive,
              ]}
            >
              <Text
                style={[
                  styles.typeSegmentText,
                  isCommodity && styles.typeSegmentTextActive,
                ]}
              >
                Komoditas Warga
              </Text>
            </TouchableOpacity>
          </View>

          {/* 2. Foto Thumbnail + Nama Produk */}
          <View style={styles.photoNameRow}>
            <Menu
              visible={photoMenuVisible}
              onDismiss={() => setPhotoMenuVisible(false)}
              anchor={
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setPhotoMenuVisible(true)}
                  style={styles.photoThumbnailContainer}
                >
                  {photo ? (
                    <Image
                      source={{ uri: photo }}
                      style={styles.photoThumbnail}
                    />
                  ) : (
                    <View style={styles.photoThumbnailPlaceholder}>
                      <Icon
                        name="camera-plus"
                        size={24}
                        color={colors.gray400}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              }
            >
              <Menu.Item
                onPress={() => {
                  handleTakePhoto();
                  setPhotoMenuVisible(false);
                }}
                leadingIcon="camera"
                title="Ambil Foto"
              />
              <Menu.Item
                onPress={() => {
                  handlePickPhoto();
                  setPhotoMenuVisible(false);
                }}
                leadingIcon="image"
                title="Pilih dari Galeri"
              />
              {photo && (
                <Menu.Item
                  onPress={() => {
                    handleRemovePhoto();
                    setPhotoMenuVisible(false);
                  }}
                  leadingIcon="delete"
                  title="Hapus Foto"
                />
              )}
            </Menu>

            <View style={styles.nameInputContainer}>
              <Text style={styles.inputLabel}>Nama Produk</Text>
              <TextInput
                placeholder="Contoh: Beras 5kg"
                value={name}
                onChangeText={setName}
                mode="outlined"
                outlineColor={colors.gray200}
                activeOutlineColor={colors.black}
                style={styles.textInput}
                contentStyle={styles.textInputContent}
              />
            </View>
          </View>

          {/* 6. SKU / Barcode */}
          {!isCommodity && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>SKU / Barcode</Text>
              <TextInput
                placeholder="Masukkan atau scan barcode"
                value={barcode}
                onChangeText={setBarcode}
                mode="outlined"
                outlineColor={colors.gray200}
                activeOutlineColor={colors.black}
                style={styles.textInput}
                contentStyle={styles.textInputContent}
                right={
                  <TextInput.Icon
                    icon="barcode-scan"
                    color={colors.black}
                    size={20}
                    onPress={() => setBarcodeScannerVisible(true)}
                  />
                }
              />
            </View>
          )}

          {/* 3. Harga Jual + Harga Beli */}
          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, styles.halfInput]}>
              <Text style={styles.inputLabel}>Harga Jual</Text>
              <TextInput
                value={sellingPrice}
                onChangeText={setSellingPrice}
                keyboardType="numeric"
                mode="outlined"
                outlineColor={colors.gray200}
                activeOutlineColor={colors.black}
                selectTextOnFocus
                style={styles.textInput}
                contentStyle={styles.textInputContent}
                left={
                  <TextInput.Affix text="Rp " textStyle={styles.affixStyle} />
                }
              />
            </View>

            {!isCommodity && (
              <View style={[styles.inputGroup, styles.halfInput]}>
                <Text style={styles.inputLabel}>Harga Beli</Text>
                <TextInput
                  value={costPrice}
                  onChangeText={setCostPrice}
                  keyboardType="numeric"
                  mode="outlined"
                  outlineColor={colors.gray200}
                  activeOutlineColor={colors.black}
                  selectTextOnFocus
                  style={styles.textInput}
                  contentStyle={styles.textInputContent}
                  left={
                    <TextInput.Affix text="Rp " textStyle={styles.affixStyle} />
                  }
                />
              </View>
            )}
          </View>

          {/* 4. Stok Awal + Min. Stok */}
          {!isCommodity && (
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, styles.halfInput]}>
                <Text style={styles.inputLabel}>Stok Awal</Text>
                <TextInput
                  value={stock}
                  onChangeText={setStock}
                  keyboardType="numeric"
                  mode="outlined"
                  outlineColor={colors.gray200}
                  activeOutlineColor={colors.black}
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
                  outlineColor={colors.gray200}
                  activeOutlineColor={colors.black}
                  selectTextOnFocus
                  style={styles.textInput}
                  contentStyle={styles.textInputContent}
                  textColor={colors.red500}
                />
              </View>
            </View>
          )}

          {/* 5. Kategori */}
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
                    <Icon
                      name="chevron-down"
                      size={20}
                      color={colors.gray500}
                    />
                  </TouchableOpacity>
                }
              >
                {availableCategories.map(cat => (
                  <Menu.Item
                    key={cat}
                    onPress={() => {
                      setCategory(cat);
                      setIsNewCategory(false);
                      setCategoryMenuVisible(false);
                    }}
                    title={cat}
                  />
                ))}
                <Menu.Item
                  onPress={() => {
                    setCategoryMenuVisible(false);
                    setIsNewCategory(true);
                    setCategory('');
                  }}
                  title="+ Buat Kategori Baru"
                />
              </Menu>

              {isNewCategory && (
                <TextInput
                  placeholder="Tulis Kategori Baru..."
                  value={category}
                  onChangeText={setCategory}
                  mode="outlined"
                  outlineColor={colors.gray200}
                  activeOutlineColor={colors.black}
                  style={[styles.textInput, styles.marginTop8]}
                  contentStyle={styles.textInputContent}
                />
              )}
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
              textColor={colors.red500}
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
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  flexContainer: {
    flex: 1,
    backgroundColor: colors.gray100,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 32,
  },
  // Segmented Control
  typeSegmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: 3,
    marginBottom: spacing.lg,
  },
  typeSegment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  typeSegmentActive: {
    backgroundColor: colors.black,
  },
  typeSegmentText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.black,
  },
  typeSegmentTextActive: {
    color: colors.white,
  },
  // Photo + Name Row
  photoNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  photoThumbnailContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.gray200,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderStyle: 'dashed',
    marginRight: spacing.md,
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoThumbnailPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameInputContainer: {
    flex: 1,
  },
  // Form inputs
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: fontWeight.bold,
    color: colors.gray700,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    height: 48,
  },
  textInputContent: {
    paddingHorizontal: 12,
  },
  marginTop8: {
    marginTop: 8,
  },
  affixStyle: {
    fontWeight: fontWeight.bold,
    color: colors.gray900,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: borderRadius.sm,
    height: 48,
    paddingHorizontal: 12,
  },
  dropdownText: {
    fontSize: fontSize.lg,
    color: colors.gray900,
    fontWeight: fontWeight.medium,
  },
  dropdownPlaceholder: {
    fontSize: fontSize.lg,
    color: colors.gray400,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  // Footer
  footerContainer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 0.5,
    borderTopColor: colors.gray200,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  saveButton: {
    backgroundColor: colors.black,
    borderRadius: borderRadius.md,
    height: 48,
    justifyContent: 'center',
    flex: 1,
  },
  saveButtonLabel: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
  },
  deleteButton: {
    borderColor: colors.red500,
    borderRadius: borderRadius.md,
    height: 48,
    justifyContent: 'center',
  },
  deleteButtonLabel: {
    color: colors.red500,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
  },
});

export default ProductFormScreen;
