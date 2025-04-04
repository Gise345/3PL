import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppSelector, useAppDispatch } from '../hooks/useRedux';
import { checkAuthState } from '../store/slices/authSlice';
import { RootStackParamList } from './types';

// Import screens
// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';

// Main screens
import HomeScreen from '../screens/home/HomeScreen';

// Inbound screens - these will be implemented later
import InboundScreen from '../screens/inbound/InboundScreen';
import UnknownInboundScreen from '../screens/inbound/UnkownInboundScreen';

// Outbound screens - these will be implemented later
import CarrierOutboundScreen from '../screens/outbound/CarrierOutboundScreen';
import AdHocOutboundScreen from '../screens/outbound/AdHocOutboundScreen';

// Cage Management screens - these will be implemented later
import ScanToCageScreen from '../screens/scan-to-cage/ScanToCageScreen';
import DispatchCagesScreen from '../screens/dispatch-cages/DispatchCagesScreen';

// Quality Control screens - these will be implemented later
import VendorOrderChecklistScreen from '../screens/vendor-checklist/VendorOrderChecklistScreen';

// Pallet Consolidation
import PalletConsolidationScreen from '../screens/pallet-consolidation/PalletConsolidationScreen';

// Create the stack navigator
const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  // Check auth state on app load
  useEffect(() => {
    dispatch(checkAuthState());
  }, [dispatch]);

  // If still checking auth state, could show a splash screen
  if (isLoading) {
    return null; // Or return a splash screen component
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{
          headerShown: false,
        }}
      >
        {!isAuthenticated ? (
          // Auth Screens
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          // Main App Screens when authenticated
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            
            {/* Inbound Screens */}
            <Stack.Screen name="Inbound" component={InboundScreen} />
            <Stack.Screen name="UnknownInbound" component={UnknownInboundScreen} />
            
            {/* Outbound Screens */}
            <Stack.Screen name="CarrierOutbound" component={CarrierOutboundScreen} />
            <Stack.Screen name="AdHocOutbound" component={AdHocOutboundScreen} />
            
            {/* Cage Management Screens */}
            <Stack.Screen name="ScanToCage" component={ScanToCageScreen} />
            <Stack.Screen name="DispatchCages" component={DispatchCagesScreen} />
            
            {/* Quality Control Screens */}
            <Stack.Screen name="VendorOrderChecklist" component={VendorOrderChecklistScreen} />

            {/* Pallet Consolidation Screens */}
            <Stack.Screen name="PalletConsolidation" component={PalletConsolidationScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;