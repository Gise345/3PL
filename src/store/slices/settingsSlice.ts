import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { detectWarehouseFromWifi, getWifiDetails } from '../../utils/networkUtils';

interface SettingsState {
  warehouse: string;
  isTestMode: boolean;
  isWifiConnected: boolean;
  ssid: string;
  selectedPrinter: {
    name: string;
    value: string;
  } | null;
}

const initialState: SettingsState = {
  warehouse: 'TFH', // Default warehouse
  isTestMode: __DEV__, // Default to true in development
  isWifiConnected: false,
  ssid: '',
  selectedPrinter: null,
};

// Add a new async thunk to detect warehouse
export const detectWarehouse = createAsyncThunk(
  'settings/detectWarehouse',
  async (_, { dispatch }) => {
    try {
      // Get WiFi details
      const wifiDetails = await getWifiDetails();
      
      if (wifiDetails) {
        dispatch(setWifiStatus({
          connected: wifiDetails.isConnected,
          ssid: wifiDetails.ssid,
        }));
      }
      
      // Try to detect warehouse from WiFi
      const detectedWarehouse = await detectWarehouseFromWifi();
      
      if (detectedWarehouse) {
        dispatch(setWarehouse(detectedWarehouse));
        return detectedWarehouse;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to detect warehouse:', error);
      return null;
    }
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setWarehouse: (state, action: PayloadAction<string>) => {
      state.warehouse = action.payload;
    },
    setTestMode: (state, action: PayloadAction<boolean>) => {
      state.isTestMode = action.payload;
    },
    setWifiStatus: (state, action: PayloadAction<{ connected: boolean; ssid?: string }>) => {
      state.isWifiConnected = action.payload.connected;
      if (action.payload.ssid) {
        state.ssid = action.payload.ssid;
      }
    },
    setPrinter: (state, action: PayloadAction<{ name: string; value: string } | null>) => {
      state.selectedPrinter = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(detectWarehouse.fulfilled, (state, action) => {
        // The warehouse is already set via the setWarehouse action
        // This case is just for completeness
        if (action.payload) {
          console.log('Successfully detected warehouse:', action.payload);
        }
      })
      .addCase(detectWarehouse.rejected, (state, action) => {
        console.error('Failed to detect warehouse:', action.error);
      });
  },
});

export const { setWarehouse, setTestMode, setWifiStatus, setPrinter } = settingsSlice.actions;
export default settingsSlice.reducer;