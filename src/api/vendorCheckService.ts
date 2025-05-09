// src/api/vendorCheckService.ts
import api from './apiConfig';

export interface ChecklistItem {
  id: number;
  description: string;
  checked: boolean;
  comment?: string;
}

export const vendorCheckService = {
  // Get vendor checklist for an order
  getOrderChecklist: async (orderNumber: string): Promise<ChecklistItem[]> => {
    try {
      const response = await api.get(`/warehouse/vendorChecks/vc-checklist-order`, {
        params: { orderNumber }
      });
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  // Submit vendor checklist for an order
  submitOrderChecklist: async (data: {
    order_number: string;
    user: string;
    checklist: ChecklistItem[];
  }): Promise<any> => {
    try {
      const response = await api.post('/warehouse/vendorChecks/vc-checklist-order', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};