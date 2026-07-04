import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import CashierScreen from '../screens/CashierScreen';
import InventoryScreen from '../screens/InventoryScreen';
import ReportScreen from '../screens/ReportScreen';
import ProductFormScreen from '../screens/ProductFormScreen';
import TransactionListScreen from '../screens/TransactionListScreen';
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

const headerStyle = {
  backgroundColor: '#FFFFFF',
  elevation: 0,
  shadowOpacity: 0,
  borderBottomWidth: 0.5,
  borderBottomColor: '#E5E7EB',
};

const headerTitleStyle = {
  fontSize: 20,
  fontWeight: '600' as const,
  color: '#000000',
};

function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle,
        headerTitleStyle,
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          borderTopWidth: 0.5,
          elevation: 0,
          height: Platform.OS === 'android' ? 56 + insets.bottom : 60,
          paddingBottom: Platform.OS === 'android' ? insets.bottom : 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Cashier"
        component={CashierScreen}
        options={{
          title: 'WAROENG',
          tabBarLabel: 'Kasir',
          tabBarIcon: cashierIcon,
        }}
      />
      <Tab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          title: 'Produk',
          tabBarLabel: 'Produk',
          tabBarIcon: inventoryIcon,
        }}
      />
      <Tab.Screen
        name="Report"
        component={ReportScreen}
        options={{
          title: 'Laporan',
          tabBarLabel: 'Laporan',
          tabBarIcon: reportIcon,
        }}
      />
    </Tab.Navigator>
  );
}

const stackHeaderStyle = {
  backgroundColor: '#FFFFFF',
  elevation: 0,
  shadowOpacity: 0,
  borderBottomWidth: 0.5,
  borderBottomColor: '#E5E7EB',
};

function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen
        name="ProductForm"
        component={ProductFormScreen}
        options={({ route }) => ({
          headerShown: true,
          headerStyle: stackHeaderStyle,
          headerTitleStyle: {
            fontSize: 16,
            fontWeight: '800' as const,
            color: '#000000',
          },
          title: route.params?.itemId ? 'Edit Produk' : 'Tambah Produk',
          headerTintColor: '#000000',
        })}
      />
      <Stack.Screen
        name="TransactionList"
        component={TransactionListScreen}
        options={{
          headerShown: true,
          headerStyle: stackHeaderStyle,
          headerTitleStyle: {
            fontSize: 16,
            fontWeight: '800' as const,
            color: '#000000',
          },
          title: 'Riwayat Transaksi',
          headerTintColor: '#000000',
        }}
      />
    </Stack.Navigator>
  );
}

export default AppNavigator;
