import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';

// Import our components
import { PhotoCapture, ModernButton, PrinterSelector } from '../../components/common';
import ReceiptManager, { Printer } from '../../utils/ReceiptManager';
import ImageUploader from '../../utils/ImageUploader';
import { colors, spacing, borderRadius, shadows } from '../../utils/theme';
import { useAppSelector } from '../../hooks/useRedux';

/**
 * Example screen demonstrating the use of PhotoCapture, PrinterSelector, 
 * ReceiptManager and ImageUploader components together
 */
const PhotoCaptureExample: React.FC = () => {
  // State management
  const [transit, setTransit] = useState<{ uri: string; name: string } | null>(null);
  const [product, setProduct] = useState<{ uri: string; name: string } | null>(null);
  const [mrn, setMrn] = useState<{ uri: string; name: string } | null>(null);
  const [selectedPrinter, setSelectedPrinter] = useState<Printer | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [uploadResults, setUploadResults] = useState<Array<{ success: boolean; name: string }>>([]);
  
  // Get warehouse from redux state
  const { warehouse } = useAppSelector((state) => state.settings);
  
  // Handle transit photo capture
  const handleTransitPhoto = (uri: string, name: string) => {
    setTransit({
      uri,
      name,
    });
  };
  
  // Handle product photo capture
  const handleProductPhoto = (uri: string, name: string) => {
    setProduct({
      uri,
      name,
    });
  };
  
  // Handle MRN document photo capture
  const handleMrnPhoto = (uri: string, name: string) => {
    setMrn({
      uri,
      name,
    });
  };
  
  // Handle printer selection
  const handleSelectPrinter = (printer: Printer) => {
    setSelectedPrinter(printer);
  };
  
  // Upload all photos
  const handleUploadPhotos = async () => {
    // Make sure we have at least one photo
    if (!transit && !product && !mrn) {
      Alert.alert('Error', 'Please capture at least one photo before uploading');
      return;
    }
    
    setIsUploading(true);
    setUploadResults([]);
    
    const uploads = [];
    const results = [];
    
    // Prepare upload options for each captured photo
    if (transit) {
      uploads.push({
        imageUri: transit.uri,
        fileName: transit.name,
        companyCode: 'TEST',
        additionalParams: {
          type: 'transit',
          poNumber: 'TEST123',
        },
      });
    }
    
    if (product) {
      uploads.push({
        imageUri: product.uri,
        fileName: product.name,
        companyCode: 'TEST',
        additionalParams: {
          type: 'product',
          poNumber: 'TEST123',
        },
      });
    }
    
    if (mrn) {
      uploads.push({
        imageUri: mrn.uri,
        fileName: mrn.name,
        companyCode: 'TEST',
        additionalParams: {
          type: 'mrn_doc',
          poNumber: 'TEST123',
        },
      });
    }
    
    try {
      // Upload each photo and track results
      for (const uploadOptions of uploads) {
        const result = await ImageUploader.uploadImage(uploadOptions);
        results.push({
          success: result.success,
          name: uploadOptions.fileName,
        });
      }
      
      // Update the state with results
      setUploadResults(results);
      
      // Show success or error message
      const successCount = results.filter(r => r.success).length;
      if (successCount === uploads.length) {
        Alert.alert('Success', `All ${successCount} images uploaded successfully`);
      } else {
        Alert.alert('Upload Results', `${successCount} of ${uploads.length} images uploaded successfully`);
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      Alert.alert('Error', 'Failed to upload photos');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Generate and print a test receipt
  const handlePrintReceipt = async () => {
    if (!selectedPrinter) {
      Alert.alert('Error', 'Please select a printer first');
      return;
    }
    
    setIsPrinting(true);
    
    try {
      // Create a test inbound receipt
      const success = await ReceiptManager.generateInboundReceipt({
        poNumber: 'TEST123',
        companyName: 'Test Company',
        companyCode: 'TEST',
        warehouse: warehouse,
        receiptLane: 'A1',
        dateTime: new Date().toLocaleString(),
        transitType: 'Pallets',
        containerType: 'Standard',
        quantity: 5,
        mrn: 'MRN12345',
      });
      
      if (success) {
        Alert.alert('Success', 'Receipt generated and printed successfully');
      } else {
        Alert.alert('Error', 'Failed to generate or print receipt');
      }
    } catch (error) {
      console.error('Error printing receipt:', error);
      Alert.alert('Error', 'Failed to print receipt');
    } finally {
      setIsPrinting(false);
    }
  };
  
  // Reset all captures
  const handleReset = () => {
    setTransit(null);
    setProduct(null);
    setMrn(null);
    setUploadResults([]);
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Photo Capture Example</Text>
        <Text style={styles.headerSubtitle}>{warehouse} Warehouse</Text>
      </View>
      
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Photo Capture Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Capture Photos</Text>
          
          <View style={styles.photoGrid}>
            <View style={styles.photoSection}>
              <PhotoCapture
                onPhotoTaken={handleTransitPhoto}
                title="Transit"
                category="Transit"
                filePrefix="transit"
                buttonTitle="Capture Transit"
              />
            </View>
            
            <View style={styles.photoSection}>
              <PhotoCapture
                onPhotoTaken={handleProductPhoto}
                title="Product"
                category="Product"
                filePrefix="product"
                buttonTitle="Capture Product"
              />
            </View>
            
            <View style={styles.photoSection}>
              <PhotoCapture
                onPhotoTaken={handleMrnPhoto}
                title="MRN Document"
                category="MRN"
                filePrefix="mrn"
                buttonTitle="Capture MRN Doc"
              />
            </View>
          </View>
        </View>
        
        {/* Upload Results Section */}
        {uploadResults.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upload Results</Text>
            
            {uploadResults.map((result, index) => (
              <View key={index} style={styles.resultItem}>
                <MaterialIcons
                  name={result.success ? 'check-circle' : 'error'}
                  size={24}
                  color={result.success ? colors.success : colors.error}
                />
                <Text style={styles.resultText}>
                  {result.name}: {result.success ? 'Success' : 'Failed'}
                </Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Printer Selection Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Printer Selection</Text>
          
          <PrinterSelector
            onSelectPrinter={handleSelectPrinter}
            selectedPrinter={selectedPrinter}
            warehouse={warehouse}
          />
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <ModernButton
            title="Upload Photos"
            onPress={handleUploadPhotos}
            loading={isUploading}
            disabled={isUploading || (!transit && !product && !mrn)}
            style={styles.actionButton}
          />
          
          <ModernButton
            title="Print Test Receipt"
            onPress={handlePrintReceipt}
            loading={isPrinting}
            disabled={isPrinting || !selectedPrinter}
            style={styles.actionButton}
          />
          
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>Reset All</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.card,
    padding: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.small,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.lg,
    padding: spacing.md,
    ...shadows.small,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -spacing.xs,
  },
  photoSection: {
    width: '100%',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.md,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  actionsContainer: {
    marginTop: spacing.md,
  },
  actionButton: {
    marginBottom: spacing.md,
  },
  resetButton: {
    alignItems: 'center',
    padding: spacing.md,
  },
  resetButtonText: {
    color: colors.textLight,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default PhotoCaptureExample;