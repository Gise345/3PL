import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
  isTestMode: false,
  isWifiConnected: false,
  ssid: '',
  selectedPrinter: null,
};

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
});

export const { setWarehouse, setTestMode, setWifiStatus, setPrinter } = settingsSlice.actions;
export default settingsSlice.reducer;