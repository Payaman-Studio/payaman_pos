import { useState, useCallback } from 'react';
import {
  View,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  RefreshControl,
} from 'react-native';

import {
  Text,
  TextInput,
  Card,
  FAB,
  ActivityIndicator,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useInventory, InventoryItem } from '../hooks/useInventory';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../constants/theme';

// Komponen pembantu untuk menampilkan thumbnail produk/komoditas secara visual premium
function ProductThumbnail({
  name,
  category,
  type,
  photo,
}: {
  name: string;
  category: string | null;
  type: 'PRODUCT' | 'COMMODITY';
  photo?: string | null;
}) {
  let backgroundColor = colors.gray100;
  let iconName = 'package-variant';
  let iconColor = colors.gray400;

  const lowerName = name.toLowerCase();
  const lowerCat = category?.toLowerCase() || '';

  if (
    lowerCat.includes('sayur') ||
    lowerName.includes('bayam') ||
    lowerName.includes('kangkung')
  ) {
    backgroundColor = colors.categoryVegetable;
    iconName = 'leaf';
    iconColor = colors.green600;
  } else if (lowerName.includes('minyak') || lowerName.includes('goreng')) {
    backgroundColor = colors.categoryOil;
    iconName = 'oil';
    iconColor = colors.amber;
  } else if (lowerName.includes('beras') || lowerName.includes('premium')) {
    backgroundColor = colors.categoryRice;
    iconName = 'barley';
    iconColor = colors.orangeDark;
  } else if (lowerName.includes('telur')) {
    backgroundColor = colors.categoryEgg;
    iconName = 'egg';
    iconColor = colors.orange;
  } else if (lowerName.includes('gula')) {
    backgroundColor = colors.categorySugar;
    iconName = 'grain';
    iconColor = colors.blue;
  } else if (
    lowerCat.includes('camilan') ||
    lowerName.includes('krupuk') ||
    lowerName.includes('keripik')
  ) {
    backgroundColor = colors.categorySnack;
    iconName = 'cookie';
    iconColor = colors.pink;
  } else if (type === 'COMMODITY') {
    backgroundColor = colors.categoryCommodity;
    iconName = 'fruit-grapes';
    iconColor = colors.emerald;
  }

  if (photo) {
    return <Image source={{ uri: photo }} style={styles.thumbnail} />;
  }

  return (
    <View style={[styles.thumbnail, { backgroundColor }]}>
      <Icon name={iconName} size={28} color={iconColor} />
    </View>
  );
}

function InventoryScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // States untuk filter
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const {
    inventoryItems,
    lowStockCount,
    categories,
    isLoading,
    isRefetching,
    refetch,
    deleteProduct,
    deleteCommodity,
  } = useInventory({
    search,
    category: selectedCategory,
    lowStockOnly,
  });

  const formatRupiah = useCallback((num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  }, []);

  const handleDelete = useCallback((item: InventoryItem) => {
    Alert.alert('Hapus Item', `Yakin ingin menghapus "${item.name}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            if (item.type === 'PRODUCT') {
              await deleteProduct(item.id);
            } else {
              await deleteCommodity(item.id);
            }
          } catch {
            Alert.alert('Gagal', 'Gagal menghapus item');
          }
        },
      },
    ]);
  }, [deleteProduct, deleteCommodity]);

  const renderItem = useCallback(
    ({ item }: { item: InventoryItem }) => {
      return (
        <Card
          style={styles.card}
          mode="outlined"
          onPress={() =>
          navigation.navigate('ProductForm', {
            itemId: item.id,
            itemType: item.type,
          })
        }
        >
          <View style={styles.cardContent}>
            <ProductThumbnail
              name={item.name}
              category={item.category}
              type={item.type}
              photo={item.photo}
            />

            <View style={styles.detailsContainer}>
              <Text
                variant="titleMedium"
                style={styles.itemName}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              {item.barcode && (
                <Text variant="bodySmall" style={styles.skuText}>
                  SKU: {item.barcode}
                </Text>
              )}

              <View style={styles.stockContainer}>
                {item.isLowStock && (
                  <Icon
                    name="alert-circle-outline"
                    size={14}
                    color={colors.red500}
                    style={styles.alertIcon}
                  />
                )}
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.stockText,
                    item.isLowStock
                      ? styles.lowStockText
                      : styles.normalStockText,
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

            <TouchableOpacity
              activeOpacity={0.6}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => handleDelete(item)}
              style={styles.deleteButton}
            >
              <Icon name="delete-outline" size={20} color={colors.gray400} />
            </TouchableOpacity>
          </View>
        </Card>
      );
    },
    [navigation, handleDelete, formatRupiah],
  );

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <View style={styles.container}>
        {/* Search Input */}
        <TextInput
          placeholder="Cari produk..."
          value={search}
          onChangeText={setSearch}
          mode="outlined"
          outlineColor={colors.gray200}
          activeOutlineColor={colors.black}
          style={styles.searchBar}
          contentStyle={styles.searchBarContent}
          left={<TextInput.Icon icon="magnify" color={colors.gray400} size={20} />}
        />

        {/* Kategori Filter Pills */}
        <View style={styles.categoriesWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map(cat => {
              const isActive = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  activeOpacity={0.8}
                  onPress={() => setSelectedCategory(cat)}
                  style={[
                    styles.categoryPill,
                    isActive
                      ? styles.categoryPillActive
                      : styles.categoryPillInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      isActive
                        ? styles.categoryTextActive
                        : styles.categoryTextInactive,
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
              <Icon
                name="alert"
                size={20}
                color={colors.red500}
                style={styles.alertBannerIcon}
              />
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
            <ActivityIndicator size="large" color={colors.black} />
          </View>
        ) : inventoryItems.length === 0 ? (
          <View style={styles.centerContainer}>
            <Icon name="package-variant-closed" size={48} color={colors.gray400} />
            <Text style={styles.emptyText}>Tidak ada item ditemukan</Text>
          </View>
        ) : (
          <FlatList
            data={inventoryItems}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
            }
          />
        )}

        {/* FAB Tambah Barang */}
        <FAB
          icon="plus"
          color={colors.white}
          style={styles.fab}
          onPress={() => navigation.navigate('ProductForm')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
    paddingHorizontal: spacing.lg,
  },
  pageTitle: {
    fontWeight: fontWeight.extrabold,
    color: colors.gray900,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  searchBar: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    height: 48,
    marginBottom: spacing.lg,
  },
  searchBarContent: {
    paddingLeft: 0,
  },
  categoriesWrapper: {
    marginHorizontal: -spacing.lg,
    marginBottom: spacing.lg,
  },
  categoriesContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryPillActive: {
    backgroundColor: colors.black,
  },
  categoryPillInactive: {
    backgroundColor: colors.gray200,
  },
  categoryText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  categoryTextActive: {
    color: colors.white,
  },
  categoryTextInactive: {
    color: colors.gray600,
  },
  alertBanner: {
    flexDirection: 'row',
    backgroundColor: colors.red100,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    borderLeftColor: colors.red500,
    marginBottom: spacing.lg,
  },
  alertBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertBannerIcon: {
    marginRight: spacing.sm,
  },
  alertBannerText: {
    color: colors.red500,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.md,
  },
  alertBannerLink: {
    color: colors.red500,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.md,
    textDecorationLine: 'underline',
  },
  listContainer: {
    paddingBottom: 80,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderColor: colors.gray200,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  itemName: {
    fontWeight: fontWeight.bold,
    color: colors.gray900,
    marginBottom: 2,
  },
  skuText: {
    color: colors.gray400,
    marginBottom: spacing.xs,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIcon: {
    marginRight: spacing.xs,
  },
  stockText: {
    fontWeight: fontWeight.bold,
  },
  lowStockText: {
    color: colors.red500,
  },
  normalStockText: {
    color: colors.gray600,
  },
  priceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  deleteButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  priceText: {
    fontWeight: fontWeight.extrabold,
    color: colors.gray900,
  },
  unitText: {
    color: colors.gray400,
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    margin: spacing.lg,
    right: 0,
    bottom: 0,
    backgroundColor: colors.black,
    borderRadius: borderRadius.xxl,
  },
  centerContainer: {
    flex: 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    color: colors.gray400,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
});

export default InventoryScreen;
