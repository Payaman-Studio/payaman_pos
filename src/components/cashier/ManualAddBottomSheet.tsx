import { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../constants/theme';
import { NumericKeypad } from './NumericKeypad';

interface ManualAddBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (name: string, price: number, qty: number, unit: 'Pcs' | 'Kg') => void;
}

export function ManualAddBottomSheet({
  visible,
  onClose,
  onAdd,
}: ManualAddBottomSheetProps) {
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [priceRaw, setPriceRaw] = useState('0');
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState<'Pcs' | 'Kg'>('Pcs');
  const [numpadTarget, setNumpadTarget] = useState<'price' | 'qty'>('price');

  useEffect(() => {
    if (visible) {
      setName('');
      setPriceRaw('0');
      setQty(1);
      setUnit('Pcs');
      setNumpadTarget('price');
    }
  }, [visible]);

  const priceValue = parseInt(priceRaw, 10) || 0;
  const subtotal = priceValue * qty;

  const handleNumpadPress = useCallback(
    (key: string) => {
      if (numpadTarget === 'price') {
        setPriceRaw(prev => {
          if (key === 'backspace') {
            const next = prev.slice(0, -1);
            return next === '' ? '0' : next;
          }
          if (key === '000') return prev === '0' ? '0' : prev + '000';
          if (prev === '0') return key;
          return prev + key;
        });
      } else {
        setQty(prev => {
          if (key === 'backspace') {
            const next = Math.floor(prev / 10);
            return next === 0 ? 1 : next;
          }
          if (key === '000') return prev * 1000;
          return prev * 10 + parseInt(key, 10);
        });
      }
    },
    [numpadTarget],
  );

  const handleAdd = () => {
    if (!name.trim() || priceValue <= 0) return;
    onAdd(name.trim(), priceValue, qty, unit);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.dismissArea}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.container, { paddingBottom: insets.bottom + spacing.sm }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Tambah Produk Manual</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="close" size={22} color={colors.gray700} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.fieldLabel}>NAMA PRODUK</Text>
            <TextInput
              placeholder="Contoh: Bayam Segar"
              value={name}
              onChangeText={setName}
              mode="outlined"
              outlineColor={colors.gray200}
              activeOutlineColor={colors.gray900}
              style={styles.nameInput}
              contentStyle={styles.nameInputContent}
            />

            <View style={styles.rowFields}>
              <View style={styles.fieldHarga}>
                <Text style={styles.fieldLabel}>HARGA SATUAN</Text>
                <TouchableOpacity
                  style={[
                    styles.hargaBox,
                    numpadTarget === 'price' && styles.hargaBoxActive,
                  ]}
                  onPress={() => setNumpadTarget('price')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.hargaText}>
                    Rp {priceValue.toLocaleString('id-ID')}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.fieldSatuan}>
                <Text style={styles.fieldLabel}>SATUAN</Text>
                <View style={styles.unitToggle}>
                  <TouchableOpacity
                    style={[
                      styles.unitBtn,
                      unit === 'Pcs' && styles.unitBtnActive,
                    ]}
                    onPress={() => setUnit('Pcs')}
                  >
                    <Text
                      style={[
                        styles.unitBtnText,
                        unit === 'Pcs' && styles.unitBtnTextActive,
                      ]}
                    >
                      Pcs
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.unitBtn,
                      unit === 'Kg' && styles.unitBtnActive,
                    ]}
                    onPress={() => setUnit('Kg')}
                  >
                    <Text
                      style={[
                        styles.unitBtnText,
                        unit === 'Kg' && styles.unitBtnTextActive,
                      ]}
                    >
                      Kg
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <Text style={styles.fieldLabel}>
              JUMLAH ({unit.toUpperCase()})
            </Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQty(prev => Math.max(1, prev - 1))}
              >
                <Icon name="minus" size={22} color={colors.gray700} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.qtyDisplay,
                  numpadTarget === 'qty' && styles.qtyDisplayActive,
                ]}
                onPress={() => setNumpadTarget('qty')}
                activeOpacity={0.8}
              >
                <Text style={styles.qtyText}>{qty}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQty(prev => prev + 1)}
              >
                <Icon name="plus" size={22} color={colors.gray700} />
              </TouchableOpacity>
            </View>

            <NumericKeypad onPress={handleNumpadPress} />
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.footerInfo}>
              <View>
                <Text style={styles.footerLabelLeft}>SUBTOTAL</Text>
                <Text style={styles.footerSubtotal}>
                  Rp {subtotal.toLocaleString('id-ID')}
                </Text>
              </View>
              <View style={styles.footerRight}>
                <Text style={styles.footerLabelRight}>BARANG</Text>
                <Text style={styles.footerQty}>
                  {qty} {unit}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.addBtn,
                (!name.trim() || priceValue <= 0) && styles.addBtnDisabled,
              ]}
              onPress={handleAdd}
              disabled={!name.trim() || priceValue <= 0}
              activeOpacity={0.85}
            >
              <Icon
                name="cart"
                size={20}
                color={colors.white}
                style={styles.addBtnIcon}
              />
              <Text style={styles.addBtnText}>TAMBAH KE KERANJANG</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.extrabold,
    color: colors.gray900,
  },
  fieldLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.gray500,
    letterSpacing: 0.6,
    marginBottom: spacing.sm - 2,
    marginTop: spacing.md + 2,
  },
  nameInput: {
    backgroundColor: colors.gray150,
    height: 52,
  },
  nameInputContent: {
    fontSize: fontSize.lg,
  },
  rowFields: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-end',
  },
  fieldHarga: {
    flex: 1,
  },
  fieldSatuan: {
    width: 120,
  },
  hargaBox: {
    height: 54,
    borderWidth: 2,
    borderColor: colors.gray200,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md + 2,
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  hargaBoxActive: {
    borderColor: colors.gray900,
    backgroundColor: colors.gray150,
  },
  hargaText: {
    fontSize: fontSize.subtitle,
    fontWeight: fontWeight.extrabold,
    color: colors.gray900,
  },
  unitToggle: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: colors.gray200,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    height: 54,
  },
  unitBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray100,
  },
  unitBtnActive: {
    backgroundColor: colors.gray900,
  },
  unitBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.gray500,
  },
  unitBtnTextActive: {
    color: colors.white,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  qtyBtn: {
    width: 52,
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray150,
  },
  qtyDisplay: {
    flex: 1,
    height: 52,
    borderWidth: 2,
    borderColor: colors.gray200,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  qtyDisplayActive: {
    borderColor: colors.gray900,
    backgroundColor: colors.gray150,
  },
  qtyText: {
    fontSize: fontSize.heading,
    fontWeight: fontWeight.extrabold,
    color: colors.gray900,
  },
  footer: {
    paddingTop: spacing.md + 2,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    marginTop: spacing.md,
  },
  footerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.md + 2,
  },
  footerLabelLeft: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.gray400,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  footerSubtotal: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.black,
    color: colors.gray900,
  },
  footerRight: {
    alignItems: 'flex-end',
  },
  footerLabelRight: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.gray400,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  footerQty: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    color: colors.gray900,
  },
  addBtn: {
    flexDirection: 'row',
    backgroundColor: colors.darkGreen,
    borderRadius: borderRadius.lg,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnDisabled: {
    backgroundColor: colors.gray400,
  },
  addBtnText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.black,
    color: colors.white,
    letterSpacing: 0.5,
  },
  addBtnIcon: {
    marginRight: spacing.sm,
  },
});
