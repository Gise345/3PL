// src/screens/outbound/AdHocOutboundScreen.tsx

import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  StatusBar,
  SafeAreaView,
  Animated,
  Keyboard,
  TextInput,
  NativeEventSubscription
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button, Input, Card, PhotoCapture, EmptyState } from '../../components/common';
import { Signature } from '../../components/signature';
import { BarcodeScannerModal } from '../../components/common/barcode';
import { SegmentedBar } from '../../components/common';
import { AdHocOutboundScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../utils/theme';
import { useAppSelector } from '../../hooks';
import OutboundSummary from './components/OutboundSummary';
import { outboundService } from '../../api/outboundService';
import { warehouseService } from '../../api/warehouseService';
import useBarcode from '../../hooks/useBarcode';
import DropshipCollection from './components/DropshipCollection';

// Define an interface for the outbound data
export interface OutboundData {
  carrierName: string;
  driverRegistration: string;
  driverSignature: string | null;
  loadoutTime: Date;
  numberOfParcels: number;
  outboundRef: string;
  outboundType: string;
  parcelPhoto: string | null;
  warehouse: string;
  loadoutType: string;
  singleOrderNumber?: string;
  multipleOrderNumbers?: string;
  dropshipClient?: string;
}

const AdHocOutboundScreen: React.FC<AdHocOutboundScreenProps> = () => {
  const navigation = useNavigation();
  const { warehouse, isTestMode } = useAppSelector(state => state.settings);
  
  // Animation refs
  const titleScale = useRef(new Animated.Value(1)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(20)).current;
  
  // Loadout types
  const loadoutTypes = [
    { name: 'singleOrderCollection', value: 'Single Order' },
    { name: 'multipleOrder', value: 'Multiple Orders' },
    { name: 'dropshipCollection', value: 'Dropship Collection' },
  ];

  // State variables
  const [loading, setLoading] = useState(false);
  const [loadoutTypeIndex, setLoadoutTypeIndex] = useState(0);
  const [orderBarcodes, setOrderBarcodes] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);
  const [carrierName, setCarrierName] = useState('');
  const [driverReg, setDriverReg] = useState('');
  const [numberOfParcels, setNumberOfParcels] = useState('');
  const [parcelPhoto, setParcelPhoto] = useState<string | null>(null);
  const [parcelPhotoName, setParcelPhotoName] = useState<string | null>(null);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [signatureName, setSignatureName] = useState<string | null>(null);
  const [manualOrderNumber, setManualOrderNumber] = useState('');
  
  // External barcode scanner states
  const [barcodeBuffer, setBarcodeBuffer] = useState<string>('');
  const [lastKeyTime, setLastKeyTime] = useState<number>(0);
  const [isScanning, setIsScanning] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const inputRef = useRef<TextInput>(null);
  const scanTimeoutDuration = 50; // ms between keystrokes for external scanner

  // UI state variables
  const [orderNumberDiv, setOrderNumberDiv] = useState(true);
  const [addOrderNumberDiv, setAddOrderNumberDiv] = useState(true);
  const [addOrderNumberBarcodeDiv, setAddOrderNumberBarcodeDiv] = useState(true);
  const [addMoreOrderNumbersBtn, setAddMoreOrderNumbersBtn] = useState(false);
  const [completedAddingOrderNumbersBtn, setCompletedAddingOrderNumbersBtn] = useState(false);
  const [carrierDiv, setCarrierDiv] = useState(false);
  const [driverRegDiv, setDriverRegDiv] = useState(false);
  const [numberOfParcelsDiv, setNumberOfParcelsDiv] = useState(false);
  const [parcelPhotoDiv, setParcelPhotoDiv] = useState(false);
  const [signaturePadDiv, setSignaturePadDiv] = useState(false);
  const [summaryDiv, setSummaryDiv] = useState(false);

  // Define checkOrderNumber before useBarcode
  const checkOrderNumber = async (orderNumber: string): Promise<boolean> => {
    try {
      if (isTestMode) return true;
      
      await warehouseService.checkOrderNumber(orderNumber);
      return true;
    } catch (error) {
      return false;
    }
  };

  // Barcode scanner
  const { 
    showScanner, 
    scannedData,
    openScanner, 
    closeScanner, 
    handleBarcodeScanned 
  } = useBarcode({
    onScan: (barcode) => addOrderNumber(barcode),
    validateBarcode: checkOrderNumber
  });

  // Current loadout type
  const loadoutType = loadoutTypes[loadoutTypeIndex];
  
  // Function to handle key presses from external scanner
  const handleKeyPress = (e: any) => {
    const currentTime = new Date().getTime();
    
    // Show scanning indicator
    setIsScanning(true);
    
    // Ignore certain keys that shouldn't be part of barcode
    if (e.nativeEvent.key === 'Backspace' || e.nativeEvent.key === 'Enter') {
      return;
    }
    
    // If this is a new scan sequence or continuing a scan
    if (currentTime - lastKeyTime < scanTimeoutDuration || barcodeBuffer === '') {
      // Append character to buffer
      setBarcodeBuffer(prev => prev + e.nativeEvent.key);
      setLastKeyTime(currentTime);
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set timeout to process the complete barcode
      timeoutRef.current = setTimeout(() => {
        if (barcodeBuffer && barcodeBuffer.length > 0) {
          console.log('Processing scanned barcode:', barcodeBuffer);
          addOrderNumber(barcodeBuffer);
          setBarcodeBuffer('');
          setIsScanning(false); // Hide scanning indicator
        }
      }, scanTimeoutDuration + 20);
    } else {
      // Start a new buffer
      setBarcodeBuffer(e.nativeEvent.key);
      setLastKeyTime(currentTime);
    }
  };

  // Run animations when component mounts
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  // Handle external scanner input
  useEffect(() => {
    let keyboardDidShowListener: NativeEventSubscription;
    let keyboardDidHideListener: NativeEventSubscription;
    
    // Set up event listeners
    const setupKeyboardListeners = () => {
      // These listeners help us detect when keyboard is shown/hidden
      keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
        // Keyboard is shown, could be for manual input
        // We'll still capture external scanner input
      });
      
      keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
        // Keyboard is hidden, focus on hidden input to capture scanner
        if (inputRef.current && !showScanner) {
          inputRef.current.focus();
        }
      });
      
      // Initially focus the hidden input to capture scanner input
      setTimeout(() => {
        if (inputRef.current && !showScanner) {
          inputRef.current.focus();
        }
      }, 500);
    };
    
    setupKeyboardListeners();
    
    // Clean up event listeners on unmount
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [barcodeBuffer, lastKeyTime, showScanner]);

  // Handle loadout type change
  useEffect(() => {
    if (loadoutTypeIndex === 0) {
      // Single order collection
      // remove all order numbers except the first
      if (orderBarcodes.length > 0) {
        setOrderBarcodes([orderBarcodes[0]]);
        setAddOrderNumberDiv(false);
        setAddOrderNumberBarcodeDiv(false);
      }
    }
    if (loadoutTypeIndex === 1) {
      // Multiple order collection
      setAddOrderNumberDiv(true);
      setAddOrderNumberBarcodeDiv(true);
      if (orderBarcodes.length > 0) {
        setCompletedAddingOrderNumbersBtn(true);
      }
    }
  }, [loadoutTypeIndex]);

  // Handle carrier name change
  useEffect(() => {
    setDriverRegDiv(carrierName.length > 2);
  }, [carrierName]);

  // Handle driver reg change
  useEffect(() => {
    setNumberOfParcelsDiv(driverReg.length > 5);
  }, [driverReg]);

  // Handle number of parcels change
  useEffect(() => {
    setParcelPhotoDiv(numberOfParcels !== '' && parseInt(numberOfParcels) > 0);
  }, [numberOfParcels]);
  
  // Handle back button press
  const handleBack = () => {
    navigation.goBack();
  };

  // Add order number
  const addOrderNumber = async (orderNumber: string) => {
    // Check if order number already exists
    if (orderBarcodes.some(code => code === orderNumber)) {
      // Order already scanned, show a notification or alert
      Alert.alert('Duplicate Order', 'This order has already been scanned');
      return;
    }
    
    // Validation already handled by the barcode scanner
    setOrderBarcodes([...orderBarcodes, orderNumber]);

    // Check vendor check completion
    try {
      await checkVendorCheckComplete(orderNumber);
    } catch (error) {
      Alert.alert('Error', `Failed to check vendor completion: ${error}`);
      return;
    }

    // When Single Order Collection and a Barcode scanned
    if (orderBarcodes.length >= 0) {
      if (loadoutTypeIndex === 0) {
        setAddOrderNumberDiv(false);
        setAddOrderNumberBarcodeDiv(false);
        setCarrierDiv(true);
      } else if (loadoutTypeIndex === 1) {
        setAddOrderNumberDiv(true);
        setAddOrderNumberBarcodeDiv(true);
        setCompletedAddingOrderNumbersBtn(true);
      }
    }
    
    // Clear the manual order number field
    setManualOrderNumber('');
  };

  // Check vendor check completion
  const checkVendorCheckComplete = async (orderNumber: string) => {
    try {
      if (isTestMode) return true;
      
      const isCompleted = await outboundService.checkVendorCheckCompleted(orderNumber);
      
      if (!isCompleted) {
        Alert.alert(
          'Vendor Check Incomplete',
          `${orderNumber}\nVendor Check Incomplete!\nThis order cannot be shipped until the vendor check is completed`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
      
      return isCompleted;
    } catch (error) {
      Alert.alert('Error', `Failed to check vendor completion: ${error}`);
      navigation.goBack();
      return false;
    }
  };

  // Remove order number
  const removeOrderNumber = (index: number) => {
    const newOrderBarcodes = [...orderBarcodes];
    newOrderBarcodes.splice(index, 1);
    setOrderBarcodes(newOrderBarcodes);

    if (newOrderBarcodes.length < 1) {
      if (loadoutTypeIndex === 0) {
        setAddOrderNumberDiv(true);
        setAddOrderNumberBarcodeDiv(true);
        setCarrierDiv(false);
      } else if (loadoutTypeIndex === 1) {
        setCompletedAddingOrderNumbersBtn(false);
      }
    }
  };

  // Complete adding order numbers
  const completedAddingOrderNumbers = () => {
    setCompleted(true);
    setCompletedAddingOrderNumbersBtn(false);
    setCarrierDiv(true);
    setAddMoreOrderNumbersBtn(true);
  };

  // Add more order numbers
  const addMoreOrderNumbers = () => {
    setCompleted(false);
    setCarrierDiv(false);
    setAddMoreOrderNumbersBtn(false);
    setCompletedAddingOrderNumbersBtn(true);
  };

  // Handle parcel photo capture
  const handleParcelPhotoCaptured = (uri: string, name: string) => {
    setParcelPhoto(uri);
    setParcelPhotoName(name);
    
    // Get current date/time
    const date = new Date();
    const day = date.toISOString().split('T')[0].replace(/-/g, '');
    const time = ('0' + date.getHours()).slice(-2) + ('0' + date.getMinutes()).slice(-2);
    
    // Move to next step
    setOrderNumberDiv(false);
    setCarrierDiv(false);
    setDriverRegDiv(false);
    setNumberOfParcelsDiv(false);
    setParcelPhotoDiv(false);
    setAddMoreOrderNumbersBtn(false);
    setSummaryDiv(true);
    setSignaturePadDiv(true);
  };

  // Handle signature captured
  const handleSignatureCaptured = (uri: string, name: string) => {
    setSignatureImage(uri);
    setSignatureName(name);
  };

  // Submit outbound
  const submitOutbound = async () => {
    setLoading(true);
    
    try {
      // Generate outbound reference
      const date = new Date();
      const day = date.toISOString().split('T')[0].replace(/-/g, '');
      const time = ('0' + date.getHours()).slice(-2) + ('0' + date.getMinutes()).slice(-2);
      
      // Camelized carrier name for the outbound reference
      const camelizedName = carrierName
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
      
      const outboundRef = `${camelizedName}_${day}`;
      
      // Prepare submission data with the right type
      const outboundData: OutboundData = {
        carrierName: carrierName.toUpperCase(),
        driverRegistration: driverReg.toUpperCase(),
        driverSignature: signatureName,
        loadoutTime: new Date(),
        numberOfParcels: parseInt(numberOfParcels),
        outboundRef,
        outboundType: 'adHoc',
        parcelPhoto: parcelPhotoName,
        warehouse,
        loadoutType: loadoutType.name,
      };
      
      // Add order numbers based on loadout type
      if (loadoutType.name === 'singleOrderCollection') {
        outboundData.singleOrderNumber = orderBarcodes[0];
      } else if (loadoutType.name === 'multipleOrder') {
        outboundData.multipleOrderNumbers = orderBarcodes.join(',');
      }
      
      // Submit to API
      const response = await outboundService.submitOutbound(outboundData);
      
      Alert.alert(
        'Success',
        response.data?.message || 'Outbound processed successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', `Failed to submit outbound: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Render main content
  const renderContent = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollViewContent}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        style={{
          opacity: fadeIn,
          transform: [{ translateY: slideUp }]
        }}
      >
        {/* Hidden input for external scanner */}
        <TextInput
          ref={inputRef}
          style={{ position: 'absolute', opacity: 0, height: 0 }}
          autoFocus={true}
          onKeyPress={handleKeyPress}
          blurOnSubmit={false}
          caretHidden={true}
        />
        
        {/* External scanner indicator */}
        {isScanning && (
          <View style={styles.scanningIndicator}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.scanningText}>Reading external scanner...</Text>
          </View>
        )}
      
        {/* Loadout Type Selector */}
        <SegmentedBar
          segments={loadoutTypes.map(type => type.value)}
          selectedIndex={loadoutTypeIndex}
          onChange={setLoadoutTypeIndex}
          style={styles.segmentedBar}
        />

        {/* Order Numbers Section */}
        {orderNumberDiv && (
          <Card style={styles.orderCard}>
            <Text style={styles.sectionTitle}>Order Number</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.orderBarcodeContainer}>
                {orderBarcodes.map((item, index) => (
                  <Button
                    key={index}
                    title={item}
                    onPress={() => removeOrderNumber(index)}
                    variant="secondary"
                    small
                    style={styles.orderButton}
                  />
                ))}
              </View>
            </ScrollView>
          </Card>
        )}

        {/* Barcode Scanner Button */}
        {addOrderNumberBarcodeDiv && !completed && (
          <Card style={styles.orderCard}>
            <Button
              title="Scan Order Number"
              onPress={openScanner}
              icon={<Text>📷</Text>}
              style={styles.scanButton}
            />
          </Card>
        )}

        {/* Manual Order Entry */}
        {addOrderNumberDiv && !completed && (
          <Card style={styles.orderCard}>
            <Text style={styles.sectionTitle}>Manual Order Number Entry</Text>
            <Input
              value={manualOrderNumber}
              onChangeText={setManualOrderNumber}
              placeholder="Enter order number"
              returnKeyType="done"
              onSubmitEditing={() => {
                if (manualOrderNumber) {
                  addOrderNumber(manualOrderNumber);
                  setManualOrderNumber(''); // Clear the field after submission
                }
              }}
              style={styles.input}
            />
            <Button
              title="Add Order Number"
              onPress={() => {
                if (manualOrderNumber) {
                  addOrderNumber(manualOrderNumber);
                  setManualOrderNumber(''); // Clear the field after submission
                }
              }}
              disabled={!manualOrderNumber}
              style={styles.button}
            />
          </Card>
        )}

        {/* Completed Adding Orders Button */}
        {completedAddingOrderNumbersBtn && (
          <Button
            title="Completed"
            onPress={completedAddingOrderNumbers}
            variant="warning"
            style={styles.button}
          />
        )}

        {/* Add More Orders Button */}
        {addMoreOrderNumbersBtn && (
          <Button
            title="Add more order numbers"
            onPress={addMoreOrderNumbers}
            variant="warning"
            style={styles.addMoreButton}
          />
        )}

        {/* Carrier Section */}
        {carrierDiv && (
          <Card style={styles.orderCard}>
            <Text style={styles.sectionTitle}>Carrier Name</Text>
            <Input
              value={carrierName}
              onChangeText={setCarrierName}
              placeholder="Enter carrier name"
              style={styles.input}
            />
          </Card>
        )}

        {/* Driver Reg Section */}
        {driverRegDiv && (
          <Card style={styles.orderCard}>
            <Text style={styles.sectionTitle}>Reg Number</Text>
            <Input
              value={driverReg}
              onChangeText={setDriverReg}
              placeholder="Enter registration number"
              style={styles.input}
            />
          </Card>
        )}

        {/* Number of Parcels Section */}
        {numberOfParcelsDiv && (
          <Card style={styles.orderCard}>
            <Text style={styles.sectionTitle}>Number of Parcels</Text>
            <Input
              value={numberOfParcels}
              onChangeText={setNumberOfParcels}
              placeholder="0"
              keyboardType="numeric"
              style={styles.input}
            />
          </Card>
        )}

        {/* Parcel Photo Section */}
        {parcelPhotoDiv && (
          <Card style={styles.orderCard}>
            <PhotoCapture
              title="Parcel Photo"
              cameraType="product"
              category="Parcel"
              companyCode="OUT"
              referenceNumber={orderBarcodes[0]}
              onImageCaptured={handleParcelPhotoCaptured}
            />
          </Card>
        )}

        {/* Summary Section */}
        {summaryDiv && (
          <OutboundSummary
            orderNumbers={orderBarcodes}
            carrierName={carrierName.toUpperCase()}
            numberOfParcels={parseInt(numberOfParcels)}
            driverReg={driverReg.toUpperCase()}
            parcelPhoto={parcelPhoto}
          />
        )}

        {/* Signature Section */}
        {signaturePadDiv && (
          <Card style={styles.orderCard}>
            <Signature
              title="Driver Signature"
              companyCode="OUT"
              onSignatureCaptured={handleSignatureCaptured}
            />
            
            {signatureImage && (
              <Button
                title="Submit"
                onPress={submitOutbound}
                variant="primary"
                loading={loading}
                style={styles.submitButton}
              />
            )}
          </Card>
        )}
      </Animated.View>
    </ScrollView>
  );

  // Render the dropship collection option if selected
  if (loadoutTypeIndex === 2) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
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
            <Text style={styles.headerTitleText}>Ad-Hoc Load Out </Text>
            <Text style={[styles.headerTitleText, styles.warehouseText]}>({warehouse})</Text>
          </Animated.Text>
          
          <View style={styles.headerPlaceholder} />
        </View>
        
        <DropshipCollection 
          warehouse={warehouse}
          loadoutType={loadoutType}
          isTestMode={isTestMode}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
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
          <Text style={styles.headerTitleText}>Ad-Hoc Load Out </Text>
          <Text style={[styles.headerTitleText, styles.warehouseText]}>({warehouse})</Text>
        </Animated.Text>
        
        <View style={styles.headerPlaceholder} />
      </View>
      
      {loading ? (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingOverlayText}>Processing...</Text>
          </View>
        </View>
      ) : (
        renderContent()
      )}
      
      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        visible={showScanner}
        onClose={closeScanner}
        onBarcodeScanned={handleBarcodeScanned}
        title="Scan Order Barcode"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight, // Prevent cutting off on Android
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
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
    color: colors.primary,
    fontSize: 22,
    fontWeight: typography.fontWeights.bold as any,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerTitleText: {
    fontSize: typography.fontSizes.large,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.text,
  },
  headerPlaceholder: {
    width: 40,
  },
  warehouseText: {
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  orderCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  segmentedBar: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.medium,
    fontWeight: typography.fontWeights.medium as any,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  orderBarcodeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.xs,
  },
  orderButton: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  input: {
    marginBottom: spacing.sm,
  },
  button: {
    marginTop: spacing.sm,
  },
  addMoreButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  scanButton: {
    marginBottom: spacing.sm,
  },
  submitButton: {
    marginTop: spacing.lg,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingBox: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.lg,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  loadingOverlayText: {
    marginTop: spacing.md,
    fontSize: typography.fontSizes.medium,
    color: colors.text,
  },
  scanningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.primary + '10', // 10% opacity
    borderRadius: 4,
  },
  scanningText: {
    marginLeft: spacing.sm,
    color: colors.primary,
    fontSize: typography.fontSizes.medium,
  },
});

export default AdHocOutboundScreen;