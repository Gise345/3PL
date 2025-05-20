import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys for persistent settings
const STORAGE_KEYS = {
  WAREHOUSE: '@3PL_Door_App_Warehouse',
  PRINTER: '@3PL_Door_App_Printer'
};

interface SettingsState {
  warehouse: string;
  isTestMode: boolean;
  isWifiConnected: boolean;
  ssid: string;
  selectedPrinter: {
    name: string;
    value: string;
  } | null;
  availablePrinters: {
    name: string;
    value: string;
  }[];
}

const initialState: SettingsState = {
  warehouse: 'TFH', // Default warehouse
  isTestMode: __DEV__, // Default to true in development
  isWifiConnected: false,
  ssid: '',
  selectedPrinter: null,
  availablePrinters: [],
};

// Load printers based on warehouse
export const loadPrinters = createAsyncThunk(
  'settings/loadPrinters',
  async (warehouse: string, { dispatch }) => {
    try {
      console.log(`Loading printers for warehouse: ${warehouse}`);
      let printers = [];
      
      // Set printers based on warehouse
      switch (warehouse.toUpperCase()) {
        case 'TFH':
          printers = [
            { name: 'Front Door Printer', value: 'printer1' },
            { name: 'Rear Door Printer on Trade Bench', value: 'printer2' },
          ];
          break;
        case 'RDC':
          printers = [{ name: 'Door Printer', value: 'printer3' }];
          break;
        default:
          // Default printers for unknown warehouse
          printers = [{ name: 'Default Printer', value: 'default' }];
      }
      
      // Add the Generic printer in test mode
      if (__DEV__) {
        printers.push({ name: 'Generic / Text Only', value: 'Generic / Text Only' });
      }
      
      // Update the available printers in state
      dispatch(setAvailablePrinters(printers));
      
      // Try to load previously selected printer for this warehouse
      try {
        const storedPrinterString = await AsyncStorage.getItem(`${STORAGE_KEYS.PRINTER}_${warehouse}`);
        if (storedPrinterString) {
          const storedPrinter = JSON.parse(storedPrinterString);
          dispatch(setPrinter(storedPrinter));
        } else if (printers.length > 0) {
          // Default to first printer
          dispatch(setPrinter(printers[0]));
        }
      } catch (storageError) {
        console.error('Error retrieving stored printer:', storageError);
        if (printers.length > 0) {
          dispatch(setPrinter(printers[0]));
        }
      }
      
      return printers;
    } catch (error) {
      console.error('Failed to load printers:', error);
      return [];
    }
  }
);

// Initialize settings from storage
export const initializeSettings = createAsyncThunk(
  'settings/initialize',
  async (_, { dispatch }) => {
    try {
      // Load saved warehouse
      const savedWarehouse = await AsyncStorage.getItem(STORAGE_KEYS.WAREHOUSE);
      const warehouse = savedWarehouse || 'TFH';
      
      // Set warehouse in state
      dispatch(setWarehouse(warehouse));
      
      // Load printers for this warehouse
      dispatch(loadPrinters(warehouse));
      
      return warehouse;
    } catch (error) {
      console.error('Failed to initialize settings:', error);
      // Use defaults on error
      dispatch(setWarehouse('TFH'));
      dispatch(loadPrinters('TFH'));
      return 'TFH';
    }
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setWarehouse: (state, action: PayloadAction<string>) => {
      const newWarehouse = action.payload;
      state.warehouse = newWarehouse;
      
      // Save warehouse preference
      AsyncStorage.setItem(STORAGE_KEYS.WAREHOUSE, newWarehouse)
        .catch(error => console.error('Failed to save warehouse preference:', error));
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
      
      // Save selected printer for current warehouse
      if (action.payload) {
        AsyncStorage.setItem(
          `${STORAGE_KEYS.PRINTER}_${state.warehouse}`, 
          JSON.stringify(action.payload)
        ).catch(error => {
          console.error('Failed to save printer preference:', error);
        });
      }
    },
    setAvailablePrinters: (state, action: PayloadAction<{ name: string; value: string }[]>) => {
      state.availablePrinters = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle initializeSettings
      .addCase(initializeSettings.fulfilled, (state, action) => {
        console.log('Settings initialized with warehouse:', action.payload);
      })
      .addCase(initializeSettings.rejected, (state, action) => {
        console.error('Failed to initialize settings:', action.error);
      })
      // Handle loadPrinters
      .addCase(loadPrinters.fulfilled, (state, action) => {
        state.availablePrinters = action.payload;
      })
      .addCase(loadPrinters.rejected, (state, action) => {
        console.error('Failed to load printers:', action.error);
      });
  },
});

export const { 
  setWarehouse, 
  setTestMode, 
  setWifiStatus, 
  setPrinter, 
  setAvailablePrinters 
} = settingsSlice.actions;

export default settingsSlice.reducer;