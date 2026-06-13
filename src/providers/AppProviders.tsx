import { PropsWithChildren, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';

import { getDatabase } from '../database';
import { isDatabaseReadyAtom } from '../store';
import AppNavigator from '../navigation/AppNavigator';

const queryClient = new QueryClient();

function DatabaseInitializer({ children }: PropsWithChildren) {
  const setIsDatabaseReady = useSetAtom(isDatabaseReadyAtom);

  useEffect(() => {
    getDatabase()
      .then(() => setIsDatabaseReady(true))
      .catch(console.error);
  }, [setIsDatabaseReady]);

  return <>{children}</>;
}

function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider>
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
