import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import Signature, { SignatureViewRef } from 'react-native-signature-canvas';
import { Button } from '../';
import { colors, typography, spacing } from '../../../utils/theme';
import { MaterialIcons } from '@expo/vector-icons';

interface SignaturePadProps {
  onSignatureCapture: (signature: string, signatureName: string) => void;
  companyCode: string;
  carrierName: string;
}

const SignaturePad: React.FC<SignaturePadProps> = ({
  onSignatureCapture,
  companyCode,
  carrierName,
}) => {
  const signatureRef = useRef<SignatureViewRef | null>(null);
  const [signing, setSigning] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Generate signature filename
  const generateSignatureFilename = () => {
    const date = new Date();
    const day = date.toISOString().split('T')[0].split('-').join('');
    const time = ('0' + date.getHours()).slice(-2) + ('0' + date.getMinutes()).slice(-2);
    const carrierNameFormatted = carrierName.split(' ').join('-').toUpperCase();
    return `${carrierNameFormatted}-${day}_${time}-Signature.jpg`;
  };

  // Handle signature capture
  const handleSignature = (signature: string) => {
    setSigning(false);
    const signatureName = generateSignatureFilename();
    onSignatureCapture(signature, signatureName);
  };

  // Clear signature pad
  const handleClear = () => {
    if (signatureRef.current) {
      signatureRef.current.clearSignature();
      setHasSignature(false);
    }
  };

  // Accept signature
  const handleAccept = () => {
    if (!hasSignature) return;
    
    setSigning(true);
    if (signatureRef.current) {
      signatureRef.current.readSignature();
    }
  };

  // Handle when drawing ends
  const handleEnd = () => {
    setHasSignature(true);
  };

  // Web and mobile styles for the signature canvas
  const style = `
    .m-signature-pad--footer {display: none; margin: 0px;}
    .m-signature-pad {box-shadow: none; border: none; margin: 0px; height: 100%;}
    .m-signature-pad--body {border: none; margin: 0px; height: 100%;}
    canvas {
      width: 100%;
      height: 100%;
      ${Platform.OS === 'android' ? 'touch-action: none !important;' : ''}
    }
  `;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver Signature</Text>
      
      <View style={styles.signaturePadContainer}>
        <Signature
          ref={signatureRef}
          onOK={handleSignature}
          onEnd={handleEnd}
          webStyle={style}
          backgroundColor={colors.background}
          penColor={colors.primary}
          imageType="image/jpeg"
          androidHardwareAccelerationDisabled={Platform.OS === 'android'}
          descriptionText=""
        />
      </View>
      
      <View style={styles.buttonRow}>
        <Button
          title="Clear Signature"
          onPress={handleClear}
          variant="outline"
          style={styles.button}
        />
        <Button
          title="Accept Signature"
          onPress={handleAccept}
          style={styles.button}
          loading={signing}
          disabled={!hasSignature}
        />
      </View>
      
      <Text style={styles.instructions}>
        Please sign above with your finger and tap 'Accept Signature' when finished.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: spacing.md,
  },
  title: {
    fontSize: typography.fontSizes.medium,
    fontWeight: typography.fontWeights.medium as any,
    marginBottom: spacing.sm,
    color: colors.text,
  },
  signaturePadContainer: {
    width: '100%',
    height: 200,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  button: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  instructions: {
    fontSize: typography.fontSizes.small,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

export default SignaturePad;