import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';
import { colors } from './src/utils/theme';

export default function App() {
  // Initialize auth token from storage when app starts
  useEffect(() => {
    const setupAuth = async () => {
      // No need to initialize the token anymore
      console.log('Authorization header is hardcoded.');
    };
    
    
    setupAuth();
  }, []);
  
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <StatusBar style="light" backgroundColor={colors.primary} />
          <AppNavigator />
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}