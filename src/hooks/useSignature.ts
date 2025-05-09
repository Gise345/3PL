import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { signatureService } from '../api/signatureService';
import { useAppSelector } from './useRedux';
import NetInfo from '@react-native-community/netinfo';

interface UseSignatureProps {
  companyCode?: string;
  onSignatureCaptured?: (signatureUri: string, signatureName: string) => void;
  onUploadComplete?: (signatureName: string) => void;
  onError?: (error: Error) => void;
}

export const useSignature = ({
  companyCode = 'OUT',
  onSignatureCaptured,
  onUploadComplete,
  onError,
}: UseSignatureProps = {}) => {
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [capturedSignatureUri, setCapturedSignatureUri] = useState<string | null>(null);
  const [signatureName, setSignatureName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const { isTestMode } = useAppSelector(state => state.settings);

  // Open signature pad
  const openSignaturePad = useCallback(() => {
    setShowSignaturePad(true);
  }, []);

  // Close signature pad
  const closeSignaturePad = useCallback(() => {
    setShowSignaturePad(false);
  }, []);

  // Handle captured signature
  const handleSignatureCaptured = useCallback(async (signatureUri: string, name: string) => {
    setCapturedSignatureUri(signatureUri);
    setSignatureName(name);
    setShowSignaturePad(false);
    
    if (onSignatureCaptured) {
      onSignatureCaptured(signatureUri, name);
    }
    
    // Check if we should upload immediately
    const netInfoState = await NetInfo.fetch();
    
    if (netInfoState.isConnected) {
      uploadSignature(signatureUri, name);
    } else {
      // Save for offline upload
      try {
        await signatureService.saveSignatureForOfflineUpload({
          signatureUri,
          signatureName: name,
          companyCode,
        });
        
        Alert.alert(
          'Offline Mode',
          'Signature saved locally. It will be uploaded when internet connection is available.'
        );
        
        if (onUploadComplete) {
          onUploadComplete(name);
        }
      } catch (error) {
        console.error('Error saving signature for offline upload:', error);
        if (onError) {
          onError(error as Error);
        }
      }
    }
  }, [companyCode, onSignatureCaptured, onUploadComplete, onError]);

  // Upload signature to server
  const uploadSignature = useCallback(async (uri: string, name: string) => {
    if (isTestMode) {
      // In test mode, we don't actually upload
      if (onUploadComplete) {
        onUploadComplete(name);
      }
      return;
    }
    
    setUploading(true);
    
    try {
      const result = await signatureService.uploadSignature({
        signatureUri: uri,
        signatureName: name,
        companyCode,
      });
      
      if (onUploadComplete) {
        onUploadComplete(result);
      }
    } catch (error) {
      console.error('Error uploading signature:', error);
      
      // Save for offline upload on failure
      try {
        await signatureService.saveSignatureForOfflineUpload({
          signatureUri: uri,
          signatureName: name,
          companyCode,
        });
        
        Alert.alert(
          'Upload Failed',
          'Signature saved locally. It will be uploaded when internet connection is available.'
        );
      } catch (saveError) {
        console.error('Error saving signature for offline upload:', saveError);
      }
      
      if (onError) {
        onError(error as Error);
      }
    } finally {
      setUploading(false);
    }
  }, [isTestMode, companyCode, onUploadComplete, onError]);

  return {
    showSignaturePad,
    capturedSignatureUri,
    signatureName,
    uploading,
    openSignaturePad,
    closeSignaturePad,
    handleSignatureCaptured,
    uploadSignature,
  };
};

export default useSignature;