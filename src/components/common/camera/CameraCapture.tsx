import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { Camera } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { colors, typography, spacing } from '../../../utils/theme';

interface CameraCaptureProps {
  onImageCaptured: (imageUri: string, imageName: string) => void;
  onCancel: () => void;
  category: string;
  type: string;
  companyCode?: string;
  referenceNumber?: string; // PO number, order number, etc.
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onImageCaptured,
  onCancel,
  category,
  type,
  companyCode = 'OUT',
  referenceNumber = '',
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState<'back' | 'front'>('back');  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const cameraRef = useRef<React.ElementRef<typeof CameraView>>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleCameraTypeChange = () => {
    setCameraType(cameraType === 'back' ? 'front' : 'back');
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      
      if (photo && photo.uri) {
        setCapturedImage(photo.uri);
      }
    } catch (error) {
      console.error('Failed to take picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    }
  };
  

  const processImage = async () => {
    if (!capturedImage) return;
    
    setProcessing(true);
    
    try {
      // Generate image name
      const date = new Date();
      const day = date.toISOString().split('T')[0].replace(/-/g, ''); // e.g., 20240410
      const time = 
        ('0' + date.getHours()).slice(-2) +
        ('0' + date.getMinutes()).slice(-2); // e.g., 0856
      
      // Format reference for the filename
      const formattedReference = referenceNumber 
        ? referenceNumber.replace(/\s+/g, '-')
        : '';
      
      // Generate image name based on the type
      const imageName = formattedReference 
        ? `${formattedReference}-${type}.jpg` 
        : `${companyCode}-${day}_${time}-${type}.jpg`;
      
      // Skip image manipulation for now and use the original image
      onImageCaptured(capturedImage, imageName);
      
    } catch (error) {
      console.error('Failed to process image:', error);
      Alert.alert('Error', 'Failed to process image. Please try again.');
    } finally {
      setProcessing(false);
    }
  };
  
  const retakePicture = () => {
    setCapturedImage(null);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorMessage}>No access to camera</Text>
        <TouchableOpacity style={styles.button} onPress={onCancel}>
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!capturedImage ? (
        // Camera view
        <View style={styles.cameraContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.headerText}>Capture {category} Image</Text>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={colors.background} />
            </TouchableOpacity>
          </View>
          
          <CameraView 
            ref={cameraRef} 
            style={styles.camera} 
            facing={cameraType}
            
          >
            <View style={styles.cameraControlsContainer}>
              <TouchableOpacity 
                style={styles.flipButton} 
                onPress={handleCameraTypeChange}
              >
                <MaterialIcons name="flip-camera-ios" size={28} color={colors.background} />
              </TouchableOpacity>
            </View>
          </CameraView>
          
          <View style={styles.bottomControlsContainer}>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // Image preview
        <View style={styles.previewContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.headerText}>Confirm {category} Image</Text>
            <TouchableOpacity onPress={retakePicture} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={colors.background} />
            </TouchableOpacity>
          </View>
          
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          
          <View style={styles.previewControlsContainer}>
            <TouchableOpacity style={styles.previewButton} onPress={retakePicture}>
              <Text style={styles.previewButtonText}>Retake</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.previewButton, styles.confirmButton]} 
              onPress={processImage}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text style={styles.previewButtonText}>Confirm</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  message: {
    textAlign: 'center',
    padding: spacing.lg,
    color: colors.text,
  },
  errorMessage: {
    textAlign: 'center',
    padding: spacing.lg,
    color: colors.error,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 4,
    alignSelf: 'center',
    marginTop: spacing.md,
  },
  buttonText: {
    color: colors.background,
    fontSize: typography.fontSizes.medium,
  },
  cameraContainer: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  headerText: {
    color: colors.background,
    fontSize: typography.fontSizes.large,
    fontWeight: typography.fontWeights.medium as any,
  },
  closeButton: {
    padding: spacing.xs,
  },
  camera: {
    flex: 1,
  },
  cameraControlsContainer: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 2,
  },
  flipButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 30,
    padding: spacing.sm,
  },
  bottomControlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  previewControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  previewButton: {
    flex: 1,
    backgroundColor: colors.border,
    padding: spacing.md,
    borderRadius: 4,
    margin: spacing.xs,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  previewButtonText: {
    color: colors.background,
    fontSize: typography.fontSizes.medium,
    fontWeight: typography.fontWeights.medium as any,
  },
});

export default CameraCapture;