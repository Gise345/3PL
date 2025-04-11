import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ModernButton } from '../../components/common';
import { colors } from '../../utils/theme';
import { InboundDetailScreenProps } from '../../navigation/types';
import { useAppSelector } from '../../hooks/useRedux';
import { inboundService } from '../../api/inboundService';

// Define modern color palette with teal primary color to match other screens
const COLORS = {
  background: '#F5F7FA',
  card: '#FFFFFF',
  cardActive: '#F0F9F6',
  primary: '#00A9B5', // Teal color matching login screen
  secondary: '#333333',
  accent: '#ff6f00',
  text: '#333333',
  textLight: '#888888',
  border: '#E0E0E0',
  shadow: 'rgba(0, 0, 0, 0.1)',
  error: '#ff3b30',
  success: '#4CD964',
  warning: '#FFCC00',
  surface: '#F5F7FA',
  inputBackground: '#F5F7FA',
};

const ModernInboundDetailScreen: React.FC<InboundDetailScreenProps> = ({
  route,
  navigation,
}) => {
  // Get inbound from route params
  const { inbound } = route.params;
  
  // Get global state
  const { warehouse } = useAppSelector((state) => state.settings);
  const { user } = useAppSelector((state) => state.auth);
  
  // Reference to scroll view for auto-scrolling
  const scrollViewRef = useRef<ScrollView>(null);
  
  // State management
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [numberOfPackages, setNumberOfPackages] = useState<string>(
    inbound.numberPallets?.toString() || inbound.numberCartons?.toString() || ''
  );
  const [receiptLane, setReceiptLane] = useState('');
  const [receiptLaneError, setReceiptLaneError] = useState('');
  const [mrn, setMrn] = useState(inbound.mrn || '');
  const [mrnError, setMrnError] = useState('');
  const [isMrnRequired, setIsMrnRequired] = useState(inbound.mrnRequired || false);
  const [showMrnDialog, setShowMrnDialog] = useState(false);
  const [haulierCanProvideMrn, setHaulierCanProvideMrn] = useState(false);
  
  // Photos state - for now we'll simulate with regular strings
  const [transitPhoto, setTransitPhoto] = useState<string | null>(null);
  const [productPhoto, setProductPhoto] = useState<string | null>(null);
  const [mrnDocPhoto, setMrnDocPhoto] = useState<string | null>(null);
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const [availablePrinters, setAvailablePrinters] = useState<{ name: string; value: string }[]>([]);
  const [printer, setPrinter] = useState<{ name: string; value: string } | null>(null);
  
  // Animation values
  const [fadeIn] = useState(new Animated.Value(0));
  const [slideUp] = useState(new Animated.Value(30));
  const [cardScale] = useState(new Animated.Value(0.95));
  
  useEffect(() => {
    // Get available printers based on warehouse
    // This would normally come from an API, but for now we'll hardcode it
    const printers = warehouse === 'TFH'
      ? [
          { name: 'Front Door Printer', value: 'printer1' },
          { name: 'Rear Door Printer on Trade Bench', value: 'printer2' },
        ]
      : [
          { name: 'Door Printer', value: 'printer3' },
        ];
    
    // Add generic printer for testing
    if (__DEV__) {
      printers.push({ name: 'Generic / Text Only', value: 'Generic / Text Only' });
    }
    
    setAvailablePrinters(printers);
    
    // Animate in the components
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
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, [warehouse]);
  
  // Function to check if MRN is required but missing
  const checkMrnRequirement = () => {
    if (inbound.mrnRequired && !inbound.mrn) {
      setIsMrnRequired(true);
      setShowMrnDialog(true);
      return true;
    }
    return false;
  };
  
  // Function to handle number of packages confirmation
  const handleConfirmPackages = () => {
    if (!numberOfPackages || parseInt(numberOfPackages) <= 0) {
      Alert.alert('Error', 'Please enter a valid number of packages');
      return;
    }
    
    setCurrentStep(2);
    
    // Check MRN requirement
    const mrnMissing = checkMrnRequirement();
    if (!mrnMissing) {
      // Proceed to next steps
      scrollToBottom();
    }
  };
  
  // Function to handle MRN confirmation or skip
  const handleMrnResponse = (canProvide: boolean) => {
    setHaulierCanProvideMrn(canProvide);
    setShowMrnDialog(false);
    
    if (canProvide) {
      // Show MRN input field
      setCurrentStep(3);
    } else {
      // Show receipt lane input
      setCurrentStep(6);
    }
    
    scrollToBottom();
  };
  
  // Function to confirm MRN
  const handleConfirmMrn = () => {
    if (!mrn.trim()) {
      setMrnError('Please enter an MRN');
      return;
    }
    
    setMrnError('');
    setCurrentStep(4);
    scrollToBottom();
  };
  
  // Function to capture transit photo - simulated
  const captureTransitPhoto = async () => {
    try {
      // In a real app, we would use ImagePicker here
      // For now we'll just simulate with a placeholder
      setTransitPhoto('https://via.placeholder.com/150');
      setCurrentStep(5);
      scrollToBottom();
    } catch (error) {
      console.error('Error taking transit photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };
  
  // Function to capture product photo - simulated
  const captureProductPhoto = async () => {
    try {
      // In a real app, we would use ImagePicker here
      // For now we'll just simulate with a placeholder
      setProductPhoto('https://via.placeholder.com/150');
      setCurrentStep(6);
      scrollToBottom();
    } catch (error) {
      console.error('Error taking product photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };
  
  // Function to capture MRN document photo - simulated
  const captureMrnDocPhoto = async () => {
    try {
      // In a real app, we would use ImagePicker here
      // For now we'll just simulate with a placeholder
      setMrnDocPhoto('https://via.placeholder.com/150');
      setCurrentStep(5);
      scrollToBottom();
    } catch (error) {
      console.error('Error taking MRN doc photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };
  
  // Function to check if receipt lane exists
  const checkReceiptLane = async () => {
    if (!receiptLane.trim()) {
      setReceiptLaneError('Please enter a receipt lane');
      return;
    }
    
    try {
      setLoading(true);
      const response = await inboundService.checkGoodsInLaneExists(receiptLane);
      
      if (response.success === 200) {
        setReceiptLaneError('');
        setCurrentStep(7);
        scrollToBottom();
      } else {
        setReceiptLaneError(response.message || 'Invalid receipt lane');
      }
    } catch (error: any) {
      console.error('Error checking receipt lane:', error);
      setReceiptLaneError(error.response?.data?.message || 'Failed to verify receipt lane');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to select a printer
  const handleSelectPrinter = (selectedPrinter: { name: string; value: string }) => {
    setPrinter(selectedPrinter);
    setCurrentStep(8);
    scrollToBottom();
  };
  
  // Function to submit the inbound
  const handleSubmitInbound = async () => {
    if (!printer) {
      Alert.alert('Error', 'Please select a printer');
      return;
    }
    
    try {
      setLoading(true);
      
      // Format date for submission
      const now = new Date();
      const day = now.toISOString().split('T')[0].split('-').join('');
      const time = ('0' + now.getHours()).slice(-2) + ('0' + now.getMinutes()).slice(-2);
      
      // Prepare data for submission
      const submitData = {
        warehouse: inbound.warehouse,
        poNumber: inbound.poNumber,
        companyCode: inbound.companyCode,
        inboundItemsPhoto: productPhoto ? `${inbound.poNumber}-products.jpg` : '',
        transitTypePhoto: transitPhoto ? `${inbound.poNumber}-transit.jpg` : '',
        timeReceived: now.toISOString(),
        receiptLane: receiptLane.toUpperCase(),
        inbound,
        printerName: printer.value,
        landedDate: `${day} ${time}`,
        transitType: inbound.transitType,
        numberOfPackages: parseInt(numberOfPackages),
        landedBy: user?.email || '',
      };
      
      // Add MRN data if provided
      const dataToSubmit: any = {
        ...submitData,
      };
      
      if (isMrnRequired && mrn) {
        dataToSubmit.mrn = mrn;
        if (mrnDocPhoto) {
          dataToSubmit.haulierMrnDocPhoto = `${inbound.poNumber}-mrn_doc.jpg`;
        }
      }
      
      // Submit inbound data
      const response = await inboundService.submitInbound(dataToSubmit);
      
      // Record GRN arrived at time
      await inboundService.setGRNArrivedAt({
        inboundId: inbound.inboundId,
        poNumber: inbound.poNumber,
        arrivedAt: now.toISOString(),
      });
      
      setCompleted(true);
      Alert.alert(
        'Success',
        `Inbound for ${inbound.companyCode} completed successfully`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error('Error submitting inbound:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to submit inbound'
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Function to submit an MRN error
  const handleSubmitMrnError = async () => {
    if (!printer) {
      Alert.alert('Error', 'Please select a printer');
      return;
    }
    
    try {
      setLoading(true);
      
      // Format date for submission
      const now = new Date();
      const day = now.toISOString().split('T')[0].split('-').join('');
      const time = ('0' + now.getHours()).slice(-2) + ('0' + now.getMinutes()).slice(-2);
      
      // Prepare data for submission
      const submitData = {
        warehouse,
        poNumber: inbound.poNumber,
        companyCode: inbound.companyCode,
        timeReceived: now.toISOString(),
        printerName: printer.value,
        landedDate: `${day} ${time}`,
        transitType: inbound.transitType,
        numberOfPackages: parseInt(numberOfPackages),
        inboundId: inbound.inboundId,
        landedBy: user?.email || '',
      };
      
      // Submit MRN error
      const response = await inboundService.handleMRNError(submitData);
      
      // Record GRN arrived at time
      await inboundService.setGRNArrivedAt({
        inboundId: inbound.inboundId,
        poNumber: inbound.poNumber,
        arrivedAt: now.toISOString(),
      });
      
      setCompleted(true);
      Alert.alert(
        'Success',
        `${response.data?.message || 'MRN error processed'}\n\nPlease ensure the stock is quarantined until an MRN is provided by the customer`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error('Error submitting MRN error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to process MRN error'
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Function to scroll to bottom of screen
  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <Animated.View 
        style={[
          styles.container, 
          { 
            opacity: fadeIn,
            transform: [{ translateY: slideUp }]
          }
        ]}
      >
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
            Process Inbound
            <Text style={styles.warehouseText}> ({warehouse})</Text>
          </Text>
          
          <View style={styles.headerPlaceholder} />
        </View>
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Inbound Summary Card */}
            <Animated.View 
              style={[
                styles.card,
                { transform: [{ scale: cardScale }] }
              ]}
            >
              <Text style={styles.companyName}>{inbound.companyName}</Text>
              <Text style={styles.poNumber}>{inbound.poNumber}</Text>
              
              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Booking:</Text>
                  <View style={styles.detailValueContainer}>
                    <Text style={styles.detailValue}>{inbound.requestedDate}</Text>
                    <Text style={styles.detailValue}>{inbound.timeSlot}</Text>
                  </View>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Customer:</Text>
                  <Text style={styles.detailValue}>{inbound.companyCode}</Text>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Transit Type:</Text>
                  <Text style={styles.detailValue}>{inbound.transitType}</Text>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Container:</Text>
                  <Text style={styles.detailValue}>{inbound.containerType}</Text>
                </View>
                
                {inbound.numberPallets && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Number of Pallets:</Text>
                      <Text style={styles.detailValue}>{inbound.numberPallets}</Text>
                    </View>
                  </>
                )}
                
                {inbound.numberCartons && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Number of Cartons:</Text>
                      <Text style={styles.detailValue}>{inbound.numberCartons}</Text>
                    </View>
                  </>
                )}
                
                <View style={styles.divider} />
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Service:</Text>
                  <Text style={styles.detailValue}>{inbound.inboundService}</Text>
                </View>
                
                {currentStep >= 6 && receiptLane && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Receipt Lane:</Text>
                      <Text style={styles.detailValue}>{receiptLane.toUpperCase()}</Text>
                    </View>
                  </>
                )}
                
                {currentStep >= 7 && printer && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Printer:</Text>
                      <Text style={styles.detailValue}>{printer.name}</Text>
                    </View>
                  </>
                )}
                
                {currentStep >= 3 && mrn && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>MRN:</Text>
                      <Text style={styles.detailValue}>{mrn}</Text>
                    </View>
                  </>
                )}
              </View>
            </Animated.View>
            
            {/* Photos Preview */}
            {(transitPhoto || productPhoto || mrnDocPhoto) && (
              <View style={styles.photoPreviewContainer}>
                {mrnDocPhoto && (
                  <View style={styles.photoItem}>
                    <Text style={styles.photoLabel}>MRN Document</Text>
                    <Image source={{ uri: mrnDocPhoto }} style={styles.photoThumbnail} />
                  </View>
                )}
                
                {transitPhoto && (
                  <View style={styles.photoItem}>
                    <Text style={styles.photoLabel}>{inbound.transitType}</Text>
                    <Image source={{ uri: transitPhoto }} style={styles.photoThumbnail} />
                  </View>
                )}
                
                {productPhoto && (
                  <View style={styles.photoItem}>
                    <Text style={styles.photoLabel}>
                      {inbound.numberPallets ? 'Pallets' : 'Cartons'}
                    </Text>
                    <Image source={{ uri: productPhoto }} style={styles.photoThumbnail} />
                  </View>
                )}
              </View>
            )}
            
            {/* Step 1: Confirm Number of Packages */}
            {currentStep === 1 && (
              <View style={styles.stepCard}>
                <Text style={styles.stepTitle}>Confirm Number of Transit Items</Text>
                <Text style={styles.stepDescription}>
                  Please verify the number of {inbound.numberPallets ? 'pallets' : 'cartons'} received
                </Text>
                
                <TextInput
                  style={styles.input}
                  value={numberOfPackages}
                  onChangeText={setNumberOfPackages}
                  keyboardType="numeric"
                  placeholder="Enter number of items"
                  placeholderTextColor={COLORS.textLight}
                />
                
                <ModernButton
                  title="Confirm"
                  onPress={handleConfirmPackages}
                  variant="primary"
                  style={styles.button}
                />
              </View>
            )}
            
            {/* Step 2: MRN Dialog */}
            {showMrnDialog && (
              <View style={styles.stepCard}>
                <View style={styles.alertContainer}>
                  <Text style={styles.alertIcon}>⚠️</Text>
                  <Text style={styles.alertTitle}>MRN Required</Text>
                  <Text style={styles.alertText}>
                    Inbound {inbound.poNumber} has arrived without an accompanying MRN (Movement Reference Number).
                    {'\n\n'}
                    Does the haulier have an MRN?
                  </Text>
                  
                  <View style={styles.alertButtonsContainer}>
                    <TouchableOpacity
                      style={[styles.alertButton, styles.alertButtonNo]}
                      onPress={() => handleMrnResponse(false)}
                    >
                      <Text style={styles.alertButtonNoText}>No</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.alertButton, styles.alertButtonYes]}
                      onPress={() => handleMrnResponse(true)}
                    >
                      <Text style={styles.alertButtonYesText}>Yes</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
            
            {/* Step 3: Enter MRN */}
            {currentStep === 3 && haulierCanProvideMrn && (
              <View style={styles.stepCard}>
                <Text style={styles.stepTitle}>Enter MRN/GMR ID</Text>
                <Text style={styles.stepDescription}>
                  Enter the Movement Reference Number provided by the haulier
                </Text>
                
                <TextInput
                  style={styles.input}
                  value={mrn}
                  onChangeText={setMrn}
                  placeholder="Enter MRN"
                  placeholderTextColor={COLORS.textLight}
                />
                
                {mrnError ? <Text style={styles.errorText}>{mrnError}</Text> : null}
                
                <ModernButton
                  title="Confirm"
                  onPress={handleConfirmMrn}
                  variant="primary"
                  style={styles.button}
                />
              </View>
            )}
            
            {/* Step 4: Capture MRN Document Photo */}
            {currentStep === 4 && haulierCanProvideMrn && (
              <View style={styles.stepCard}>
                <Text style={styles.stepTitle}>Capture MRN Document Photo</Text>
                <Text style={styles.stepDescription}>
                  Take a photo of the MRN document provided by the haulier
                </Text>
                
                <ModernButton
                  title="Take Photo of MRN Document"
                  onPress={captureMrnDocPhoto}
                  variant="primary"
                  style={styles.button}
                />
              </View>
            )}
            
            {/* Step 5: Capture Transit Photo */}
            {currentStep === 5 && (
              <View style={styles.stepCard}>
                <Text style={styles.stepTitle}>Capture Transit Photo</Text>
                <Text style={styles.stepDescription}>
                  Take a photo of the {inbound.transitType} for verification
                </Text>
                
                <ModernButton
                  title={`Take Photo of ${inbound.transitType}`}
                  onPress={captureTransitPhoto}
                  variant="primary"
                  style={styles.button}
                />
              </View>
            )}
            
            {/* Step 6: Capture Product Photo */}
            {currentStep === 5 && transitPhoto && (
              <View style={styles.stepCard}>
                <Text style={styles.stepTitle}>Capture Product Photo</Text>
                <Text style={styles.stepDescription}>
                  Take a photo of the {inbound.numberPallets ? 'pallets' : 'cartons'} for verification
                </Text>
                
                <ModernButton
                  title={`Take Photo of ${inbound.numberPallets ? 'Pallets' : 'Cartons'}`}
                  onPress={captureProductPhoto}
                  variant="primary"
                  style={styles.button}
                />
              </View>
            )}
            
            {/* Step 6: Enter Receipt Lane */}
            {currentStep === 6 && (
              <View style={styles.stepCard}>
                <Text style={styles.stepTitle}>Enter Receipt Lane</Text>
                <Text style={styles.stepDescription}>
                  Enter the storage lane where the items will be received
                </Text>
                
                <TextInput
                  style={styles.input}
                  value={receiptLane}
                  onChangeText={setReceiptLane}
                  placeholder="Enter receipt lane"
                  placeholderTextColor={COLORS.textLight}
                  autoCapitalize="characters"
                />
                
                {receiptLaneError ? (
                  <Text style={styles.errorText}>{receiptLaneError}</Text>
                ) : null}
                
                <ModernButton
                  title="Confirm"
                  onPress={checkReceiptLane}
                  variant="primary"
                  style={styles.button}
                />
              </View>
            )}
            
            {/* Step 7: Select Printer */}
            {currentStep === 7 && (
              <View style={styles.stepCard}>
                <Text style={styles.stepTitle}>Select Label Printer</Text>
                <Text style={styles.stepDescription}>
                  Choose a printer to generate the inbound label
                </Text>
                
                {availablePrinters.map((printerItem) => (
                  <ModernButton
                    key={printerItem.value}
                    title={printerItem.name}
                    onPress={() => handleSelectPrinter(printerItem)}
                    variant="outline"
                    style={styles.printerButton}
                  />
                ))}
              </View>
            )}
            
            {/* Step 8: Complete Inbound */}
            {currentStep === 8 && (
              <View style={styles.stepCard}>
                {isMrnRequired && !haulierCanProvideMrn ? (
                  <>
                    <View style={styles.warningContainer}>
                      <Text style={styles.warningIcon}>⚠️</Text>
                      <Text style={styles.warningText}>
                        Please ensure the stock is quarantined until an MRN is provided by the customer.
                      </Text>
                    </View>
                    
                    <ModernButton
                      title="Print MRN Error Label"
                      onPress={handleSubmitMrnError}
                      variant="primary"
                      style={styles.warningButton}
                    />
                  </>
                ) : (
                  <>
                    <Text style={styles.stepTitle}>Complete Inbound</Text>
                    <Text style={styles.stepDescription}>
                      Process the inbound shipment and print the label
                    </Text>
                    
                    <ModernButton
                      title="Complete Inbound"
                      onPress={handleSubmitInbound}
                      variant="primary"
                      style={styles.button}
                    />
                  </>
                )}
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
        
        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Processing...</Text>
            </View>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
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
    color: COLORS.primary,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  warehouseText: {
    color: COLORS.primary,
  },
  headerPlaceholder: {
    width: 40,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 50,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  companyName: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 4,
  },
  poNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  detailsContainer: {
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  detailLabel: {
    width: 140,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  detailValueContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailValue: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
    marginRight: 8,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  photoPreviewContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 20,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  photoItem: {
    alignItems: 'center',
    margin: 8,
  },
  photoLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 8,
  },
  photoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginTop: -16,
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  printerButton: {
    marginBottom: 12,
  },
  alertContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  alertIcon: {
    fontSize: 40,
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  alertText: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  alertButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  alertButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    maxWidth: 120,
  },
  alertButtonNo: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  alertButtonNoText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  alertButtonYes: {
    backgroundColor: COLORS.primary,
  },
  alertButtonYesText: {
    color: 'white',
    fontWeight: '600',
  },
  warningContainer: {
    backgroundColor: 'rgba(255, 204, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  warningIcon: {
    fontSize: 30,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  warningButton: {
    backgroundColor: COLORS.warning,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
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
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
});

export default ModernInboundDetailScreen;