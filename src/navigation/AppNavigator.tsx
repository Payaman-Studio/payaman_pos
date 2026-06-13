import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import CashierScreen from '../screens/CashierScreen';
import InventoryScreen from '../screens/InventoryScreen';
import ReportScreen from '../screens/ReportScreen';
import { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

const cashierIcon = ({ color, size }: { color: string; size: number }) => (
  <Icon name="cash-register" color={color} size={size} />
);

const inventoryIcon = ({ color, size }: { color: string; size: number }) => (
  <Icon name="package-variant-closed" color={color} size={size} />
);

const reportIcon = ({ color, size }: { color: string; size: number }) => (
  <Icon name="chart-bar" color={color} size={size} />
);

function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Cashier"
        component={CashierScreen}
        options={{
          tabBarLabel: 'Cashier',
          tabBarIcon: cashierIcon,
        }}
      />
      <Tab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          tabBarLabel: 'Inventory',
          tabBarIcon: inventoryIcon,
        }}
      />
      <Tab.Screen
        name="Report"
        component={ReportScreen}
        options={{
          tabBarLabel: 'Report',
          tabBarIcon: reportIcon,
        }}
      />
    </Tab.Navigator>
  );
}

export default AppNavigator;
