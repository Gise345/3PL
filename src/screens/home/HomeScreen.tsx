import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Page, Button } from '../../components/common';
import { colors, typography, spacing } from '../../utils/theme';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { logout } from '../../store/slices/authSlice';
import { setWarehouse, setWifiStatus } from '../../store/slices/settingsSlice';
import { HomeScreenProps } from '../../navigation/types';

// Define styles outside the component
const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: spacing.md,
  },
  warehouseSelector: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  warehouseOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  selectedWarehouse: {
    backgroundColor: colors.primary,
  },
  warehouseText: {
    fontSize: typography.fontSizes.medium,
    color: colors.text,
  },
  selectedWarehouseText: {
    color: colors.background,
    fontWeight: typography.fontWeights.bold as any,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.medium,
    fontWeight: typography.fontWeights.bold as any,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  button: {
    marginBottom: spacing.sm,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  userEmail: {
    fontSize: typography.fontSizes.medium,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  logoutButton: {
    width: 100,
    marginVertical: spacing.md,
  },
  version: {
    fontSize: typography.fontSizes.small,
    color: colors.textLight,
    marginTop: spacing.md,
  },
  wifiContainer: {
    marginTop: spacing.sm,
  },
  wifiStatus: {
    fontSize: typography.fontSizes.small,
    color: colors.textLight,
  },
});

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { warehouse, isWifiConnected, ssid } = useAppSelector((state) => state.settings);
  
  // Warehouses array
  const warehouses = ['TFH', 'RDC'];
  
  // Simulating WiFi check - in a real app, you would use a native module
  useEffect(() => {
    const checkWifiConnection = async () => {
      try {
        // Simulate connection check
        const connected = true;
        const wifiSsid = connected ? '3PL' : '';
        
        dispatch(setWifiStatus({ connected, ssid: wifiSsid }));
      } catch (error) {
        console.error('Error checking WiFi:', error);
        Alert.alert('Error', 'Failed to check WiFi connection');
      }
    };
    
    checkWifiConnection();
  }, [dispatch]);
  
  // Handle warehouse selection
  const handleWarehouseSelect = (selectedWarehouse: string) => {
    dispatch(setWarehouse(selectedWarehouse));
  };
  
  // Handle logout
  const handleLogout = () => {
    dispatch(logout());
  };
  
  // Navigate to screens
  const navigateTo = (screen: keyof HomeScreenProps['navigation']['navigate']) => {
    navigation.navigate(screen);
  };

  return (
    <Page title="3PL Door App" showHeader showBackButton={false}>
      <View style={styles.content}>
        {/* Warehouse Selector */}
        <View style={styles.warehouseSelector}>
          {warehouses.map((wh) => (
            <TouchableOpacity
              key={wh}
              style={[
                styles.warehouseOption,
                warehouse === wh && styles.selectedWarehouse,
              ]}
              onPress={() => handleWarehouseSelect(wh)}
            >
              <Text
                style={[
                  styles.warehouseText,
                  warehouse === wh && styles.selectedWarehouseText,
                ]}
              >
                {wh}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Main Navigation Buttons */}
        <View style={styles.section}>
          <Button 
            title="Inbound" 
            onPress={() => navigateTo('Inbound')} 
            style={styles.button}
          />
          <Button 
            title="Carrier Load Out" 
            onPress={() => navigateTo('CarrierOutbound')} 
            style={styles.button}
          />
          <Button 
            title="Ad-Hoc Load Out" 
            onPress={() => navigateTo('AdHocOutbound')} 
            style={styles.button}
          />
        </View>

        {/* Cage Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scan2Cage</Text>
          <Button 
            title="Scan To Cage" 
            onPress={() => navigateTo('ScanToCage')} 
            style={styles.button}
          />
          <Button 
            title="Dispatch Cages" 
            onPress={() => navigateTo('DispatchCages')} 
            style={styles.button}
          />
        </View>
        
        {/* Build Pallet */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Build Pallet</Text>
          <Button 
            title="Pallet Consolidation" 
            onPress={() => navigateTo('PalletConsolidation')} 
            style={styles.button}
          />
        </View>

        {/* Quality Control */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QC</Text>
          <Button 
            title="Vendor Order Checklist" 
            onPress={() => navigateTo('VendorOrderChecklist')} 
            style={styles.button}
          />
        </View>

        {/* User Info & Logout */}
        <View style={styles.footer}>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <Button 
            title="Logout" 
            onPress={handleLogout} 
            variant="outline"
            style={styles.logoutButton}
          />
          <Text style={styles.version}>v1.0.0</Text>
          
          {/* WiFi Status */}
          <View style={styles.wifiContainer}>
            <Text style={styles.wifiStatus}>
              WiFi: {isWifiConnected ? 'Connected' : 'Disconnected'}
              {isWifiConnected && ssid ? ` (${ssid})` : ''}
            </Text>
          </View>
        </View>
      </View>
    </Page>
  );
};

export default HomeScreen;