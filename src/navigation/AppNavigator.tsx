import { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomNavigation } from 'react-native-paper';

import CashierScreen from '../screens/CashierScreen';
import InventoryScreen from '../screens/InventoryScreen';
import ReportScreen from '../screens/ReportScreen';
import ProductFormScreen from '../screens/ProductFormScreen';
import TransactionListScreen from '../screens/TransactionListScreen';
import TransactionDetailScreen from '../screens/TransactionDetailScreen';
import PaymentScreen from '../screens/PaymentScreen';
import { RootStackParamList } from './types';
import { colors } from '../constants/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const headerStyle = {
  backgroundColor: colors.white,
  /* elevation: 0,
  shadowOpacity: 0,
  borderBottomWidth: 0.5,
  borderBottomColor: colors.gray200, */
};

const headerTitleStyle = {
  fontSize: 20,
  fontWeight: '600' as const,
  color: colors.black,
};

function TabNavigator() {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    {
      key: 'Cashier',
      title: 'Kasir',
      focusedIcon: 'cash-register',
    },
    {
      key: 'Inventory',
      title: 'Produk',
      focusedIcon: 'package-variant-closed',
    },
    {
      key: 'Report',
      title: 'Laporan',
      focusedIcon: 'chart-bar',
    },
  ]);

  return (
    <BottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={BottomNavigation.SceneMap({
        Cashier: CashierScreen,
        Inventory: InventoryScreen,
        Report: ReportScreen,
      })}
      activeIndicatorStyle={{ backgroundColor: colors.green100 }}
      barStyle={{ backgroundColor: colors.white }}
    />
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
          headerStyle,
          headerTitleStyle,
        })}
      />
      <Stack.Screen
        name="TransactionList"
        component={TransactionListScreen}
        options={{
          title: 'Riwayat Transaksi',
          headerTintColor: colors.black,
          headerStyle,
          headerTitleStyle,
        }}
      />
      <Stack.Screen
        name="TransactionDetail"
        component={TransactionDetailScreen}
        options={{
          title: 'Detail Transaksi',
          headerTintColor: colors.black,
          headerStyle,
          headerTitleStyle,
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
