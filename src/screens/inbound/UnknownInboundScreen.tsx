import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UnknownInboundScreenProps } from '../../navigation/types';
import { useAppSelector } from '../../hooks/useRedux';
import { inboundService } from '../../api/inboundService';
import { ModernButton } from '../../components/common';


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

// Define interfaces
interface Company {
  id: number;
  companyName: string;
  companyCode: string;
}

interface Printer {
  name: string;
  value: string;
}

const ModernUnknownInboundScreen: React.FC<UnknownInboundScreenProps> = ({ navigation }) => {
  const { warehouse } = useAppSelector((state) => state.settings);
  const { user } = useAppSelector((state) => state.auth);
  
  // State for companies
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchCompany, setSearchCompany] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  
  // State for steps
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // State for form fields
  const [carrierName, setCarrierName] = useState('');
  const [transitType, setTransitType] = useState<{ name: string; value: string } | null>(null);
  const [containerType, setContainerType] = useState<{ text: string; api_value: string } | null>(null);
  const [containerTypes, setContainerTypes] = useState<{ text: string; api_value: string }[]>([]);
  const [numberOfPackages, setNumberOfPackages] = useState('');
  const [receiptLane, setReceiptLane] = useState('');
  const [printer, setPrinter] = useState<Printer | null>(null);
  const [availablePrinters, setAvailablePrinters] = useState<Printer[]>([]);
  
  // State for MRN
  const [showMrnDialog, setShowMrnDialog] = useState(false);
  const [haulierCanProvideMrn, setHaulierCanProvideMrn] = useState(false);
  const [mrn, setMrn] = useState('');
  
  // State for photos - using placeholders for now
  const [transitPhoto, setTransitPhoto] = useState<string | null>(null);
  const [productPhoto, setProductPhoto] = useState<string | null>(null);
  const [mrnDocPhoto, setMrnDocPhoto] = useState<string | null>(null);
  
  // Reference to scroll view
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Animation values
  const [fadeIn] = useState(new Animated.Value(0));
  const [slideUp] = useState(new Animated.Value(30));
  const [titleScale] = useState(new Animated.Value(0.95));
  
  // Transit types
  const transitTypes = [
    { name: 'Cartons', value: 'cartons' },
    { name: 'Pallets', value: 'pallets' },
    { name: 'Container Loose', value: 'containerLoose' },
    { name: 'Container Pallets', value: 'containerPallets' },
  ];
  
  const handleBack = useCallback(() => {
    // Clear any state first
    setLoading(false);
    // And any other state you need to clear...
    
    // Use a timeout to allow React to process state updates before navigation
    setTimeout(() => {
      // Use navigate instead of reset or goBack
      navigation.navigate('Home');
    }, 50);
  }, [navigation]);

  //  this useEffect to handle proper unmounting
useEffect(() => {
  // Subscribe to focus events
  const unsubscribe = navigation.addListener('beforeRemove', (e) => {
    // Prevent default behavior of leaving the screen
    e.preventDefault();
    
    // Clear state
    setLoading(false);
    // Reset any other important state variables here
    
    // Continue with navigation after a short delay
    setTimeout(() => {
      navigation.dispatch(e.data.action);
    }, 50);
  });
  
  // Cleanup subscription on unmount
  return unsubscribe;
}, [navigation]);


  // Load companies when component mounts
  useEffect(() => {
    getCompanies();
    
    // Load printers
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
  }, [warehouse]);
  
  // Get companies from API
  const getCompanies = async () => {
    try {
      setLoading(true);
      const response = await inboundService.getCompanies();
      
      if (response.data && Array.isArray(response.data)) {
        setCompanies(response.data);
        setFilteredCompanies(response.data);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      Alert.alert('Error', 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter companies when search text changes
  const onTextChangedCompany = (text: string) => {
    setSearchCompany(text);
    
    if (text) {
      const filtered = companies.filter((company) =>
        company.companyName.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredCompanies(filtered);
    } else {
      setFilteredCompanies(companies);
    }
  };
  
  // Handle selecting a company
  const handleSelectCompany = (company: Company) => {
    setSelectedCompany(company);
    setCurrentStep(2);
    scrollToBottom();
  };
  
  // Handle setting carrier
  const handleSetCarrier = () => {
    if (carrierName.length < 3) {
      Alert.alert('Validation Error', 'Carrier name must be at least 3 characters');
      return;
    }
    
    setCurrentStep(3);
    scrollToBottom();
  };
  
  // Handle selecting transit type
  const handleSelectTransitType = async (type: { name: string; value: string }) => {
    setTransitType(type);
    
    if (type.value !== 'pallets') {
      try {
        setLoading(true);
        // Fetch container types
        const response = await inboundService.getContainerTypes();
        
        if (response.data) {
          // Filter container types based on transit type
          const needle = type.value.toLowerCase() === 'pallets' ? 'palletised' : 'cartons';
          const filtered = response.data.filter((item: any) =>
            item.text.toLowerCase().includes(needle)
          );
          
          setContainerTypes(filtered);
          setCurrentStep(4);
        }
      } catch (error) {
        console.error('Error fetching container types:', error);
        Alert.alert('Error', 'Failed to load container types');
      } finally {
        setLoading(false);
      }
    } else {
      // Skip container types for pallets
      setCurrentStep(5);
    }
    
    scrollToBottom();
  };
  
  // Handle selecting container type
  const handleSelectContainerType = (type: { text: string; api_value: string }) => {
    setContainerType(type);
    setCurrentStep(5);
    scrollToBottom();
  };
  
  // Handle setting number of packages
  const handleSetPackages = () => {
    if (!numberOfPackages || parseInt(numberOfPackages) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid number of packages');
      return;
    }
    
    setShowMrnDialog(true);
    scrollToBottom();
  };
  
  // Handle MRN dialog response
  const handleMrnResponse = (canProvide: boolean) => {
    setHaulierCanProvideMrn(canProvide);
    setShowMrnDialog(false);
    
    if (canProvide) {
      // Show MRN input
      setCurrentStep(6);
    } else {
      // Skip to container photo
      setCurrentStep(7);
    }
    
    scrollToBottom();
  };
  
  // Handle setting MRN
  const handleSetMrn = () => {
    if (!mrn.trim()) {
      Alert.alert('Validation Error', 'Please enter an MRN');
      return;
    }
    
    setCurrentStep(7);
    scrollToBottom();
  };
  
  // Handle capturing MRN document photo - simulated
  const captureMrnDocPhoto = async () => {
    try {
      // Simulating photo capture - in a real app, use ImagePicker
      setMrnDocPhoto('https://via.placeholder.com/150');
      setCurrentStep(8);
      scrollToBottom();
    } catch (error) {
      console.error('Error taking MRN doc photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };
  
  // Handle capturing container photo - simulated
  const captureContainerPhoto = async () => {
    try {
      // Simulating photo capture - in a real app, use ImagePicker
      setTransitPhoto('https://via.placeholder.com/150');
      setCurrentStep(8);
      scrollToBottom();
    } catch (error) {
      console.error('Error taking container photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };
  
  // Handle capturing product photo - simulated
  const captureProductPhoto = async () => {
    try {
      // Simulating photo capture - in a real app, use ImagePicker
      setProductPhoto('https://via.placeholder.com/150');
      setCurrentStep(9);
      scrollToBottom();
    } catch (error) {
      console.error('Error taking product photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };
  
  // Handle setting receipt lane
  const handleSetReceiptLane = async () => {
    if (!receiptLane.trim()) {
      Alert.alert('Validation Error', 'Please enter a receipt lane');
      return;
    }
    
    try {
      setLoading(true);
      const response = await inboundService.checkGoodsInLaneExists(receiptLane);
      
      if (response.success === 200) {
        setCurrentStep(10);
        scrollToBottom();
      } else {
        Alert.alert('Error', response.message || 'Invalid receipt lane');
      }
    } catch (error: any) {
      console.error('Error checking receipt lane:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to verify receipt lane');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle selecting printer
  const handleSelectPrinter = (selectedPrinter: Printer) => {
    setPrinter(selectedPrinter);
    setCurrentStep(11);
    scrollToBottom();
  };
  
  // Handle submitting unknown inbound
  const handleSubmitInbound = async () => {
    if (!selectedCompany || !transitType || !printer) {
      Alert.alert('Error', 'Missing required information');
      return;
    }
    
    try {
      setLoading(true);
      
      // Generate PO number for unknown inbound
      const now = new Date();
      const day = now.toISOString().split('T')[0].split('-').join('');
      const time = ('0' + now.getHours()).slice(-2) + ('0' + now.getMinutes()).slice(-2);
      const poNumber = `${selectedCompany.companyCode}UNK${day.slice(2)}${time}`;
      
      // Prepare data for submission
      const submitData = {
        companyCode: selectedCompany.companyCode,
        warehouse,
        receiptLane: receiptLane.toUpperCase(),
        poNumber,
        carrierName: carrierName.toUpperCase(),
        transitType: transitType.name.replace(/\s+/g, ''),
        containerType: containerType?.api_value || '',
        transit: transitPhoto ? `${poNumber}-transit.jpg` : '',
        products: productPhoto ? `${poNumber}-products.jpg` : '',
        packageType: transitType.name,
        numberOfPackages: parseInt(numberOfPackages),
        receivedAt: now.toISOString(),
        printerName: printer.value,
        landedBy: user?.email || '',
      };
      
      // Add MRN if provided
      const submitDataWithMrn: any = {
        ...submitData
      };
      
      // Add MRN if provided
      if (mrn) {
        submitDataWithMrn.mrn = mrn;
        if (mrnDocPhoto) {
          submitDataWithMrn.haulierMrnDocPhoto = `${poNumber}-mrn_doc.jpg`;
        }
      }
      
      // Submit unknown inbound
      const response = await inboundService.submitUnknownInbound(submitDataWithMrn);
      
      Alert.alert(
        'Success',
        `Unknown Inbound for ${selectedCompany.companyCode} completed successfully`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error('Error submitting unknown inbound:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to submit unknown inbound'
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

  // Render a company item
  const renderCompanyItem = ({ item }: { item: Company }) => (
    <TouchableOpacity
      style={styles.companyCard}
      onPress={() => handleSelectCompany(item)}
      activeOpacity={0.7}
    >
      <View style={styles.companyCardContent}>
        <Text style={styles.companyName}>{item.companyName}</Text>
        <View style={styles.companyCodeContainer}>
          <Text style={styles.companyCode}>{item.companyCode}</Text>
        </View>
      </View>
      <View style={styles.selectButtonContainer}>
        <Text style={styles.selectButtonText}>Select →</Text>
      </View>
    </TouchableOpacity>
  );
  
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
            <Text style={styles.headerTitleText}>Unknown Inbound </Text>
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
            {/* Step 1: Select Company */}
            {currentStep === 1 ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Select Company</Text>
                <Text style={styles.cardDescription}>
                  Choose the company for this unknown inbound shipment
                </Text>
                
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search companies..."
                  value={searchCompany}
                  onChangeText={onTextChangedCompany}
                  placeholderTextColor={COLORS.textLight}
                />
                
                {filteredCompanies.length > 0 ? (
                  <FlatList
                    data={filteredCompanies}
                    renderItem={renderCompanyItem}
                    keyExtractor={(item) => item.id.toString()}
                    style={styles.companiesList}
                    scrollEnabled={false} // Disable scrolling since we're inside a ScrollView
                  />
                ) : (
                  <View style={styles.emptyStateContainer}>
                    <Text style={styles.emptyStateIcon}>🔍</Text>
                    <Text style={styles.emptyStateText}>
                      {searchCompany ? `No results for "${searchCompany}"` : "No companies found"}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              /* Company Summary */
              selectedCompany && (
                <View style={styles.summaryCard}>
                  <View style={styles.summaryHeader}>
                    <Text style={styles.summaryTitle}>Company</Text>
                    <TouchableOpacity 
                      style={styles.editButton}
                      onPress={() => setCurrentStep(1)}
                    >
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.summaryContent}>
                    <Text style={styles.summaryValue}>{selectedCompany.companyName}</Text>
                    <View style={styles.companyCodeBadge}>
                      <Text style={styles.companyCodeBadgeText}>{selectedCompany.companyCode}</Text>
                    </View>
                  </View>
                </View>
              )
            )}
            
            {/* Photos Preview */}
            {(transitPhoto || productPhoto || mrnDocPhoto) && (
              <View style={styles.photoPreviewCard}>
                <Text style={styles.photoPreviewTitle}>Photos</Text>
                <View style={styles.photoPreviewContainer}>
                  {mrnDocPhoto && (
                    <View style={styles.photoItem}>
                      <Image source={{ uri: mrnDocPhoto }} style={styles.photoThumbnail} />
                      <Text style={styles.photoLabel}>MRN Document</Text>
                    </View>
                  )}
                  
                  {transitPhoto && (
                    <View style={styles.photoItem}>
                      <Image source={{ uri: transitPhoto }} style={styles.photoThumbnail} />
                      <Text style={styles.photoLabel}>
                        {transitType?.name || 'Transit'}
                      </Text>
                    </View>
                  )}
                  
                  {productPhoto && (
                    <View style={styles.photoItem}>
                      <Image source={{ uri: productPhoto }} style={styles.photoThumbnail} />
                      <Text style={styles.photoLabel}>Products</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
            
            {/* Step 2: Enter Carrier Name */}
            {currentStep === 2 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Enter Carrier Name</Text>
                <Text style={styles.cardDescription}>
                  Provide the name of the carrier delivering this shipment
                </Text>
                
                <TextInput
                  style={styles.input}
                  value={carrierName}
                  onChangeText={setCarrierName}
                  placeholder="Enter carrier name"
                  placeholderTextColor={COLORS.textLight}
                  autoCapitalize="characters"
                />
                
                <ModernButton
                  title="Confirm"
                  onPress={handleSetCarrier}
                  style={styles.button}
                />
              </View>
            )}
            
            {/* Step 3: Select Transit Type */}
            {currentStep === 3 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Select Transit Type</Text>
                <Text style={styles.cardDescription}>
                  Choose how the shipment was transported
                </Text>
                
                <View style={styles.transitTypeContainer}>
                  {transitTypes.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={styles.transitTypeButton}
                      onPress={() => handleSelectTransitType(type)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.transitTypeIcon}>
                        {type.value === 'cartons' ? '📦' : 
                         type.value === 'pallets' ? '📚' :
                         type.value === 'containerLoose' ? '🚢' : '🏭'}
                      </Text>
                      <Text style={styles.transitTypeText}>{type.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            
            {/* Step 4: Select Container Type */}
            {currentStep === 4 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Select Container Type</Text>
                <Text style={styles.cardDescription}>
                  Choose the type of container used for transport
                </Text>
                
                {containerTypes.map((type) => (
                  <TouchableOpacity
                    key={type.api_value}
                    style={styles.containerTypeButton}
                    onPress={() => handleSelectContainerType(type)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.containerTypeText}>{type.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            {/* Step 5: Enter Number of Packages */}
            {currentStep === 5 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  Number of {transitType?.name || 'Packages'}
                </Text>
                <Text style={styles.cardDescription}>
                  Enter the quantity of items received
                </Text>
                
                <TextInput
                  style={styles.input}
                  value={numberOfPackages}
                  onChangeText={setNumberOfPackages}
                  keyboardType="numeric"
                  placeholder="Enter number of packages"
                  placeholderTextColor={COLORS.textLight}
                />
                
                <ModernButton
                  title="Confirm"
                  onPress={handleSetPackages}
                  style={styles.button}
                />
              </View>
            )}
            
            {/* MRN Dialog */}
            {showMrnDialog && (
              <View style={styles.card}>
                <View style={styles.alertContainer}>
                  <Text style={styles.alertIcon}>⚠️</Text>
                  <Text style={styles.alertTitle}>MRN Required</Text>
                  <Text style={styles.alertText}>
                    Does the haulier have an MRN (Movement Reference Number)?
                  </Text>
                  
                  <View style={styles.alertButtonsContainer}>
                    <TouchableOpacity
                      style={[styles.alertButton, styles.alertButtonNo]}
                      onPress={() => handleMrnResponse(false)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.alertButtonNoText}>No</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.alertButton, styles.alertButtonYes]}
                      onPress={() => handleMrnResponse(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.alertButtonYesText}>Yes</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
            
            {/* Step 6: Enter MRN */}
            {currentStep === 6 && haulierCanProvideMrn && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Enter MRN/GMR ID</Text>
                <Text style={styles.cardDescription}>
                  Enter the Movement Reference Number provided by the haulier
                </Text>
                
                <TextInput
                  style={styles.input}
                  value={mrn}
                  onChangeText={setMrn}
                  placeholder="Enter MRN/GMR ID"
                  placeholderTextColor={COLORS.textLight}
                />
                
                <ModernButton
                  title="Confirm"
                  onPress={handleSetMrn}
                  style={styles.button}
                />
              </View>
            )}
            
            {/* Step 7: Capture MRN Document Photo */}
            {haulierCanProvideMrn && mrn && currentStep === 7 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Capture MRN Document Photo</Text>
                <Text style={styles.cardDescription}>
                  Take a photo of the MRN document provided by the haulier
                </Text>
                
                <ModernButton
                  title="Take Photo of MRN Document"
                  onPress={captureMrnDocPhoto}
                  style={styles.cameraButton}
                />
              </View>
            )}
            
            {/* Step 7/8: Capture Container Photo */}
            {currentStep === 7 || (haulierCanProvideMrn && currentStep === 8) ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Capture Container Photo</Text>
                <Text style={styles.cardDescription}>
                  Take a photo of the delivery container
                </Text>
                
                <ModernButton
                  title={`Take Photo #1`}
                  onPress={captureContainerPhoto}
                  style={styles.cameraButton}
                />
              </View>
            ) : null}
            
            {/* Step 8/9: Capture Product Photo */}
            {currentStep === 8 || (haulierCanProvideMrn && currentStep === 9) ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Capture Product Photo</Text>
                <Text style={styles.cardDescription}>
                  Take a photo of the delivered products
                </Text>
                
                <ModernButton
                  title={`Take Photo #2`}
                  onPress={captureProductPhoto}
                  style={styles.cameraButton}
                />
              </View>
            ) : null}
            
            {/* Step 9/10: Enter Receipt Lane */}
            {currentStep === 9 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Enter Receipt Lane</Text>
                <Text style={styles.cardDescription}>
                  Specify the storage lane where the items will be received
                </Text>
                
                <TextInput
                  style={styles.input}
                  value={receiptLane}
                  onChangeText={setReceiptLane}
                  placeholder="Enter receipt lane"
                  placeholderTextColor={COLORS.textLight}
                  autoCapitalize="characters"
                />
                
                <ModernButton
                  title="Confirm"
                  onPress={handleSetReceiptLane}
                  style={styles.button}
                />
              </View>
            )}
            
            {/* Step 10: Select Printer */}
            {currentStep === 10 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Select Label Printer</Text>
                <Text style={styles.cardDescription}>
                  Choose a printer to generate the inbound label
                </Text>
                
                <View style={styles.printersContainer}>
                  {availablePrinters.map((printerItem) => (
                    <TouchableOpacity
                      key={printerItem.value}
                      style={styles.printerButton}
                      onPress={() => handleSelectPrinter(printerItem)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.printerIcon}>🖨️</Text>
                      <Text style={styles.printerText}>{printerItem.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            
            {/* Step 11: Complete Inbound */}
            {currentStep === 11 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Complete Inbound</Text>
                <Text style={styles.cardDescription}>
                  Process this unknown inbound shipment
                </Text>
                
                <View style={styles.summaryList}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryItemLabel}>Company:</Text>
                    <Text style={styles.summaryItemValue}>{selectedCompany?.companyName}</Text>
                  </View>
                  
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryItemLabel}>Carrier:</Text>
                    <Text style={styles.summaryItemValue}>{carrierName}</Text>
                  </View>
                  
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryItemLabel}>Transit Type:</Text>
                    <Text style={styles.summaryItemValue}>{transitType?.name}</Text>
                  </View>
                  
                  {containerType && (
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryItemLabel}>Container Type:</Text>
                      <Text style={styles.summaryItemValue}>{containerType.text}</Text>
                    </View>
                  )}
                  
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryItemLabel}>Quantity:</Text>
                    <Text style={styles.summaryItemValue}>{numberOfPackages}</Text>
                  </View>
                  
                  {mrn && (
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryItemLabel}>MRN:</Text>
                      <Text style={styles.summaryItemValue}>{mrn}</Text>
                    </View>
                  )}
                  
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryItemLabel}>Receipt Lane:</Text>
                    <Text style={styles.summaryItemValue}>{receiptLane.toUpperCase()}</Text>
                  </View>
                  
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryItemLabel}>Printer:</Text>
                    <Text style={styles.summaryItemValue}>{printer?.name}</Text>
                  </View>
                </View>
                
                <ModernButton
                  title="Complete Unknown Inbound"
                  onPress={handleSubmitInbound}
                  style={styles.submitButton}
                />
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 20,
    textAlign: 'center',
  },
  searchInput: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  companiesList: {
    marginTop: 8,
    maxHeight: 400,
  },
  companyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  companyCardContent: {
    flex: 1,
    padding: 12,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  companyCodeContainer: {
    flexDirection: 'row',
  },
  companyCode: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  selectButtonContainer: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  selectButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyStateIcon: {
    fontSize: 40,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginBottom: 20,
    padding: 16,
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
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  editButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 169, 181, 0.1)',
  },
  editButtonText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  companyCodeBadge: {
    backgroundColor: 'rgba(0, 169, 181, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  companyCodeBadgeText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  photoPreviewCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginBottom: 20,
    padding: 16,
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
  photoPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  photoPreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  photoItem: {
    alignItems: 'center',
    margin: 8,
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  photoLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  input: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  button: {
    marginTop: 8,
  },
  transitTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -4,
    
  },
  transitTypeButton: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  transitTypeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  transitTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  containerTypeButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  containerTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  alertContainer: {
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
    borderRadius: 12,
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
  cameraButton: {
    backgroundColor: COLORS.primary,
  },
  printersContainer: {
    marginTop: 8,
  },
  printerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  printerIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  printerText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  summaryList: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  summaryItem: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    padding: 12,
  },
  summaryItemLabel: {
    width: 120,
    fontSize: 14,
    color: COLORS.textLight,
  },
  summaryItemValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
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

export default ModernUnknownInboundScreen;