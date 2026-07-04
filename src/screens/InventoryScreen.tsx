import { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  SectionList,
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
  Menu,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useInventory, InventoryItem } from '../hooks/useInventory';
import { RootStackParamList } from '../navigation/types';
import { groupByAlphabet } from '../utils/groupByAlphabet';
import AlphabetIndex from '../components/inventory/AlphabetIndex';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../constants/theme';

type SortBy = 'name' | 'stock' | 'price';

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
      <Icon name={iconName} size={20} color={iconColor} />
    </View>
  );
}

function InventoryScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);

  const sectionListRef = useRef<SectionList<InventoryItem, { title: string }>>(null);

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
    sortBy,
  });

  const sections = useMemo(
    () => (sortBy === 'name' ? groupByAlphabet(inventoryItems) : []),
    [inventoryItems, sortBy],
  );
  const letters = useMemo(() => sections.map(s => s.title), [sections]);

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

  const handleLetterPress = useCallback((letter: string) => {
    const idx = sections.findIndex(s => s.title === letter);
    if (idx !== -1) {
      sectionListRef.current?.scrollToLocation({ sectionIndex: idx, itemIndex: 0, animated: true });
    }
  }, [sections]);

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
                variant="titleSmall"
                style={styles.itemName}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <View style={styles.stockRow}>
                {item.isLowStock && (
                  <Icon
                    name="alert-circle-outline"
                    size={13}
                    color={colors.red500}
                    style={styles.alertIcon}
                  />
                )}
                <Text
                  variant="bodySmall"
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
              <Text variant="titleSmall" style={styles.priceText}>
                {formatRupiah(item.price)}
              </Text>
            </View>

            <Menu
              visible={openMenuId === item.id}
              onDismiss={() => setOpenMenuId(null)}
              anchor={
                <TouchableOpacity
                  activeOpacity={0.6}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  onPress={() => setOpenMenuId(item.id)}
                  style={styles.kebabButton}
                >
                  <Icon name="dots-vertical" size={20} color={colors.gray400} />
                </TouchableOpacity>
              }
            >
              <Menu.Item
                onPress={() => {
                  setOpenMenuId(null);
                  navigation.navigate('ProductForm', {
                    itemId: item.id,
                    itemType: item.type,
                  });
                }}
                title="Edit"
                leadingIcon="pencil"
              />
              <Menu.Item
                onPress={() => {
                  setOpenMenuId(null);
                  handleDelete(item);
                }}
                title="Hapus"
                leadingIcon="delete"
                titleStyle={{ color: colors.red500 }}
              />
            </Menu>
          </View>
        </Card>
      );
    },
    [navigation, openMenuId, handleDelete, formatRupiah],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: { title: string } }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{section.title}</Text>
      </View>
    ),
    [],
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

        {/* Filter Row: Kategori + Low Stock Chip + Sort */}
        <View style={styles.filterRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScrollView}
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
                      styles.categoryPillText,
                      isActive
                        ? styles.categoryPillTextActive
                        : styles.categoryPillTextInactive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {lowStockCount > 0 && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setLowStockOnly(!lowStockOnly)}
                style={[
                  styles.categoryPill,
                  lowStockOnly
                    ? styles.categoryPillLowStockActive
                    : styles.categoryPillLowStockInactive,
                ]}
              >
                <Icon
                  name="alert-outline"
                  size={14}
                  color={lowStockOnly ? colors.white : colors.red500}
                  style={styles.lowStockChipIcon}
                />
                <Text
                  style={[
                    styles.categoryPillText,
                    lowStockOnly
                      ? styles.categoryPillTextActive
                      : styles.categoryPillTextLowStock,
                  ]}
                >
                  Stok Rendah ({lowStockCount})
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <Menu
            visible={sortMenuVisible}
            onDismiss={() => setSortMenuVisible(false)}
            anchor={
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSortMenuVisible(true)}
                style={styles.sortButton}
              >
                <Icon name="sort-variant" size={20} color={colors.gray600} />
              </TouchableOpacity>
            }
          >
            <Menu.Item
              onPress={() => { setSortBy('name'); setSortMenuVisible(false); }}
              title="Nama (A-Z)"
              leadingIcon="sort-alphabetical-ascending"
            />
            <Menu.Item
              onPress={() => { setSortBy('stock'); setSortMenuVisible(false); }}
              title="Stok Terendah"
              leadingIcon="sort-numeric-ascending"
            />
            <Menu.Item
              onPress={() => { setSortBy('price'); setSortMenuVisible(false); }}
              title="Harga Tertinggi"
              leadingIcon="sort-numeric-descending"
            />
          </Menu>
        </View>

        {/* Main List */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.black} />
          </View>
        ) : inventoryItems.length === 0 ? (
          <View style={styles.centerContainer}>
            <Icon name="package-variant-closed" size={48} color={colors.gray400} />
            <Text style={styles.emptyText}>Tidak ada item ditemukan</Text>
          </View>
        ) : sortBy === 'name' ? (
          <View style={styles.listWrapper}>
            <SectionList<InventoryItem, { title: string }>
              ref={sectionListRef}
              sections={sections}
              renderItem={renderItem}
              keyExtractor={item => item.id}
              renderSectionHeader={renderSectionHeader}
              stickySectionHeadersEnabled
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
              }
            />
            {letters.length > 0 && (
              <AlphabetIndex
                activeLetters={letters}
                onLetterPress={handleLetterPress}
              />
            )}
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
  searchBar: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    height: 48,
    marginBottom: spacing.lg,
  },
  searchBarContent: {
    paddingLeft: 0,
  },
  // Filter Row
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  filterScrollView: {
    flex: 1,
    marginHorizontal: -spacing.lg,
  },
  categoriesContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  categoryPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  categoryPillActive: {
    backgroundColor: colors.black,
  },
  categoryPillInactive: {
    backgroundColor: colors.gray200,
  },
  categoryPillLowStockActive: {
    backgroundColor: colors.red500,
  },
  categoryPillLowStockInactive: {
    backgroundColor: colors.red100,
  },
  categoryPillText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  categoryPillTextActive: {
    color: colors.white,
  },
  categoryPillTextInactive: {
    color: colors.gray600,
  },
  categoryPillTextLowStock: {
    color: colors.red500,
  },
  lowStockChipIcon: {
    marginRight: 4,
  },
  sortButton: {
    marginLeft: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  // Section Header
  listWrapper: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: 4,
    paddingVertical: spacing.xs + 2,
    backgroundColor: colors.gray50,
  },
  sectionHeaderText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.black,
    color: colors.gray400,
    letterSpacing: 1,
  },
  listContainer: {
    paddingBottom: 80,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderColor: colors.gray200,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    flex: 1,
    marginLeft: spacing.sm,
    justifyContent: 'center',
  },
  itemName: {
    fontWeight: fontWeight.bold,
    color: colors.gray900,
    marginBottom: 2,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIcon: {
    marginRight: 3,
  },
  stockText: {
    fontWeight: fontWeight.semibold,
  },
  lowStockText: {
    color: colors.red500,
  },
  normalStockText: {
    color: colors.gray500,
  },
  priceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginRight: 2,
  },
  kebabButton: {
    padding: spacing.xs,
  },
  priceText: {
    fontWeight: fontWeight.extrabold,
    color: colors.gray900,
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
