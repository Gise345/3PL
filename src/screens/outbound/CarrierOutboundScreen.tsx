import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Animated,
  Platform,
  Dimensions
} from 'react-native';
import { PhotoCapture } from '../../components/common/photo';
import SignaturePad from '../../components/common/signature/SignaturePad';
import { Input, Button } from '../../components/common';
import { CarrierOutboundScreenProps } from '../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCamera } from '../../hooks/useCamera';
import {
  fetchCarriers,
  vendorCheck,
  selectCarrier as selectCarrierAction,
  setDriverReg,
  setNumberOfParcels,
  setParcelPhoto,
  setSignatureImage,
  submitOutbound,
  reset,
  clearError,
  clearSuccess,
} from '../../store/slices/carrierOutboundSlice';
import { Carrier } from '../../api/carrierService';

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

// Get screen dimensions for responsive sizing
const { width, height } = Dimensions.get('window');

// Helper function to generate reference ID
const generateOutboundRef = (carrierName: string, date: Date): string => {
  const day = date.toISOString().split('T')[0].split('-').join('');
  const camelizedName = carrierName
    .split(' ')
    .map((word, index) => 
      index === 0 
        ? word.toLowerCase() 
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join('');
  
  return `${camelizedName}_${day}`;
};

const CarrierOutboundScreen: React.FC<CarrierOutboundScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { warehouse } = useAppSelector((state) => state.settings);
  
  const {
    carriers,
    selectedCarrier,
    driverReg,
    numberOfParcels,
    parcelPhoto,
    signatureImage,
    loading,
    error,
    success,
    successMessage,
  } = useAppSelector((state) => state.carrierOutbound);

  // Local state for search
  const [searchText, setSearchText] = useState('');
  const [filteredCarriers, setFilteredCarriers] = useState<Carrier[]>([]);

  // Component state for UI flow
  const [step, setStep] = useState<
    'select-carrier' | 
    'confirm-parcels' | 
    'capture-photo' | 
    'driver-reg' | 
    'capture-signature' | 
    'summary'
  >('select-carrier');

  // Animation values
  const [fadeIn] = useState(new Animated.Value(0));
  const [slideUp] = useState(new Animated.Value(30));
  const [titleScale] = useState(new Animated.Value(0.95));

  // Camera functionality
  const { 
    showCamera, 
    capturedImageUri, 
    openCamera, 
    closeCamera, 
    handleImageCaptured 
  } = useCamera({
    companyCode: 'OUT',
    referenceNumber: selectedCarrier?.name,
    onImageCaptured: (imageUri, imageName) => {
      if (step === 'capture-photo') {
        dispatch(setParcelPhoto({ uri: imageUri, name: imageName }));
        setStep('driver-reg');
      }
    }
  });

  // Fetch carriers when screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log('Fetching carriers...');
      dispatch(fetchCarriers())
        .then(result => console.log('Carriers fetch result:', result))
        .catch(error => console.error('Error fetching carriers:', error));
      
      // Reset state when component unmounts
      return () => {
        dispatch(reset());
      };
    }, [dispatch])
  );

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
  }, []);

  // Update filtered carriers when carriers list or search text changes
  useEffect(() => {
    if (carriers && carriers.length > 0) {
      if (searchText.trim() === '') {
        setFilteredCarriers(carriers);
      } else {
        const filtered = carriers.filter(carrier =>
          carrier.name.toLowerCase().includes(searchText.toLowerCase())
        );
        setFilteredCarriers(filtered);
      }
    }
  }, [carriers, searchText]);

  // Handle errors and success messages
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      dispatch(clearError());
    }
    
    if (success && successMessage) {
      Alert.alert('Success', successMessage, [
        { 
          text: 'OK', 
          onPress: () => {
            dispatch(clearSuccess());
            navigation.goBack();
          }
        }
      ]);
    }
  }, [error, success, successMessage, dispatch, navigation]);

  // Handle carrier selection
  const handleSelectCarrier = async (carrier: Carrier) => {
    try {
      setStep('confirm-parcels');
      dispatch(selectCarrierAction(carrier));
    } catch (error) {
      console.error('Error selecting carrier:', error);
    }
  };

  // Confirm number of parcels and run vendor check
  const handleConfirmParcels = async () => {
    if (!selectedCarrier) return;
    
    try {
      // Run vendor check
      await dispatch(vendorCheck(selectedCarrier)).unwrap();
      setStep('capture-photo');
    } catch (error: any) {
      // If vendor check fails, show alert with unchecked orders
      if (error.uncheckedOrders) {
        Alert.alert(
          'Vendor Check Incomplete',
          `These parcels cannot be shipped until the vendor check is completed:\n${error.uncheckedOrders.join('\n')}`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    }
  };

  // Handle driver registration input
  const handleDriverRegInput = (value: string) => {
    dispatch(setDriverReg(value));
  };

  // Handle number of parcels input
  const handleNumberOfParcelsInput = (value: string) => {
    const parsedValue = parseInt(value, 10);
    if (!isNaN(parsedValue) && parsedValue >= 0) {
      dispatch(setNumberOfParcels(parsedValue));
    }
  };

  // Handle photo capture
  const handleTakeParcelPhoto = () => {
    openCamera('transit', 'Parcels');
  };

  // Handle signature capture
  const handleSignatureCaptured = (signatureUri: string, signatureName: string) => {
    dispatch(setSignatureImage({ uri: signatureUri, name: signatureName }));
    // Show a success message before proceeding to the next step
    Alert.alert(
      "Signature Captured", 
      "Signature has been successfully captured. You can proceed to the summary screen.",
      [
        { text: "View Summary", onPress: () => setStep('summary') }
      ]
    );
  };

  // Handle outbound submission
  const handleSubmitOutbound = async () => {
    if (!selectedCarrier) return;
    
    try {
      const outboundRef = generateOutboundRef(selectedCarrier.name, new Date());
      await dispatch(submitOutbound({
        warehouse,
        outboundRef,
      })).unwrap();
    } catch (error) {
      console.error('Failed to submit outbound:', error);
    }
  };

  // Reset carrier selection
  const handleResetCarrier = () => {
    dispatch(reset());
    setStep('select-carrier');
  };

  // Handle back navigation
  const handleBack = () => {
    if (step !== 'select-carrier') {
      // If we're not on the first step, go back to carrier selection
      dispatch(reset());
      setStep('select-carrier');
    } else {
      // If we're already on the first step, navigate back
      navigation.goBack();
    }
  };

  // Render carriers selection
  const renderCarrierSelection = () => (
    <View style={styles.section}>
      <Input
        label="Search Carrier"
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Enter carrier name..."
        containerStyle={styles.searchInput}
      />
      
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : filteredCarriers.length > 0 ? (
        <FlatList
          data={filteredCarriers}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.carrierItem}
              onPress={() => handleSelectCarrier(item)}
            >
              <View style={styles.carrierInfo}>
                <Text style={styles.carrierName}>{item.name}</Text>
                <Text style={styles.carrierParcels}>Parcels: {item.numberOfParcels}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          )}
          style={styles.carrierList}
        />
      ) : (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateIcon}>🚚</Text>
          <Text style={styles.emptyStateTitle}>
            {searchText.trim() !== '' 
              ? `No carriers found matching "${searchText}"`
              : 'No carriers available'
            }
          </Text>
          <Text style={styles.emptyStateDescription}>
            Try searching for a different carrier name or check your network connection.
          </Text>
        </View>
      )}
    </View>
  );

  // Render parcels confirmation
  const renderParcelConfirmation = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Confirm Number of Parcels</Text>
      
      {selectedCarrier && (
        <View style={styles.carrierSummary}>
          <Text style={styles.carrierSummaryTitle}>Carrier:</Text>
          <Text style={styles.carrierSummaryValue}>{selectedCarrier.name}</Text>
        </View>
      )}
      
      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>Number of Parcels:</Text>
        <TextInput
          style={styles.parcelInput}
          value={numberOfParcels.toString()}
          onChangeText={handleNumberOfParcelsInput}
          keyboardType="number-pad"
          placeholder="0"
        />
      </View>
      
      <Button
        title="Confirm & Continue"
        onPress={handleConfirmParcels}
        style={styles.actionButton}
        disabled={loading || numberOfParcels <= 0}
        loading={loading}
      />
      
      <Button
        title="Select Different Carrier"
        onPress={handleResetCarrier}
        variant="outline"
        style={styles.secondaryButton}
      />
    </View>
  );

  // Render photo capture
  const renderPhotoCapture = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Capture Parcel Photo</Text>
      
      {selectedCarrier && (
        <View style={styles.carrierSummary}>
          <Text style={styles.carrierSummaryTitle}>Carrier:</Text>
          <Text style={styles.carrierSummaryValue}>{selectedCarrier.name}</Text>
          
          <Text style={styles.carrierSummaryTitle}>Parcels:</Text>
          <Text style={styles.carrierSummaryValue}>{numberOfParcels}</Text>
        </View>
      )}
      
      <PhotoCapture
         title="Capture Image of Parcels"
         cameraType="transit"
         category="Parcels"
         companyCode="OUT"
         referenceNumber={selectedCarrier?.name}
         onImageCaptured={(imageUri, imageName) => {
           dispatch(setParcelPhoto({ uri: imageUri, name: imageName }));
           // Proceed directly to driver registration without showing alert
           setStep('driver-reg');
        }}
      />
      
      <TouchableOpacity
        style={styles.backToPreviousStep}
        onPress={() => setStep('confirm-parcels')}
      >
        <Text style={styles.backToPreviousStepText}>
          ← Back to parcel confirmation
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render driver registration
  const renderDriverReg = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Driver Registration Details</Text>
      
      <Input
        label="Registration Number"
        value={driverReg}
        onChangeText={handleDriverRegInput}
        placeholder="Enter vehicle registration"
        containerStyle={styles.regInput}
      />
      
      <Button
        title="Continue to Signature"
        onPress={() => setStep('capture-signature')}
        style={styles.actionButton}
        disabled={driverReg.length < 4}
      />
      
      <TouchableOpacity
        style={styles.backToPreviousStep}
        onPress={() => setStep('capture-photo')}
      >
        <Text style={styles.backToPreviousStepText}>
          ← Back to photo capture
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render signature capture
  const renderSignatureCapture = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Signature Capture</Text>
      
      {selectedCarrier && (
        <>
          <SignaturePad
            onSignatureCapture={handleSignatureCaptured}
            companyCode="OUT"
            carrierName={selectedCarrier.name}
          />
          
          <TouchableOpacity
            style={styles.backToPreviousStep}
            onPress={() => setStep('driver-reg')}
          >
            <Text style={styles.backToPreviousStepText}>
              ← Back to driver details
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  // Render summary and submission
  const renderSummary = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Outbound Summary</Text>
      
      {selectedCarrier && (
        <>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Carrier:</Text>
            <Text style={styles.summaryValue}>{selectedCarrier.name}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Number of Parcels:</Text>
            <Text style={styles.summaryValue}>{numberOfParcels}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Registration:</Text>
            <Text style={styles.summaryValue}>{driverReg.toUpperCase()}</Text>
          </View>
          
          <View style={styles.photoPreviewContainer}>
            <View style={styles.photoPreviewItem}>
              <Text style={styles.photoLabel}>Parcel Photo</Text>
              {parcelPhoto && (
                <TouchableOpacity 
                  style={styles.photoWrapper}
                  onPress={() => setStep('capture-photo')} // Allow going back to retake photo
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: parcelPhoto }} style={styles.photoPreview} />
                  <View style={styles.editOverlay}>
                    <Text style={styles.editOverlayText}>Edit</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.photoPreviewItem}>
              <Text style={styles.photoLabel}>Signature</Text>
              {signatureImage && (
                <TouchableOpacity 
                  style={styles.photoWrapper}
                  onPress={() => setStep('capture-signature')} // Allow going back to redo signature
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: signatureImage }} style={styles.photoPreview} />
                  <View style={styles.editOverlay}>
                    <Text style={styles.editOverlayText}>Edit</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          <Button
            title="Submit Outbound"
            onPress={handleSubmitOutbound}
            style={styles.submitButton}
            loading={loading}
            disabled={loading}
            variant="warning"
          />
          
          <TouchableOpacity
            style={styles.backToPreviousStep}
            onPress={() => setStep('capture-signature')}
          >
            <Text style={styles.backToPreviousStepText}>
              ← Back to signature
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  // Render current step
  const renderCurrentStep = () => {
    switch (step) {
      case 'select-carrier':
        return renderCarrierSelection();
      case 'confirm-parcels':
        return renderParcelConfirmation();
      case 'capture-photo':
        return renderPhotoCapture();
      case 'driver-reg':
        return renderDriverReg();
      case 'capture-signature':
        return renderSignatureCapture();
      case 'summary':
        return renderSummary();
      default:
        return renderCarrierSelection();
    }
  };
  
  // Render step indicators
  const renderStepIndicators = () => {
    const steps = [
      { key: 'select-carrier', label: 'Select Carrier' },
      { key: 'confirm-parcels', label: 'Confirm Parcels' },
      { key: 'capture-photo', label: 'Capture Photo' },
      { key: 'driver-reg', label: 'Driver Details' },
      { key: 'capture-signature', label: 'Signature' },
      { key: 'summary', label: 'Summary' },
    ];
    
    const currentStepIndex = steps.findIndex(s => s.key === step);
    
    // Function to handle step navigation
    const navigateToStep = (targetStep: string, targetIndex: number) => {
      // Only allow navigating to steps that are completed or the current step
      if (targetIndex <= currentStepIndex) {
        setStep(targetStep as any);
      } else {
        // Optional: Show a message that they need to complete the current step first
        Alert.alert(
          "Complete Current Step", 
          "Please complete the current step before proceeding.",
          [{ text: "OK" }]
        );
      }
    };
    
    return (
      <View style={styles.stepIndicatorContainer}>
        {steps.map((s, index) => (
          <TouchableOpacity
            key={s.key}
            onPress={() => navigateToStep(s.key, index)}
            style={styles.stepIndicatorWrapper}
            activeOpacity={index <= currentStepIndex ? 0.7 : 1}
          >
            <View 
              style={[
                styles.stepIndicator,
                index <= currentStepIndex ? styles.activeStep : styles.inactiveStep,
                index === 0 ? styles.firstStep : null,
                index === steps.length - 1 ? styles.lastStep : null,
              ]}
            >
              <Text 
                style={[
                  styles.stepNumber,
                  index <= currentStepIndex ? styles.activeStepText : styles.inactiveStepText
                ]}
              >
                {index + 1}
              </Text>
            </View>
            
            {/* Optional: Add step labels below the indicators */}
            <Text 
              style={[
                styles.stepLabel, 
                index <= currentStepIndex ? styles.activeStepLabel : styles.inactiveStepLabel
              ]}
              numberOfLines={1}
            >
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
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
          <Text style={styles.headerTitleText}>Carrier Load Out </Text>
          <Text style={[styles.headerTitleText, styles.warehouseText]}>({warehouse})</Text>
        </Animated.Text>
        
        <View style={styles.headerPlaceholder} />
      </View>
      
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
          {renderStepIndicators()}
          {renderCurrentStep()}
        </Animated.View>
      </ScrollView>
      
      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingOverlayText}>Processing...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.background,
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
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  headerTitleText: {
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
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 30,
  },
  section: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  searchInput: {
    marginBottom: 16,
  },
  loader: {
    marginVertical: 30,
  },
  carrierList: {
    maxHeight: 400,
  },
  carrierItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  carrierInfo: {
    flex: 1,
  },
  carrierName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  carrierParcels: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 24,
    textAlign: 'center',
  },
  carrierSummary: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  carrierSummaryTitle: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '500',
    marginBottom: 4,
  },
  carrierSummaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
  },
  parcelInput: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
  },
  actionButton: {
    marginBottom: 8,
  },
  secondaryButton: {
    marginTop: 8,
  },
  regInput: {
    marginBottom: 24,
  },
  photoPreviewContainer: {
    flexDirection: 'row',
    marginVertical: 16,
    justifyContent: 'space-between',
  },
  photoPreviewItem: {
    flex: 1,
    alignItems: 'center',
    margin: 4,
  },
  photoLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  photoWrapper: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    overflow: 'hidden',
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
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  submitButton: {
    marginTop: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  summaryLabel: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textLight,
  },
  summaryValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    padding: 12,
    backgroundColor: COLORS.card,
    borderRadius: 16,
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
  stepIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeStep: {
    backgroundColor: COLORS.primary,
  },
  inactiveStep: {
    backgroundColor: COLORS.border,
  },
  firstStep: {},
  lastStep: {},
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeStepText: {
    color: COLORS.card,
  },
  inactiveStepText: {
    color: COLORS.textLight,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingBox: {
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
  loadingOverlayText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  // Add these missing style properties at the end of your styles object:

  backToPreviousStep: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 10,
  },
  backToPreviousStepText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  stepIndicatorWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
  },
  stepLabel: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  activeStepLabel: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  inactiveStepLabel: {
    color: COLORS.textLight,
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 4,
    alignItems: 'center',
  },
  editOverlayText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default CarrierOutboundScreen;