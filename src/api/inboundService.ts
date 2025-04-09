import api from './apiConfig';

interface InboundParams {
  warehouse: string;
}

// Make API_BASE_URL available
export const API_BASE_URL = api.defaults.baseURL;

export const inboundService = {
  getInbounds: async (params: InboundParams) => {
    try {
      const response = await api.get('/warehouse/systems/door/inbounds', {
        params
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  submitInbound: async (inboundData: any) => {
    try {
      const response = await api.post('/warehouse/systems/door/inbounds', inboundData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  submitUnknownInbound: async (inboundData: any) => {
    try {
      const response = await api.post('/warehouse/systems/door/unknown-inbound', inboundData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  checkGoodsInLaneExists: async (goodsInLane: string) => {
    try {
      const response = await api.get('/warehouse/systems/door/check-goods-in-lane-exists', {
        params: { goodsInLane }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  setGRNArrivedAt: async (data: { inboundId: string; poNumber: string; arrivedAt: string }) => {
    try {
      const response = await api.post('/warehouse/systems/door/inbounds/grn/set-arrived', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  handleMRNError: async (data: any) => {
    try {
      const response = await api.post('/warehouse/systems/door/inbounds/mrn-error', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getCompanies: async () => {
    try {
      const response = await api.get('/utilities/companies', {
        params: { order: 'name' }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getContainerTypes: async () => {
    try {
      const response = await api.get('/warehouse/systems/door/container-types');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};