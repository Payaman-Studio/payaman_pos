import { NavigatorScreenParams } from '@react-navigation/native';

export type RootTabParamList = {
  Cashier: undefined;
  Inventory: undefined;
  Report: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<RootTabParamList>;
  ProductForm: {
    itemId?: string;
    itemType?: 'PRODUCT' | 'COMMODITY';
  } | undefined;
  TransactionList: undefined;
};
