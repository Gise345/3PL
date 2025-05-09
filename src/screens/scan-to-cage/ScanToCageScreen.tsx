import React, { useState, useEffect, useRef } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, TextInput, ActivityIndicator, TouchableOpacity, ViewStyle, StatusBar, SafeAreaView } from 'react-native';
import { useAppSelector } from '../../hooks';
import { useToast } from '../../components/common/ToastProvider';
import { ScanToCageScreenProps } from '../../navigation/types';
import { Page, Input, Button, BarcodeScannerModal, Card } from '../../components/common';
import { MaterialIcons } from '@expo/vector-icons';
import WarehouseOperatorSelector from './WarehouseOperatorSelector';
import OrderDetails from './OrderDetails';
import { warehouseService } from '../../api/warehouseService';
import { Operator } from '../../types/warehouse';
import { styles } from './styles';
import { colors } from '../../utils/theme';
import audioService from '../../utils/audioService';
const ScanToCageScreen: React.FC<ScanToCageScreenProps> = ({ navigation }) => {
  const { warehouse } = useAppSelector((state) => state.settings);
  const { showToast } = useToast();
  
  // Operator state
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [showOperatorSelector, setShowOperatorSelector] = useState(false);
  
  // Scanning state
  const [trackingNumber, setTrackingNumber] = useState('');
  const [cageId, setCageId] = useState('');
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanTarget, setScanTarget] = useState<'tracking' | 'cage'>('tracking');
  
  // Refs for text inputs
  const trackingInputRef = useRef<TextInput>(null);
  const cageInputRef = useRef<TextInput>(null);
  
  // Sound effects
  const [soundEnabled] = useState(true);

  const isCompleteScan = (text: string): boolean => {
    // Customize this based on your barcode format patterns
    // Most scanners append an Enter key, but this checks for typical barcode formats
    return text.length >= 8 && /^[A-Z0-9]+$/.test(text);
  };
  
  // Enhanced tracking number input handler
  const handleTrackingInput = (text: string) => {
    setTrackingNumber(text);
    
    // Auto-submit if the input appears to be a complete scan
    if (isCompleteScan(text)) {
      handleGetOrderInfo(text);
    }
  };
  
  // Enhanced cage ID input handler
  const handleCageInput = (text: string) => {
    setCageId(text);
    
    // Auto-submit if the input appears to be a complete scan
    if (isCompleteScan(text) && trackingNumber && orderDetails) {
      handleScanToCage(text);
    }
  };

  // Play success/error sound
  const playSound = async (type: 'success' | 'error') => {
    if (!soundEnabled) return;
    
    await audioService.initialize();
    await audioService.playSound(type);
  };

  // Handle tracking number scan
  const handleTrackingNumberScanned = (scannedValue: string) => {
    setTrackingNumber(scannedValue);
    setShowScanner(false);
    handleGetOrderInfo(scannedValue);
  };

  // Handle cage ID scan
  const handleCageIdScanned = (scannedValue: string) => {
    setCageId(scannedValue);
    setShowScanner(false);
    if (trackingNumber && orderDetails) {
      handleScanToCage(scannedValue);
    } else {
      cageInputRef.current?.blur();
      setTimeout(() => trackingInputRef.current?.focus(), 100);
    }
  };

  // Get order info for tracking number
  const handleGetOrderInfo = async (trackingNum: string = trackingNumber) => {
    if (!trackingNum) {
      setError('Please enter a tracking number');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const result = await warehouseService.checkOrderDetails(trackingNum);
      setOrderDetails(result);
      setLoading(false);
      
      // Focus cage input
      setTimeout(() => cageInputRef.current?.focus(), 100);
    } catch (err: any) {
      setLoading(false);
      setOrderDetails(null);
      setError(err.response?.data?.message || 'Failed to get order details');
      playSound('error');
    }
  };

  // Handle scan to cage
  const handleScanToCage = async (cageIdValue: string = cageId) => {
    if (!selectedOperator) {
      setError('Please select an operator first');
      return;
    }

    if (!trackingNumber) {
      setError('Please enter a tracking number');
      trackingInputRef.current?.focus();
      return;
    }

    if (!cageIdValue) {
      setError('Please enter a cage ID');
      cageInputRef.current?.focus();
      return;
    }

    if (!orderDetails) {
      handleGetOrderInfo();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const result = await warehouseService.scanToCage({
        orderTrackNumber: trackingNumber,
        operatorId: selectedOperator.id,
        cageId: cageIdValue,
        warehouse,
      });
      
      setLoading(false);
      setSuccess(result.data);
      playSound('success');
      
      // Show success toast
      showToast({
        type: 'success',
        message: result.data || 'Successfully scanned to cage',
        duration: 3000,
      });
      
      // Reset fields for next scan
      setTrackingNumber('');
      setCageId('');
      setOrderDetails(null);
      
      // Focus tracking number input for next scan
      setTimeout(() => trackingInputRef.current?.focus(), 100);
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.response?.data?.message || 'Failed to scan to cage';
      setError(errorMessage);
      playSound('error');
      
      // Show error toast
      showToast({
        type: 'error',
        message: errorMessage,
        duration: 5000,
      });
    }
  };

  // Handle operator selection
  const handleOperatorSelected = (operator: Operator) => {
    setSelectedOperator(operator);
    setShowOperatorSelector(false);
    
    // Focus tracking number input
    setTimeout(() => trackingInputRef.current?.focus(), 100);
  };

  // Reset operator selection
  const handleResetOperator = () => {
    setSelectedOperator(null);
  };

  // Handle barcode scanner button press
  const handleScanButtonPress = (target: 'tracking' | 'cage') => {
    setScanTarget(target);
    setShowScanner(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
  <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
  
  {/* Header */}
  <View style={styles.header}>
    <TouchableOpacity
      style={styles.backButton}
      onPress={() => navigation.goBack()}
      activeOpacity={0.7}
    >
      <Text style={styles.backButtonText}>←</Text>
    </TouchableOpacity>
    
    <Text style={styles.headerTitle}>
      <Text style={styles.headerTitleText}>Scan To Cage </Text>
      <Text style={[styles.headerTitleText, styles.warehouseText]}>({warehouse})</Text>
    </Text>
    
    <View style={styles.headerPlaceholder} />
  </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {!selectedOperator ? (
          <View style={styles.operatorSection}>
            <Card style={styles.card}>
              <Button
                title="Select Operator"
                onPress={() => setShowOperatorSelector(true)}
                icon={<MaterialIcons name="person" size={24} color={colors.background} />}
              />
            </Card>
          </View>
        ) : (
          <View style={styles.scanningSection}>
            {/* Operator info */}
            <Card style={styles.card}>
              <View style={styles.selectedOperatorContainer}>
                <View style={styles.operatorInfo}>
                  <MaterialIcons name="person" size={24} color={colors.primary} style={styles.operatorIcon} />
                  <View>
                    <View style={styles.operatorNameContainer}>
                      <Text style={styles.operatorName}>
                        {selectedOperator.operator_first_name} {selectedOperator.operator_last_name}
                      </Text>
                      <MaterialIcons name="verified" size={16} color={colors.primary} style={styles.verifiedIcon} />
                    </View>
                    <Text style={styles.operatorId}>ID: {selectedOperator.id}</Text>
                  </View>
                </View>
                <Button
                  title="Change"
                  variant="outline"
                  small
                  onPress={handleResetOperator}
                  icon={<MaterialIcons name="edit" size={16} color={colors.primary} />}
                  style={styles.changeOperatorButton}
                />
              </View>
            </Card>

            {/* Tracking Number Input */}
            <View style={styles.inputSection}>
              <View style={styles.inputContainer}>
                <Input
                  label="Tracking Number"
                  value={trackingNumber}
                  onChangeText={handleTrackingInput}
                  ref={trackingInputRef}
                  returnKeyType="go"
                  onSubmitEditing={() => handleGetOrderInfo()}
                  autoCapitalize="characters"
                  blurOnSubmit={false}
                  selectTextOnFocus={true}
                />
                <TouchableOpacity 
                  style={styles.scanButton}
                  onPress={() => handleScanButtonPress('tracking')}
                >
                  <MaterialIcons name="qr-code-scanner" size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {/* Cage ID Input */}
              <View style={styles.inputContainer}>
              <Input
                label="Cage ID"
                value={cageId}
                onChangeText={handleCageInput}
                ref={cageInputRef}
                returnKeyType="go"
                onSubmitEditing={() => handleScanToCage()}
                autoCapitalize="characters"
                blurOnSubmit={false}
                selectTextOnFocus={true}
              />
                <TouchableOpacity 
                  style={styles.scanButton}
                  onPress={() => handleScanButtonPress('cage')}
                >
                  <MaterialIcons name="qr-code-scanner" size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <Button
                title="Submit"
                onPress={() => handleScanToCage()}
                disabled={loading || !trackingNumber || !cageId}
              />
            </View>

            {/* Order Details */}
            {orderDetails && (
              <OrderDetails orderDetails={orderDetails} trackingNumber={trackingNumber} />
            )}

            {/* Error and Success Messages */}
            {loading && (
              <View style={styles.messageContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}
            
            {error && (
              <Card style={{...styles.messageCard, ...styles.errorCard} as ViewStyle}>
                <View style={styles.messageContent}>
                  <MaterialIcons name="error" size={24} color={colors.error} style={styles.messageIcon} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              </Card>
            )}
            
            {success && (
              <Card style={{...styles.messageCard, ...styles.successCard} as ViewStyle}>
                <View style={styles.messageContent}>
                  <MaterialIcons name="check-circle" size={24} color={colors.success} style={styles.messageIcon} />
                  <Text style={styles.successText}>{success}</Text>
                </View>
              </Card>
            )}
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onBarcodeScanned={scanTarget === 'tracking' ? handleTrackingNumberScanned : handleCageIdScanned}
        title={scanTarget === 'tracking' ? 'Scan Tracking Number' : 'Scan Cage ID'}
      />

      {/* Operator Selector */}
      <WarehouseOperatorSelector
        visible={showOperatorSelector}
        onClose={() => setShowOperatorSelector(false)}
        onSelectOperator={handleOperatorSelected}
      />
    </SafeAreaView>
  );
};

export default ScanToCageScreen;