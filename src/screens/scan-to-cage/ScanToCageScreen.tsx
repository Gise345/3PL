import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  Animated,
  Keyboard,
  ScrollView
} from 'react-native';
import { Page } from '../../components/common';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../utils/theme';
import { warehouseService } from '../../api/warehouseService';
import { useAppSelector } from '../../hooks';
import { BarcodeScannerModal } from '../../components/common/barcode';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';


// Define the Operator interface
interface Operator {
  id: number;
  operator_first_name: string;
  operator_last_name: string;
}

const ScanToCageScreen: React.FC = () => {
  // Animation values
  const [fadeIn] = useState(new Animated.Value(0));
  const [slideUp] = useState(new Animated.Value(30));
  const [titleScale] = useState(new Animated.Value(0.95));

  // State
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [filteredOperators, setFilteredOperators] = useState<Operator[]>([]);
  const [searchOperator, setSearchOperator] = useState('');
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [cageId, setCageId] = useState('');
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loadedTrackingNumber, setLoadedTrackingNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [activeInput, setActiveInput] = useState<'tracking' | 'cage'>('tracking');
  const [checkingOrder, setCheckingOrder] = useState(false);
  const [scanningToCage, setScanningToCage] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  
  // Refs for TextInput focus management
  const trackingInputRef = useRef<TextInput>(null);
  const cageInputRef = useRef<TextInput>(null);
  
  // Get warehouse from Redux store
  const { warehouse } = useAppSelector(state => state.settings);
  
  // Set up animations on component mount
  useEffect(() => {
    // Animate components on mount
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(titleScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
    
    // Load sounds
    loadSounds();
    
    return () => {
      // Cleanup
      unloadSounds();
    };
  }, []);
  
  // Load operators on component mount
  useEffect(() => {
    loadOperators();
  }, []);
  
  // Filter operators when search changes
  useEffect(() => {
    if (searchOperator) {
      const lowercaseSearch = searchOperator.toLowerCase();
      const filtered = operators.filter(
        op => 
          op.operator_first_name.toLowerCase().includes(lowercaseSearch) || 
          op.operator_last_name.toLowerCase().includes(lowercaseSearch)
      );
      setFilteredOperators(filtered);
    } else {
      setFilteredOperators(operators);
    }
  }, [searchOperator, operators]);

  // Auto-focus tracking input when selected operator changes
  useEffect(() => {
    if (selectedOperator) {
      setTimeout(() => trackingInputRef.current?.focus(), 100);
    }
  }, [selectedOperator]);
  
  // Sound handling functions
  const loadSounds = async () => {
    try {
      const sound = new Audio.Sound();
      await sound.loadAsync(require('../../../assets/sounds/beep.mp3'));
      setSound(sound);
    } catch (error) {
      console.error('Error loading sounds:', error);
    }
  };

  const unloadSounds = async () => {
    if (sound) {
      await sound.unloadAsync();
    }
  };

  const playSuccessSound = async () => {
    try {
      if (sound) {
        await sound.setPositionAsync(0);
        await sound.playAsync();
        
        // Haptic feedback
        if (Haptics) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const playErrorSound = async () => {
    try {
      if (sound) {
        await sound.setPositionAsync(0);
        await sound.playAsync();
        
        // Haptic feedback
        if (Haptics) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };
  
  // Load warehouse operators from the API
  const loadOperators = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await warehouseService.getWarehouseOperators();
      setOperators(data);
      setFilteredOperators(data);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setError('Failed to load operators: ' + (err.message || 'Unknown error'));
    }
  };
  
  // Select an operator
  const handleSelectOperator = (operator: Operator) => {
    if (Haptics) {
      Haptics.selectionAsync();
    }
    setSelectedOperator(operator);
    setActiveInput('tracking');
  };
  
  // Go back to operator selection
  const handleChangeOperator = () => {
    if (Haptics) {
      Haptics.selectionAsync();
    }
    setSelectedOperator(null);
    resetFormState();
  };

  // Reset form state
  const resetFormState = () => {
    setTrackingNumber('');
    setCageId('');
    setOrderDetails(null);
    setLoadedTrackingNumber(null);
    setError(null);
    setSuccess(null);
    setActiveInput('tracking');
  };
  
  // Get order info based on tracking number
  const getOrderInfo = async () => {
    if (!trackingNumber || checkingOrder) return;
    
    setCheckingOrder(true);
    setError(null);
    setSuccess(null);
    
    try {
      const orderData = await warehouseService.checkOrderDetails(trackingNumber);
      setOrderDetails(orderData);
      setLoadedTrackingNumber(trackingNumber);
      setActiveInput('cage');
      
      // Focus cage ID input after success
      setTimeout(() => {
        cageInputRef.current?.focus();
      }, 100);
      
      playSuccessSound();
    } catch (err: any) {
      setOrderDetails(null);
      setError(err.response?.data?.message || 'Failed to check order details');
      playErrorSound();
      
      // Clear tracking number and re-focus
      setTrackingNumber('');
      setTimeout(() => trackingInputRef.current?.focus(), 100);
    } finally {
      setCheckingOrder(false);
    }
  };
  
  // Scan to cage
  const scanToCage = async () => {
    if (!selectedOperator || !trackingNumber || !cageId || scanningToCage) return;
    
    setScanningToCage(true);
    setError(null);
    setSuccess(null);
    Keyboard.dismiss();
    
    try {
      const result = await warehouseService.scanToCage({
        orderTrackNumber: trackingNumber,
        operatorId: selectedOperator.id,
        cageId: cageId,
        warehouse: warehouse,
      });
      
      setSuccess(result.data);
      playSuccessSound();
      
      // Reset for next scan
      setTrackingNumber('');
      setCageId('');
      setOrderDetails(null);
      setLoadedTrackingNumber(null);
      
      // Focus tracking input for next scan
      setActiveInput('tracking');
      setTimeout(() => trackingInputRef.current?.focus(), 100);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to scan to cage');
      playErrorSound();
    } finally {
      setScanningToCage(false);
    }
  };
  
  // Open barcode scanner
  const openScanner = (input: 'tracking' | 'cage') => {
    setActiveInput(input);
    setShowBarcodeScanner(true);
    if (Haptics) {
      Haptics.selectionAsync();
    }
  };
  
  // Handle barcode scan result
  const handleBarcodeScan = (barcode: string) => {
    setShowBarcodeScanner(false);
    
    if (activeInput === 'tracking') {
      setTrackingNumber(barcode);
      // Auto-process the tracking number
      setTimeout(() => getOrderInfo(), 300);
    } else {
      setCageId(barcode);
      // Auto-submit if we have all data
      if (trackingNumber && selectedOperator) {
        setTimeout(() => scanToCage(), 300);
      }
    }
  };
  
  // Focus management
  const handleInputFocus = (input: 'tracking' | 'cage') => {
    setActiveInput(input);
  };
  
  // Handle tracking input submission
  const handleTrackingSubmit = () => {
    if (trackingNumber) {
      getOrderInfo();
    }
  };
  
  // Handle cage ID submission
  const handleCageSubmit = () => {
    if (trackingNumber && cageId) {
      scanToCage();
    }
  };
  
  // Render operator selection screen
  const renderOperatorSelection = () => (
    <Animated.View 
      style={{ 
        opacity: fadeIn,
        transform: [{ translateY: slideUp }],
        flex: 1,
      }}
    >
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Select Operator</Text>
        
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <MaterialIcons name="search" size={24} color={colors.textLight} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchOperator}
              onChangeText={setSearchOperator}
              placeholder="Search operators..."
              placeholderTextColor={colors.textLight}
            />
          </View>
        </View>
        
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : filteredOperators.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateIcon}>🔍</Text>
            <Text style={styles.emptyStateTitle}>
              {searchOperator ? `No operators matching "${searchOperator}"` : "No operators available"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredOperators}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.operatorItem}
                onPress={() => handleSelectOperator(item)}
                activeOpacity={0.7}
              >
                <View style={styles.operatorCard}>
                  <Text style={styles.operatorName}>
                    {item.operator_first_name} {item.operator_last_name}
                  </Text>
                  <MaterialIcons name="chevron-right" size={24} color={colors.primary} />
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </Animated.View>
  );
  
  // Render main scan to cage form
  const renderScanToCageForm = () => (
    <Animated.View 
      style={{ 
        opacity: fadeIn,
        transform: [{ translateY: slideUp }],
        flex: 1,
      }}
    >
      {/* Selected Operator */}
      <View style={styles.operatorHeader}>
        <View style={styles.selectedOperatorContent}>
          <View style={styles.operatorInfoRow}>
            <MaterialIcons name="person" size={20} color={colors.primary} style={styles.operatorIcon} />
            <Text style={styles.selectedOperatorText}>
              {selectedOperator?.operator_first_name} {selectedOperator?.operator_last_name}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.changeOperatorButton}
            onPress={handleChangeOperator}
          >
            <Text style={styles.changeOperatorText}>Change</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Tracking Number Section */}
      <View style={[styles.sectionCard, activeInput === 'tracking' && styles.activeSection]}>
        <Text style={styles.inputLabel}>
          <MaterialIcons name="qr-code" size={18} color={colors.text} style={styles.inputIcon} />
          Tracking Number
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            ref={trackingInputRef}
            style={[
              styles.input,
              activeInput === 'tracking' && styles.activeInput
            ]}
            value={trackingNumber}
            onChangeText={setTrackingNumber}
            placeholder="Enter tracking number"
            placeholderTextColor={colors.textLight}
            onFocus={() => handleInputFocus('tracking')}
            onSubmitEditing={handleTrackingSubmit}
            returnKeyType="go"
            blurOnSubmit={false}
          />
          <TouchableOpacity 
            style={styles.scanButton}
            onPress={() => openScanner('tracking')}
          >
            <MaterialIcons name="qr-code-scanner" size={20} color="white" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.actionButton,
            (!trackingNumber || checkingOrder) && styles.disabledButton
          ]}
          onPress={getOrderInfo}
          disabled={!trackingNumber || checkingOrder}
        >
          {checkingOrder ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <MaterialIcons name="search" size={18} color="white" style={styles.buttonIcon} />
              <Text style={styles.actionButtonText}>Check Order</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Cage ID Section */}
      <View style={[styles.sectionCard, activeInput === 'cage' && styles.activeSection]}>
        <Text style={styles.inputLabel}>
          <MaterialIcons name="inventory-2" size={18} color={colors.text} style={styles.inputIcon} />
          Cage ID
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            ref={cageInputRef}
            style={[
              styles.input,
              activeInput === 'cage' && styles.activeInput
            ]}
            value={cageId}
            onChangeText={setCageId}
            placeholder="Enter cage ID"
            placeholderTextColor={colors.textLight}
            onFocus={() => handleInputFocus('cage')}
            onSubmitEditing={handleCageSubmit}
            returnKeyType="go"
            autoCapitalize="characters"
          />
          <TouchableOpacity 
            style={styles.scanButton}
            onPress={() => openScanner('cage')}
          >
            <MaterialIcons name="qr-code-scanner" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Order Details */}
      {orderDetails && (
        <View style={styles.sectionCard}>
          <View style={styles.orderDetailsHeader}>
            <MaterialIcons name="info" size={20} color={colors.primary} />
            <Text style={styles.orderDetailsTitle}>Order Details</Text>
          </View>
          
          <View style={styles.orderDetailsRow}>
            <Text style={styles.orderDetailsLabel}>Address:</Text>
            <Text style={styles.orderDetailsText}>{orderDetails.ShipAddress[0].Name}</Text>
          </View>
          <View style={styles.orderDetailsRow}>
            <Text style={styles.orderDetailsLabel}>Order Number:</Text>
            <Text style={styles.orderDetailsText}>{orderDetails.ShipmentId}</Text>
          </View>
          <View style={styles.orderDetailsRow}>
            <Text style={styles.orderDetailsLabel}>Carrier:</Text>
            <Text style={styles.orderDetailsText}>{orderDetails.CarrierId}</Text>
          </View>
          <View style={styles.orderDetailsRow}>
            <Text style={styles.orderDetailsLabel}>Tracking:</Text>
            <Text style={styles.orderDetailsText}>{loadedTrackingNumber}</Text>
          </View>
        </View>
      )}
      
      {/* Error/Success Message */}
      {error && (
        <View style={styles.messageCard}>
          <View style={styles.errorCardContent}>
            <MaterialIcons name="error" size={20} color={colors.error} style={styles.messageIcon} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </View>
      )}
      
      {success && (
        <View style={styles.messageCard}>
          <View style={styles.successCardContent}>
            <MaterialIcons name="check-circle" size={20} color="#4CD964" style={styles.messageIcon} />
            <Text style={styles.successText}>{success}</Text>
          </View>
        </View>
      )}
      
      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          (!trackingNumber || !cageId || !orderDetails || scanningToCage) && styles.disabledButton
        ]}
        onPress={scanToCage}
        disabled={!trackingNumber || !cageId || !orderDetails || scanningToCage}
      >
        {scanningToCage ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <>
            <MaterialIcons name="add-task" size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.submitButtonText}>Scan to Cage</Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
  
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
        
        <Animated.Text 
          style={[
            styles.headerTitle,
            { transform: [{ scale: titleScale }] }
          ]}
        >
          <Text style={styles.headerTitleText}>Scan to Cage </Text>
          <Text style={[styles.headerTitleText, styles.warehouseText]}>({warehouse})</Text>
        </Animated.Text>
        
        <View style={styles.headerPlaceholder} />
      </View>
      
      {/* Main Content */}
      <ScrollView 
  style={styles.scrollView}
  contentContainerStyle={styles.contentContainer}
  keyboardShouldPersistTaps="handled"
>
  <View style={styles.container}>
    {selectedOperator ? renderScanToCageForm() : renderOperatorSelection()}
  </View>
</ScrollView>
      
      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        visible={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onBarcodeScanned={handleBarcodeScan}
        title={`Scan ${activeInput === 'tracking' ? 'Tracking Number' : 'Cage ID'}`}
      />
      
      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: colors.background,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backButtonText: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: '500',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  warehouseText: {
    color: colors.primary,
  },
  headerPlaceholder: {
    width: 40,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  sectionCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  activeSection: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: colors.text,
  },
  loader: {
    marginVertical: 30,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 16,
  },
  operatorItem: {
    marginBottom: 8,
  },
  operatorCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  operatorName: {
    fontSize: 16,
    color: colors.text,
  },
  operatorHeader: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  selectedOperatorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  operatorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  operatorIcon: {
    marginRight: 8,
  },
  selectedOperatorText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  changeOperatorButton: {
    backgroundColor: `${colors.primary}15`,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  changeOperatorText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    marginRight: 8,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.text,
    marginRight: 8,
  },
  activeInput: {
    borderColor: colors.primary,
  },
  scanButton: {
    backgroundColor: colors.primary,
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
  orderDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderDetailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
  },
  orderDetailsRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.border}50`,
  },
  orderDetailsLabel: {
    width: 100,
    fontSize: 14,
    color: colors.textLight,
    fontWeight: '500',
  },
  orderDetailsText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  messageCard: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  errorCardContent: {
    backgroundColor: '#FFF1F0',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
  },
  successCardContent: {
    backgroundColor: '#F6FFED',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
  },
  messageIcon: {
    marginRight: 8,
  },
  errorText: {
    flex: 1,
    color: colors.error,
  },
  successText: {
    flex: 1,
    color: '#4CD964', // Success green
  },
  submitButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 8,
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledButton: {
    backgroundColor: colors.border,
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingBox: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
});

export default ScanToCageScreen;