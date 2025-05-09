import api from './apiConfig';

// Types
interface CarrierWithOpenCages {
  carrier_id: string;
  cage_count: number;
}

interface CagePackage {
  cage_id: string;
  order_number: string;
  carrier_id: string;
}

// Service for cage-related operations
export const cageService = {
  // Get carriers with open cages
  getCarriersWithOpenCages: async (warehouse: string): Promise<CarrierWithOpenCages[]> => {
    try {
      const response = await api.get('/warehouse/systems/door/carriers-with-open-cages', {
        params: { warehouse }
      });
      if (response.data.success === 200) {
        return response.data.data;
      }
      throw new Error('Failed to get carriers with open cages');
    } catch (error) {
      console.error('Error fetching carriers with open cages:', error);
      throw error;
    }
  },

  // Get open cages and packages for a carrier
  getOpenCagesPackages: async (carrier: string, warehouse: string): Promise<CagePackage[]> => {
    try {
      const response = await api.get('/warehouse/systems/door/open-cages-packages', {
        params: { carrier, warehouse }
      });
      if (response.data.success === 200) {
        return response.data.data;
      }
      throw new Error('Failed to get open cage packages');
    } catch (error) {
      console.error('Error fetching open cage packages:', error);
      throw error;
    }
  },

  // Process loadout for cages
  processLoadoutCages: async (outboundData: {
    carrierName: string;
    driverRegistration: string;
    driverSignature: string;
    loadoutTime: Date;
    numberOfParcels: number;
    outboundRef: string;
    outboundType: string;
    parcelPhoto: string;
    warehouse: string;
    loadoutType: string;
  }): Promise<any> => {
    try {
      const response = await api.post('/warehouse/systems/door/loadout-cages', outboundData);
      return response.data;
    } catch (error) {
      console.error('Error processing loadout cages:', error);
      throw error;
    }
  },

  // Dispatch cages
  dispatchCages: async (cages: string[], outbound_id: number): Promise<any> => {
    try {
      const response = await api.post('/warehouse/systems/door/dispatch-cages', {
        cages,
        outbound_id
      });
      return response.data;
    } catch (error) {
      console.error('Error dispatching cages:', error);
      throw error;
    }
  }
};