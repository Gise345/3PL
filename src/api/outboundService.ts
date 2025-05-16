// src/api/outboundService.ts

import api from './apiConfig';

export interface DropshipClient {
    CustomerName: string;
    StUQty: number;
  }

export const outboundService = {
  /**
   * Submit outbound loadout data
   */
  submitOutbound: async (outboundData: any): Promise<any> => {
    try {
      const response = await api.post('/warehouse/systems/door/loadout', outboundData);
      return response.data;
    } catch (error) {
      console.error('Error submitting outbound data:', error);
      throw error;
    }
  },

  /**
   * Check if vendor checks are completed for an order
   */
  checkVendorCheckCompleted: async (orderNumber: string): Promise<boolean> => {
    try {
      const response = await api.post('/warehouse/vendorChecks/is-completed', {
        orderNumber,
      });
      return response.data.data.completed;
    } catch (error) {
      console.error('Error checking vendor check completion:', error);
      throw error;
    }
  },

  /**
   * Get available dropship clients
   */
  getDropshipClients: async (): Promise<DropshipClient[]> => {
    try {
      console.log('Making API request to fetch dropship clients');
      
      // Match the exact endpoint used in the Vue implementation
      const response = await api.get('/warehouse/systems/door/check-dropship-orders');
      console.log('Raw dropship API response:', response);
      
      // Handle the response structure correctly
      if (response.data && response.data.success === 200) {
        console.log('Successful dropship clients response:', response.data.data);
        return response.data.data || [];
      } 
      
      console.warn('Unexpected response format from dropship API:', response);
      return [];
    } catch (error) {
      console.error('Error fetching dropship clients:', error);
      // Return empty array instead of throwing
      return [];
    }
  },
};