import React, { useState }  from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../utils/theme';
import { CameraModal } from '../camera';
import { useCamera } from '../../../hooks';

interface PhotoCaptureProps {
  title: string;
  cameraType: 'inbound' | 'transit' | 'product' | 'mrn' | 'order-check';
  category: string;
  companyCode?: string;
  referenceNumber?: string;
  onImageCaptured?: (imageUri: string, imageName: string) => void;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  title,
  cameraType,
  category,
  companyCode,
  referenceNumber,
  onImageCaptured,
}) => {
  const {
    showCamera,
    capturedImageUri,
    uploading,
    openCamera,
    closeCamera,
    handleImageCaptured,
  } = useCamera({
    companyCode,
    referenceNumber,
    onImageCaptured,
  });

  const handleCapture = () => {
    openCamera(cameraType, category);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      {capturedImageUri ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: capturedImageUri }} style={styles.image} />
          
          <TouchableOpacity 
            style={styles.retakeButton} 
            onPress={handleCapture}
            disabled={uploading}
          >
            <MaterialIcons name="refresh" size={20} color={colors.background} />
            <Text style={styles.retakeButtonText}>Retake</Text>
          </TouchableOpacity>
          
          {uploading && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.uploadingText}>Uploading...</Text>
            </View>
          )}
        </View>
      ) : (
        <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
          <MaterialIcons name="camera-alt" size={24} color={colors.background} />
          <Text style={styles.captureButtonText}>Capture Image</Text>
        </TouchableOpacity>
      )}
      
      <CameraModal
        visible={showCamera}
        onClose={closeCamera}
        onImageCaptured={handleImageCaptured}
        category={category}
        type={cameraType}
        companyCode={companyCode}
        referenceNumber={referenceNumber}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  title: {
    fontSize: typography.fontSizes.medium,
    fontWeight: typography.fontWeights.medium as any,
    marginBottom: spacing.sm,
    color: colors.text,
  },
  captureButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: 4,
  },
  captureButtonText: {
    color: colors.background,
    marginLeft: spacing.xs,
    fontSize: typography.fontSizes.medium,
    fontWeight: typography.fontWeights.medium as any,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  retakeButton: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 4,
  },
  retakeButtonText: {
    color: colors.background,
    marginLeft: 4,
    fontSize: typography.fontSizes.small,
    fontWeight: typography.fontWeights.medium as any,
  },
  uploadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 4,
  },
  uploadingText: {
    color: colors.background,
    marginTop: spacing.xs,
    fontSize: typography.fontSizes.medium,
    fontWeight: typography.fontWeights.medium as any,
  }
});

export default PhotoCapture;
