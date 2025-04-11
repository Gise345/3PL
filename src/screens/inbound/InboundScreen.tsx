import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Page, Button, Input, PhotoCapture, PhotoGrid, Signature } from '../../components/common';
import { colors, typography, spacing, shadows } from '../../utils/theme';
import { InboundScreenProps } from '../../navigation/types';
import { useAppSelector } from '../../hooks/useRedux';
import { inboundService } from '../../api';
import { MaterialIcons } from '@expo/vector-icons';

interface InboundPhoto {
  uri: string;
  label: string;
  name: string;
}

const InboundScreen: React.FC<InboundScreenProps> = ({ navigation }) => {
  const { warehouse } = useAppSelector((state) => state.settings);
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
  
  // State for signature
  const [signatureName, setSignatureName] = useState('');
  
  // State for receipt lane
  const [receiptLane, setReceiptLane] = useState('');
  
  // State for showing different sections
  const [showSearch, setShowSearch] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [showMRNForm, setShowMRNForm] = useState(false);
  const [mrn, setMRN] = useState('');
  
  useEffect(() => {
    fetchInbounds();
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
      setInbounds(response.data);
      setFilteredInbounds(response.data);
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
    
    // Check if MRN is required but not provided
    if (inbound.mrnRequired && !inbound.mrn) {
      setShowMRNForm(true);
    }
  };
  
  const handleMRNSubmit = () => {
    if (!mrn) {
      Alert.alert('Error', 'Please enter an MRN');
      return;
    }
    
    setShowMRNForm(false);
    // In a real implementation, you would update the inbound with the MRN
  };
  
  const handleTransitPhotoCapture = (uri: string, name: string) => {
    setTransitPhotoName(name);
    setPhotos(prev => [...prev, { uri, label: 'Transit', name }]);
  };
  
  const handleProductPhotoCapture = (uri: string, name: string) => {
    setProductPhotoName(name);
    setPhotos(prev => [...prev, { uri, label: 'Product', name }]);
  };
  
  const handleMRNDocPhotoCapture = (uri: string, name: string) => {
    setMrnDocPhotoName(name);
    setPhotos(prev => [...prev, { uri, label: 'MRN Document', name }]);
  };
  
  const handleSignatureCapture = (uri: string, name: string) => {
    setSignatureName(name);
  };
  
  const handleSubmitInbound = async () => {
    if (!receiptLane) {
      Alert.alert('Error', 'Please enter a receipt lane');
      return;
    }
    
    if (photos.length < 2) {
      Alert.alert('Error', 'Please capture all required photos');
      return;
    }
    
    setLoading(true);
    
    try {
      // In a real implementation, you would submit the inbound with all captured data
      Alert.alert('Success', 'Inbound processing completed successfully');
      // Reset form and go back to search
      setPhotos([]);
      setTransitPhotoName('');
      setProductPhotoName('');
      setMrnDocPhotoName('');
      setSignatureName('');
      setReceiptLane('');
      setSelectedInbound(null);
      setShowDetails(false);
      setShowSearch(true);
    } catch (error) {
      console.error('Error submitting inbound:', error);
      Alert.alert('Error', 'Failed to process inbound');
    } finally {
      setLoading(false);
    }
  };
  
  const handleBack = () => {
    if (showDetails) {
      setShowDetails(false);
      setShowSearch(true);
      setSelectedInbound(null);
      setPhotos([]);
    } else {
      navigation.goBack();
    }
  };

  return (
    <Page 
      title={`Inbound (${warehouse})`} 
      showHeader 
      showBackButton
      onBackPress={handleBack}
      loading={loading}
    >
      <ScrollView style={styles.container}>
        {showSearch && (
          <View style={styles.searchContainer}>
            <Input
              label="Search PO Number"
              value={searchText}
              onChangeText={setSearchText}
              containerStyle={styles.searchInput}
            />
            
            {filteredInbounds.length > 0 ? (
              filteredInbounds.map((inbound, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.inboundItem}
                  onPress={() => handleSelectInbound(inbound)}
                >
                  <View style={styles.inboundHeader}>
                    <Text style={styles.poNumber}>{inbound.poNumber}</Text>
                    <Text style={styles.service}>{inbound.inboundService}</Text>
                  </View>
                  
                  <View style={styles.inboundDetails}>
                    <Text>{inbound.warehouse} - {inbound.requestedDate} {inbound.timeSlot}</Text>
                    <Text>Company: {inbound.companyName}</Text>
                    <Text>Transit: {inbound.transitType}</Text>
                    <Text>Container: {inbound.containerType}</Text>
                    {inbound.numberPallets && <Text>Pallets: {inbound.numberPallets}</Text>}
                    {inbound.numberCartons && <Text>Cartons: {inbound.numberCartons}</Text>}
                  </View>
                  
                  <View style={styles.inboundActions}>
                    <Button 
                      title="Receive Inbound" 
                      onPress={() => handleSelectInbound(inbound)}
                      small
                    />
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>
                  {searchText ? `No results for "${searchText}"` : 'No inbounds available'}
                </Text>
                
                <Button 
                  title="Process Unknown Inbound" 
                  onPress={() => navigation.navigate('UnknownInbound')}
                  variant="secondary"
                  style={styles.unknownButton}
                />
              </View>
            )}
          </View>
        )}
        
        {showDetails && selectedInbound && (
          <View style={styles.detailsContainer}>
            <View style={styles.inboundSummary}>
              <Text style={styles.companyName}>{selectedInbound.companyName}</Text>
              <Text style={styles.poNumberLarge}>{selectedInbound.poNumber}</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Booking:</Text>
                <Text style={styles.infoValue}>
                  {selectedInbound.requestedDate} {selectedInbound.timeSlot}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Customer:</Text>
                <Text style={styles.infoValue}>{selectedInbound.companyCode}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Transit Type:</Text>
                <Text style={styles.infoValue}>{selectedInbound.transitType}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Container Type:</Text>
                <Text style={styles.infoValue}>{selectedInbound.containerType}</Text>
              </View>
              
              {selectedInbound.numberPallets && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Transit Items:</Text>
                  <Text style={styles.infoValue}>{selectedInbound.numberPallets} Pallets</Text>
                </View>
              )}
              
              {selectedInbound.numberCartons && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Transit Items:</Text>
                  <Text style={styles.infoValue}>{selectedInbound.numberCartons} Cartons</Text>
                </View>
              )}
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Service:</Text>
                <Text style={styles.infoValue}>{selectedInbound.inboundService}</Text>
              </View>
            </View>
            
            {showMRNForm && (
              <View style={styles.mrnForm}>
                <Text style={styles.formSectionTitle}>MRN Required</Text>
                <Text style={styles.mrnMessage}>
                  Inbound {selectedInbound.poNumber} has arrived without an accompanying MRN (Movement Reference Number).
                  Does the haulier have an MRN?
                </Text>
                
                <Input
                  label="MRN/GMR ID"
                  value={mrn}
                  onChangeText={setMRN}
                />
                
                <View style={styles.mrnButtons}>
                  <Button
                    title="Confirm"
                    onPress={handleMRNSubmit}
                    style={styles.mrnButton}
                  />
                  
                  <Button
                    title="No MRN Available"
                    variant="secondary"
                    onPress={() => setShowMRNForm(false)}
                    style={styles.mrnButton}
                  />
                </View>
              </View>
            )}
            
            {!showMRNForm && (
              <>
                <View style={styles.photosContainer}>
                  <Text style={styles.formSectionTitle}>Required Photos</Text>
                  
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
                      category={`${selectedInbound.numberPallets ? selectedInbound.numberPallets + ' Pallet(s)' : selectedInbound.numberCartons + ' Carton(s)'}`}
                      companyCode={selectedInbound.companyCode}
                      referenceNumber={selectedInbound.poNumber}
                      onImageCaptured={handleProductPhotoCapture}
                    />
                  )}
                  
                  {selectedInbound.mrnRequired && !mrnDocPhotoName && (
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
                
                <View style={styles.receiptLaneContainer}>
                  <Text style={styles.formSectionTitle}>Receipt Lane</Text>
                  <Input
                    label="Enter Receipt Lane"
                    value={receiptLane}
                    onChangeText={setReceiptLane}
                    autoCapitalize="characters"
                  />
                </View>
                
                <View style={styles.signatureContainer}>
                  <Text style={styles.formSectionTitle}>Driver's Signature</Text>
                  <Signature
                    title="Driver's Signature"
                    companyCode={selectedInbound.companyCode}
                    onSignatureCaptured={handleSignatureCapture}
                  />
                </View>
                
                <Button
                  title="Complete Inbound"
                  onPress={handleSubmitInbound}
                  style={styles.submitButton}
                  variant="warning"
                />
              </>
            )}
          </View>
        )}
      </ScrollView>
    </Page>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: spacing.md,
  },
  searchInput: {
    marginBottom: spacing.md,
  },
  inboundItem: {
    backgroundColor: colors.background,
    borderRadius: 4,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.medium
  },
  inboundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  poNumber: {
    fontSize: typography.fontSizes.large,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.text,
  },
  service: {
    fontSize: typography.fontSizes.medium,
    color: colors.primary,
  },
  inboundDetails: {
    marginBottom: spacing.md,
  },
  inboundActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  noResults: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  noResultsText: {
    fontSize: typography.fontSizes.medium,
    marginBottom: spacing.md,
  },
  unknownButton: {
    marginTop: spacing.md,
  },
  detailsContainer: {
    padding: spacing.md,
  },
  inboundSummary: {
    backgroundColor: colors.background,
    borderRadius: 4,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  companyName: {
    fontSize: typography.fontSizes.medium,
    color: colors.text,
    textAlign: 'center',
  },
  poNumberLarge: {
    fontSize: typography.fontSizes.xlarge,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.xs,
  },
  infoLabel: {
    flex: 1,
    fontSize: typography.fontSizes.medium,
    color: colors.text,
  },
  infoValue: {
    flex: 2,
    fontSize: typography.fontSizes.medium,
    fontWeight: typography.fontWeights.medium as any,
    color: colors.text,
  },
  mrnForm: {
    backgroundColor: colors.background,
    borderRadius: 4,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  formSectionTitle: {
    fontSize: typography.fontSizes.large,
    fontWeight: typography.fontWeights.medium as any,
    color: colors.text,
    marginBottom: spacing.md,
  },
  mrnMessage: {
    fontSize: typography.fontSizes.medium,
    marginBottom: spacing.md,
  },
  mrnButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mrnButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  photosContainer: {
    backgroundColor: colors.background,
    borderRadius: 4,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  receiptLaneContainer: {
    backgroundColor: colors.background,
    borderRadius: 4,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  signatureContainer: {
    backgroundColor: colors.background,
    borderRadius: 4,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  submitButton: {
    marginVertical: spacing.lg,
  },
});

export default InboundScreen;