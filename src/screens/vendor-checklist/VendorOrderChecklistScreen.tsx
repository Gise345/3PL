// src/screens/vendor-checklist/VendorOrderChecklistScreen.tsx
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Page, Button, Input, PhotoCapture } from '../../components/common';
import { useAppSelector } from '../../hooks/useRedux';
import { colors, typography, spacing } from '../../utils/theme';
import { vendorCheckService, ChecklistItem } from '../../api/vendorCheckService';
import ChecklistItemComponent from '../../components/vendor-checklist/CheckListItemComponent';
import { VendorOrderChecklistScreenProps } from '../../navigation/types';

const VendorOrderChecklistScreen: React.FC<VendorOrderChecklistScreenProps> = ({ navigation }) => {
  const { warehouse, isTestMode } = useAppSelector(state => state.settings);
  const { user } = useAppSelector(state => state.auth);
  
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [loadedOrderNumber, setLoadedOrderNumber] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [orderPhoto, setOrderPhoto] = useState<string | null>(null);
  const [orderPhotoName, setOrderPhotoName] = useState<string | null>(null);
  
  const orderInputRef = useRef<TextInput>(null);

  // Check if all items are checked to determine if photo is required
  const orderPhotoRequired = checklist.length > 0 && 
    checklist.every(item => item.checked);

  // Handle input submission
  const loadVendorOrderChecklist = async () => {
    if (loading || !orderNumber.trim()) {
      if (!orderNumber.trim()) {
        Alert.alert('Error', 'Please Input an Order Number');
      }
      return;
    }

    setLoading(true);
    
    try {
      const checklistData = await vendorCheckService.getOrderChecklist(orderNumber);
      setChecklist(checklistData);
      setLoadedOrderNumber(orderNumber);
      
      // Reset the input field
      setOrderNumber('');
      if (orderInputRef.current) {
        orderInputRef.current.blur();
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to load checklist');
    } finally {
      setLoading(false);
    }
  };

  // Handle checklist item toggle
  const toggleChecklistItem = (index: number, checked: boolean) => {
    const updatedChecklist = [...checklist];
    updatedChecklist[index].checked = checked;
    setChecklist(updatedChecklist);
  };

  // Handle adding comment to a checklist item
  const addCommentToCheck = (index: number) => {
    Alert.prompt(
      'Add Comment To Check',
      '',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: (comment?: string) => {
            if (comment) {
              const updatedChecklist = [...checklist];
              updatedChecklist[index].comment = comment;
              setChecklist(updatedChecklist);
            }
          },
          style: 'default',
        },
      ],
      'plain-text',
      checklist[index].comment || ''
    );
  };

  // Handle photo capture
  const handleImageCaptured = (imageUri: string, imageName: string) => {
    setOrderPhoto(imageUri);
    setOrderPhotoName(imageName);
  };

  // Handle submit checklist
  const submitOrderChecklist = async () => {
    if (loading) return;

    setLoading(true);
    
    try {
      const response = await vendorCheckService.submitOrderChecklist({
        order_number: loadedOrderNumber,
        user: user?.email || 'unknown',
        checklist: checklist,
      });
      
      Alert.alert('Success', response.data || 'Checklist submitted successfully');
      
      // Reset form
      setChecklist([]);
      setLoadedOrderNumber('');
      setOrderPhoto(null);
      setOrderPhotoName(null);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit checklist');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel checklist
  const cancelOrderChecklist = () => {
    setChecklist([]);
    setLoadedOrderNumber('');
    setOrderPhoto(null);
    setOrderPhotoName(null);
  };

  return (
    <Page
      title="Vendor Order Checklist"
      showHeader
      showBackButton
      loading={loading}
      onBackPress={() => navigation.goBack()}
    >
      {checklist.length > 0 ? (
        <View style={styles.container}>
          <Text style={styles.orderTitle}>Checklist for Order {loadedOrderNumber}</Text>
          
          <ScrollView style={styles.checklistContainer}>
            {checklist.map((item, index) => (
              <ChecklistItemComponent
                key={index}
                item={item}
                index={index}
                onToggle={(checked) => toggleChecklistItem(index, checked)}
                onAddComment={() => addCommentToCheck(index)}
              />
            ))}
          </ScrollView>
          
          {orderPhotoRequired && !orderPhoto && (
            <PhotoCapture
              title="Order Photo"
              cameraType="order-check"
              category="Order Verification"
              referenceNumber={loadedOrderNumber}
              onImageCaptured={handleImageCaptured}
            />
          )}
          
          <View style={styles.buttonContainer}>
            <Button 
              title="Cancel" 
              onPress={cancelOrderChecklist} 
              variant="outline"
              style={styles.button}
            />
            <Button
              title="Submit"
              onPress={submitOrderChecklist}
              disabled={orderPhotoRequired && !orderPhoto}
              style={styles.button}
            />
          </View>
        </View>
      ) : (
        <View style={styles.inputContainer}>
          <Input
            label="Order Number"
            value={orderNumber}
            onChangeText={setOrderNumber}
            ref={orderInputRef}
            placeholder="Enter order number"
            returnKeyType="go"
            onSubmitEditing={loadVendorOrderChecklist}
          />
          <Button
            title="Load Order Checklist"
            onPress={loadVendorOrderChecklist}
          />
        </View>
      )}
    </Page>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  inputContainer: {
    padding: spacing.md,
  },
  orderTitle: {
    fontSize: typography.fontSizes.large,
    fontWeight: typography.fontWeights.bold as any,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  checklistContainer: {
    maxHeight: 400,
    marginBottom: spacing.md,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  button: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
});

export default VendorOrderChecklistScreen;