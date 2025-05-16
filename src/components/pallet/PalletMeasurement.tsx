// src/components/pallet/PalletMeasurement.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../utils/theme';
import * as Sensors from 'expo-sensors';

interface PalletMeasurementProps {
  onMeasurementComplete: (height: number) => void;
}

const { width, height: screenHeight } = Dimensions.get('window');

const PalletMeasurement: React.FC<PalletMeasurementProps> = ({ onMeasurementComplete }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [measuring, setMeasuring] = useState(false);
  const [measurementResult, setMeasurementResult] = useState<number | null>(null);
  
  // Gyroscope data for measurement
  const [{ x, y, z }, setGyroData] = useState({ x: 0, y: 0, z: 0 });
  const [subscription, setSubscription] = useState<any>(null);
  
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();

  // Request camera permissions
  useEffect(() => {
    (async () => {
      if (permission) {
        setHasPermission(permission.granted);
      } else {
        const permissionResult = await requestPermission();
        setHasPermission(permissionResult.granted);
      }
    })();
  }, [permission, requestPermission]);

  // Clean up subscription when component unmounts
  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, []);

  const openCamera = () => {
    setModalVisible(true);
    setMeasuring(false);
    setMeasurementResult(null);
  };

  const closeCamera = () => {
    unsubscribe();
    setModalVisible(false);
  };

  // Subscribe to gyroscope data
  const subscribe = () => {
    Sensors.Gyroscope.setUpdateInterval(100); // Update every 100ms
    setSubscription(
      Sensors.Gyroscope.addListener(gyroscopeData => {
        setGyroData(gyroscopeData);
      })
    );
  };

  // Unsubscribe from gyroscope data
  const unsubscribe = () => {
    subscription && subscription.remove();
    setSubscription(null);
  };

  const startMeasuring = () => {
    setMeasuring(true);
    // Start tracking gyroscope data
    subscribe();
    
    // Simulate measuring with a timer (would be replaced with actual AR measurement in production)
    setTimeout(() => {
      // Generate a realistic pallet height between 80cm and 200cm
      // In a real implementation, this would use the camera and sensors to detect the pallet height
      // This is just a simulation for demonstration purposes
      const randomHeight = Math.floor(80 + Math.random() * 120);
      setMeasurementResult(randomHeight);
      setMeasuring(false);
      unsubscribe();
    }, 2000);
  };

  const confirmMeasurement = () => {
    if (measurementResult !== null) {
      onMeasurementComplete(measurementResult);
      closeCamera();
    }
  };

  const retryMeasurement = () => {
    setMeasuring(false);
    setMeasurementResult(null);
  };

  if (hasPermission === null) {
    return <View />;
  }

  if (hasPermission === false) {
    return (
      <TouchableOpacity 
        style={styles.measureButton}
        onPress={() => Alert.alert('Permission Required', 'Camera permission is needed to measure pallets.')}
      >
        <MaterialIcons name="straighten" size={20} color="white" />
        <Text style={styles.measureButtonText}>Measure Height</Text>
      </TouchableOpacity>
    );
  }

  return (
    <>
      <TouchableOpacity style={styles.measureButton} onPress={openCamera}>
        <MaterialIcons name="straighten" size={20} color="white" />
        <Text style={styles.measureButtonText}>Measure Height</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={closeCamera}
      >
        <View style={styles.modalContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
          >
            <View style={styles.overlay}>
              {/* Guide lines for measurement */}
              <View style={styles.guideBox}>
                <View style={styles.horizontalLine} />
                <View style={styles.verticalLine} />
              </View>

              {/* Instructions */}
              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionText}>
                  Position the camera to capture the full height of the pallet
                </Text>
              </View>

              {/* Gyroscope data indicator (for debugging) */}
              {__DEV__ && (
                <View style={styles.debugContainer}>
                  <Text style={styles.debugText}>
                    Gyro: x={x.toFixed(2)}, y={y.toFixed(2)}, z={z.toFixed(2)}
                  </Text>
                </View>
              )}

              {/* Results or measuring indicator */}
              <View style={styles.resultsContainer}>
                {measuring ? (
                  <View style={styles.measuringContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.measuringText}>Measuring...</Text>
                  </View>
                ) : measurementResult ? (
                  <View style={styles.resultContainer}>
                    <Text style={styles.resultText}>
                      Height: {measurementResult} cm
                    </Text>
                    <View style={styles.resultButtonsContainer}>
                      <TouchableOpacity 
                        style={[styles.resultButton, styles.retryButton]} 
                        onPress={retryMeasurement}
                      >
                        <Text style={styles.resultButtonText}>Retry</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.resultButton, styles.confirmButton]} 
                        onPress={confirmMeasurement}
                      >
                        <Text style={styles.resultButtonText}>Confirm</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.captureButton} 
                    onPress={startMeasuring}
                  >
                    <Text style={styles.captureButtonText}>Measure</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Header with close button */}
              <View style={styles.headerContainer}>
                <TouchableOpacity 
                  style={styles.closeButton} 
                  onPress={closeCamera}
                >
                  <MaterialIcons name="close" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Measure Pallet Height</Text>
                <View style={{ width: 40 }} />
              </View>
            </View>
          </CameraView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  measureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  measureButtonText: {
    color: 'white',
    fontWeight: typography.fontWeights.medium as any,
    marginLeft: spacing.xs,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerText: {
    color: 'white',
    fontSize: typography.fontSizes.large,
    fontWeight: typography.fontWeights.bold as any,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideBox: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    top: '50%',
    left: '50%',
    marginTop: -(width * 0.7) / 2,
    marginLeft: -(width * 0.7) / 2,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 8,
  },
  horizontalLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    top: '50%',
  },
  verticalLine: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    left: '50%',
  },
  instructionsContainer: {
    position: 'absolute',
    top: '10%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  instructionText: {
    color: 'white',
    fontSize: typography.fontSizes.medium,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: spacing.sm,
    borderRadius: 8,
  },
  debugContainer: {
    position: 'absolute',
    top: '20%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  debugText: {
    color: 'white',
    fontSize: typography.fontSizes.small,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: spacing.xs,
    borderRadius: 4,
  },
  resultsContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonText: {
    color: 'white',
    fontWeight: typography.fontWeights.bold as any,
  },
  measuringContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  measuringText: {
    color: 'white',
    marginTop: spacing.sm,
    fontSize: typography.fontSizes.medium,
  },
  resultContainer: {
    width: '80%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  resultText: {
    color: 'white',
    fontSize: typography.fontSizes.large,
    fontWeight: typography.fontWeights.bold as any,
    marginBottom: spacing.md,
  },
  resultButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  resultButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  retryButton: {
    backgroundColor: colors.textLight,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  resultButtonText: {
    color: 'white',
    fontWeight: typography.fontWeights.medium as any,
  },
});

export default PalletMeasurement;