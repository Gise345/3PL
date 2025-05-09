import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { colors, typography, spacing } from '../../utils/theme';
import { MaterialIcons } from '@expo/vector-icons';
import SignatureModal from './SignatureModal';
import { useSignature } from '../../hooks/useSignature';

interface SignatureProps {
  title: string;
  companyCode?: string;
  onSignatureCaptured?: (signatureUri: string, signatureName: string) => void;
}

const Signature: React.FC<SignatureProps> = ({
  title,
  companyCode,
  onSignatureCaptured,
}) => {
  const {
    showSignaturePad,
    capturedSignatureUri,
    uploading,
    openSignaturePad,
    closeSignaturePad,
    handleSignatureCaptured,
  } = useSignature({
    companyCode,
    onSignatureCaptured,
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      {capturedSignatureUri ? (
        <View style={styles.signatureContainer}>
          <Image source={{ uri: capturedSignatureUri }} style={styles.signature} resizeMode="contain" />
          
          <TouchableOpacity 
            style={styles.retakeButton} 
            onPress={openSignaturePad}
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
        <TouchableOpacity style={styles.captureButton} onPress={openSignaturePad}>
          <MaterialIcons name="gesture" size={24} color={colors.background} />
          <Text style={styles.captureButtonText}>Sign Here</Text>
        </TouchableOpacity>
      )}
      
      <SignatureModal
        visible={showSignaturePad}
        onClose={closeSignaturePad}
        onSignatureCapture={handleSignatureCaptured}
        title={title}
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
  signatureContainer: {
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    backgroundColor: colors.background,
    height: 150,
  },
  signature: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
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
  },
});

export default Signature;
