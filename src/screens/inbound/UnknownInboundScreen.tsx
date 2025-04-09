import React, { useState, useEffect, useRef } from 'react';
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
  Platform
} from 'react-native';
import { Page, Button } from '../../components/common';
import { colors, typography, spacing, shadows } from '../../utils/theme';
import { UnknownInboundScreenProps } from '../../navigation/types';
import { useAppSelector } from '../../hooks/useRedux';
import { inboundService } from '../../api/inboundService';

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

const UnknownInboundScreen: React.FC<UnknownInboundScreenProps> = ({ navigation }) => {
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
  
  // Transit types
  const transitTypes = [
    { name: 'Cartons', value: 'cartons' },
    { name: 'Pallets', value: 'pallets' },
    { name: 'Container Loose', value: 'containerLoose' },
    { name: 'Container Pallets', value: 'containerPallets' },
  ];
  
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
      // Prepare data with potential MRN properties
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
      style={styles.companyItem}
      onPress={() => handleSelectCompany(item)}
    >
      <Text style={styles.companyName}>{item.companyName}</Text>
      <Text style={styles.companyCode}>{item.companyCode}</Text>
    </TouchableOpacity>
  );
  
  return (
    <Page
      title={`Unknown Inbound (${warehouse})`}
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
          {/* Step 1: Select Company */}
          {currentStep === 1 ? (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Select Company</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search companies..."
                value={searchCompany}
                onChangeText={onTextChangedCompany}
              />
              
              {filteredCompanies.length > 0 ? (
                <FlatList
                  data={filteredCompanies}
                  renderItem={renderCompanyItem}
                  keyExtractor={(item) => item.id.toString()}
                  style={styles.companiesList}
                />
              ) : (
                <Text style={styles.emptyText}>No companies found</Text>
              )}
            </View>
          ) : (
            /* Company Summary */
            selectedCompany && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Company:</Text>
                <Text style={styles.summaryValue}>{selectedCompany.companyName}</Text>
                <Text style={styles.summaryCode}>({selectedCompany.companyCode})</Text>
              </View>
            )
          )}
          
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
                  <Text style={styles.photoLabel}>
                    {transitType?.name || 'Transit'}
                  </Text>
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
          
          {/* Step 2: Enter Carrier Name */}
          {currentStep === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Enter Carrier Name</Text>
              <TextInput
                style={styles.input}
                value={carrierName}
                onChangeText={setCarrierName}
                placeholder="Enter carrier name"
                autoCapitalize="characters"
              />
              <Button
                title="Confirm"
                onPress={handleSetCarrier}
                style={styles.button}
              />
            </View>
          )}
          
          {/* Step 3: Select Transit Type */}
          {currentStep === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Select Transit Type</Text>
              {transitTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={styles.optionItem}
                  onPress={() => handleSelectTransitType(type)}
                >
                  <Text style={styles.optionText}>{type.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {/* Step 4: Select Container Type */}
          {currentStep === 4 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Select Container Type</Text>
              {containerTypes.map((type) => (
                <TouchableOpacity
                  key={type.api_value}
                  style={styles.optionItem}
                  onPress={() => handleSelectContainerType(type)}
                >
                  <Text style={styles.optionText}>{type.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {/* Step 5: Enter Number of Packages */}
          {currentStep === 5 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>
                Number of {transitType?.name || 'Packages'}
              </Text>
              <TextInput
                style={styles.input}
                value={numberOfPackages}
                onChangeText={setNumberOfPackages}
                keyboardType="numeric"
                placeholder="Enter number of packages"
              />
              <Button
                title="Confirm"
                onPress={handleSetPackages}
                style={styles.button}
              />
            </View>
          )}
          
          {/* MRN Dialog */}
          {showMrnDialog && (
            <View style={styles.stepContainer}>
              <View style={styles.alertContainer}>
                <Text style={styles.alertTitle}>MRN Required</Text>
                <Text style={styles.alertText}>
                  Does the haulier have an MRN (Movement Reference Number)?
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
          
          {/* Step 6: Enter MRN */}
          {currentStep === 6 && haulierCanProvideMrn && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Enter MRN/GMR ID</Text>
              <TextInput
                style={styles.input}
                value={mrn}
                onChangeText={setMrn}
                placeholder="Enter MRN"
              />
              <Button
                title="Confirm"
                onPress={handleSetMrn}
                style={styles.button}
              />
            </View>
          )}
          
          {/* Step 7: Capture MRN Document Photo */}
          {haulierCanProvideMrn && mrn && currentStep === 7 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Capture MRN Document Photo</Text>
              <Button
                title="Take Photo of MRN Document"
                onPress={captureMrnDocPhoto}
                style={styles.button}
              />
            </View>
          )}
          
          {/* Step 7/8: Capture Container Photo */}
          {currentStep === 7 || (haulierCanProvideMrn && currentStep === 8) ? (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Capture Container Photo</Text>
              <Button
                title={`Take Photo #1`}
                onPress={captureContainerPhoto}
                style={styles.button}
              />
            </View>
          ) : null}
          
          {/* Step 8/9: Capture Product Photo */}
          {currentStep === 8 || (haulierCanProvideMrn && currentStep === 9) ? (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Capture Product Photo</Text>
              <Button
                title={`Take Photo #2`}
                onPress={captureProductPhoto}
                style={styles.button}
              />
            </View>
          ) : null}
          
          {/* Step 9/10: Enter Receipt Lane */}
          {currentStep === 9 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Enter Receipt Lane</Text>
              <TextInput
                style={styles.input}
                value={receiptLane}
                onChangeText={setReceiptLane}
                placeholder="Enter receipt lane"
                autoCapitalize="characters"
              />
              <Button
                title="Confirm"
                onPress={handleSetReceiptLane}
                style={styles.button}
              />
            </View>
          )}
          
          {/* Step 10: Select Printer */}
          {currentStep === 10 && (
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
          
          {/* Step 11: Complete Inbound */}
          {currentStep === 11 && (
            <View style={styles.stepContainer}>
              <Button
                title="Complete Unknown Inbound"
                onPress={handleSubmitInbound}
                style={styles.successButton}
              />
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
  searchInput: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: typography.fontSizes.regular,
    marginBottom: spacing.md,
  },
  companiesList: {
    maxHeight: 300,
  },
  companyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  companyName: {
    fontSize: typography.fontSizes.medium,
    color: colors.text,
    flex: 1,
  },
  companyCode: {
    fontSize: typography.fontSizes.medium,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  emptyText: {
    color: colors.textLight,
    textAlign: 'center',
    padding: spacing.lg,
  },
  summaryCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: typography.fontSizes.medium,
    fontWeight: typography.fontWeights.medium as any,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  summaryValue: {
    fontSize: typography.fontSizes.medium,
    fontWeight: typography.fontWeights.semibold as any,
    color: colors.text,
    flex: 1,
  },
  summaryCode: {
    fontSize: typography.fontSizes.medium,
    color: colors.primary,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: typography.fontSizes.regular,
    marginBottom: spacing.md,
  },
  button: {
    marginTop: spacing.xs,
  },
  optionItem: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  optionText: {
    fontSize: typography.fontSizes.medium,
    color: colors.text,
    textAlign: 'center',
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
  printerButton: {
    marginBottom: spacing.sm,
  },
  successButton: {
    backgroundColor: colors.success,
  },
});

export default UnknownInboundScreen;