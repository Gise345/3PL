import api from './apiConfig';

export interface Operator {
  id: number;
  operator_first_name: string;
  operator_last_name: string;
}

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
  checkOrderDetails: async (orderTrackNumber: string): Promise<any> => {
    try {
      const response = await api.get('/warehouse/systems/door/check-order', {
        params: { orderTrackNumber }
      });
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Associate a package with a cage
   * @param params Parameters for scan-to-cage operation
   */
  scanToCage: async (params: {
    orderTrackNumber: string;
    operatorId: number;
    cageId: string;
    warehouse: string;
  }): Promise<any> => {
    try {
      const response = await api.get('/warehouse/systems/door/scan-to-cage', { params });
      return response.data;
    } catch (error) {
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
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};