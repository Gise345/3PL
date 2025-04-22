import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CameraView, Camera } from 'expo-camera';

// Define colors to match the main theme
const COLORS = {
  background: '#F5F7FA',
  card: '#FFFFFF',
  primary: '#00A9B5',
  text: '#333333',
  textLight: '#888888',
  border: '#E0E0E0',
  shadow: 'rgba(0, 0, 0, 0.1)',
  error: '#ff3b30',
};

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onBarcodeScanned: (barcode: string) => void;
  title?: string;
}

const { width } = Dimensions.get('window');
const finderWidth = width * 0.7;
const finderHeight = finderWidth * 0.7;
const viewFinderBorderWidth = 2;

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  visible,
  onClose,
  onBarcodeScanned,
  title = 'Scan Barcode',
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [flash, setFlash] = useState(false);

  // Request camera permissions when modal is shown
  useEffect(() => {
    if (visible) {
      (async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
      })();
    }

    // Reset state when modal is closed
    return () => {
      setScanned(false);
      setFlash(false);
    };
  }, [visible]);

  // Handle barcode scanning
  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    onBarcodeScanned(data);
  };

  // Toggle flash
  const toggleFlash = () => {
    setFlash(!flash);
  };

  // Render content based on permission state
  const renderContent = () => {
    if (hasPermission === null) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.permissionText}>Requesting camera permission...</Text>
        </View>
      );
    }

    if (hasPermission === false) {
      return (
        <View style={styles.centerContainer}>
          <MaterialIcons name="no-photography" size={64} color="white" />
          <Text style={styles.permissionText}>No access to camera</Text>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.scannerContainer}>
        <CameraView
          style={styles.scanner}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: [
              'code39', 'code93', 'code128',
              'datamatrix', 'ean8', 'qr',
              'ean13', 'itf14', 'pdf417',
              'upc_a', 'upc_e', 'codabar',
              'aztec'
            ],
          }}
          facing={flash ? 'front' : 'back'}
          enableTorch={flash}
        >
          <View style={styles.overlay}>
            <View style={styles.unfocusedContainer} />
            <View style={styles.middleContainer}>
              <View style={styles.unfocusedContainer} />
              <View style={styles.focusedContainer}>
                <View style={styles.cornerTopLeft} />
                <View style={styles.cornerTopRight} />
                <View style={styles.cornerBottomLeft} />
                <View style={styles.cornerBottomRight} />
              </View>
              <View style={styles.unfocusedContainer} />
            </View>
            <View style={styles.unfocusedContainer}>
              <Text style={styles.scanText}>Align barcode within frame</Text>
            </View>
          </View>
        </CameraView>

        {/* Flash toggle button */}
        <TouchableOpacity style={styles.flashButton} onPress={toggleFlash}>
          <MaterialIcons 
            name={flash ? "flash-on" : "flash-off"} 
            size={24} 
            color="white" 
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialIcons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerRight} />
        </View>
        {renderContent()}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  headerRight: {
    width: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    color: 'white',
    marginTop: 16,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  scanner: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  unfocusedContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleContainer: {
    flexDirection: 'row',
    height: finderHeight,
  },
  focusedContainer: {
    width: finderWidth,
    height: finderHeight,
  },
  scanText: {
    color: 'white',
    fontSize: 14,
    marginTop: 20,
    fontWeight: '500',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 20,
    height: 20,
    borderTopWidth: viewFinderBorderWidth,
    borderLeftWidth: viewFinderBorderWidth,
    borderColor: COLORS.primary,
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 20,
    height: 20,
    borderTopWidth: viewFinderBorderWidth,
    borderRightWidth: viewFinderBorderWidth,
    borderColor: COLORS.primary,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 20,
    height: 20,
    borderBottomWidth: viewFinderBorderWidth,
    borderLeftWidth: viewFinderBorderWidth,
    borderColor: COLORS.primary,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderBottomWidth: viewFinderBorderWidth,
    borderRightWidth: viewFinderBorderWidth,
    borderColor: COLORS.primary,
  },
  flashButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BarcodeScannerModal;
