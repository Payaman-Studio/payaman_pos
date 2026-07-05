import { TouchableOpacity, View, Image, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { InventoryItem } from '../../hooks/useInventory';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
} from '../../constants/theme';

interface ProductGridTileProps {
  item: InventoryItem;
  onPress: () => void;
  formatRupiah: (num: number) => string;
}

export function ProductGridTile({
  item,
  onPress,
  formatRupiah,
}: ProductGridTileProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.tile}
      onPress={onPress}
    >
      {item.photo ? (
        <Image
          source={{ uri: item.photo }}
          style={styles.photo}
        />
      ) : (
        <View style={styles.photoPlaceholder}>
          <Icon
            name="package-variant-closed"
            size={28}
            color={colors.gray400}
          />
        </View>
      )}
      <Text style={styles.name} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={styles.price}>{formatRupiah(item.price)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    padding: spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
  },
  photo: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.sm,
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray900,
    textAlign: 'center',
    lineHeight: 16,
  },
  price: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.black,
  },
});
