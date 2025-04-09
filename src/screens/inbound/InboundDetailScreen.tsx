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
  Platform
} from 'react-native';
import { Page, Button } from '../../components/common';
import { colors, typography, spacing, shadows } from '../../utils/theme';
import { InboundDetailScreenProps } from '../../navigation/types';
import { useAppSelector } from '../../hooks/useRedux';
import { inboundService } from '../../api/inboundService';
// We will simulate the image picker functionality for now
// Later you'll need to install: expo install expo-image-picker

// Interface for the printer type
interface Printer {
  name: string;
  value: string;
}

const InboundDetailScreen: React.FC<InboundDetailScreenProps> = ({
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
  const [availablePrinters, setAvailablePrinters] = useState<Printer[]>([]);
  const [printer, setPrinter] = useState<Printer | null>(null);
  
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
  const handleSelectPrinter = (selectedPrinter: Printer) => {
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
    <Page
      title={`Process Inbound (${warehouse})`}
      showHeader
      showBackButton
      loading={loading}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Inbound Summary */}
          <View style={styles.card}>
            <Text style={styles.companyName}>{inbound.companyName}</Text>
            <Text style={styles.poNumber}>{inbound.poNumber}</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Booking:</Text>
              <Text style={styles.infoValue}>{inbound.requestedDate}</Text>
              <Text style={styles.infoValue}>{inbound.timeSlot}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Customer:</Text>
              <Text style={styles.infoValue}>{inbound.companyCode}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Transit Type:</Text>
              <Text style={styles.infoValue}>{inbound.transitType}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Container Type:</Text>
              <Text style={styles.infoValue}>{inbound.containerType}</Text>
            </View>
            
            {inbound.numberPallets && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Number of Pallets:</Text>
                <Text style={styles.infoValue}>{inbound.numberPallets}</Text>
              </View>
            )}
            
            {inbound.numberCartons && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Number of Cartons:</Text>
                <Text style={styles.infoValue}>{inbound.numberCartons}</Text>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Service:</Text>
              <Text style={styles.infoValue}>{inbound.inboundService}</Text>
            </View>
            
            {currentStep >= 6 && receiptLane && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Receipt Lane:</Text>
                <Text style={styles.infoValue}>{receiptLane.toUpperCase()}</Text>
              </View>
            )}
            
            {currentStep >= 7 && printer && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Printer:</Text>
                <Text style={styles.infoValue}>{printer.name}</Text>
              </View>
            )}
            
            {currentStep >= 3 && mrn && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>MRN:</Text>
                <Text style={styles.infoValue}>{mrn}</Text>
              </View>
            )}
          </View>
          
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
                  <Text style={styles.photoLabel}>Transit</Text>
                  <Image source={{ uri: transitPhoto }} style={styles.photoThumbnail} />
                </View>
              )}
              
              {productPhoto && (
                <View style={styles.photoItem}>
                  <Text style={styles.photoLabel}>Products</Text>
                  <Image source={{ uri: productPhoto }} style={styles.photoThumbnail} />
                </View>
              )}
            </View>
          )}
          
          {/* Step 1: Confirm Number of Packages */}
          {currentStep === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Confirm Number of Transit Items</Text>
              <TextInput
                style={styles.input}
                value={numberOfPackages}
                onChangeText={setNumberOfPackages}
                keyboardType="numeric"
                placeholder="Enter number of items"
              />
              <Button
                title="Confirm"
                onPress={handleConfirmPackages}
                style={styles.button}
              />
            </View>
          )}
          
          {/* Step 2: MRN Dialog */}
          {showMrnDialog && (
            <View style={styles.stepContainer}>
              <View style={styles.alertContainer}>
                <Text style={styles.alertTitle}>MRN Required</Text>
                <Text style={styles.alertText}>
                  Inbound {inbound.poNumber} has arrived without an accompanying MRN (Movement Reference Number).
                  {'\n\n'}
                  Does the haulier have an MRN?
                </Text>
                
                <View style={styles.alertButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.alertButton, styles.alertButtonCancel]}
                    onPress={() => handleMrnResponse(false)}
                  >
                    <Text style={styles.alertButtonText}>No</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.alertButton, styles.alertButtonConfirm]}
                    onPress={() => handleMrnResponse(true)}
                  >
                    <Text style={styles.alertButtonText}>Yes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          
          {/* Step 3: Enter MRN */}
          {currentStep === 3 && haulierCanProvideMrn && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Enter MRN/GMR ID</Text>
              <TextInput
                style={styles.input}
                value={mrn}
                onChangeText={setMrn}
                placeholder="Enter MRN"
              />
              {mrnError ? <Text style={styles.errorText}>{mrnError}</Text> : null}
              <Button
                title="Confirm"
                onPress={handleConfirmMrn}
                style={styles.button}
              />
            </View>
          )}
          
          {/* Step 4: Capture MRN Document Photo */}
          {currentStep === 4 && haulierCanProvideMrn && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Capture MRN Document Photo</Text>
              <Button
                title="Take Photo of MRN Document"
                onPress={captureMrnDocPhoto}
                style={styles.button}
              />
            </View>
          )}
          
          {/* Step 5: Capture Transit Photo */}
          {currentStep === 5 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Capture Transit Photo</Text>
              <Button
                title={`Take Photo of ${inbound.transitType}`}
                onPress={captureTransitPhoto}
                style={styles.button}
              />
            </View>
          )}
          
          {/* Step 6: Capture Product Photo */}
          {currentStep === 5 && transitPhoto && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Capture Product Photo</Text>
              <Button
                title={`Take Photo of ${
                  inbound.numberPallets ? 'Pallets' : 'Cartons'
                }`}
                onPress={captureProductPhoto}
                style={styles.button}
              />
            </View>
          )}
          
          {/* Step 6: Enter Receipt Lane */}
          {currentStep === 6 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Enter Receipt Lane</Text>
              <TextInput
                style={styles.input}
                value={receiptLane}
                onChangeText={setReceiptLane}
                placeholder="Enter receipt lane"
                autoCapitalize="characters"
              />
              {receiptLaneError ? (
                <Text style={styles.errorText}>{receiptLaneError}</Text>
              ) : null}
              <Button
                title="Confirm"
                onPress={checkReceiptLane}
                style={styles.button}
              />
            </View>
          )}
          
          {/* Step 7: Select Printer */}
          {currentStep === 7 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Select Label Printer</Text>
              {availablePrinters.map((printerItem) => (
                <Button
                  key={printerItem.value}
                  title={printerItem.name}
                  onPress={() => handleSelectPrinter(printerItem)}
                  style={styles.printerButton}
                />
              ))}
            </View>
          )}
          
          {/* Step 8: Complete Inbound */}
          {currentStep === 8 && (
            <View style={styles.stepContainer}>
              {isMrnRequired && !haulierCanProvideMrn ? (
                <>
                  <Text style={styles.warningText}>
                    Please ensure the stock is quarantined until an MRN is provided by the customer.
                  </Text>
                  <Button
                    title="Print MRN Error Label"
                    onPress={handleSubmitMrnError}
                    style={styles.warningButton}
                  />
                </>
              ) : (
                <Button
                  title="Complete Inbound"
                  onPress={handleSubmitInbound}
                  style={styles.successButton}
                />
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Page>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  companyName: {
    fontSize: typography.fontSizes.medium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  poNumber: {
    fontSize: typography.fontSizes.title,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: typography.fontSizes.medium,
    fontWeight: typography.fontWeights.medium as any,
    color: colors.textSecondary,
    width: 120,
  },
  infoValue: {
    fontSize: typography.fontSizes.medium,
    color: colors.text,
    fontWeight: typography.fontWeights.semibold as any,
    marginRight: spacing.sm,
  },
  photoPreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  photoItem: {
    alignItems: 'center',
    margin: spacing.xs,
  },
  photoLabel: {
    fontSize: typography.fontSizes.small,
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
  },
  photoThumbnail: {
    width: 75,
    height: 75,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  stepTitle: {
    fontSize: typography.fontSizes.large,
    fontWeight: typography.fontWeights.semibold as any,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: typography.fontSizes.regular,
    marginBottom: spacing.md,
  },
  button: {
    marginTop: spacing.xs,
  },
  printerButton: {
    marginBottom: spacing.sm,
  },
  warningButton: {
    backgroundColor: colors.warning,
  },
  successButton: {
    backgroundColor: colors.success,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSizes.small,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
  alertContainer: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  alertTitle: {
    fontSize: typography.fontSizes.large,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  alertText: {
    fontSize: typography.fontSizes.medium,
    color: colors.text,
    marginBottom: spacing.md,
  },
  alertButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  alertButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 4,
    marginLeft: spacing.sm,
  },
  alertButtonCancel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  alertButtonConfirm: {
    backgroundColor: colors.primary,
  },
  alertButtonText: {
    color: colors.text,
    fontWeight: typography.fontWeights.medium as any,
  },
  warningText: {
    color: colors.warning,
    fontSize: typography.fontSizes.medium,
    fontWeight: typography.fontWeights.medium as any,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});

export default InboundDetailScreen;