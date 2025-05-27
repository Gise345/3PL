import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Platform,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Page, Button, Input, PhotoCapture, PhotoGrid } from '../../components/common';
import { InboundScreenProps } from '../../navigation/types';
import { useAppSelector } from '../../hooks/useRedux';
import { inboundService } from '../../api';
import { MaterialIcons } from '@expo/vector-icons';

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

interface InboundPhoto {
  uri: string;
  label: string;
  name: string;
}

interface Inbound {
  poNumber: string;
  inboundService: string;
  requestedDate: string;
  timeSlot: string;
  companyName: string;
  transitType: string;
  containerType: string;
  numberPallets?: number;
  numberCartons?: number;
  inboundId?: string;
  warehouse?: string;
  companyCode?: string;
  mrnRequired?: boolean;
  mrn?: string;
}

const InboundScreen: React.FC<InboundScreenProps> = ({ navigation }) => {
  const { warehouse } = useAppSelector((state) => state.settings);
  const { user } = useAppSelector((state) => state.auth);
  
  // State for inbounds
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [inbounds, setInbounds] = useState<any[]>([]);
  const [filteredInbounds, setFilteredInbounds] = useState<any[]>([]);
  const [selectedInbound, setSelectedInbound] = useState<any | null>(null);
  
  // State for capturing photos
  const [photos, setPhotos] = useState<InboundPhoto[]>([]);
  const [transitPhotoName, setTransitPhotoName] = useState('');
  const [productPhotoName, setProductPhotoName] = useState('');
  const [mrnDocPhotoName, setMrnDocPhotoName] = useState('');
  
  // State for receipt lane
  const [receiptLane, setReceiptLane] = useState('');
  
  // State for showing different sections
  const [showSearch, setShowSearch] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [showMRNForm, setShowMRNForm] = useState(false);
  const [mrn, setMRN] = useState('');
  
  // State for number of packages
  const [numberOfPackages, setNumberOfPackages] = useState<number | null>(null);
  const [numberPalletsTextDiv, setNumberPalletsTextDiv] = useState(false);
  const [numberCartonsTextDiv, setNumberCartonsTextDiv] = useState(false);
  const [numberPalletsDiv, setNumberPalletsDiv] = useState(false);
  const [numberCartonsDiv, setNumberCartonsDiv] = useState(false);
  
  // Reference to scroll view
  const scrollViewRef = useRef<ScrollView>(null);

  //  Printer State and Validation
  const [printerName, setPrinterName] = useState('Door Printer');
  const [printerValue, setPrinterValue] = useState('printer1');
  const [receiptLaneError, setReceiptLaneError] = useState('');
  const [receiptLaneVerified, setReceiptLaneVerified] = useState(false);


  const validateReceiptLane = async () => {
    if (!receiptLane.trim()) {
      setReceiptLaneError('Please enter a receipt lane');
      return false;
    }
    
    try {
      setLoading(true);
      const response = await inboundService.checkGoodsInLaneExists(receiptLane);
      
      if (response.success === 200) {
        setReceiptLaneError('');
        setReceiptLaneVerified(true);
        // Automatically set the Door Printer when lane is verified
        setPrinterName('Door Printer');
        setPrinterValue('printer1');
        return true;
      } else {
        setReceiptLaneError(response.message || 'Invalid receipt lane');
        setReceiptLaneVerified(false);
        return false;
      }
    } catch (error) {
      console.error('Error validating receipt lane:', error);
      setReceiptLaneError('Failed to verify receipt lane');
      setReceiptLaneVerified(false);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const validateRequiredFields = () => {
    const missingFields = [];
    
    if (!selectedInbound?.companyCode) missingFields.push('Company Code');
    if (!selectedInbound?.poNumber) missingFields.push('PO Number');
    if (!receiptLane) missingFields.push('Receipt Lane');
    if (!numberOfPackages) missingFields.push('Number of Packages');
    if (!selectedInbound?.transitType) missingFields.push('Transit Type');
    if (!printerValue) missingFields.push('Printer');
    
    if (missingFields.length > 0) {
      Alert.alert(
        'Missing Required Fields',
        `The following fields are required for label printing:\n${missingFields.join('\n')}`,
        [{ text: 'OK' }]
      );
      return false;
    }
    
    return true;
  };
  
  const fetchInbounds = useCallback(async () => {
    setLoading(true);
    try {
      const response = await inboundService.getInbounds({ warehouse });
      if (response.data) {
        setInbounds(response.data);
        setFilteredInbounds(response.data);
      }
    } catch (error) {
      console.error('Error fetching inbounds:', error);
      Alert.alert('Error', 'Failed to fetch inbound shipments');
    } finally {
      setLoading(false);
    }
  }, [warehouse]);
  
  useEffect(() => {
    fetchInbounds();
  }, [fetchInbounds]);
  
  useEffect(() => {
    if (searchText) {
      const filtered = inbounds.filter(inbound => 
        inbound.poNumber.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredInbounds(filtered);
    } else {
      setFilteredInbounds(inbounds);
    }
  }, [searchText, inbounds]);

  

  // Add this near the top of your component with other useEffect calls
useEffect(() => {
  // Subscribe to focus events
  const unsubscribe = navigation.addListener('beforeRemove', (e) => {
    // Prevent default behavior of leaving the screen
    e.preventDefault();
    
    // Clear state
    setFilteredInbounds([]);
    setInbounds([]);
    setSearchText('');
    setLoading(false);
    
    // Continue with navigation after a short delay
    setTimeout(() => {
      navigation.dispatch(e.data.action);
    }, 50);
  });
  
  // Cleanup subscription on unmount
  return unsubscribe;
}, [navigation]);
  
  const handleSelectInbound = useCallback((inbound: any) => {
    setSelectedInbound(inbound);
    setShowSearch(false);
    setShowDetails(true);
    
    // Handle the cartons or pallets confirmation
    if (inbound.numberCartons) {
      setNumberCartonsTextDiv(true);
      setNumberPalletsTextDiv(false);
      setNumberOfPackages(inbound.numberCartons);
    } else if (inbound.numberPallets) {
      setNumberPalletsTextDiv(true);
      setNumberCartonsTextDiv(false);
      setNumberOfPackages(inbound.numberPallets);
    }

    // Scroll to top when showing details
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: false });
    }, 100);
  }, []);

  const setPallets = useCallback((value: number) => {
    setNumberOfPackages(value);
    setNumberPalletsTextDiv(false);
    setNumberPalletsDiv(true);
    
    // Check if MRN is required
    if (selectedInbound && selectedInbound.mrnRequired && !selectedInbound.mrn) {
      setShowMRNForm(true);
    } else {
      setShowMRNForm(false);
    }
    
    moveToBottom();
  }, [selectedInbound]);

  const setCartons = useCallback((value: number) => {
    setNumberOfPackages(value);
    setNumberCartonsTextDiv(false);
    setNumberCartonsDiv(true);
    
    // Check if MRN is required
    if (selectedInbound && selectedInbound.mrnRequired && !selectedInbound.mrn) {
      setShowMRNForm(true);
    } else {
      setShowMRNForm(false);
    }
    
    moveToBottom();
  }, [selectedInbound]);

  const checkMRNRequirement = useCallback(() => {
    if (selectedInbound && selectedInbound.mrnRequired && !selectedInbound.mrn) {
      setShowMRNForm(true);
    } else {
      setShowMRNForm(false);
    }
    moveToBottom();
  }, [selectedInbound]);
  
  const handleMRNSubmit = useCallback(() => {
    if (!mrn) {
      Alert.alert('Error', 'Please enter an MRN');
      return;
    }
    
    setShowMRNForm(false);
    moveToBottom();
  }, [mrn]);
  
  const handleTransitPhotoCapture = useCallback((uri: string, name: string) => {
    setTransitPhotoName(name);
    setPhotos(prev => [...prev, { uri, label: 'Transit', name }]);
    moveToBottom();
  }, []);
  
  const handleProductPhotoCapture = useCallback((uri: string, name: string) => {
    setProductPhotoName(name);
    setPhotos(prev => [...prev, { uri, label: 'Product', name }]);
    moveToBottom();
  }, []);
  
  const handleMRNDocPhotoCapture = useCallback((uri: string, name: string) => {
    setMrnDocPhotoName(name);
    setPhotos(prev => [...prev, { uri, label: 'MRN Document', name }]);
    moveToBottom();
  }, []);

  const handleDeletePhoto = useCallback((photoName: string) => {
    // Find the photo to delete
    const photoToDelete = photos.find(photo => photo.name === photoName);
    
    if (!photoToDelete) return;
    
    // Update the appropriate photo name state
    if (photoToDelete.label === 'Transit') {
      setTransitPhotoName('');
    } else if (photoToDelete.label === 'Product') {
      setProductPhotoName('');
    } else if (photoToDelete.label === 'MRN Document') {
      setMrnDocPhotoName('');
    }
    
    // Remove the photo from the photos array
    setPhotos(photos.filter(photo => photo.name !== photoName));
    
    // Show feedback to the user
    Alert.alert('Photo Deleted', 'You can now retake this photo.');
  }, [photos]);
  
  const handleSubmitInbound = useCallback(async () => {
    // Validate receipt lane if not already verified
    if (!receiptLaneVerified) {
      const isValid = await validateReceiptLane();
      if (!isValid) return;
    }

    // Validate all required fields
    if (!validateRequiredFields()) return;
    
    // Check if we have a valid selectedInbound
    if (!selectedInbound) {
      Alert.alert('Error', 'No inbound shipment selected');
      return;
    }

    // Format date and time for landedDate
    const now = new Date();
    const day = now.toISOString().split('T')[0].split('-').join(''); // "20250411" 
    const time = ('0' + now.getHours()).slice(-2) + ('0' + now.getMinutes()).slice(-2); // e.g., "1457"
    
    if (photos.length < 2) {
      Alert.alert('Error', 'Please capture all required photos');
      return;
    }
    
    if (!receiptLane) {
      setReceiptLaneError('Please enter a receipt lane');
      return;
    }
    
    if (!printerValue) {
      Alert.alert('Error', 'Printer selection is required');
      return;
    }
    
    setLoading(true);
    try {
      // Prepare data with all required fields
      const data = {
        warehouse: selectedInbound.warehouse,
        poNumber: selectedInbound.poNumber,
        companyCode: selectedInbound.companyCode,
        inboundItemsPhoto: productPhotoName,
        transitTypePhoto: transitPhotoName,
        timeReceived: new Date().toISOString(),
        receiptLane: receiptLane.toUpperCase(),
        inbound: selectedInbound,
        printerName: printerValue, // Use the printer value for API
        landedDate: day + ' ' + time,
        transitType: selectedInbound.transitType,
        numberOfPackages: numberOfPackages,
        mrn: mrn,
        haulierMrnDocPhoto: mrnDocPhotoName,
        landedBy: user?.email || "test@example.co.uk",
      };
      
      // Add MRN if required and available
      if (selectedInbound.mrnRequired && mrn) {
        data.mrn = mrn;
        if (mrnDocPhotoName) {
          data.haulierMrnDocPhoto = mrnDocPhotoName;
        }
      }
      
      // Submit the inbound
      const response = await inboundService.submitInbound(data);
      
      // Update GRN arrived status
      if (selectedInbound.inboundId && selectedInbound.poNumber) {
        await inboundService.setGRNArrivedAt({
          inboundId: selectedInbound.inboundId,
          poNumber: selectedInbound.poNumber,
          arrivedAt: new Date().toISOString()
        });
      }
      
      console.log('About to show success alert');
      // Show success message
      Alert.alert(
        'Success!',
        `Inbound for ${selectedInbound.companyCode || 'Unknown'} processed successfully!`,
        [{ 
          text: 'OK', 
          onPress: () => {
            // Reset form first
            resetForm();
            // Then navigate
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Home');
            }
          }
        }]
      );

    } catch (error) {
      console.error('Error submitting inbound:', error);
      Alert.alert('Error', 'Failed to process inbound. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [
    receiptLaneVerified, 
    validateReceiptLane, 
    validateRequiredFields, 
    selectedInbound, 
    photos.length, 
    receiptLane, 
    printerValue, 
    productPhotoName, 
    transitPhotoName, 
    mrn, 
    mrnDocPhotoName, 
    user, 
    navigation
  ]);
  
  const resetForm = useCallback(() => {
    setPhotos([]);
    setTransitPhotoName('');
    setProductPhotoName('');
    setMrnDocPhotoName('');
    setReceiptLane('');
    setReceiptLaneError('');
    setReceiptLaneVerified(false);
    setPrinterName('Door Printer');
    setPrinterValue('printer1');
    setSelectedInbound(null);
    setShowDetails(false);
    setShowSearch(true);
    setNumberOfPackages(null);
    setNumberPalletsTextDiv(false);
    setNumberCartonsTextDiv(false);
    setNumberPalletsDiv(false);
    setNumberCartonsDiv(false);
    setShowMRNForm(false);
    setMRN('');
  }, []);
  
  const handleBack = useCallback(() => {
    if (showDetails) {
      // If showing details, just reset the form state
      resetForm();
    } else {
      // We're on the list screen - this is where the error happens
      // Instead of using navigation.goBack() or navigation.reset(),
      // let's use the simplest possible navigation method
      
      // Clear any state first
      setFilteredInbounds([]);
      setInbounds([]);
      setLoading(false);
      setSearchText('');
      
      // Use a timeout to allow React to process state updates before navigation
      setTimeout(() => {
        // Use navigate instead of reset or goBack
        navigation.navigate('Home');
      }, 50);
    }
  }, [showDetails, resetForm, navigation]);

  // Function to scroll to bottom of scroll view
  const moveToBottom = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  // Update the renderInboundItem function with explicit 'any' types
  const renderInboundItem = useCallback(({ item, index }: { item: any; index: number }) => {
    // Skip rendering if item is null or undefined
    if (!item) return null;
    
    return (
      <TouchableOpacity
        key={`inbound-${index}`}
        style={styles.inboundCard}
        onPress={() => handleSelectInbound(item)}
        activeOpacity={0.7}
      >
        <View style={styles.inboundHeader}>
          <Text style={styles.poNumber}>{item?.poNumber || 'Unknown'}</Text>
          <View style={styles.serviceTag}>
            <Text style={styles.serviceTagText}>{item?.inboundService || 'N/A'}</Text>
          </View>
        </View>
        
        <View style={styles.inboundDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booking:</Text>
            <Text style={styles.detailValue}>{item?.requestedDate || 'N/A'} {item?.timeSlot || ''}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Company:</Text>
            <Text style={styles.detailValue}>{item?.companyName || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transit Type:</Text>
            <Text style={styles.detailValue}>{item?.transitType || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Container:</Text>
            <Text style={styles.detailValue}>{item?.containerType || 'N/A'}</Text>
          </View>
          
          {item?.numberPallets && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pallets:</Text>
              <Text style={styles.detailValue}>{item.numberPallets}</Text>
            </View>
          )}
          
          {item?.numberCartons && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Cartons:</Text>
              <Text style={styles.detailValue}>{item.numberCartons}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.cardFooter}>
          <TouchableOpacity 
            style={styles.receiveButton}
            onPress={() => handleSelectInbound(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.receiveButtonText}>Receive Inbound</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }, [handleSelectInbound]);

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
        
        <View style={styles.headerTitle}>
          <Text style={styles.headerTitleText}>
            Inbound <Text style={styles.warehouseText}>({warehouse})</Text>
          </Text>
        </View>
        
        <View style={styles.headerPlaceholder} />
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        {showSearch ? (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by PO Number..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor={COLORS.textLight}
            />
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading inbounds...</Text>
              </View>
            ) : (
              filteredInbounds.length > 0 ? (
                <FlatList
                  data={filteredInbounds}
                  renderItem={renderInboundItem}
                  keyExtractor={(item, index) => `inbound-${item?.poNumber || index}`}
                  initialNumToRender={5}
                  maxToRenderPerBatch={3}
                  windowSize={5}
                  removeClippedSubviews={true}
                  contentContainerStyle={{ paddingBottom: 16 }}
                  extraData={searchText} // Add this to ensure re-render when search changes
                />
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Text style={styles.emptyStateIcon}>📦</Text>
                  <Text style={styles.emptyStateTitle}>
                    {searchText ? `No results for "${searchText}"` : 'No inbounds available'}
                  </Text>
                  <Text style={styles.emptyStateDescription}>
                    There are no scheduled inbound shipments matching your criteria.
                  </Text>
                  
                  <TouchableOpacity
                    style={styles.unknownButton}
                    onPress={() => navigation.navigate('UnknownInbound')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.unknownButtonText}>Process Unknown Inbound</Text>
                  </TouchableOpacity>
                </View>
              )
            )}
          </View>
        ) : (
          <ScrollView 
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {showDetails && selectedInbound && (
              <View style={styles.detailsContainer}>
                <View style={styles.inboundSummaryCard}>
                  <Text style={styles.companyName}>{selectedInbound.companyName}</Text>
                  <Text style={styles.poNumberLarge}>{selectedInbound.poNumber}</Text>
                  
                  <View style={styles.summaryDetailsContainer}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Booking:</Text>
                      <Text style={styles.summaryValue}>
                        {selectedInbound.requestedDate} {selectedInbound.timeSlot}
                      </Text>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Customer:</Text>
                      <Text style={styles.summaryValue}>{selectedInbound.companyCode}</Text>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Transit Type:</Text>
                      <Text style={styles.summaryValue}>{selectedInbound.transitType}</Text>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Container Type:</Text>
                      <Text style={styles.summaryValue}>{selectedInbound.containerType}</Text>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    {numberPalletsDiv && (
                      <>
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Transit Items:</Text>
                          <Text style={styles.summaryValue}>{numberOfPackages} Pallets</Text>
                        </View>
                        <View style={styles.divider} />
                      </>
                    )}
                    
                    {numberCartonsDiv && (
                      <>
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Transit Items:</Text>
                          <Text style={styles.summaryValue}>{numberOfPackages} Cartons</Text>
                        </View>
                        <View style={styles.divider} />
                      </>
                    )}
                    
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Service:</Text>
                      <Text style={styles.summaryValue}>{selectedInbound.inboundService}</Text>
                    </View>
                  </View>
                </View>
                
                {/* Confirm Number of Pallets */}
                {numberPalletsTextDiv && (
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Number Of Transit Items</Text>
                    <TextInput
                      style={styles.numberInput}
                      value={numberOfPackages?.toString() || ''}
                      onChangeText={(text) => setNumberOfPackages(parseInt(text) || 0)}
                      keyboardType="numeric"
                      placeholder="Enter number of pallets"
                      placeholderTextColor={COLORS.textLight}
                    />
                    <TouchableOpacity
                      style={styles.confirmButton}
                      onPress={() => setPallets(numberOfPackages || 0)}
                    >
                      <Text style={styles.confirmButtonText}>Confirm</Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                {/* Confirm Number of Cartons */}
                {numberCartonsTextDiv && (
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Number Of Transit Items</Text>
                    <TextInput
                      style={styles.numberInput}
                      value={numberOfPackages?.toString() || ''}
                      onChangeText={(text) => setNumberOfPackages(parseInt(text) || 0)}
                      keyboardType="numeric"
                      placeholder="Enter number of cartons"
                      placeholderTextColor={COLORS.textLight}
                    />
                    <TouchableOpacity
                      style={styles.confirmButton}
                      onPress={() => setCartons(numberOfPackages || 0)}
                    >
                      <Text style={styles.confirmButtonText}>Confirm</Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                {showMRNForm && (
                  <View style={styles.mrnFormCard}>
                    <View style={styles.mrnWarningContainer}>
                      <Text style={styles.mrnWarningIcon}>⚠️</Text>
                      <Text style={styles.mrnWarningTitle}>MRN Required</Text>
                      <Text style={styles.mrnWarningText}>
                        Inbound {selectedInbound.poNumber} has arrived without an accompanying MRN (Movement Reference Number).
                        Does the haulier have an MRN?
                      </Text>
                      
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={styles.input}
                          value={mrn}
                          onChangeText={setMRN}
                          placeholder="Enter MRN/GMR ID"
                          placeholderTextColor={COLORS.textLight}
                        />
                      </View>
                      
                      <View style={styles.mrnButtonsContainer}>
                        <TouchableOpacity
                          style={[styles.mrnButton, styles.mrnButtonSecondary]}
                          onPress={() => setShowMRNForm(false)}
                        >
                          <Text style={styles.mrnButtonSecondaryText}>No MRN Available</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[styles.mrnButton, styles.mrnButtonPrimary]}
                          onPress={handleMRNSubmit}
                        >
                          <Text style={styles.mrnButtonPrimaryText}>Confirm</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
                
                {(!showMRNForm && !numberPalletsTextDiv && !numberCartonsTextDiv) && (
                  <>
                    {/* Photos Section */}
                    <View style={styles.sectionCard}>
                      <Text style={styles.sectionTitle}>Required Photos</Text>
                      
                      {photos.length > 0 && (
                        <PhotoGrid 
                          photos={photos} 
                          onDeletePhoto={handleDeletePhoto}
                        />
                      )}
                      
                      {!transitPhotoName && (
                        <PhotoCapture
                          title="Transit Photo"
                          cameraType="transit"
                          category="Transit"
                          companyCode={selectedInbound?.companyCode}
                          referenceNumber={selectedInbound?.poNumber}
                          onImageCaptured={handleTransitPhotoCapture}
                        />
                      )}
                      
                      {!productPhotoName && (
                        <PhotoCapture
                          title="Product Photo"
                          cameraType="product"
                          category="Product"
                          companyCode={selectedInbound?.companyCode}
                          referenceNumber={selectedInbound?.poNumber}
                          onImageCaptured={handleProductPhotoCapture}
                        />
                      )}
                      
                      {selectedInbound?.mrnRequired && mrn && !mrnDocPhotoName && (
                        <PhotoCapture
                          title="MRN Document Photo"
                          cameraType="mrn"
                          category="MRN Document"
                          companyCode={selectedInbound?.companyCode}
                          referenceNumber={selectedInbound?.poNumber}
                          onImageCaptured={handleMRNDocPhotoCapture}
                        />
                      )}
                    </View>
                    
                    {/* Receipt Lane Section with Validation */}
                    <View style={styles.sectionCard}>
                      <Text style={styles.sectionTitle}>Receipt Lane</Text>
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={[styles.input, receiptLaneError ? { borderColor: COLORS.error } : null]}
                          value={receiptLane}
                          onChangeText={(text) => {
                            setReceiptLane(text);
                            setReceiptLaneVerified(false); // Reset verification when text changes
                          }}
                          placeholder="Enter receipt lane"
                          placeholderTextColor={COLORS.textLight}
                          autoCapitalize="characters"
                        />
                        {receiptLaneError ? (
                          <Text style={styles.errorText}>{receiptLaneError}</Text>
                        ) : null}
                      </View>
                      
                      <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={validateReceiptLane}
                      >
                        <Text style={styles.confirmButtonText}>Verify Lane</Text>
                      </TouchableOpacity>
                      
                      {receiptLaneVerified && (
                        <View style={styles.printerInfoContainer}>
                          <Text style={styles.printerInfoTitle}>Printer Selected:</Text>
                          <View style={styles.printerInfoCard}>
                            <Text style={styles.printerName}>{printerName}</Text>
                            <Text style={styles.printerStatus}>Ready</Text>
                          </View>
                        </View>
                      )}
                    </View>
                    
                    {/* Submit Button */}
                    <TouchableOpacity
                      style={styles.submitButton}
                      onPress={handleSubmitInbound}
                    >
                      <Text style={styles.submitButtonText}>Complete Inbound</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
      
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
    textAlign: 'center',
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
    paddingBottom: 30,
    padding: 16,
  },
  searchContainer: {
    padding: 16,
    flex: 1,
  },
  searchInput: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textLight,
  },
  inboundCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
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
  inboundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  poNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  serviceTag: {
    backgroundColor: 'rgba(0, 169, 181, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  serviceTagText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  inboundDetails: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    width: 100,
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  cardFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    alignItems: 'flex-end',
  },
  receiveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
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
  receiveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
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
  unknownButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
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
  unknownButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  detailsContainer: {
    padding: 16,
  },
  inboundSummaryCard: {
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
  companyName: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 4,
  },
  poNumberLarge: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  summaryDetailsContainer: {
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    padding: 12,
  },
  summaryLabel: {
    width: 120,
    fontSize: 15,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  summaryValue: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  sectionCard: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  mrnFormCard: {
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
  mrnWarningContainer: {
    alignItems: 'center',
  },
  mrnWarningIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  mrnWarningTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  mrnWarningText: {
    fontSize: 15,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  input: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  numberInput: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
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
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  mrnButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  mrnButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginHorizontal: 6,
  },
  mrnButtonPrimary: {
    backgroundColor: COLORS.primary,
  },
  mrnButtonPrimaryText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  mrnButtonSecondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mrnButtonSecondaryText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
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
    
  printerInfoContainer: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  printerInfoTitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 8,
  },
  printerInfoCard: {
    backgroundColor: 'rgba(0, 169, 181, 0.1)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  printerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  printerStatus: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '500',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  photoRequirementContainer: {
    marginTop: 16,
  },
  photoRequirementItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoMissing: {
    backgroundColor: 'rgba(0, 169, 181, 0.05)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  photoComplete: {
    backgroundColor: 'rgba(76, 217, 100, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(76, 217, 100, 0.2)',
  },
  photoRequirementText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginLeft: 12,
  },
});

export default InboundScreen;