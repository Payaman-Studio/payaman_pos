import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, fontSize, fontWeight } from '../../constants/theme';

const ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface AlphabetIndexProps {
  activeLetters: string[];
  onLetterPress: (letter: string) => void;
}

function AlphabetIndex({ activeLetters, onLetterPress }: AlphabetIndexProps) {
  const activeSet = new Set(activeLetters);

  return (
    <View style={styles.container}>
      {ALL_LETTERS.map(letter => {
        const isActive = activeSet.has(letter);
        return (
          <TouchableOpacity
            key={letter}
            activeOpacity={isActive ? 0.6 : 1}
            onPress={() => isActive && onLetterPress(letter)}
            style={styles.letterBtn}
          >
            <Text
              style={[
                styles.letter,
                isActive ? styles.letterActive : styles.letterInactive,
              ]}
            >
              {letter}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 2,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
  },
  letterBtn: {
    width: 20,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  letter: {
    fontSize: fontSize.xs,
    lineHeight: 12,
  },
  letterActive: {
    color: colors.gray700,
    fontWeight: fontWeight.bold,
  },
  letterInactive: {
    color: colors.gray300,
  },
});

export default AlphabetIndex;
