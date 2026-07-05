import { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  SectionList,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Appbar,
  Card,
  FAB,
  Menu,
  Text,
  TextInput,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import AlphabetIndex from '../components/inventory/AlphabetIndex';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
import {
  borderRadius,
  colors,
  fontSize,
  fontWeight,
  spacing,
} from '../constants/theme';
import { InventoryItem, useInventory } from '../hooks/useInventory';
import { RootStackParamList } from '../navigation/types';
import { groupByAlphabet } from '../utils/groupByAlphabet';

type SortBy = 'name' | 'stock' | 'price';

function ProductThumbnail({ photo }: { photo?: string | null }) {
  const [imageError, setImageError] = useState(false);

  const showPlaceholder = !photo || imageError;

  if (!showPlaceholder) {
    return (
      <Image
        source={{ uri: photo }}
        style={styles.thumbnail}
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <View style={[styles.thumbnail, { backgroundColor: colors.gray100 }]}>
      <Icon
        name={photo ? 'package-variant-closed' : 'leaf'}
        size={20}
        color={colors.black}
      />
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
  const [sortMenuVisible, setSortMenuVisible] = useState(false);

  const sectionListRef =
    useRef<SectionList<InventoryItem, { title: string }>>(null);

  const {
    inventoryItems,
    lowStockCount,
    categories,
    isLoading,
    isRefetching,
    refetch,
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

  const [barcodeScannerVisible, setBarcodeScannerVisible] = useState(false);

  const handleBarcodeScanned = useCallback(
    (barcode: string) => {
      setBarcodeScannerVisible(false);
      const found = inventoryItems.find(item => item.barcode === barcode);
      if (found) {
        setSearch(found.name);
      }
    },
    [inventoryItems],
  );

  const formatRupiah = useCallback((num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  }, []);

  const handleLetterPress = useCallback(
    (letter: string) => {
      const idx = sections.findIndex(s => s.title === letter);
      if (idx !== -1) {
        sectionListRef.current?.scrollToLocation({
          sectionIndex: idx,
          itemIndex: 0,
          animated: true,
        });
      }
    },
    [sections],
  );

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
            <ProductThumbnail photo={item.photo} />

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
          </View>
        </Card>
      );
    },
    [navigation, formatRupiah],
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

      <Appbar.Header style={styles.appbarHeader}>
        <Appbar.Content
          title="Produk"
          titleStyle={styles.appbarTitle}
        />
      </Appbar.Header>

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
          left={
            <TextInput.Icon icon="magnify" color={colors.gray400} size={20} />
          }
          right={
            <TextInput.Icon
              icon="barcode-scan"
              color={colors.black}
              size={20}
              onPress={() => setBarcodeScannerVisible(true)}
            />
          }
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
              onPress={() => {
                setSortBy('name');
                setSortMenuVisible(false);
              }}
              title="Nama (A-Z)"
              leadingIcon="sort-alphabetical-ascending"
            />
            <Menu.Item
              onPress={() => {
                setSortBy('stock');
                setSortMenuVisible(false);
              }}
              title="Stok Terendah"
              leadingIcon="sort-numeric-ascending"
            />
            <Menu.Item
              onPress={() => {
                setSortBy('price');
                setSortMenuVisible(false);
              }}
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
            <Icon
              name="package-variant-closed"
              size={48}
              color={colors.gray400}
            />
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

      <BarcodeScannerModal
        visible={barcodeScannerVisible}
        onClose={() => setBarcodeScannerVisible(false)}
        onBarcodeScanned={handleBarcodeScanned}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  appbarHeader: {
    backgroundColor: colors.white,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.gray200,
  },
  appbarTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.black,
  },
  container: {
    flex: 1,
    backgroundColor: colors.gray100,
    padding: spacing.lg,
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
    backgroundColor: colors.gray100,
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
