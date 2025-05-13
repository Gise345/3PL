import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  Alert, 
  ScrollView, 
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Platform
} from 'react-native';
import { Button, Input, PhotoCapture, Card } from '../../components/common';
import { useAppSelector } from '../../hooks/useRedux';
import { colors, typography, spacing, shadows } from '../../utils/theme';
import { vendorCheckService, ChecklistItem } from '../../api/vendorCheckService';
import ChecklistItemComponent from '../../components/vendor-checklist/CheckListItemComponent';
import { VendorOrderChecklistScreenProps } from '../../navigation/types';
import { MaterialIcons } from '@expo/vector-icons';

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
  
  // Animation values
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(50)).current;
  const titleScale = useRef(new Animated.Value(1)).current;

  // Start animations on component mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Check if all items are checked to determine if photo is required
  const orderPhotoRequired = checklist.length > 0 && 
    checklist.every(item => item.checked);
    
  const handleBack = () => {
    navigation.goBack();
  };

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
  
  // Render checklist content
  const renderChecklistContent = () => {
    return (
      <>
        <Card style={styles.orderCard}>
          <View style={styles.orderHeaderRow}>
            <MaterialIcons name="assignment" size={24} color={colors.primary} />
            <Text style={styles.orderTitle}>Order {loadedOrderNumber}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Quality Check Items</Text>
          
          <View style={styles.checklistContainer}>
            {checklist.map((item, index) => (
              <ChecklistItemComponent
                key={index}
                item={item}
                index={index}
                onToggle={(checked) => toggleChecklistItem(index, checked)}
                onAddComment={() => addCommentToCheck(index)}
              />
            ))}
          </View>
          
          {orderPhotoRequired && !orderPhoto && (
            <View style={styles.photoSection}>
              <Text style={styles.sectionTitle}>Required Documentation</Text>
              <PhotoCapture
                title="Order Verification Photo"
                cameraType="order-check"
                category="Order Verification"
                referenceNumber={loadedOrderNumber}
                onImageCaptured={handleImageCaptured}
              />
            </View>
          )}
          
          {orderPhoto && (
            <View style={styles.photoSection}>
              <Text style={styles.sectionTitle}>Documentation Captured</Text>
              <View style={styles.photoConfirmation}>
                <MaterialIcons name="check-circle" size={24} color={colors.success} />
                <Text style={styles.photoConfirmText}>Photo captured successfully</Text>
              </View>
            </View>
          )}
        </Card>
        
        <View style={styles.buttonContainer}>
          <Button 
            title="Cancel" 
            onPress={cancelOrderChecklist} 
            variant="outline"
            style={styles.button}
          />
          <Button
            title="Submit Checklist"
            onPress={submitOrderChecklist}
            disabled={orderPhotoRequired && !orderPhoto}
            style={styles.button}
          />
        </View>
      </>
    );
  };
  
  // Render input form
  const renderOrderInputForm = () => {
    return (
      <Card style={styles.inputCard}>
        <Text style={styles.sectionTitle}>Enter Order Number</Text>
        <Input
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
          icon={<MaterialIcons name="search" size={20} color={colors.background} />}
          iconPosition="left"
        />
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
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
          <Text style={styles.headerTitleText}>Vendor Order Checklist </Text>
          <Text style={[styles.headerTitleText, styles.warehouseText]}>({warehouse})</Text>
        </Animated.Text>
        
        <View style={styles.headerPlaceholder} />
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={{ 
            opacity: fadeIn,
            transform: [{ translateY: slideUp }]
          }}
        >
          {checklist.length > 0 ? renderChecklistContent() : renderOrderInputForm()}
        </Animated.View>
      </ScrollView>
      
      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
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
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight, // Prevent cutting off on Android
    ...Platform.select({
      ios: {
        shadowColor: colors.shadowColor,
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadowColor,
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
    color: colors.primary,
    fontSize: 22,
    fontWeight: typography.fontWeights.bold as any,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerTitleText: {
    fontSize: typography.fontSizes.large,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.text,
  },
  headerPlaceholder: {
    width: 40,
  },
  warehouseText: {
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  orderCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  orderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  orderTitle: {
    fontSize: typography.fontSizes.large,
    fontWeight: typography.fontWeights.bold as any,
    marginLeft: spacing.sm,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.medium,
    fontWeight: typography.fontWeights.semibold as any,
    marginBottom: spacing.sm,
    color: colors.text,
  },
  checklistContainer: {
    marginBottom: spacing.md,
  },
  photoSection: {
    marginTop: spacing.md,
  },
  photoConfirmation: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.success}15`,
    padding: spacing.sm,
    borderRadius: 4,
  },
  photoConfirmText: {
    marginLeft: spacing.sm,
    color: colors.success,
    fontWeight: typography.fontWeights.medium as any,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  button: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  inputCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingBox: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.shadowColor,
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
    marginTop: spacing.sm,
    fontSize: typography.fontSizes.medium,
    color: colors.text,
  },
});

export default VendorOrderChecklistScreen;