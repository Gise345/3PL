import api from './apiConfig';

export interface PalletType {
  id: number;
  pallet_size: string;
  length: number;
  width: number;
  weight: number;
}

export interface PalletTypeForm {
  pallet_size: string;
  length: number;
  width: number;
  weight: number;
}

export interface Pallet {
  id: number;
  pallet_type_id: number;
  description: string;
  closed: boolean;
  height?: number;
  palletStus: PalletStu[];
}

export interface PalletStu {
  id: number;
  pallet_id: number;
  stu_id: string;
  order_number: string;
}

export interface PalletSummary {
  pallet_id: number;
  order_numbers: string[];
  asns: string[];
  pallet_weight: number;
  cartons: number;
}

export const palletService = {
  getPalletTypes: async (): Promise<PalletType[]> => {
    try {
      // Updated to use correct endpoint as per the documentation
      const response = await api.get('/warehouse/systems/door/pallet-type');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching pallet types:', error);
      throw error;
    }
  },

  insertPallet: async (pallet: { pallet_type_id: number, description: string }): Promise<Pallet> => {
    try {
      const response = await api.post('/warehouse/systems/door/pallet', pallet);
      return response.data.data;
    } catch (error) {
      console.error('Error creating pallet:', error);
      throw error;
    }
  },

  getPallet: async (palletId: number | string): Promise<Pallet> => {
    try {
      const response = await api.get(`/warehouse/systems/door/pallet?palletId=${palletId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching pallet:', error);
      throw error;
    }
  },

  updatePallet: async (pallet: { id: number, closed: boolean, height?: string }): Promise<Pallet> => {
    try {
      // Using PUT to update pallet status
      const response = await api.put(`/warehouse/systems/door/pallet`, pallet);
      return response.data.data;
    } catch (error) {
      console.error('Error updating pallet status:', error);
      throw error;
    }
  },

  insertPalletStu: async (palletStu: { pallet_id: number, stu_id: string, operator_id: number }): Promise<PalletStu> => {
    try {
      const response = await api.post('/warehouse/systems/door/pallet-stu', palletStu);
      return response.data.data;
    } catch (error) {
      console.error('Error adding STU to pallet:', error);
      throw error;
    }
  },

  deletePalletStu: async (id: { id: number }): Promise<void> => {
    try {
      await api.delete(`/warehouse/systems/door/pallet-stu`, { data: id });
    } catch (error) {
      // Narrowing the type of 'error'
      if (error instanceof Error) {
        console.error('Error removing STU from pallet:', error.message);
        throw new Error(error.message); // Re-throwing with a specific message
      } else {
        console.error('Unknown error occurred while removing STU from pallet:', error);
        throw new Error('An unknown error occurred.');
      }
    }
  },
  

  getStuDetails: async (stuId: string): Promise<{ orderNumber: string }> => {
    try {
      const response = await api.get(`/warehouse/systems/door/stu-details?stuId=${stuId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error checking STU details:', error);
      throw error;
    }
  },

  getPalletSummary: async (palletId: number): Promise<PalletSummary> => {
    try {
      const response = await api.get(`/warehouse/systems/door/pallet-summary?palletId=${palletId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching pallet summary:', error);
      throw error;
    }
  }
};