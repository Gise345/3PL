import api from './apiConfig';

interface PalletType {
  id: number;
  pallet_size: string;
  length: number;
  width: number;
  weight: number;
}

interface PalletTypeForm {
  pallet_size: string;
  length: number;
  width: number;
  weight: number;
}

interface Pallet {
  id: number;
  pallet_type_id: number;
  description: string;
  closed: boolean;
  height?: number;
  palletStus: PalletStu[];
}

interface PalletStu {
  id: number;
  pallet_id: number;
  stu_id: string;
  order_number: string;
}

interface PalletSummary {
  pallet_id: number;
  order_numbers: string[];
  asns: string[];
  pallet_weight: number;
  cartons: number;
}

export const palletService = {
  getPalletTypes: async (): Promise<PalletType[]> => {
    try {
      const response = await api.get('/warehouse/systems/pallet-types');
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  insertPalletType: async (palletType: PalletTypeForm): Promise<PalletType> => {
    try {
      const response = await api.post('/warehouse/systems/pallet-type', palletType);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  deletePalletType: async (id: { id: number }): Promise<void> => {
    try {
      await api.delete(`/warehouse/systems/pallet-type/${id.id}`);
    } catch (error) {
      throw error;
    }
  },

  insertPallet: async (pallet: { pallet_type_id: number, description: string }): Promise<Pallet> => {
    try {
      const response = await api.post('/warehouse/systems/pallet', pallet);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  getPallet: async (palletId: number | string): Promise<Pallet> => {
    try {
      const response = await api.get(`/warehouse/systems/pallet/${palletId}`);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  updatePallet: async (pallet: { id: number, closed: boolean, height?: string }): Promise<Pallet> => {
    try {
      const response = await api.put(`/warehouse/systems/pallet/${pallet.id}`, pallet);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  insertPalletStu: async (palletStu: { pallet_id: number, stu_id: string, operator_id: number }): Promise<PalletStu> => {
    try {
      const response = await api.post('/warehouse/systems/pallet-stu', palletStu);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  deletePalletStu: async (id: { id: number }): Promise<void> => {
    try {
      await api.delete(`/warehouse/systems/pallet-stu/${id.id}`);
    } catch (error) {
      throw error;
    }
  },

  getStuDetails: async (stuId: string): Promise<{ orderNumber: string }> => {
    try {
      const response = await api.get(`/warehouse/systems/stu/${stuId}`);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  getPalletSummary: async (palletId: number): Promise<PalletSummary> => {
    try {
      const response = await api.get(`/warehouse/systems/pallet/${palletId}/summary`);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }
};