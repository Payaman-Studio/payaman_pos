import { PropsWithChildren, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';

import { getDatabase } from '../database';
import { isDatabaseReadyAtom } from '../store';
import AppNavigator from '../navigation/AppNavigator';

const queryClient = new QueryClient();

const theme = {
  ...MD3LightTheme,
};

function DatabaseInitializer({ children }: PropsWithChildren) {
  const setIsDatabaseReady = useSetAtom(isDatabaseReadyAtom);

  useEffect(() => {
    getDatabase();
    setIsDatabaseReady(true);
  }, [setIsDatabaseReady]);

  return <>{children}</>;
}

function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <DatabaseInitializer>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </DatabaseInitializer>
      </PaperProvider>
    </QueryClientProvider>
  );
}

export default AppProviders;
