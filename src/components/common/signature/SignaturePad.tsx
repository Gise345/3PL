import React, { useRef, useState } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import Signature, { SignatureViewRef }  from 'react-native-signature-canvas';
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

  // Generate signature filename
  const generateSignatureFilename = () => {
    const date = new Date();
    const day = date.toISOString().split('T')[0].split('-').join('');
    const time = ('0' + date.getHours()).slice(-2) + ('0' + date.getMinutes()).slice(-2);
    const carrierNameFormatted = carrierName.split(' ').join('-').toUpperCase();
    return `${carrierNameFormatted}-${day}_${time}-Signature.jpg`;
  };

  // Called when user completes signature
  const handleSignature = (signature: string) => {
    setSigning(false);
    if (signature.length < 100) {
      // Empty or nearly empty signature
      Alert.alert('Error', 'Please provide a valid signature');
      return;
    }

    const signatureName = generateSignatureFilename();
    onSignatureCapture(signature, signatureName);
  };

  // Handle errors
  const handleError = (error: Error) => {
    console.error('Signature error:', error);
    setSigning(false);
    Alert.alert('Error', 'Failed to capture signature');
  };

  // Clear signature pad
  const handleClear = () => {
    if (signatureRef.current) {
      signatureRef.current.clearSignature();
    }
  };

  // Accept signature
  const handleAccept = () => {
    setSigning(true);
    if (signatureRef.current) {
      signatureRef.current.readSignature();
    }
  };

  // Web and mobile styles for the signature canvas
  const style = `.m-signature-pad--footer {display: none; margin: 0px;}
  .m-signature-pad {width: 100%; height: 100%; border: none; box-shadow: none; margin: 0;}
  .m-signature-pad--body {border: none; margin: 0;}
  body,html {width: 100%; height: 100%; margin: 0;}`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver Signature</Text>
      
      <View style={styles.signaturePadContainer}>
        <Signature
          ref={signatureRef}
          onOK={handleSignature}
          onEnd={handleAccept}
          webStyle={style}
          backgroundColor={colors.background}
          penColor={colors.primary}
          imageType="image/jpeg"
          descriptionText=""
          dotSize={1}
          minWidth={2}
          maxWidth={3}
        />
      </View>
      
      <View style={styles.buttonRow}>
        <Button
          title="Clear Signature"
          onPress={handleClear}
          variant="outline"
          style={styles.button}
          icon={<MaterialIcons name="clear" size={18} color={colors.primary} />}
        />
        <Button
          title="Accept Signature"
          onPress={handleAccept}
          style={styles.button}
          loading={signing}
          icon={<MaterialIcons name="check" size={18} color={colors.background} />}
        />
      </View>
      
      <Text style={styles.instructions}>
        Please sign above with your finger and tap 'Accept Signature' when you're satisfied with your signature.
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