import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../constants/theme';
import type { CartItem } from '../../hooks/useCashier';

interface CartItemCardProps {
  item: CartItem;
  formatRupiah: (num: number) => string;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onEditCommodity: (item: CartItem) => void;
}

export function CartItemCard({
  item,
  formatRupiah,
  onUpdateQuantity,
  onRemove,
  onEditCommodity,
}: CartItemCardProps) {
  const isOut = item.flowDirection === 'OUT';
  const totalItemPrice = item.price * item.quantity;

  return (
    <Card
      style={[
        styles.card,
        isOut ? styles.cardProduct : styles.cardCommodity,
      ]}
      mode="outlined"
    >
      <View style={styles.content}>
        {item.photo ? (
          <Image source={{ uri: item.photo }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Icon
              name={isOut ? 'package-variant' : 'leaf'}
              size={20}
              color={colors.gray400}
            />
          </View>
        )}

        <View style={styles.details}>
          <View style={styles.nameRow}>
            {!isOut && (
              <View style={styles.beliTag}>
                <Text style={styles.beliTagText}>BELI</Text>
              </View>
            )}
            <Text
              variant="titleMedium"
              style={styles.name}
              numberOfLines={1}
            >
              {item.name}
            </Text>
          </View>
          <Text variant="bodyMedium" style={styles.qtyText}>
            {item.quantity} {item.unit} x {item.price.toLocaleString('id-ID')}
          </Text>
        </View>

        <View style={styles.actions}>
          <Text variant="titleMedium" style={styles.total}>
            {formatRupiah(isOut ? totalItemPrice : -totalItemPrice)}
          </Text>

          {isOut ? (
            <View style={styles.qtyControls}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onUpdateQuantity(item.id, item.quantity - 1)}
                style={styles.qtyBtn}
              >
                <Icon name="minus" size={16} color={colors.gray600} />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onUpdateQuantity(item.id, item.quantity + 1)}
                style={styles.qtyBtn}
              >
                <Icon name="plus" size={16} color={colors.gray600} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.qtyControls}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onEditCommodity(item)}
                style={styles.editBtn}
              >
                <Icon name="pencil-outline" size={16} color={colors.gray600} />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onRemove(item.id)}
                style={styles.deleteBtn}
              >
                <Icon name="delete-outline" size={16} color={colors.red500} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderColor: colors.gray200,
  },
  cardProduct: {
    borderLeftWidth: 4,
    borderLeftColor: colors.gray900,
  },
  cardCommodity: {
    backgroundColor: colors.green100,
    borderLeftWidth: 4,
    borderLeftColor: colors.green600,
    borderColor: colors.green200,
  },
  content: {
    flexDirection: 'row',
    padding: spacing.md,
    alignItems: 'center',
    gap: 10,
  },
  photo: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray100,
  },
  photoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  beliTag: {
    backgroundColor: colors.green600,
    borderRadius: borderRadius.sm - 2,
    paddingHorizontal: spacing.sm - 2,
    paddingVertical: 2,
    marginRight: spacing.sm,
  },
  beliTagText: {
    color: colors.white,
    fontSize: fontSize.sm - 3,
    fontWeight: fontWeight.black,
  },
  name: {
    fontWeight: fontWeight.bold,
    color: colors.gray900,
  },
  qtyText: {
    color: colors.gray600,
  },
  actions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  total: {
    fontWeight: fontWeight.bold,
    color: colors.gray900,
  },
  qtyControls: {
    flexDirection: 'row',
    gap: spacing.sm - 2,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtn: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: colors.red100,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
