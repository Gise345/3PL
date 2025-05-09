import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import api from '../api/apiConfig';

interface UploadOptions {
  imageUri: string;
  fileName: string;
  companyCode: string;
  additionalParams?: Record<string, any>;
}

interface UploadResult {
  success: boolean;
  data?: any;
  error?: string;
}

class ImageUploader {
  /**
   * Upload an image to the server
   * @param options Upload options
   * @returns Promise resolving to upload result
   */
  async uploadImage(options: UploadOptions): Promise<UploadResult> {
    try {
      // In a real app, this would actually upload the image
      // For now, we're just simulating a success after a delay
      
      console.log('Uploading image:', options.fileName);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a production environment, we would create a FormData object
      // and send it to the server using the API service
      
      /*
      // Real implementation would look something like this:
      const fileInfo = await FileSystem.getInfoAsync(options.imageUri);
      
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }
      
      // Create form data
      const formData = new FormData();
      formData.append('companyCode', options.companyCode);
      
      // Add additional params
      if (options.additionalParams) {
        Object.entries(options.additionalParams).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }
      
      // Add image file
      const fileUri = Platform.OS === 'ios' 
        ? options.imageUri.replace('file://', '') 
        : options.imageUri;
        
      formData.append('image', {
        uri: fileUri,
        name: options.fileName,
        type: 'image/jpeg',
      } as any);
      
      // Send to server
      const response = await api.post('/warehouse/systems/door/inbound-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return {
        success: true,
        data: response.data,
      };
      */
      
      // For now, return a mock success
      return {
        success: true,
        data: {
          fileName: options.fileName,
          url: options.imageUri,
        },
      };
      
    } catch (error: any) {
      console.error('Failed to upload image:', error);
      
      return {
        success: false,
        error: error.message || 'Failed to upload image',
      };
    }
  }
  
  /**
   * Delete a temporary image file
   * @param uri URI of the image to delete
   */
  async deleteTemporaryImage(uri: string): Promise<void> {
    try {
      if (uri.startsWith('file://')) {
        await FileSystem.deleteAsync(uri);
      }
    } catch (error) {
      console.error('Failed to delete temporary image:', error);
    }
  }
}

// Export a singleton instance
export default new ImageUploader();