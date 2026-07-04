import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, Dialog, Portal } from 'react-native-paper';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../constants/theme';
import type { CartItem } from '../../hooks/useCashier';

interface EditQtyDialogProps {
  visible: boolean;
  onDismiss: () => void;
  item: CartItem | null;
  value: string;
  onChangeText: (text: string) => void;
  onSave: () => void;
}

export function EditQtyDialog({
  visible,
  onDismiss,
  item,
  value,
  onChangeText,
  onSave,
}: EditQtyDialogProps) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title style={styles.title}>
          Ubah Jumlah Komoditas
        </Dialog.Title>
        <Dialog.Content>
          <Text style={styles.itemName}>{item?.name}</Text>
          <TextInput
            label={`Jumlah (${item?.unit}) *`}
            value={value}
            onChangeText={onChangeText}
            keyboardType="numeric"
            mode="outlined"
            activeOutlineColor={colors.black}
            selectTextOnFocus
            style={styles.input}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} textColor={colors.gray600}>
            Batal
          </Button>
          <Button
            onPress={onSave}
            textColor={colors.white}
            style={styles.saveBtn}
            labelStyle={styles.saveBtnLabel}
          >
            Simpan
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    maxHeight: '80%',
  },
  title: {
    fontWeight: fontWeight.extrabold,
    fontSize: fontSize.xxl,
    color: colors.gray900,
  },
  itemName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.gray600,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  saveBtn: {
    backgroundColor: colors.black,
    borderRadius: borderRadius.md,
  },
  saveBtnLabel: {
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
});
