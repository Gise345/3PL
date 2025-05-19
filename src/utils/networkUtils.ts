import NetInfo from '@react-native-community/netinfo';

// These are the specific SSIDs for each warehouse
const WIFI_MAPPINGS = {
  'TFH_WIFI': 'TFH',
  'TFH_STAFF': 'TFH',
  'TFH_WAREHOUSE': 'TFH',
  'RDC_WIFI': 'RDC',
  'RDC_STAFF': 'RDC',
  'RDC_WAREHOUSE': 'RDC',
};

/**
 * Detect warehouse based on connected WiFi network
 * @returns Promise resolving to detected warehouse or null
 */
export const detectWarehouseFromWifi = async (): Promise<string | null> => {
  try {
    // Get network state
    const netInfo = await NetInfo.fetch();

    // Check if connected to WiFi
    if (netInfo.type === 'wifi' && netInfo.details && netInfo.isConnected) {
      const ssid = netInfo.details.ssid;
      
      
      
      // Check if this SSID is mapped to a warehouse
      for (const [wifiName, warehouse] of Object.entries(WIFI_MAPPINGS)) {
        if (ssid && ssid.includes(wifiName)) {
          console.log('Detected warehouse from WiFi:', warehouse);
          return warehouse;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error detecting warehouse from WiFi:', error);
    return null;
  }
};

/**
 * Get WiFi connection details
 * @returns Promise resolving to WiFi details or null
 */
export const getWifiDetails = async (): Promise<{ ssid: string; isConnected: boolean } | null> => {
  try {
    const netInfo = await NetInfo.fetch();
    
    if (netInfo.type === 'wifi' && netInfo.details) {
      return {
        ssid: netInfo.details.ssid || 'Unknown',
        isConnected: !!netInfo.isConnected,
      };
    }
    
    return {
      ssid: '',
      isConnected: false,
    };
  } catch (error) {
    console.error('Error getting WiFi details:', error);
    return null;
  }
};