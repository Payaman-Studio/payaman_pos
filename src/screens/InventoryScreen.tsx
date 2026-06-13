import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

function InventoryScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Inventory</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default InventoryScreen;
