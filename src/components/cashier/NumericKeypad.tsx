import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing } from '../../constants/theme';

interface NumericKeypadProps {
  onPress: (key: string) => void;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'backspace'];

export function NumericKeypad({ onPress }: NumericKeypadProps) {
  return (
    <View style={styles.grid}>
      {KEYS.map(key => (
        <TouchableOpacity
          key={key}
          style={[styles.key, key === 'backspace' && styles.keyDelete]}
          onPress={() => onPress(key)}
          activeOpacity={0.6}
        >
          {key === 'backspace' ? (
            <Icon name="backspace-outline" size={22} color={colors.red500} />
          ) : (
            <Text style={styles.keyText}>{key}</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  key: {
    width: '30.5%',
    height: 60,
    backgroundColor: colors.gray100,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyDelete: {
    backgroundColor: colors.red50,
  },
  keyText: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.gray900,
  },
});
