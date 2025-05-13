// src/api/outboundService.ts

import api from './apiConfig';

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
  getDropshipClients: async (): Promise<any[]> => {
    try {
      const response = await api.get('/warehouse/systems/door/check-dropship-orders');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching dropship clients:', error);
      throw error;
    }
  },
};