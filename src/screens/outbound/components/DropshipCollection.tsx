// src/screens/outbound/components/DropshipCollection.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  TouchableOpacity,
  FlatList,
  SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, Button, Input, PhotoCapture, EmptyState } from '../../../components/common';
import { Signature } from '../../../components/signature';
import { colors, spacing, typography } from '../../../utils/theme';
import { outboundService } from '../../../api/outboundService';
import OutboundSummary from './OutboundSummary';

interface DropshipClient {
  CustomerName: string;
  StUQty: number;
}

interface DropshipCollectionProps {
  warehouse: string;
  loadoutType: {
    name: string;
    value: string;
  };
  isTestMode: boolean;
  onBackPress?: () => void;
}

const DropshipCollection: React.FC<DropshipCollectionProps> = ({
  warehouse,
  loadoutType,
  isTestMode,
  onBackPress,
}) => {
  const navigation = useNavigation();
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [dropshipClients, setDropshipClients] = useState<DropshipClient[]>([]);
  const [dropshipClientNames, setDropshipClientNames] = useState<string[]>([]);
  const [selectedClientIndex, setSelectedClientIndex] = useState<number>(0);
  const [selectedDropshipClient, setSelectedDropshipClient] = useState<DropshipClient | null>(null);
  const [carrierName, setCarrierName] = useState('');
  const [driverReg, setDriverReg] = useState('');
  const [numberOfParcels, setNumberOfParcels] = useState('');
  const [parcelPhoto, setParcelPhoto] = useState<string | null>(null);
  const [parcelPhotoName, setParcelPhotoName] = useState<string | null>(null);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [signatureName, setSignatureName] = useState<string | null>(null);
  
  // UI state variables
  const [dropshipClientsDiv, setDropshipClientsDiv] = useState(true);
  const [numberOfParcelsDiv, setNumberOfParcelsDiv] = useState(false);
  const [carrierNameDiv, setCarrierNameDiv] = useState(false);
  const [driverRegDiv, setDriverRegDiv] = useState(false);
  const [parcelPhotoDiv, setParcelPhotoDiv] = useState(false);
  const [summaryDiv, setSummaryDiv] = useState(false);
  const [signaturePadDiv, setSignaturePadDiv] = useState(false);

  // Load dropship clients on component mount
  useEffect(() => {
    fetchDropshipClients();
  }, []);

  // Handle carrier name change
  useEffect(() => {
    setDriverRegDiv(carrierName.length > 2);
  }, [carrierName]);

  // Handle driver reg change
  useEffect(() => {
    setParcelPhotoDiv(driverReg.length > 5);
  }, [driverReg]);

   const handleBack = useCallback(() => {
    if (onBackPress) {
      onBackPress();
      return;
    }
    
    // Fallback to original logic if no parent handler
    // ... rest of the handleBack logic from above
  }, [onBackPress, loading]); 
  
  // Fetch dropship clients from API
  const fetchDropshipClients = async () => {
    try {
      setLoading(true);
      console.log('Fetching dropship clients from API...');
      
      // Make API call and properly handle the response structure
      const response = await outboundService.getDropshipClients();
      console.log('Dropship clients API response:', response);
      
      if (response && Array.isArray(response)) {
        setDropshipClients(response);
        
        // Extract client names for the picker/list
        const clientNames = response.map(client => client.CustomerName);
        setDropshipClientNames(clientNames);
        
        if (response.length > 0) {
          setSelectedDropshipClient(response[0]);
          setNumberOfParcels(response[0].StUQty.toString());
          setNumberOfParcelsDiv(true);
          setCarrierNameDiv(true);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load dropship clients:', error);
      Alert.alert('Error', 'Failed to load dropship clients. Please try again.');
      setLoading(false);
    }
  };

  // Handle client selection change
  const onSelectedIndexChanged = (index: number) => {
    setSelectedClientIndex(index);
    setSelectedDropshipClient(dropshipClients[index]);
    setNumberOfParcels(dropshipClients[index].StUQty.toString());
    setNumberOfParcelsDiv(true);
    setCarrierNameDiv(true);
  };

  // Handle parcel photo capture
  const handleParcelPhotoCaptured = (uri: string, name: string) => {
    setParcelPhoto(uri);
    setParcelPhotoName(name);
    
    // Get current date/time
    const date = new Date();
    const day = date.toISOString().split('T')[0].replace(/-/g, '');
    const time = ('0' + date.getHours()).slice(-2) + ('0' + date.getMinutes()).slice(-2);
    
    // Move to next step
    setDropshipClientsDiv(false);
    setCarrierNameDiv(false);
    setDriverRegDiv(false);
    setNumberOfParcelsDiv(false);
    setParcelPhotoDiv(false);
    setSummaryDiv(true);
    setSignaturePadDiv(true);
  };

  // Handle signature captured
  const handleSignatureCaptured = (uri: string, name: string) => {
    setSignatureImage(uri);
    setSignatureName(name);
  };

  // Submit outbound
  const submitOutbound = async () => {
    if (!selectedDropshipClient) return;
    
    setLoading(true);
    
    try {
      // Generate outbound reference
      const date = new Date();
      const day = date.toISOString().split('T')[0].replace(/-/g, '');
      const time = ('0' + date.getHours()).slice(-2) + ('0' + date.getMinutes()).slice(-2);
      
      // Camelized carrier name for the outbound reference
      const camelizedName = carrierName
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
      
      const outboundRef = `${camelizedName}_${day}`;
      
      // Prepare submission data
      const outboundData = {
        carrierName: carrierName.toUpperCase(),
        driverRegistration: driverReg.toUpperCase(),
        driverSignature: signatureName,
        loadoutTime: new Date(),
        numberOfParcels: parseInt(numberOfParcels),
        outboundRef,
        outboundType: 'adHoc',
        parcelPhoto: parcelPhotoName,
        warehouse,
        loadoutType: loadoutType.name,
        dropshipClient: selectedDropshipClient.CustomerName,
      };
      
      // Submit to API
      const response = await outboundService.submitOutbound(outboundData);
      
      Alert.alert(
        'Success',
        response.data?.message || 'Outbound processed successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', `Failed to submit outbound: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && dropshipClients.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading dropship clients...</Text>
      </View>
    );
  }

  // Main change: Use a View instead of ScrollView at the top level
  return (
    <View style={styles.container}>
      {/* Dropship Clients Selection */}
      {dropshipClientsDiv && (
  <Card style={styles.card}>
    <Text style={styles.sectionTitle}>Select Carrier</Text>
    
    {dropshipClients.length === 0 ? (
      <EmptyState 
        title="No Dropship Clients" 
        message="No dropship clients are available at this time."
        icon="🚚"
      />
    ) : (
      <View style={styles.pickerContainer}>
        {/* Replace FlatList with a simple mapped View */}
        <View style={styles.pickerList}>
          {dropshipClientNames.map((item, index) => (
            <TouchableOpacity
              key={`${item}-${index}`}
              style={[
                styles.pickerItem,
                selectedClientIndex === index && styles.pickerItemSelected
              ]}
              onPress={() => onSelectedIndexChanged(index)}
            >
              <Text style={[
                styles.pickerItemText,
                selectedClientIndex === index && styles.pickerItemTextSelected
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    )}
  </Card>
)}
      {/* Rest of the UI components */}
      {selectedDropshipClient && (
        <View style={styles.formContainer}>
          {/* Number of Parcels */}
          {numberOfParcelsDiv && (
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Number of Parcels</Text>
              <Input
                value={numberOfParcels}
                onChangeText={setNumberOfParcels}
                keyboardType="numeric"
                style={styles.input}
              />
            </Card>
          )}
          
          {/* Carrier Name */}
          {carrierNameDiv && (
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Carrier Name</Text>
              <Input
                value={carrierName}
                onChangeText={setCarrierName}
                placeholder="Enter carrier name"
                style={styles.input}
              />
            </Card>
          )}
          
          {/* Driver Registration */}
          {driverRegDiv && (
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Reg Number</Text>
              <Input
                value={driverReg}
                onChangeText={setDriverReg}
                placeholder="Enter registration number"
                style={styles.input}
              />
            </Card>
          )}
          
          {/* Parcel Photo */}
          {parcelPhotoDiv && (
            <Card style={styles.card}>
              <PhotoCapture
                title="Capture Image of Parcels"
                cameraType="product"
                category="Parcel"
                companyCode="OUT"
                referenceNumber={selectedDropshipClient.CustomerName}
                onImageCaptured={handleParcelPhotoCaptured}
              />
            </Card>
          )}
          
          {/* Summary */}
          {summaryDiv && (
            <OutboundSummary
              carrierName={carrierName.toUpperCase()}
              numberOfParcels={parseInt(numberOfParcels)}
              driverReg={driverReg.toUpperCase()}
              parcelPhoto={parcelPhoto}
            />
          )}
          
          {/* Signature */}
          {signaturePadDiv && (
            <Card style={styles.card}>
              <Signature
                title="Driver Signature"
                companyCode="OUT"
                onSignatureCaptured={handleSignatureCaptured}
              />
              
              {signatureImage && (
                <Button
                  title="Submit"
                  onPress={submitOutbound}
                  variant="primary"
                  loading={loading}
                  style={styles.submitButton}
                />
              )}
            </Card>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  formContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSizes.medium,
    color: colors.text,
  },
  card: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.medium,
    fontWeight: typography.fontWeights.medium as any,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: spacing.md,
    backgroundColor: colors.cardBackground,
     maxHeight: 200,
  },
  pickerList: {
    
  },
  pickerItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerItemSelected: {
    backgroundColor: colors.primary + '15', // 15% opacity of primary color
  },
  pickerItemText: {
    fontSize: typography.fontSizes.medium,
    color: colors.text,
  },
  pickerItemTextSelected: {
    fontWeight: typography.fontWeights.bold as any,
    color: colors.primary,
  },
  input: {
    marginBottom: spacing.sm,
  },
  submitButton: {
    marginTop: spacing.lg,
  },
});

export default DropshipCollection;