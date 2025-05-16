import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';
import { colors } from './src/utils/theme';
import { ToastProvider } from './src/components/common';
import { initializeAuthToken } from './src/api/apiConfig';
import { useAppDispatch } from './src/hooks/useRedux';
import { checkAuthState } from './src/store/slices/authSlice';
import NetInfo from '@react-native-community/netinfo';

// Internal App component with access to Redux hooks
const InternalApp = () => {
  const dispatch = useAppDispatch();
  
  // Initialize authentication on app start
  useEffect(() => {
    const setupAuth = async () => {
      // Initialize token from storage
      await initializeAuthToken();
      
      // Check authentication state
      dispatch(checkAuthState());
      
      // Set up network change listener
      const unsubscribe = NetInfo.addEventListener(state => {
        // When connection is restored, check auth state again
        if (state.isConnected) {
          dispatch(checkAuthState());
        }
      });
      
      // Clean up network listener on unmount
      return () => {
        unsubscribe();
      };
    };
    
    setupAuth();
  }, [dispatch]);
  
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={colors.primary} />
      <ToastProvider>
        <AppNavigator />
      </ToastProvider>
    </SafeAreaProvider>
  );
};

// Main app component
export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <InternalApp />
      </PersistGate>
    </Provider>
  );
}