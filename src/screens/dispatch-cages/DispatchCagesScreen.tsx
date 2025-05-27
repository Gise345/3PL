import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
View,
Text,
StyleSheet,
TouchableOpacity,
TextInput,
FlatList,
Alert,
ActivityIndicator,
StatusBar,
Image,
ScrollView,
Platform,
Dimensions,
SafeAreaView,
Modal,
Keyboard,
NativeEventSubscription,
BackHandler 
} from 'react-native';
import { DispatchCagesScreenProps } from '../../navigation/types';
import { useAppSelector } from '../../hooks/useRedux';
import { MaterialIcons } from '@expo/vector-icons';
import { Button, PhotoCapture, CameraModal } from '../../components/common';
import SignaturePad from '../../components/common/signature/SignaturePad';
import { useFocusEffect } from '@react-navigation/native';
import { useCamera } from '../../hooks/useCamera';
import { Audio } from 'expo-av';
import { cageService } from '../../api/cageService';
import { BarcodeScannerModal } from '../../components/common/barcode';
import { colors } from '../../utils/theme';


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
const { width } = Dimensions.get('window');

const DispatchCagesScreen: React.FC<DispatchCagesScreenProps> = ({ navigation }) => {
const { warehouse } = useAppSelector((state) => state.settings);

// Custom alert prompt for Android (since Alert.prompt is iOS-only)
const showEditRegistrationDialog = (
  currentValue: string,
  onSave: (newValue: string) => void
) => {
  if (Platform.OS === 'ios') {
    Alert.prompt(
      'Edit Registration',
      'Update the vehicle registration number',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Save',
          onPress: (value?: string) => {
            if (value && value.trim().length >= 3) {
              onSave(value.trim());
            }
          },
        },
      ],
      'plain-text',
      currentValue,
      'default'
    );
  } else {
    // For Android, we'd ideally use a custom dialog component
    // For simplicity in this example, we'll use a regular alert with instructions
    Alert.alert(
      'Edit Registration',
      'To edit registration, clear current value and enter a new one below.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear & Edit',
          onPress: () => {
            // Clear the current registration to allow editing
            onSave('');
          },
        },
      ]
    );
  }
};

// State for carriers and cages
const [loading, setLoading] = useState(false);
const [submitting, setSubmitting] = useState(false);
const [carriers, setCarriers] = useState<string[]>([]);
const [selectedCarrierIndex, setSelectedCarrierIndex] = useState<number | null>(null);
const [pickedCarrier, setPickedCarrier] = useState<string | null>(null);
const [openCages, setOpenCages] = useState<string[]>([]);
const [cagesToDispatch, setCagesToDispatch] = useState<string[]>([]);
const [cageIdField, setCageIdField] = useState('');
const [dispatchProcess, setDispatchProcess] = useState(false);

// State for truck photos and signature
const [driverReg, setDriverReg] = useState('');
const [parcelPhoto, setParcelPhoto] = useState<string | null>(null);
const [parcelPhotoName, setParcelPhotoName] = useState<string | null>(null);
const [signatureImage, setSignatureImage] = useState<string | null>(null);
const [signatureImageName, setSignatureImageName] = useState<string | null>(null);
const [showSignaturePad, setShowSignaturePad] = useState(false);
const [categoryName, setCategoryName] = useState<string>('Truck');
const [cameraType, setCameraType] = useState<'inbound' | 'transit' | 'product' | 'mrn' | 'order-check'>('transit');


// Sound players for feedback
const [sound, setSound] = useState<Audio.Sound | null>(null);


// Set up barcode scanning state from hooks
const [showScanner, setShowScanner] = useState(false);
const [scannedData, setScannedData] = useState<string | null>(null);
const [barcodeBuffer, setBarcodeBuffer] = useState<string>('');
const [lastKeyTime, setLastKeyTime] = useState<number>(0);
const [isScanning, setIsScanning] = useState(false);
const timeoutRef = useRef<number | null>(null);
const invisibleInputRef = useRef<TextInput>(null);
const scanTimeoutDuration = 50; // ms between keystrokes for external scanner
const [scanningMode, setScanningMode] = useState(false);

if (!navigation) {
  return null; // or a loading component
}



useEffect(() => {
  // When a carrier is picked and we're not in dispatch process, 
  // we're in scanning mode
  setScanningMode(pickedCarrier !== null && !dispatchProcess);
}, [pickedCarrier, dispatchProcess]);

// Add this useEffect to ensure focus on invisible input
useEffect(() => {
  if (scanningMode) {
    // Initial focus
    const initialFocusTimer = setTimeout(() => {
      if (invisibleInputRef.current) {
        invisibleInputRef.current.focus();
        Keyboard.dismiss();
      }
    }, 100);
    
    // Keep checking and refocusing
    const focusInterval = setInterval(() => {
      if (invisibleInputRef.current && !showScanner && !showSignaturePad && scanningMode) {
        invisibleInputRef.current.focus();
        Keyboard.dismiss();
      }
    }, 200);
    
    return () => {
      clearTimeout(initialFocusTimer);
      clearInterval(focusInterval);
    };
  }
}, [scanningMode, showScanner, showSignaturePad]);

// Add keyboard listener for ensuring focus
useEffect(() => {
  if (scanningMode) {
    const keyboardDidHideSubscription = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        if (invisibleInputRef.current) {
          invisibleInputRef.current.focus();
        }
      }
    );
    
    return () => {
      keyboardDidHideSubscription.remove();
    };
  }
}, [scanningMode]);

// Camera functionality
const { 
  showCamera,
  capturedImageUri,
  uploading,
  openCamera,
  closeCamera,
  handleImageCaptured,
} = useCamera({
  companyCode: 'OUT',
  referenceNumber: pickedCarrier || undefined,
  onImageCaptured: (imageUri, imageName) => {
    // Make sure we're actually updating the state with the captured image
    console.log('Image captured:', imageUri, imageName);
    setParcelPhoto(imageUri);
    setParcelPhotoName(imageName);
  }
});

// Clear more state variables in handleBack function
const handleBack = useCallback(() => {
  // Prevent multiple rapid calls
  if (loading || submitting) {
    return;
  }
  
  // Set a flag to prevent further interactions
  setLoading(true);
  
  // Clear all state synchronously first
  setSubmitting(false);
  setPickedCarrier(null);
  setOpenCages([]);
  setCagesToDispatch([]);
  setDispatchProcess(false);
  setCageIdField('');
  setDriverReg('');
  setParcelPhoto(null);
  setParcelPhotoName(null);
  setSignatureImage(null);
  setSignatureImageName(null);
  setShowSignaturePad(false);
  setShowScanner(false);
  closeCamera(); // Close camera if open
  
  // Use requestAnimationFrame instead of setTimeout for better timing
  requestAnimationFrame(() => {
    // Navigate back to home
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  });
}, [navigation, loading, submitting, closeCamera]);

// Same expanded cleanup in the useEffect
useEffect(() => {
  const unsubscribe = navigation.addListener('beforeRemove', (e) => {
    // Don't prevent navigation if we're already navigating
    if (loading || submitting) {
      return;
    }
    
    e.preventDefault();
    
    // Clear all state
    setSubmitting(false);
    setPickedCarrier(null);
    setOpenCages([]);
    setCagesToDispatch([]);
    setDispatchProcess(false);
    setCageIdField('');
    setDriverReg('');
    setParcelPhoto(null);
    setParcelPhotoName(null);
    setSignatureImage(null);
    setSignatureImageName(null);
    setShowSignaturePad(false);
    setShowScanner(false);
    
    // Close any open modals/cameras
    try {
      closeCamera();
    } catch (error) {
      console.log('Camera already closed');
    }
    
    // Use requestAnimationFrame for smoother navigation
    requestAnimationFrame(() => {
      navigation.dispatch(e.data.action);
    });
  });
  
  return unsubscribe;
}, [navigation, loading, submitting, closeCamera]);

// Helper to check if a scan appears complete
const isCompleteScan = (text: string): boolean => {
  // Customize based on your barcode format patterns
  return text.length >= 8 && /^[A-Z0-9]+$/.test(text);
};

// Enhanced cage ID input handler
const handleCageInput = (text: string) => {
  setCageIdField(text);
  
  // Auto-submit if the input appears to be a complete scan
  if (isCompleteScan(text)) {
    handleScanCage(text);
  }
};

// Add enhanced registration input handler
const handleRegistrationInput = (text: string) => {
  setDriverReg(text);
  
  // Auto-confirm if appears to be a complete registration (adapt as needed)
  if (text.length >= 3 && /^[A-Z0-9]+$/.test(text)) {
    handleConfirmDriverReg();
  }
};

// Reference to TextInput for focusing
const cageIdInputRef = useRef<TextInput>(null);

// Fetch carriers when screen is focused
useFocusEffect(
  useCallback(() => {
    fetchCarriers();
    
    // Load sounds
    loadSounds();
    
    return () => {
      // Unload sounds when component unmounts
      unloadSounds();
    };
  }, [])
);

// Add helper function to focus the invisible input
const focusInvisibleInput = useCallback(() => {
  if (invisibleInputRef.current) {
    invisibleInputRef.current.focus();
    Keyboard.dismiss();
  }
}, []);

// this useFocusEffect for maintaining focus on the invisible input
useFocusEffect(
  useCallback(() => {
    if (pickedCarrier && !dispatchProcess) {
      // Call immediately
      focusInvisibleInput();
      
      // Set up interval to ensure focus remains
      const focusInterval = setInterval(focusInvisibleInput, 300);
      
      // Ensure focus when keyboard hides
      const keyboardHideListener = Keyboard.addListener('keyboardDidHide', focusInvisibleInput);
      
      return () => {
        clearInterval(focusInterval);
        keyboardHideListener.remove();
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pickedCarrier, dispatchProcess, focusInvisibleInput])
);

// This useEffect to hide keyboard when screen loads
useEffect(() => {
  Keyboard.dismiss();
}, []);

// Update the handleKeyPress function to prevent navigation
const handleKeyPress = (e: any) => {
  // Skip if we're not in scanning mode
  if (!scanningMode) return;
  
  const currentTime = new Date().getTime();
  const key = e.nativeEvent.key;
  
  // Show scanning indicator
  setIsScanning(true);
  
  // Handle Enter/Return as end of scan
  if (key === 'Enter' || key === 'Return') {
    if (barcodeBuffer) {
      processScanBuffer(barcodeBuffer);
    }
    setBarcodeBuffer('');
    setIsScanning(false);
    return;
  }
  
  // Skip control and special keys
  if (key === 'Backspace' || key === 'Tab' || key === 'Escape' || 
      key === 'Shift' || key === 'Control' || key === 'Alt') {
    return;
  }
  
  // If this is part of an ongoing scan or new scan
  if (currentTime - lastKeyTime < scanTimeoutDuration || !barcodeBuffer) {
    // Update buffer with new character
    const newBuffer = barcodeBuffer + key;
    setBarcodeBuffer(newBuffer);
    setLastKeyTime(currentTime);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout to process barcode
    timeoutRef.current = setTimeout(() => {
      if (newBuffer) {
        processScanBuffer(newBuffer);
      }
    }, scanTimeoutDuration + 20);
  } else {
    // Start new scan
    setBarcodeBuffer(key);
    setLastKeyTime(currentTime);
  }
};

// Add this helper function to process the scan buffer
const processScanBuffer = (barcode: string) => {
  console.log('Processing scanned barcode:', barcode);
  
  try {
    // Trim and clean the barcode
    const cleanBarcode = barcode.trim().toUpperCase();
    
    if (!cleanBarcode || cleanBarcode.length < 3) {
      console.log('Barcode too short, ignoring:', cleanBarcode);
      setIsScanning(false);
      setBarcodeBuffer('');
      return;
    }
    
    // Show what was scanned in the field
    setCageIdField(cleanBarcode);
    
    // Process the scan
    if (!openCages.includes(cleanBarcode)) {
      if (cagesToDispatch.includes(cleanBarcode)) {
        console.log("Cage already scanned:", cleanBarcode);
        playErrorSound();
        Alert.alert('Already Scanned', 'This cage has already been scanned');
      } else {
        console.log("Cage not found:", cleanBarcode);
        playErrorSound();
        Alert.alert('Not Found', `Cage ${cleanBarcode} not found for carrier ${pickedCarrier}`);
      }
    } else {
      // Valid cage - add to dispatch list
      console.log("Valid cage found:", cleanBarcode);
      
      // Update state with new arrays
      setOpenCages(prev => prev.filter(id => id !== cleanBarcode));
      setCagesToDispatch(prev => [...prev, cleanBarcode]);
      
      playSuccessSound();
    }
  } catch (error) {
    console.error('Error processing barcode:', error);
  } finally {
    // Always reset the scan state
    setIsScanning(false);
    setBarcodeBuffer('');
    setCageIdField('');
    
    // Refocus the invisible input
    setTimeout(() => {
      if (invisibleInputRef.current && scanningMode) {
        invisibleInputRef.current.focus();
        Keyboard.dismiss();
      }
    }, 100);
  }
};

// Add this useEffect to prevent unintended navigation 
useEffect(() => {
  const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
    // Only handle back press if not in the middle of scanning or loading
    if (!isScanning && !loading && !submitting) {
      handleBack();
      return true; // Prevent default back behavior
    }
    return false; // Allow default behavior
  });
  
  return () => backHandler.remove();
}, [handleBack, isScanning, loading, submitting]);



// Set up keyboard listeners for external scanner - replace existing useEffect entirely
useEffect(() => {
  // Hide keyboard initially
  Keyboard.dismiss();
  
  if (pickedCarrier && !dispatchProcess) {
    // Initial focus
    focusInvisibleInput();
  }
}, [pickedCarrier, dispatchProcess, focusInvisibleInput]);


useEffect(() => {
  // This prevents back navigation when scanning is active
  const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
    // If scanning is active, prevent navigation
    if (isScanning) {
      return true; // Prevents default back behavior
    }
    return false; // Allow normal back navigation
  });
  
  return () => backHandler.remove();
}, [isScanning]);

// Load sound effects
const loadSounds = async () => {
  try {
    const sound = new Audio.Sound();
    await sound.loadAsync(require('../../../assets/sounds/beep.mp3'));
    setSound(sound);
  } catch (error) {
    console.error('Error loading sounds:', error);
  }
};

// Unload sound effects
const unloadSounds = async () => {
  if (sound) {
    await sound.unloadAsync();
  }
};

// Play success sound
const playSuccessSound = async () => {
  try {
    if (sound) {
      await sound.setPositionAsync(0);
      await sound.playAsync();
    }
  } catch (error) {
    console.error('Error playing sound:', error);
  }
};

// Play error sound (could be a different sound in a full implementation)
const playErrorSound = async () => {
  try {
    if (sound) {
      await sound.setPositionAsync(0);
      await sound.playAsync();
    }
  } catch (error) {
    console.error('Error playing sound:', error);
  }
};

// Fetch carriers with open cages
const fetchCarriers = useCallback(async () => {
  setLoading(true);
  try {
    const carriersWithCages = await cageService.getCarriersWithOpenCages(warehouse);
    const carrierList = carriersWithCages.map(item => item.carrier_id);
    setCarriers(carrierList);
  } catch (error) {
    console.error('Error fetching carriers:', error);
    Alert.alert('Error', 'An error occurred while fetching carriers');
  } finally {
    setLoading(false);
  }
}, [warehouse]);

// Handle carrier selection change
const handleCarrierChange = (event: any) => {
  setSelectedCarrierIndex(event.value);
};

// Pick a carrier and fetch open cages
// Pick a carrier and fetch open cages
const pickCarrier = async () => {
  if (selectedCarrierIndex === null) {
    Alert.alert('Error', 'Please select a carrier');
    return;
  }
  
  try {
    const carrier = carriers[selectedCarrierIndex];
    console.log("Selected carrier:", carrier); // Debug log
    
    // Set the picked carrier first
    setPickedCarrier(carrier);
    
    // Then fetch open cages for this carrier
    await fetchOpenCages(carrier);
  } catch (error) {
    console.error('Error in pickCarrier:', error);
    Alert.alert('Error', 'Failed to process carrier selection');
  }
};

// Fetch open cages for selected carrier
const fetchOpenCages = async (carrier: string) => {
  setLoading(true);
  try {
    // Call the API to get open cages and packages
    const cagePackages = await cageService.getOpenCagesPackages(carrier, warehouse);
    
    if (cagePackages) {
      console.log("Received cage packages:", cagePackages); // Debug log
      
      // Extract unique cage IDs (a cage might have multiple packages)
      const uniqueCageIds = Array.from(new Set(cagePackages.map(item => item.cage_id)));
      console.log("Unique cage IDs:", uniqueCageIds); // Debug log
      
      // Update the state with the open cages
      setOpenCages(uniqueCageIds);
    } else {
      // Handle the case when no cages are returned
      setOpenCages([]);
      console.log("No open cages found for carrier:", carrier);
    }
  } catch (error) {
    console.error('Error fetching open cages:', error);
    Alert.alert('Error', 'An error occurred while fetching open cages');
    setOpenCages([]);
  } finally {
    setLoading(false);
  }
};

// Focus on cage ID input field
const focusCageIdField = () => {
  setCageIdField('');
  if (cageIdInputRef.current) {
    cageIdInputRef.current.focus();
  }
};

// Handle cage ID scanning
// Update your handleScanCage function to accept an optional parameter
const handleScanCage = (scanValue: string = cageIdField) => {
  if (!scanValue) return;
  
  console.log("Scanning cage ID:", scanValue);
  console.log("Open cages:", openCages);
  console.log("Cages to dispatch:", cagesToDispatch);
  
  if (!openCages.includes(scanValue)) {
    if (cagesToDispatch.includes(scanValue)) {
      console.log("Cage already scanned:", scanValue);
      playErrorSound();
      Alert.alert('Error', 'Cage has already been scanned');
    } else {
      console.log("Cage not found:", scanValue);
      playErrorSound();
      Alert.alert('Error', `Cage not found under open cages for carrier ${pickedCarrier}`);
    }
  } else {
    // Valid cage - move from openCages to cagesToDispatch
    console.log("Valid cage found, moving to dispatch list:", scanValue);
    
    // Update state by removing from open cages and adding to dispatch cages
    setOpenCages(prev => prev.filter(id => id !== scanValue));
    setCagesToDispatch(prev => [...prev, scanValue]);
    
    playSuccessSound();
  }
  
  // Clear the input field and refocus
  setCageIdField('');
  setTimeout(focusCageIdField, 100);
};

// Remove cage from dispatch list
const removeCageFromDispatch = (cageId: string) => {
  setCagesToDispatch(cagesToDispatch.filter(id => id !== cageId));
  setOpenCages([...openCages, cageId]);
};

// Start dispatch process
const startDispatchProcess = () => {
  if (cagesToDispatch.length === 0) {
    Alert.alert('Error', 'Please scan at least one cage to dispatch');
    return;
  }
  
  setDispatchProcess(true);
};

// Handle truck photo capture
const handleTakeParcelPhoto = () => {
  openCamera('transit', 'Truck');
  setCameraType('transit');
  openCamera('transit', 'Truck');
};

// Handle setting driver registration
const handleConfirmDriverReg = () => {
  if (driverReg.length < 3) {
    Alert.alert('Error', 'Please enter a valid registration number');
    return;
  }
 
  // Set driver reg in uppercase for consistency
  setDriverReg(driverReg.toUpperCase());
  
  // Close keyboard
  Keyboard.dismiss();
  
  // Here we could toggle a state to hide the input section if desired
  setShowRegistrationInput(false);
};

const [showRegistrationInput, setShowRegistrationInput] = useState(true);

// handler for editing registration
const handleEditRegistration = () => {
  setShowRegistrationInput(true);
};

// Handler for clearing registration
const handleClearRegistration = () => {
  setDriverReg('');
  setShowRegistrationInput(true);
};


// Handle signature capture
const handleSignatureCaptured = (signatureUri: string, signatureName: string) => {
  setSignatureImage(signatureUri);
  setSignatureImageName(signatureName);
  setShowSignaturePad(false);
};

// Submit dispatch request
const handleSubmitDispatch = async () => {
  if (!pickedCarrier || !driverReg || !parcelPhoto || !signatureImage || !parcelPhotoName || !signatureImageName) {
    Alert.alert('Error', 'Please complete all required fields');
    return;
  }
  
  setSubmitting(true);
  
  try {
    // Generate outbound reference (format: carrierName_YYYYMMDD)
    const date = new Date();
    const day = date.toISOString().split('T')[0].replace(/-/g, '');
    
    // Camelize carrier name (e.g., "Royal Mail" -> "royalMail")
    const camelizedName = pickedCarrier
      .split(' ')
      .map((word, index) => 
        index === 0 
          ? word.toLowerCase() 
          : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .join('');
    
    const outboundRef = `${camelizedName}_${day}`;
    
    // Step 1: Create outbound record
    const outboundData = {
      carrierName: pickedCarrier,
      driverRegistration: driverReg.toUpperCase(),
      driverSignature: signatureImageName,
      loadoutTime: date,
      numberOfParcels: cagesToDispatch.length,
      outboundRef,
      outboundType: 'carrier',
      parcelPhoto: parcelPhotoName,
      warehouse,
      loadoutType: 'standard'
    };
    
    const outboundResponse = await cageService.processLoadoutCages(outboundData);
    
    // Step 2: Dispatch cages using the outbound ID
    if (outboundResponse.data?.outbound?.id) {
      const outboundId = outboundResponse.data.outbound.id;
      const dispatchResponse = await cageService.dispatchCages(cagesToDispatch, outboundId);
      
      let successMessage = `${cagesToDispatch.length} cages have been dispatched successfully`;
      
      if (dispatchResponse.data) {
        successMessage = dispatchResponse.data;
      }
      
      Alert.alert(
        'Success',
        successMessage,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } else {
      throw new Error('Could not get created outbound ID');
    }
  } catch (error: any) {
    console.error('Error submitting dispatch:', error);
    Alert.alert('Error', error.message || 'Failed to dispatch cages. Please try again.');
  } finally {
    setSubmitting(false);
  }
};

// Reset carrier selection
const resetCarrierSelection = () => {
  setPickedCarrier(null);
  setOpenCages([]);
  setCagesToDispatch([]);
  setDispatchProcess(false);
  setCageIdField('');
  setDriverReg('');
  setParcelPhoto(null);
  setParcelPhotoName(null);
  setSignatureImage(null);
  setSignatureImageName(null);
};

// Render carrier selection view
// Render carrier selection view
const renderCarrierSelection = () => (
  <View style={[styles.section, {flex: 1}]}>
    <Text style={styles.sectionTitle}>Select Carrier</Text>
    
    {loading ? (
      <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
    ) : (
      <>
        {carriers.length > 0 ? (
          <View style={{flex: 1}}>
            {/* Use FlatList directly without nesting it */}
            <FlatList
              data={carriers}
              keyExtractor={(item, index) => `carrier-${index}`}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.carrierItem,
                    selectedCarrierIndex === index && styles.selectedCarrierItem
                  ]}
                  onPress={() => setSelectedCarrierIndex(index)}
                >
                  <Text 
                    style={[
                      styles.carrierName,
                      selectedCarrierIndex === index && styles.selectedCarrierName
                    ]}
                  >
                    {item}
                  </Text>
                  {selectedCarrierIndex === index && (
                    <MaterialIcons name="check-circle" size={24} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyMessage}>No carriers available</Text>}
              style={styles.carrierList}
            />
            
            <Button
              title="Select Carrier"
              onPress={pickCarrier}
              style={styles.actionButton}
              disabled={selectedCarrierIndex === null}
            />
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateIcon}>🚚</Text>
            <Text style={styles.emptyStateTitle}>No Carriers Available</Text>
            <Text style={styles.emptyStateDescription}>
              There are no carriers with open cages available for dispatch.
            </Text>
          </View>
        )}
      </>
    )}
  </View>
);

// Render cage scanning view
// Render cage scanning view
const renderCageScanning = () => (
  <View style={styles.fullSection}>
    <View style={styles.carrierHeader}>
      <Text style={styles.carrierHeaderText}>
        Dispatching cages for <Text style={styles.highlightedText}>{pickedCarrier}</Text>
      </Text>
      <Button
        title="Change Carrier"
        onPress={resetCarrierSelection}
        variant="outline"
        style={styles.changeCarrierButton}
      />
    </View>
    
    <View style={styles.scannerSection}>
      <Text style={styles.scanInstructions}>Scan cage or enter cage ID:</Text>
      <View style={styles.scanInputContainer}>
      <TextInput
        ref={cageIdInputRef}
        style={styles.scanInput}
        value={cageIdField}
        onChangeText={handleCageInput}
        placeholder="Enter or scan cage ID"
        placeholderTextColor={COLORS.textLight}
        returnKeyType="go"
        onSubmitEditing={() => handleScanCage()}
        autoCapitalize="characters"
        blurOnSubmit={false}
        selectTextOnFocus={true}
        showSoftInputOnFocus={false}
        onFocus={() => {
          // Only show keyboard when user explicitly taps on field
          setTimeout(() => {
            if (cageIdInputRef.current) {
              cageIdInputRef.current.setNativeProps({ showSoftInputOnFocus: true });
            }
          }, 50);
        }}
      />
        <TouchableOpacity 
          style={styles.scanButton}
          onPress={openScanner}
        >
          <MaterialIcons name="qr-code-scanner" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
    
    {/* Cage lists container with auto-height based on content */}
    <View style={styles.cagesContainer}>
      {/* Open Cages section */}
      <View style={styles.cageListContainer}>
        <Text style={styles.cageListTitle}>
          Open Cages: <Text style={styles.cageCount}>{openCages.length}</Text>
        </Text>
        
        {/* ScrollView with max height for many items */}
        <ScrollView 
          style={[
            styles.cageItemsScrollView, 
            openCages.length > 5 && styles.cageItemsScrollViewTall
          ]}
          nestedScrollEnabled={true}
        >
          <View style={styles.cageItemsContainer}>
            {openCages.length > 0 ? (
              openCages.map((item) => (
                <View key={`open-${item}`} style={styles.cageItem}>
                  <Text style={styles.cageId}>{item}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noCagesText}>No open cages remaining</Text>
            )}
          </View>
        </ScrollView>
      </View>
      
      {/* Scanned Cages section */}
      <View style={styles.cageListContainer}>
        <Text style={styles.cageListTitle}>
          Scanned Cages: <Text style={styles.cageCount}>{cagesToDispatch.length}</Text>
        </Text>
        
        {/* Render items directly instead of using FlatList */}
        <View style={styles.cageItemsContainer}>
          {cagesToDispatch.length > 0 ? (
            cagesToDispatch.map((item) => (
              <View key={`dispatch-${item}`} style={styles.cageItem}>
                <Text style={styles.cageId}>{item}</Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeCageFromDispatch(item)}
                >
                  <MaterialIcons name="close" size={18} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.noCagesText}>No cages scanned yet</Text>
          )}
        </View>
      </View>
    </View>
    
    {cagesToDispatch.length > 0 && (
      <Button
        title={`Dispatch ${cagesToDispatch.length} Cage${cagesToDispatch.length > 1 ? 's' : ''}`}
        onPress={startDispatchProcess}
        style={styles.dispatchButton}
        variant="primary"
      />
    )}
  </View>
);

// Render dispatch process view
const renderDispatchProcess = () => (
  <View style={styles.fullSection}>
    <View style={styles.carrierHeader}>
      <Text style={styles.carrierHeaderText}>
        Dispatching <Text style={styles.highlightedText}>{cagesToDispatch.length} cages</Text> for {pickedCarrier}
      </Text>
    </View>
    
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Dispatch Summary</Text>
      
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Carrier:</Text>
        <Text style={styles.summaryValue}>{pickedCarrier}</Text>
      </View>
      
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Number of Cages:</Text>
        <Text style={styles.summaryValue}>{cagesToDispatch.length}</Text>
      </View>
      
      {/* Registration display in summary with edit/delete button */}
      {driverReg && (
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Registration:</Text>
          <View style={styles.editableValue}>
            <Text style={styles.summaryValue}>{driverReg.toUpperCase()}</Text>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={handleClearRegistration}
            >
              <MaterialIcons name="close" size={18} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      <View style={styles.photoGrid}>
        <View style={styles.photoContainer}>
          <Text style={styles.photoLabel}>Truck Photo</Text>
          {parcelPhoto ? (
            <View>
              <Image source={{ uri: parcelPhoto }} style={styles.photo} />
              <TouchableOpacity 
                style={styles.retakePhotoButton}
                onPress={handleTakeParcelPhoto}
              >
                <MaterialIcons name="refresh" size={18} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.photoPlaceholder}
              onPress={handleTakeParcelPhoto}
            >
              <MaterialIcons name="add-a-photo" size={36} color={COLORS.border} />
              <Text style={styles.photoPlaceholderText}>Tap to capture</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.photoContainer}>
          <Text style={styles.photoLabel}>Driver Signature</Text>
          {signatureImage ? (
            <View>
              <Image source={{ uri: signatureImage }} style={styles.photo} />
              <TouchableOpacity 
                style={styles.retakePhotoButton}
                onPress={() => setShowSignaturePad(true)}
              >
                <MaterialIcons name="refresh" size={18} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.photoPlaceholder}
              onPress={() => {
                if (driverReg && driverReg.length >= 3) {
                  setShowSignaturePad(true);
                } else {
                  Alert.alert(
                   'Registration Required',
                   'Please enter a valid registration number first'
                 );
               }
             }}
           >
             <MaterialIcons name="gesture" size={36} color={COLORS.border} />
             <Text style={styles.photoPlaceholderText}>
               {driverReg && driverReg.length >= 3 ? 'Tap to capture' : 'Complete registration first'}
             </Text>
           </TouchableOpacity>
         )}
       </View>
     </View>
   </View>
   
   {/* Registration input section - separate from summary */}
   {showRegistrationInput && (
     <View style={styles.inputSection}>
       <Text style={styles.inputLabel}>Vehicle Registration Number</Text>
       <View style={styles.registrationInputContainer}>
         <TextInput
           style={styles.registrationFieldInput}
           value={driverReg}
           onChangeText={handleRegistrationInput}
           placeholder="Enter registration"
           placeholderTextColor={COLORS.textLight}
           autoCapitalize="characters"
           blurOnSubmit={false}
           selectTextOnFocus={true}
         />
         <TouchableOpacity 
           style={[
             styles.confirmButton,
             driverReg.length < 3 && styles.disabledButton
           ]}
           onPress={handleConfirmDriverReg}
           disabled={driverReg.length < 3}
         >
           <Text style={styles.confirmButtonText}>Confirm</Text>
         </TouchableOpacity>
       </View>
       {driverReg && driverReg.length < 3 && (
         <Text style={styles.validationText}>Registration must be at least 3 characters</Text>
       )}
     </View>
   )}
   
   {/* Submit button - enabled when all required fields are present */}
   {(parcelPhoto && driverReg && driverReg.length >= 3 && signatureImage) ? (
     <Button
       title="Submit Dispatch"
       onPress={handleSubmitDispatch}
       style={styles.submitButton}
       loading={submitting}
       disabled={submitting}
     />
   ) : (
     <Text style={styles.instructionText}>
       {!parcelPhoto ? '• Please capture a truck photo\n' : ''}
       {!driverReg || driverReg.length < 3 ? '• Please enter a valid registration number\n' : ''}
       {!signatureImage ? '• Please capture driver signature' : ''}
     </Text>
   )}
 </View>
);

// Open barcode scanner
const openScanner = () => {
 setShowScanner(true);
};


return (
 <SafeAreaView style={styles.safeArea}>
   <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
   
  
    {pickedCarrier && !dispatchProcess && (
      <>
        {/* Invisible input for external scanner */}
          {scanningMode && (
            <TextInput
              ref={invisibleInputRef}
              style={{ position: 'absolute', height: 0, width: 0, opacity: 0 }}
              onKeyPress={handleKeyPress}
              autoCapitalize="characters"
              blurOnSubmit={false}
              autoCorrect={false}
              caretHidden={true}
              autoFocus={true}
              showSoftInputOnFocus={false}
            />
          )}
        
        {/* External scanner indicator */}
        {isScanning && (
          <View style={styles.scanningIndicator}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.scanningText}>Reading external scanner...</Text>
          </View>
        )}
      </>
    )}

   {/* Header */}
   <View style={styles.header}>
     <TouchableOpacity
       style={styles.backButton}
       onPress={handleBack}
       activeOpacity={0.7}
        disabled={loading || submitting} // Disable when loading
     >
       <Text style={[styles.backButtonText, (loading || submitting) && { opacity: 0.5 } ]}>←</Text>
     </TouchableOpacity>


       <Text style={styles.headerTitleText}>Dispatch Cages </Text>
       <Text style={[styles.headerTitleText, styles.warehouseText]}>({warehouse})</Text>
     
     <View style={styles.headerPlaceholder} />
   </View>
   
   {/* Main content - use conditional rendering instead of ScrollView */}
   <View style={styles.mainContainer}>
    
       {!pickedCarrier && renderCarrierSelection()}
       {pickedCarrier && !dispatchProcess && renderCageScanning()}
       {pickedCarrier && dispatchProcess && renderDispatchProcess()}
 
   </View>

       {/* Camera Modal */}
       <CameraModal
         visible={showCamera}
         onClose={closeCamera}
         onImageCaptured={handleImageCaptured}
         category={categoryName || 'Truck'} // Provide default value
         type={cameraType || 'transit'} // Provide default value
         companyCode="OUT"
         referenceNumber={pickedCarrier || ''}
   />
   
   {/* Signature Pad Modal */}
   <Modal
     visible={showSignaturePad}
     transparent={true}
     animationType="slide"
   >
     <View style={styles.signatureModalContainer}>
       <View style={styles.signatureModalContent}>
         <View style={styles.signatureModalHeader}>
           <Text style={styles.signatureModalTitle}>Driver Signature</Text>
           <TouchableOpacity 
             style={styles.signatureCloseButton}
             onPress={() => setShowSignaturePad(false)}
           >
             <MaterialIcons name="close" size={24} color={COLORS.text} />
           </TouchableOpacity>
         </View>
         
         <SignaturePad
           onSignatureCapture={handleSignatureCaptured}
           companyCode="OUT"
           carrierName={pickedCarrier || ''}
         />
       </View>
     </View>
   </Modal>

   {/* Barcode Scanner Modal */}
   <BarcodeScannerModal
 visible={showScanner}
 onClose={() => setShowScanner(false)}
 onBarcodeScanned={(barcode) => {
   // First close the scanner
   setShowScanner(false);
   
   // Set the cage ID field
   setCageIdField(barcode);
   
   // Process the scanned cage with a small delay to ensure state updates properly
   setTimeout(() => {
     if (barcode) {
       // Check if the barcode is a valid cage
       if (!openCages.includes(barcode)) {
         if (cagesToDispatch.includes(barcode)) {
           playErrorSound();
           Alert.alert('Error', 'Cage has already been scanned');
         } else {
           playErrorSound();
           Alert.alert('Error', `Cage not found under open cages for carrier ${pickedCarrier}`);
         }
       } else {
         // Create new arrays instead of mutating state directly
         const newOpenCages = [...openCages].filter(id => id !== barcode);
         const newCagesToDispatch = [...cagesToDispatch, barcode];
         
         // Update state with new arrays
         setOpenCages(newOpenCages);
         setCagesToDispatch(newCagesToDispatch);
         playSuccessSound();
       }
       // Reset the input field
       setCageIdField('');
     }
   }, 300);
 }}
 title="Scan Cage ID"
/>
   
   {/* Loading Overlay */}
   {(loading || submitting) && (
     <View style={styles.loadingOverlay}>
       <View style={styles.loadingBox}>
         <ActivityIndicator size="large" color={COLORS.primary} />
         <Text style={styles.loadingOverlayText}>
           {submitting ? 'Submitting dispatch...' : 'Loading...'}
         </Text>
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
 paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
},
header: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center',
 paddingHorizontal: 16,
 paddingVertical: 20,
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
},
scrollContent: {
 padding: 16,
 paddingBottom: 30,
 flexGrow: 1,
},
section: {
 backgroundColor: COLORS.card,
 borderRadius: 16,
 padding: 16,
 marginBottom: 16,
 minHeight: 100,
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
fullSection: {
 flex: 1,
},
sectionTitle: {
 fontSize: 18,
 fontWeight: '700',
 color: COLORS.text,
 marginBottom: 16,
 textAlign: 'center',
},
loader: {
 marginVertical: 30,
},
pickerContainer: {
 backgroundColor: COLORS.surface,
 borderRadius: 12,
 marginBottom: 16,
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
carrierList: {
 minHeight: 50,
 width: '100%',
},
carrierItem: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center',
 padding: 16,
 borderBottomWidth: 1,
 borderBottomColor: COLORS.border,
},
selectedCarrierItem: {
 backgroundColor: 'rgba(0, 169, 181, 0.1)',
},
carrierName: {
 fontSize: 16,
 color: COLORS.text,
},
selectedCarrierName: {
 fontWeight: '600',
 color: COLORS.primary,
},
actionButton: {
 marginTop: 8,
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
carrierHeader: {
 backgroundColor: COLORS.card,
 borderRadius: 12,
 padding: 16,
 marginBottom: 16,
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center',
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
carrierHeaderText: {
 fontSize: 16,
 color: COLORS.text,
 flex: 1,
},
highlightedText: {
 color: COLORS.primary,
 fontWeight: '700',
},
changeCarrierButton: {
 marginLeft: 8,
},
scannerSection: {
 backgroundColor: COLORS.card,
 borderRadius: 12,
 padding: 16,
 marginBottom: 16,
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
scanInstructions: {
 fontSize: 16,
 color: COLORS.text,
 marginBottom: 12,
 textAlign: 'center',
},
scanInputContainer: {
 flexDirection: 'row',
 alignItems: 'center',
},
scanInput: {
 flex: 1,
 backgroundColor: COLORS.inputBackground,
 borderWidth: 1,
 borderColor: COLORS.border,
 borderRadius: 8,
 padding: 12,
 fontSize: 16,
 color: COLORS.text,
 marginRight: 8,
},
scanButton: {
 backgroundColor: COLORS.primary,
 width: 48,
 height: 48,
 borderRadius: 8,
 alignItems: 'center',
 justifyContent: 'center',
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
cagesContainer: {
 flexDirection: 'row',
 marginBottom: 16,
 
},
cageListContainer: {
 flex: 1,
 backgroundColor: COLORS.card,
 borderRadius: 12,
 padding: 12,
 marginHorizontal: 4,
 maxHeight: 220, 
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
cageList: {
 height: 150, // Fixed height for the FlatList
},
cageListTitle: {
 fontSize: 14,
 color: COLORS.text,
 marginBottom: 8,
 textAlign: 'center',
 fontWeight: '600',
},
cageCount: {
 color: COLORS.primary,
 fontWeight: '700',
},
cageItemsContainer: {
 marginTop: 4,
},
cageItem: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center',
 backgroundColor: COLORS.surface,
 padding: 10,
 borderRadius: 8,
 marginBottom: 6,
},
cageId: {
 fontSize: 14,
 color: COLORS.text,
 fontWeight: '500',
},
removeButton: {
 padding: 4,
},
noCagesText: {
 fontSize: 14,
 color: COLORS.textLight,
 textAlign: 'center',
 fontStyle: 'italic',
 padding: 16,
},
dispatchButton: {
 backgroundColor: COLORS.primary,
 marginTop: 8,
},
summaryCard: {
 backgroundColor: COLORS.card,
 borderRadius: 12,
 padding: 16,
 marginBottom: 16,
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
summaryTitle: {
 fontSize: 18,
 fontWeight: '700',
 color: COLORS.text,
 marginBottom: 16,
 textAlign: 'center',
},
summaryItem: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 paddingVertical: 8,
 borderBottomWidth: 1,
 borderBottomColor: COLORS.border,
},
summaryLabel: {
 fontSize: 16,
 color: COLORS.textLight,
},
summaryValue: {
 fontSize: 16,
 color: COLORS.text,
 fontWeight: '600',
},
photoGrid: {
 flexDirection: 'row',
 marginTop: 16,
},
photoContainer: {
 flex: 1,
 alignItems: 'center',
 marginHorizontal: 4,
},
photoLabel: {
 fontSize: 14,
 color: COLORS.textLight,
 marginBottom: 8,
 textAlign: 'center',
},
photo: {
 width: 120,
 height: 120,
 borderRadius: 8,
 borderWidth: 1,
 borderColor: COLORS.border,
},
photoPlaceholder: {
 width: 120,
 height: 120,
 borderRadius: 8,
 backgroundColor: COLORS.surface,
 borderWidth: 1,
 borderColor: COLORS.border,
 alignItems: 'center',
 justifyContent: 'center',
},
photoPlaceholderText: {
 fontSize: 12,
 color: COLORS.textLight,
 textAlign: 'center',
 marginTop: 4,
 padding: 4,
},
inputSection: {
 backgroundColor: COLORS.card,
 borderRadius: 12,
 padding: 16,
 marginBottom: 16,
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
inputLabel: {
 fontSize: 16,
 color: COLORS.text,
 marginBottom: 8,
},
registrationInput: {
 backgroundColor: COLORS.inputBackground,
 borderWidth: 1,
 borderColor: COLORS.border,
 borderRadius: 8,
 padding: 12,
 fontSize: 16,
 color: COLORS.text,
 marginBottom: 16,
},
submitButton: {
 backgroundColor: COLORS.primary,
 marginTop: 16,
},
// Editable values in summary
editableValue: {
 flexDirection: 'row',
 alignItems: 'center',
},
editButton: {
 padding: 6,
 marginLeft: 8,
},
inlineSummaryInput: {
 flex: 1,
 height: 36,
 backgroundColor: COLORS.inputBackground,
 borderWidth: 1,
 borderColor: COLORS.border,
 borderRadius: 6,
 paddingHorizontal: 8,
 fontSize: 14,
 color: COLORS.text,
},
retakePhotoButton: {
 position: 'absolute',
 bottom: 8,
 right: 8,
 backgroundColor: 'rgba(0, 0, 0, 0.6)',
 width: 32,
 height: 32,
 borderRadius: 16,
 justifyContent: 'center',
 alignItems: 'center',
 ...Platform.select({
   ios: {
     shadowColor: COLORS.shadow,
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.3,
     shadowRadius: 2,
   },
   android: {
     elevation: 3,
   },
 }),
},
instructionText: {
 fontSize: 14,
 color: COLORS.textLight,
 textAlign: 'center',
 marginTop: 16,
 lineHeight: 20,
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
signatureModalContainer: {
 flex: 1,
 backgroundColor: 'rgba(0, 0, 0, 0.5)',
 justifyContent: 'center',
},
signatureModalContent: {
 backgroundColor: COLORS.card,
 margin: 20,
 borderRadius: 16,
 overflow: 'hidden',
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
signatureModalHeader: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center',
 padding: 16,
 borderBottomWidth: 1,
 borderBottomColor: COLORS.border,
},
signatureModalTitle: {
 fontSize: 18,
 fontWeight: '600',
 color: COLORS.text,
},
signatureCloseButton: {
 padding: 4,
},
// Barcode scanner modal styles
scannerModalContainer: {
 flex: 1,
 backgroundColor: COLORS.background,
},
scannerModalHeader: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center',
 padding: 16,
 borderBottomWidth: 1,
 borderBottomColor: COLORS.border,
 backgroundColor: COLORS.card,
},
scannerModalTitle: {
 fontSize: 18,
 fontWeight: '600',
 color: COLORS.text,
},
scannerCloseButton: {
 padding: 8,
},
scannerHeaderPlaceholder: {
 width: 40,
},
scannerPlaceholder: {
 flex: 1,
 alignItems: 'center',
 justifyContent: 'center',
 padding: 20,
},
scannerPlaceholderText: {
 fontSize: 16,
 color: COLORS.textLight,
 marginTop: 16,
 marginBottom: 32,
 textAlign: 'center',
},
simulateScanButton: {
 width: 200,
},
emptyMessage: {
 textAlign: 'center',
 padding: 20,
 color: COLORS.textLight,
},
registrationInputContainer: {
 flexDirection: 'row',
 alignItems: 'center',
},
registrationFieldInput: {
 flex: 1,
 backgroundColor: COLORS.inputBackground,
 borderWidth: 1,
 borderColor: COLORS.border,
 borderRadius: 8,
 padding: 12,
 fontSize: 16,
 color: COLORS.text,
 marginRight: 8,
},
confirmButton: {
 backgroundColor: COLORS.primary,
 paddingVertical: 12,
 paddingHorizontal: 16,
 borderRadius: 8,
 alignItems: 'center',
 justifyContent: 'center',
},
confirmButtonText: {
 color: 'white',
 fontWeight: '600',
 fontSize: 14,
},
validationText: {
 fontSize: 12,
 color: COLORS.error,
 marginTop: 5,
},
disabledButton: {
 backgroundColor: COLORS.textLight,
},
// Add these styles to the existing styles object
mainContainer: {
 flex: 1,
 padding: 16,
},
cageListWrapper: {
 height: 200, // Fixed height for the list container
 flex: 1,
},
cageItemsScrollView: {
 maxHeight: 150, // Default max height
},
cageItemsScrollViewTall: {
 maxHeight: 200, // Taller when there are many items
},
scanningIndicator: {
 flexDirection: 'row',
 alignItems: 'center',
 justifyContent: 'center',
 padding: 8,
 marginHorizontal: 16,
 marginTop: 8,
 backgroundColor: colors.primary + '10', // 10% opacity
 borderRadius: 4,
},
scanningText: {
 marginLeft: 8,
 color: colors.primary,
 fontSize: 14,
},
});

export default DispatchCagesScreen; 