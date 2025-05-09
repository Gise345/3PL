import api from './apiConfig';
import { Operator, OrderDetails, ScanToCageParams } from '../types/warehouse';

export const warehouseService = {
  /**
   * Get list of warehouse operators
   */
  getWarehouseOperators: async (): Promise<Operator[]> => {
    try {
      const response = await api.get('/warehouse/workflow/warehouse-operators');
      if (response.data.success === 200) {
        return response.data.data;
      }
      throw new Error('Failed to get warehouse operators');
    } catch (error) {
      console.error('Error fetching warehouse operators:', error);
      throw error;
    }
  },
  
  /**
   * Check details of an order by tracking number
   * @param orderTrackNumber Tracking number or order number to check
   */
  checkOrderDetails: async (orderTrackNumber: string): Promise<OrderDetails> => {
    try {
      const response = await api.get('/warehouse/systems/door/check-order', {
        params: { orderTrackNumber }
      });
      
      if (response.data.success === 200) {
        return response.data.data;
      }
      
      throw new Error('Failed to get order details');
    } catch (error) {
      console.error('Error checking order details:', error);
      throw error;
    }
  },
  
  /**
   * Associate a package with a cage
   * @param params Parameters for scan-to-cage operation
   */
  scanToCage: async (params: ScanToCageParams): Promise<any> => {
    try {
      const response = await api.get('/warehouse/systems/door/scan-to-cage', { 
        params 
      });
      
      if (response.data.success === 200) {
        return response.data;
      }
      
      throw new Error('Failed to scan to cage');
    } catch (error) {
      console.error('Error scanning to cage:', error);
      throw error;
    }
  },
  
  /**
   * Validate an order number
   * @param orderNumber Order number to validate
   */
  checkOrderNumber: async (orderNumber: string): Promise<any> => {
    try {
      const response = await api.get('/warehouse/systems/door/check-order-number', {
        params: { orderNumber }
      });
      
      if (response.data.success === 200) {
        return response.data.data;
      }
      
      throw new Error('Invalid order number');
    } catch (error) {
      console.error('Error checking order number:', error);
      throw error;
    }
  }
};