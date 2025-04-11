import * as FileSystem from 'expo-file-system';
import api from './apiConfig';

interface UploadImageParams {
  imageUri: string;
  imageName: string;
  companyCode?: string;
  orderNumber?: string;
  type?: string;
}

export const imageService = {
  /**
   * Upload image to the server
   * This mimics the functionality from the Vue app
   */
  uploadImage: async ({
    imageUri,
    imageName,
    companyCode = 'OUT',
    orderNumber,
    type,
  }: UploadImageParams): Promise<string> => {
    try {
      // Create form data for upload
      const formData = new FormData();
      
      // Add company code 
      formData.append('companyCode', companyCode);
      
      // Add order number if applicable
      if (orderNumber) {
        formData.append('orderNumber', orderNumber);
      }
      
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }
      
      // Add image file
      formData.append('image', {
        uri: imageUri,
        name: imageName,
        type: 'image/jpeg',
      } as any);
      
      // Determine the endpoint based on the type
      let endpoint = '/warehouse/systems/door/inbound-images';
      
      if (type === 'order-check') {
        endpoint = '/warehouse/vendorChecks/upload-order-check-image';
      }
      
      // Upload the image
      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data.data?.photoFile || imageName;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },
  
  /**
   * For offline mode - save the image locally and queue for upload
   */
  saveImageForOfflineUpload: async ({
    imageUri,
    imageName,
    companyCode,
    orderNumber,
    type,
  }: UploadImageParams): Promise<string> => {
    try {
      // Define the directory for storing offline images
      const offlineDir = `${FileSystem.documentDirectory}offline_images/`;
      
      // Check if directory exists, create if not
      const dirInfo = await FileSystem.getInfoAsync(offlineDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(offlineDir, { intermediates: true });
      }
      
      // Copy image to offline directory
      const newUri = `${offlineDir}${imageName}`;
      await FileSystem.copyAsync({
        from: imageUri,
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
        imageUri: newUri,
        imageName,
        companyCode,
        orderNumber,
        type,
        timestamp: new Date().toISOString(),
      };
      
      // Save metadata
      await FileSystem.writeAsStringAsync(
        `${metadataDir}${imageName}.json`,
        JSON.stringify(metadata)
      );
      
      return newUri;
    } catch (error) {
      console.error('Error saving image for offline upload:', error);
      throw error;
    }
  },
  
  /**
   * Process any queued offline uploads
   */
  processOfflineUploads: async (): Promise<{ success: number; failed: number }> => {
    try {
      // Check if we have internet connection
      const netInfo = await fetch('https://reports.3p-logistics.co.uk/api/v1/health-check').catch(() => null);
      if (!netInfo) {
        // No internet connection
        return { success: 0, failed: 0 };
      }
      
      // Get metadata directory
      const metadataDir = `${FileSystem.documentDirectory}offline_metadata/`;
      const dirInfo = await FileSystem.getInfoAsync(metadataDir);
      if (!dirInfo.exists) {
        return { success: 0, failed: 0 };
      }
      
      // Read all metadata files
      const metadataFiles = await FileSystem.readDirectoryAsync(metadataDir);
      
      let success = 0;
      let failed = 0;
      
      // Process each file
      for (const file of metadataFiles) {
        try {
          // Read metadata
          const metadataContent = await FileSystem.readAsStringAsync(`${metadataDir}${file}`);
          const metadata = JSON.parse(metadataContent);
          
          // Upload image
          await this.uploadImage(metadata);
          
          // Delete metadata and image after successful upload
          await FileSystem.deleteAsync(`${metadataDir}${file}`);
          
          // Check if the image file exists before trying to delete it
          const imageInfo = await FileSystem.getInfoAsync(metadata.imageUri);
          if (imageInfo.exists) {
            await FileSystem.deleteAsync(metadata.imageUri);
          }
          
          success++;
        } catch (error) {
          console.error(`Error processing offline upload for file ${file}:`, error);
          failed++;
        }
      }
      
      return { success, failed };
    } catch (error) {
      console.error('Error processing offline uploads:', error);
      return { success: 0, failed: 0 };
    }
  }
};