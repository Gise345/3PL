import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../api/inboundService';

/**
 * Interface for upload options
 */
interface UploadOptions {
  imageUri: string;
  endpoint?: string;
  companyCode?: string;
  additionalParams?: Record<string, string>;
  fileName?: string;
  mimeType?: string;
}

/**
 * Response from the image upload
 */
interface UploadResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Service for uploading images to the server
 */
class ImageUploader {
  private static instance: ImageUploader;
  private apiBaseUrl: string = API_BASE_URL;

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}

  /**
   * Get the ImageUploader instance (Singleton)
   */
  public static getInstance(): ImageUploader {
    if (!ImageUploader.instance) {
      ImageUploader.instance = new ImageUploader();
    }
    return ImageUploader.instance;
  }

  /**
   * Upload an image to the server
   * @param options Upload options
   * @returns Promise that resolves to upload response
   */
  public async uploadImage(options: UploadOptions): Promise<UploadResponse> {
    const {
      imageUri,
      endpoint = '/warehouse/systems/door/inbound-images',
      companyCode = 'OUT',
      additionalParams = {},
      fileName,
      mimeType = 'image/jpeg',
    } = options;

    try {
      // Prepare the URL
      const url = `${this.apiBaseUrl}${endpoint}`;

      // Create FormData
      const formData = new FormData();
      
      // Add the image
      const imageName = fileName || imageUri.split('/').pop() || `image_${Date.now()}.jpg`;
      
      const imageFile = {
        uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
        name: imageName,
        type: mimeType,
      };
      
      // @ts-ignore - FormData append can take a File object
      formData.append('image', imageFile);
      
      // Add company code if provided
      if (companyCode) {
        formData.append('companyCode', companyCode);
      }
      
      // Add additional parameters
      Object.entries(additionalParams).forEach(([key, value]) => {
        formData.append(key, value);
      });
      
      // Make the request
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': 'Basic d2FyZWhvdXNlQWRtaW46M1BMJldIRChBUEkp', // Default authorization
        },
      });
      
      // Check if the request was successful
      if (response.ok) {
        const responseData = await response.json();
        return {
          success: true,
          data: responseData.data,
        };
      } else {
        const errorData = await response.json().catch(() => null);
        return {
          success: false,
          error: errorData?.message || 'Failed to upload image',
        };
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Upload multiple images to the server
   * @param options Array of upload options
   * @returns Promise that resolves to array of upload responses
   */
  public async uploadMultipleImages(options: UploadOptions[]): Promise<UploadResponse[]> {
    const results: UploadResponse[] = [];
    
    for (const option of options) {
      const result = await this.uploadImage(option);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Process image before uploading (resize, compress, etc.)
   * @param imageUri URI of the image to process
   * @returns Promise that resolves to the processed image URI
   */
  public async processImage(imageUri: string): Promise<string> {
    try {
      // For now, we'll just return the original image
      // In a real implementation, we might use a library like expo-image-manipulator
      // to resize, compress, or otherwise process the image
      return imageUri;
    } catch (error) {
      console.error('Error processing image:', error);
      return imageUri;
    }
  }

  /**
   * Check if an image exists at the given URI
   * @param imageUri URI of the image to check
   * @returns Promise that resolves to true if the image exists
   */
  public async imageExists(imageUri: string): Promise<boolean> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      return fileInfo.exists && fileInfo.size > 0;
    } catch (error) {
      console.error('Error checking if image exists:', error);
      return false;
    }
  }

  /**
   * Get the base64 representation of an image
   * @param imageUri URI of the image
   * @returns Promise that resolves to the base64 data
   */
  public async getBase64(imageUri: string): Promise<string> {
    try {
      return await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    } catch (error) {
      console.error('Error getting base64 data:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export default ImageUploader.getInstance();