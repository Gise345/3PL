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
  Animated,
  Platform,
  Dimensions,
  SafeAreaView,
  Modal
} from 'react-native';
import { DispatchCagesScreenProps } from '../../navigation/types';
import { useAppSelector } from '../../hooks/useRedux';
import { MaterialIcons } from '@expo/vector-icons';
import { Button, PhotoCapture } from '../../components/common';
import SignaturePad from '../../components/common/signature/SignaturePad';
import { useFocusEffect } from '@react-navigation/native';
import { useCamera } from '../../hooks/useCamera';
import { Audio } from 'expo-av';
import { cageService } from '../../api/cageService';

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
  
  // Sound players for feedback
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  
  // Animation values
  const [fadeIn] = useState(new Animated.Value(0));
  const [slideUp] = useState(new Animated.Value(30));
  const [titleScale] = useState(new Animated.Value(0.95));

  // Camera functionality
  const { 
    openCamera, 
    handleImageCaptured 
  } = useCamera({
    companyCode: 'OUT',
    referenceNumber: pickedCarrier || undefined,
    onImageCaptured: (imageUri, imageName) => {
      setParcelPhoto(imageUri);
      setParcelPhotoName(imageName);
    }
  });

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
  const pickCarrier = async () => {
    if (selectedCarrierIndex === null) {
      Alert.alert('Error', 'Please select a carrier');
      return;
    }
    
    const carrier = carriers[selectedCarrierIndex];
    setPickedCarrier(carrier);
    await fetchOpenCages(carrier);
  };

  // Fetch open cages for selected carrier
  const fetchOpenCages = async (carrier: string) => {
    setLoading(true);
    try {
      const cagePackages = await cageService.getOpenCagesPackages(carrier, warehouse);
      
      // Extract unique cage IDs (a cage might have multiple packages)
      const uniqueCageIds = Array.from(new Set(cagePackages.map(item => item.cage_id)));
      setOpenCages(uniqueCageIds);
    } catch (error) {
      console.error('Error fetching open cages:', error);
      Alert.alert('Error', 'An error occurred while fetching open cages');
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
  const handleScanCage = () => {
    if (!cageIdField) return;
    
    if (!openCages.includes(cageIdField)) {
      if (cagesToDispatch.includes(cageIdField)) {
        playErrorSound();
        Alert.alert('Error', 'Cage has already been scanned');
      } else {
        playErrorSound();
        Alert.alert('Error', `Cage not found under open cages for carrier ${pickedCarrier}`);
      }
    } else {
      // Valid cage - move from openCages to cagesToDispatch
      setOpenCages(openCages.filter(id => id !== cageIdField));
      setCagesToDispatch([...cagesToDispatch, cageIdField]);
      playSuccessSound();
    }
    
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
  };

  // Handle setting driver registration
  const handleConfirmDriverReg = () => {
    if (driverReg.length < 3) {
      Alert.alert('Error', 'Please enter a valid registration number');
      return;
    }
    
    // Show signature pad
    setShowSignaturePad(true);
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
  const renderCarrierSelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Select Carrier</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : (
        <>
          {carriers.length > 0 ? (
            <>
              <View style={styles.pickerContainer}>
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
                  style={styles.carrierList}
                />
              </View>
              
              <Button
                title="Select Carrier"
                onPress={pickCarrier}
                style={styles.actionButton}
                disabled={selectedCarrierIndex === null}
              />
            </>
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
            onChangeText={setCageIdField}
            placeholder="Enter or scan cage ID"
            placeholderTextColor={COLORS.textLight}
            returnKeyType="go"
            onSubmitEditing={handleScanCage}
            autoCapitalize="characters"
          />
          <TouchableOpacity 
            style={styles.scanButton}
            onPress={handleScanCage}
          >
            <MaterialIcons name="qr-code-scanner" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.cagesContainer}>
        <View style={styles.cageListContainer}>
          <Text style={styles.cageListTitle}>
            Open Cages: <Text style={styles.cageCount}>{openCages.length}</Text>
          </Text>
          {openCages.length > 0 ? (
            <FlatList
              data={openCages}
              keyExtractor={(item) => `open-${item}`}
              renderItem={({ item }) => (
                <View style={styles.cageItem}>
                  <Text style={styles.cageId}>{item}</Text>
                </View>
              )}
              style={styles.cageList}
            />
          ) : (
            <Text style={styles.noCagesText}>No open cages remaining</Text>
          )}
        </View>
        
        <View style={styles.cageListContainer}>
          <Text style={styles.cageListTitle}>
            Scanned Cages: <Text style={styles.cageCount}>{cagesToDispatch.length}</Text>
          </Text>
          {cagesToDispatch.length > 0 ? (
            <FlatList
              data={cagesToDispatch}
              keyExtractor={(item) => `dispatch-${item}`}
              renderItem={({ item }) => (
                <View style={styles.cageItem}>
                  <Text style={styles.cageId}>{item}</Text>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeCageFromDispatch(item)}
                  >
                    <MaterialIcons name="close" size={18} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              )}
              style={styles.cageList}
            />
          ) : (
            <Text style={styles.noCagesText}>No cages scanned yet</Text>
          )}
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
        
        {driverReg && (
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Registration:</Text>
            <Text style={styles.summaryValue}>{driverReg.toUpperCase()}</Text>
          </View>
        )}
        
        <View style={styles.photoGrid}>
          <View style={styles.photoContainer}>
            <Text style={styles.photoLabel}>Truck Photo</Text>
            {parcelPhoto ? (
              <Image source={{ uri: parcelPhoto }} style={styles.photo} />
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
              <Image source={{ uri: signatureImage }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <MaterialIcons name="gesture" size={36} color={COLORS.border} />
                <Text style={styles.photoPlaceholderText}>Complete registration first</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      
      {!parcelPhoto && (
        <PhotoCapture
          title="Capture Truck Image"
          cameraType="transit"
          category="Truck"
          companyCode="OUT"
          referenceNumber={pickedCarrier || undefined}
          onImageCaptured={(imageUri, imageName) => {
            setParcelPhoto(imageUri);
            setParcelPhotoName(imageName);
          }}
        />
      )}
      
      {parcelPhoto && !driverReg && (
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Registration Number</Text>
          <TextInput
            style={styles.registrationInput}
            value={driverReg}
            onChangeText={setDriverReg}
            placeholder="Enter vehicle registration"
            placeholderTextColor={COLORS.textLight}
            autoCapitalize="characters"
          />
          <Button
            title="Confirm Registration"
            onPress={handleConfirmDriverReg}
            style={styles.actionButton}
            disabled={driverReg.length < 3}
          />
        </View>
      )}
      
      {parcelPhoto && driverReg && !signatureImage && (
        <Button
          title="Capture Driver Signature"
          onPress={() => setShowSignaturePad(true)}
          style={styles.actionButton}
        />
      )}
      
      {parcelPhoto && driverReg && signatureImage && (
        <Button
          title="Submit Dispatch"
          onPress={handleSubmitDispatch}
          style={styles.submitButton}
          loading={submitting}
          disabled={submitting}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
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
          <Text style={styles.headerTitleText}>Dispatch Cages </Text>
          <Text style={[styles.headerTitleText, styles.warehouseText]}>({warehouse})</Text>
        </Animated.Text>
        
        <View style={styles.headerPlaceholder} />
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={{ 
            opacity: fadeIn,
            transform: [{ translateY: slideUp }]
          }}
        >
          {!pickedCarrier && renderCarrierSelection()}
          {pickedCarrier && !dispatchProcess && renderCageScanning()}
          {pickedCarrier && dispatchProcess && renderDispatchProcess()}
        </Animated.View>
      </ScrollView>
      
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
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  section: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
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
    maxHeight: 300,
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
    maxHeight: 250,
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
  cageList: {
    maxHeight: 200,
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
    backgroundColor: COLORS.accent,
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
    backgroundColor: COLORS.accent,
    marginTop: 16,
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
})
export default DispatchCagesScreen;
