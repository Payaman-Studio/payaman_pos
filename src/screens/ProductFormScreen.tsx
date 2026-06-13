import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Switch,
  Button,
  Menu,
  IconButton,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useInventory } from '../hooks/useInventory';
import { RootStackParamList } from '../navigation/types';

type ProductFormScreenRouteProp = RouteProp<RootStackParamList, 'ProductForm'>;
type ProductFormScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProductForm'>;

function ProductFormScreen() {
  const navigation = useNavigation<ProductFormScreenNavigationProp>();
  const route = useRoute<ProductFormScreenRouteProp>();
  
  const itemId = route.params?.itemId;
  const itemType = route.params?.itemType;
  const isEditMode = !!itemId;

  // Custom hook untuk operasi database
  const { getItem, addProduct, addCommodity, updateProduct, updateCommodity, categories, refetch } = useInventory();

  // State Form
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('');
  const [costPrice, setCostPrice] = useState('0');
  const [sellingPrice, setSellingPrice] = useState('0');
  const [stock, setStock] = useState('0');
  const [minStock, setMinStock] = useState('5');
  const [isCommodity, setIsCommodity] = useState(false);

  // UI States
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);

  // Load data lama jika dalam mode Edit
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
      }
    }
  }, [isEditMode, itemId, itemType, getItem]);

  const handleSave = async () => {
    if (!name.trim()) return;

    const parsedSellingPrice = Number(sellingPrice) || 0;
    const parsedCostPrice = Number(costPrice) || 0;
    const parsedStock = Number(stock) || 0;
    const parsedMinStock = Number(minStock) || 0;
    const finalCategory = category.trim() || 'Lainnya';
    const finalBarcode = barcode.trim() || null;

    try {
      if (isEditMode && itemId && itemType) {
        if (isCommodity) {
          // Jika diubah menjadi komoditas atau memang komoditas
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
          // Jika tipe produk
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
            },
          });
        }
      } else {
        // Mode Tambah Baru
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
          });
        }
      }
      refetch();
      navigation.goBack();
    } catch {
      // Tangani error secara aman
    }
  };

  // Bersihkan opsi kategori agar tidak duplikat dengan "Semua"
  const availableCategories = categories.filter(cat => cat !== 'Semua');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <IconButton
          icon="arrow-left"
          size={24}
          iconColor="#000000"
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Edit Produk' : 'Tambah Produk'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flexContainer}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
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
              right={<TextInput.Icon icon="barcode" color="#000000" size={20} />}
            />
          </View>

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
                  <Text style={category ? styles.dropdownText : styles.dropdownPlaceholder}>
                    {category || 'Pilih Kategori'}
                  </Text>
                  <Icon name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>
              }
            >
              {availableCategories.map((cat) => (
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
                style={styles.textInput}
                contentStyle={styles.textInputContent}
                left={<TextInput.Affix text="Rp " textStyle={styles.affixStyle} />}
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
              style={styles.textInput}
              contentStyle={styles.textInputContent}
              left={<TextInput.Affix text="Rp " textStyle={styles.affixStyle} />}
            />
          </View>

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
                style={styles.textInput}
                contentStyle={styles.textInputContent}
                textColor="#DC2626"
              />
            </View>
          </View>

          {/* Switch Produk Komoditas Warga */}
          <View style={styles.commoditySwitchContainer}>
            <View style={styles.commoditySwitchLeft}>
              <Icon name="leaf" size={20} color="#16A34A" style={styles.commodityIcon} />
              <Text style={styles.commodityText}>Produk Komoditas Warga</Text>
            </View>
            <Switch
              value={isCommodity}
              onValueChange={setIsCommodity}
              color="#16A34A"
            />
          </View>
        </ScrollView>

        {/* Sticky Simpan Button di bagian bawah */}
        <View style={styles.footerContainer}>
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.saveButton}
            labelStyle={styles.saveButtonLabel}
          >
            Simpan Produk
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
  },
  backButton: {
    margin: 0,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  headerSpacer: {
    width: 48,
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
  },
  saveButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
  },
  saveButtonLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});

export default ProductFormScreen;
