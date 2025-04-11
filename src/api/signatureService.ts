import * as FileSystem from 'expo-file-system';
import api from './apiConfig';

interface UploadSignatureParams {
  signatureUri: string;
  signatureName: string;
  companyCode?: string;
}

export const signatureService = {
  /**
   * Upload signature to the server
   */
  uploadSignature: async ({
    signatureUri,
    signatureName,
    companyCode = 'OUT',
  }: UploadSignatureParams): Promise<string> => {
    try {
      // Create form data for upload
      const formData = new FormData();
      
      // Add company code
      formData.append('companyCode', companyCode);
      
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(signatureUri);
      
      if (!fileInfo.exists) {
        throw new Error('Signature file does not exist');
      }
      
      // Add signature file
      formData.append('image', {
        uri: signatureUri,
        name: signatureName,
        type: 'image/png',
      } as any);
      
      // Upload the signature
      const response = await api.post('/warehouse/systems/door/inbound-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return signatureName;
    } catch (error) {
      console.error('Error uploading signature:', error);
      throw error;
    }
  },
  
  /**
   * For offline mode - save the signature locally and queue for upload
   */
  saveSignatureForOfflineUpload: async ({
    signatureUri,
    signatureName,
    companyCode,
  }: UploadSignatureParams): Promise<string> => {
    try {
      // Define the directory for storing offline signatures
      const offlineDir = `${FileSystem.documentDirectory}offline_signatures/`;
      
      // Check if directory exists, create if not
      const dirInfo = await FileSystem.getInfoAsync(offlineDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(offlineDir, { intermediates: true });
      }
      
      // Copy signature to offline directory
      const newUri = `${offlineDir}${signatureName}`;
      await FileSystem.copyAsync({
        from: signatureUri,
        to: newUri
      });
      
      // Save metadata for later upload
      const metadataDir = `${FileSystem.documentDirectory}offline_metadata/`;
      const metadataDirInfo = await FileSystem.getInfoAsync(metadataDir);
      if (!metadataDirInfo.exists) {
        await FileSystem.makeDirectoryAsync(metadataDir, { intermediates: true });
      }
      
      // Create metadata object
      const metadata = {
        type: 'signature',
        imageUri: newUri,
        imageName: signatureName,
        companyCode,
        timestamp: new Date().toISOString(),
      };
      
      // Save metadata
      await FileSystem.writeAsStringAsync(
        `${metadataDir}sig_${signatureName}.json`,
        JSON.stringify(metadata)
      );
      
      return newUri;
    } catch (error) {
      console.error('Error saving signature for offline upload:', error);
      throw error;
    }
  }
};