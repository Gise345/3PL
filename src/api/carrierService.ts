import api from './apiConfig';

// Types
export interface Carrier {
  name: string;
  numberOfParcels: number;
}

export interface VendorCheckResponse {
  data: {
    completed: boolean;
  };
}

// Service for carrier operations
export const carrierService = {
  // Get all available carriers
  getAvailableCarriers: async (): Promise<Carrier[]> => {
    try {
      const response = await api.get('/utilities/carriers/available-carriers');
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  // Get order numbers for a specific carrier
  getCarrierOrders: async (carrierId: string): Promise<string[]> => {
    try {
      const response = await api.post('/utilities/carriers/available-carriers/orders', {
        carrierId,
      });
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  // Check if vendor checks are completed for an order
  checkVendorCheckCompleted: async (orderNumber: string): Promise<boolean> => {
    try {
      const response = await api.post<VendorCheckResponse>('/warehouse/vendorChecks/is-completed', {
        orderNumber,
      });
      return response.data.data.completed;
    } catch (error) {
      throw error;
    }
  },

  // Process outbound loadout
  submitOutbound: async (outboundData: {
    carrierName: string;
    driverRegistration: string;
    driverSignature: string;
    loadoutTime: Date;
    loadoutType: string;
    numberOfParcels: number;
    outboundRef: string;
    outboundType: string;
    parcelPhoto: string;
    warehouse: string;
  }): Promise<any> => {
    try {
      const response = await api.post('/warehouse/systems/door/loadout', outboundData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Upload image to server
  uploadImage: async (imageUri: string, companyCode: string): Promise<string> => {
    try {
      // Create form data
      const formData = new FormData();
      formData.append('companyCode', companyCode);
      
      // Get filename from URI
      const uriParts = imageUri.split('/');
      const filename = uriParts[uriParts.length - 1];
      
      formData.append('image', {
        uri: imageUri,
        name: filename,
        type: 'image/jpeg',
      } as any);
      
      const response = await api.post('/warehouse/systems/door/inbound-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return filename;
    } catch (error) {
      throw error;
    }
  }
};