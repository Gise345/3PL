import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { carrierService, Carrier } from '../../api/carrierService';

interface CarrierOutboundState {
  carriers: Carrier[];
  selectedCarrier: Carrier | null;
  driverReg: string;
  numberOfParcels: number;
  parcelPhoto: string | null;
  parcelPhotoName: string | null;
  signatureImage: string | null;
  signatureImageName: string | null;
  loading: boolean;
  error: string | null;
  success: boolean;
  successMessage: string | null;
}

const initialState: CarrierOutboundState = {
  carriers: [],
  selectedCarrier: null,
  driverReg: '',
  numberOfParcels: 0,
  parcelPhoto: null,
  parcelPhotoName: null,
  signatureImage: null,
  signatureImageName: null,
  loading: false,
  error: null,
  success: false,
  successMessage: null,
};

// Async thunks
export const fetchCarriers = createAsyncThunk(
  'carrierOutbound/fetchCarriers',
  async (_, { rejectWithValue }) => {
    try {
      return await carrierService.getAvailableCarriers();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch carriers');
    }
  }
);

export const vendorCheck = createAsyncThunk(
  'carrierOutbound/vendorCheck',
  async (carrier: Carrier, { rejectWithValue }) => {
    try {
      // Get orders for carrier
      const orderNumbers = await carrierService.getCarrierOrders(carrier.name);
      
      // Check each order for vendor check completion
      const uncheckedOrders: string[] = [];
      
      for (const orderNumber of orderNumbers) {
        const isCompleted = await carrierService.checkVendorCheckCompleted(orderNumber);
        if (!isCompleted) {
          uncheckedOrders.push(orderNumber);
        }
      }
      
      if (uncheckedOrders.length > 0) {
        return rejectWithValue({
          message: 'Vendor Check Incomplete!',
          uncheckedOrders
        });
      }
      
      return carrier;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Vendor check failed');
    }
  }
);

export const submitOutbound = createAsyncThunk(
  'carrierOutbound/submitOutbound',
  async (
    {
      warehouse,
      outboundRef,
    }: { 
      warehouse: string;
      outboundRef: string;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { carrierOutbound: CarrierOutboundState };
      const { 
        selectedCarrier, 
        driverReg, 
        numberOfParcels, 
        parcelPhotoName, 
        signatureImageName 
      } = state.carrierOutbound;
      
      if (!selectedCarrier || !driverReg || !parcelPhotoName || !signatureImageName) {
        return rejectWithValue('Missing required information');
      }
      
      const response = await carrierService.submitOutbound({
        carrierName: selectedCarrier.name,
        driverRegistration: driverReg.toUpperCase(),
        driverSignature: signatureImageName,
        loadoutTime: new Date(),
        loadoutType: 'standard', // For carrier outbound
        numberOfParcels,
        outboundRef,
        outboundType: 'carrier',
        parcelPhoto: parcelPhotoName,
        warehouse,
      });
      
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit outbound');
    }
  }
);

// Slice
const carrierOutboundSlice = createSlice({
  name: 'carrierOutbound',
  initialState,
  reducers: {
    selectCarrier: (state, action) => {
      state.selectedCarrier = action.payload;
      state.numberOfParcels = action.payload.numberOfParcels;
    },
    setDriverReg: (state, action) => {
      state.driverReg = action.payload;
    },
    setNumberOfParcels: (state, action) => {
      state.numberOfParcels = action.payload;
    },
    setParcelPhoto: (state, action) => {
      state.parcelPhoto = action.payload.uri;
      state.parcelPhotoName = action.payload.name;
    },
    setSignatureImage: (state, action) => {
      state.signatureImage = action.payload.uri;
      state.signatureImageName = action.payload.name;
    },
    reset: () => initialState,
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchCarriers
      .addCase(fetchCarriers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCarriers.fulfilled, (state, action) => {
        state.carriers = action.payload;
        state.loading = false;
      })
      .addCase(fetchCarriers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // vendorCheck
      .addCase(vendorCheck.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(vendorCheck.fulfilled, (state, action) => {
        state.selectedCarrier = action.payload;
        state.loading = false;
      })
      .addCase(vendorCheck.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.selectedCarrier = null;
      })
      
      // submitOutbound
      .addCase(submitOutbound.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
        state.successMessage = null;
      })
      .addCase(submitOutbound.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.successMessage = action.payload?.data?.message || 'Outbound successfully processed';
      })
      .addCase(submitOutbound.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  selectCarrier,
  setDriverReg,
  setNumberOfParcels,
  setParcelPhoto,
  setSignatureImage,
  reset,
  clearError,
  clearSuccess,
} = carrierOutboundSlice.actions;

export default carrierOutboundSlice.reducer;