import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import CashierScreen from '../screens/CashierScreen';
import InventoryScreen from '../screens/InventoryScreen';
import ReportScreen from '../screens/ReportScreen';
import ProductFormScreen from '../screens/ProductFormScreen';
import { RootTabParamList, RootStackParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const cashierIcon = ({ color, size }: { color: string; size: number }) => (
  <Icon name="cash-register" color={color} size={size} />
);

const inventoryIcon = ({ color, size }: { color: string; size: number }) => (
  <Icon name="package-variant-closed" color={color} size={size} />
);

const reportIcon = ({ color, size }: { color: string; size: number }) => (
  <Icon name="chart-bar" color={color} size={size} />
);

function TabNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.elevation.level2,
          borderTopColor: theme.colors.outlineVariant,
          borderTopWidth: 0.5,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Cashier"
        component={CashierScreen}
        options={{
          tabBarLabel: 'Kasir',
          tabBarIcon: cashierIcon,
        }}
      />
      <Tab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          tabBarLabel: 'Inventori',
          tabBarIcon: inventoryIcon,
        }}
      />
      <Tab.Screen
        name="Report"
        component={ReportScreen}
        options={{
          tabBarLabel: 'Laporan',
          tabBarIcon: reportIcon,
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="ProductForm" component={ProductFormScreen} />
    </Stack.Navigator>
  );
}

export default AppNavigator;
