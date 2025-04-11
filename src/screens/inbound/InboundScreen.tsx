import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  Dimensions,
  KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Page, Button, Input, PhotoCapture, PhotoGrid } from '../../components/common';
import { InboundScreenProps } from '../../navigation/types';
import { useAppSelector } from '../../hooks/useRedux';
import { inboundService } from '../../api';

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

const InboundScreen: React.FC<InboundScreenProps> = ({ navigation }) => {
  const { warehouse } = useAppSelector((state) => state.settings);
  
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
  
  // Animation values
  const [fadeIn] = useState(new Animated.Value(0));
  const [slideUp] = useState(new Animated.Value(30));
  const [titleScale] = useState(new Animated.Value(0.95));

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
  
  
  useEffect(() => {
    fetchInbounds();
    
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
  
  const fetchInbounds = async () => {
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
  };
  
  const handleSelectInbound = (inbound: any) => {
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
  };

  const setPallets = (value: number) => {
    setNumberOfPackages(value);
    setNumberPalletsTextDiv(false);
    setNumberPalletsDiv(true);
    checkMRNRequirement();
  };

  const setCartons = (value: number) => {
    setNumberOfPackages(value);
    setNumberCartonsTextDiv(false);
    setNumberCartonsDiv(true);
    checkMRNRequirement();
  };

  const checkMRNRequirement = () => {
    if (selectedInbound && selectedInbound.mrnRequired && !selectedInbound.mrn) {
      setShowMRNForm(true);
    } else {
      setShowMRNForm(false);
    }
    moveToBottom();
  };
  
  const handleMRNSubmit = () => {
    if (!mrn) {
      Alert.alert('Error', 'Please enter an MRN');
      return;
    }
    
    setShowMRNForm(false);
    // In a real implementation, you would update the inbound with the MRN
    moveToBottom();
  };
  
  const handleTransitPhotoCapture = (uri: string, name: string) => {
    setTransitPhotoName(name);
    setPhotos(prev => [...prev, { uri, label: 'Transit', name }]);
    moveToBottom();
  };
  
  const handleProductPhotoCapture = (uri: string, name: string) => {
    setProductPhotoName(name);
    setPhotos(prev => [...prev, { uri, label: 'Product', name }]);
    moveToBottom();
  };
  
  const handleMRNDocPhotoCapture = (uri: string, name: string) => {
    setMrnDocPhotoName(name);
    setPhotos(prev => [...prev, { uri, label: 'MRN Document', name }]);
    moveToBottom();
  };
  
  
  const handleSubmitInbound = async () => {
    // Validate receipt lane if not already verified
    if (!receiptLaneVerified) {
      const isValid = await validateReceiptLane();
      if (!isValid) return;
    }

     // Validate all required fields
    if (!validateRequiredFields()) return;
    
    if (photos.length < 2) {
      Alert.alert('Error', 'Please capture all required photos');
      return;
    }
    
    if (!receiptLane) {
      setReceiptLaneError('Please enter a receipt lane');
      return;
    }
    
    if (photos.length < 2) {
      Alert.alert('Error', 'Please capture all required photos');
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
        landedDate: new Date().toISOString().split('T')[0].split('-').join(''),
        transitType: selectedInbound.transitType,
        numberOfPackages: numberOfPackages,
        mrn: mrn,
        haulierMrnDocPhoto: mrnDocPhotoName,
        // landedBy: user.email, // This would come from auth state in a real implementation
      };
      
      // Add MRN if required
      if (selectedInbound.mrnRequired && mrn) {
        data.mrn = mrn;
        data.haulierMrnDocPhoto = mrnDocPhotoName;
      }
      
      // Submit the inbound
      const response = await inboundService.submitInbound(data);
      
      Alert.alert('Success', 'Inbound for ' + selectedInbound.companyCode + ' Completed');
      resetForm();
    } catch (error) {
      console.error('Error submitting inbound:', error);
      Alert.alert('Error', 'Failed to process inbound');
    } finally {
      setLoading(false);
    }
  };
  

  const resetForm = () => {
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
  };
  
  const handleBack = () => {
    if (showDetails) {
      resetForm();
    } else {
      navigation.goBack();
    }
  };

  // Function to scroll to bottom of scroll view
  const moveToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
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
          <Text style={styles.headerTitleText}>Inbound </Text>
          <Text style={[styles.headerTitleText, styles.warehouseText]}>({warehouse})</Text>
        </Animated.Text>
        
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
          <Animated.View 
            style={{ 
              opacity: fadeIn,
              transform: [{ translateY: slideUp }]
            }}
          >
            {showSearch && (
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
                  <>
                    {filteredInbounds.length > 0 ? (
                      filteredInbounds.map((inbound, index) => (
                        <TouchableOpacity
                          key={`inbound-${index}`}
                          style={styles.inboundCard}
                          onPress={() => handleSelectInbound(inbound)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.inboundHeader}>
                            <Text style={styles.poNumber}>{inbound.poNumber}</Text>
                            <View style={styles.serviceTag}>
                              <Text style={styles.serviceTagText}>{inbound.inboundService}</Text>
                            </View>
                          </View>
                          
                          <View style={styles.inboundDetails}>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Booking:</Text>
                              <Text style={styles.detailValue}>{inbound.requestedDate} {inbound.timeSlot}</Text>
                            </View>
                            
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Company:</Text>
                              <Text style={styles.detailValue}>{inbound.companyName}</Text>
                            </View>
                            
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Transit Type:</Text>
                              <Text style={styles.detailValue}>{inbound.transitType}</Text>
                            </View>
                            
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Container:</Text>
                              <Text style={styles.detailValue}>{inbound.containerType}</Text>
                            </View>
                            
                            {inbound.numberPallets && (
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Pallets:</Text>
                                <Text style={styles.detailValue}>{inbound.numberPallets}</Text>
                              </View>
                            )}
                            
                            {inbound.numberCartons && (
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Cartons:</Text>
                                <Text style={styles.detailValue}>{inbound.numberCartons}</Text>
                              </View>
                            )}
                          </View>
                          
                          <View style={styles.cardFooter}>
                            <TouchableOpacity 
                              style={styles.receiveButton}
                              onPress={() => handleSelectInbound(inbound)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.receiveButtonText}>Receive Inbound</Text>
                            </TouchableOpacity>
                          </View>
                        </TouchableOpacity>
                      ))
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
                    )}
                  </>
                )}
              </View>
            )}
            
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
                      keyboardType="number-pad"
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
                      keyboardType="number-pad"
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
                        <PhotoGrid photos={photos} photoSize="small" columns={3} />
                      )}
                      
                      {!transitPhotoName && (
                        <PhotoCapture
                          title="Capture Transit Photo"
                          cameraType="transit"
                          category={selectedInbound.transitType}
                          companyCode={selectedInbound.companyCode}
                          referenceNumber={selectedInbound.poNumber}
                          onImageCaptured={handleTransitPhotoCapture}
                        />
                      )}
                      
                      {!productPhotoName && (
                        <PhotoCapture
                          title={`Capture ${selectedInbound.numberPallets ? 'Pallet' : 'Carton'} Photo`}
                          cameraType="product"
                          category={`${numberOfPackages} ${selectedInbound.numberPallets ? 'Pallet(s)' : 'Carton(s)'}`}
                          companyCode={selectedInbound.companyCode}
                          referenceNumber={selectedInbound.poNumber}
                          onImageCaptured={handleProductPhotoCapture}
                        />
                      )}
                      
                      {selectedInbound.mrnRequired && mrn && !mrnDocPhotoName && (
                        <PhotoCapture
                          title="Capture MRN Document"
                          cameraType="mrn"
                          category="MRN Document"
                          companyCode={selectedInbound.companyCode}
                          referenceNumber={selectedInbound.poNumber}
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
              </Animated.View>
            </ScrollView>
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
            },
            searchContainer: {
              padding: 16,
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
              backgroundColor: COLORS.accent,
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

});

export default InboundScreen;