import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { imageService } from '../api/imageService';
import { useAppSelector } from './useRedux';
import NetInfo from '@react-native-community/netinfo';

interface UseCameraProps {
  companyCode?: string;
  referenceNumber?: string;
  onImageCaptured?: (imageUri: string, imageName: string) => void;
  onUploadComplete?: (imageName: string) => void;
  onError?: (error: Error) => void;
}

export const useCamera = ({
  companyCode = 'OUT',
  referenceNumber = '',
  onImageCaptured,
  onUploadComplete,
  onError,
}: UseCameraProps = {}) => {
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cameraType, setCameraType] = useState<'inbound' | 'transit' | 'product' | 'mrn' | 'order-check'>('inbound');
  const [categoryName, setCategoryName] = useState<string>('');
  
  const { isTestMode } = useAppSelector(state => state.settings);

  // Open camera with specified type
  const openCamera = useCallback((type: 'inbound' | 'transit' | 'product' | 'mrn' | 'order-check', category: string) => {
    setCameraType(type);
    setCategoryName(category);
    setShowCamera(true);
  }, []);

  // Close camera
  const closeCamera = useCallback(() => {
    setShowCamera(false);
  }, []);

  // Handle captured image
  const handleImageCaptured = useCallback(async (imageUri: string, name: string) => {
    setCapturedImageUri(imageUri);
    setImageName(name);
    setShowCamera(false);
    
    if (onImageCaptured) {
      onImageCaptured(imageUri, name);
    }
    
    // Check if we should upload immediately
    const netInfoState = await NetInfo.fetch();
    
    if (netInfoState.isConnected) {
      uploadImage(imageUri, name);
    } else {
      // Save for offline upload
      try {
        await imageService.saveImageForOfflineUpload({
          imageUri,
          imageName: name,
          companyCode,
          orderNumber: referenceNumber,
          type: cameraType,
        });
        
        Alert.alert(
          'Offline Mode',
          'Image saved locally. It will be uploaded when internet connection is available.'
        );
        
        if (onUploadComplete) {
          onUploadComplete(name);
        }
      } catch (error) {
        console.error('Error saving image for offline upload:', error);
        if (onError) {
          onError(error as Error);
        }
      }
    }
  }, [companyCode, referenceNumber, cameraType, onImageCaptured, onUploadComplete, onError]);

  // Upload image to server
  const uploadImage = useCallback(async (uri: string, name: string) => {
    if (isTestMode) {
      // In test mode, we don't actually upload
      if (onUploadComplete) {
        onUploadComplete(name);
      }
      return;
    }
    
    setUploading(true);
    
    try {
      const result = await imageService.uploadImage({
        imageUri: uri,
        imageName: name,
        companyCode,
        orderNumber: referenceNumber,
        type: cameraType,
      });
      
      if (onUploadComplete) {
        onUploadComplete(result);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      
      // Save for offline upload on failure
      try {
        await imageService.saveImageForOfflineUpload({
          imageUri: uri,
          imageName: name,
          companyCode,
          orderNumber: referenceNumber,
          type: cameraType,
        });
        
        Alert.alert(
          'Upload Failed',
          'Image saved locally. It will be uploaded when internet connection is available.'
        );
      } catch (saveError) {
        console.error('Error saving image for offline upload:', saveError);
      }
      
      if (onError) {
        onError(error as Error);
      }
    } finally {
      setUploading(false);
    }
  }, [isTestMode, companyCode, referenceNumber, cameraType, onUploadComplete, onError]);

  return {
    showCamera,
    capturedImageUri,
    imageName,
    uploading,
    cameraType,
    categoryName,
    openCamera,
    closeCamera,
    handleImageCaptured,
    uploadImage,
  };
};

export default useCamera;