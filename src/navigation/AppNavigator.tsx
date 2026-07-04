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
import PaymentScreen from '../screens/PaymentScreen';
import { RootTabParamList, RootStackParamList } from './types';
import { colors } from '../constants/theme';

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
  backgroundColor: colors.white,
  elevation: 0,
  shadowOpacity: 0,
  borderBottomWidth: 0.5,
  borderBottomColor: colors.gray200,
};

const headerTitleStyle = {
  fontSize: 20,
  fontWeight: '600' as const,
  color: colors.black,
};

function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle,
        headerTitleStyle,
        tabBarActiveTintColor: colors.black,
        tabBarInactiveTintColor: colors.gray400,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.gray200,
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
          headerShown: false,
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

function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ProductForm"
        component={ProductFormScreen}
        options={({ route }) => ({
          title: route.params?.itemId ? 'Edit Produk' : 'Tambah Produk',
          headerTintColor: colors.black,
        })}
      />
      <Stack.Screen
        name="TransactionList"
        component={TransactionListScreen}
        options={{
          title: 'Riwayat Transaksi',
          headerTintColor: colors.black,
        }}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
}

export default AppNavigator;
