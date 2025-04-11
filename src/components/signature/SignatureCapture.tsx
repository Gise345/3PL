import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '../../utils/theme';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import * as FileSystem from 'expo-file-system';
import { MaterialIcons } from '@expo/vector-icons';

interface SignatureCaptureProps {
  onSignatureCapture: (path: string, signatureFileName: string) => void;
  title?: string;
}

const SignatureCapture: React.FC<SignatureCaptureProps> = ({
  onSignatureCapture,
  title = 'Sign below',
}) => {
  const signatureRef = useRef<SignatureViewRef>(null);
  const [signatureEmpty, setSignatureEmpty] = useState(true);

  const handleSignatureEnd = () => {
    setSignatureEmpty(false);
  };

  const handleClear = () => {
    signatureRef.current?.clearSignature();
    setSignatureEmpty(true);
  };

  const handleConfirm = () => {
    signatureRef.current?.readSignature();
  };

  const handleSignature = async (signature: string) => {
    try {
      // Convert base64 image to a file
      const date = new Date();
      const day = date.toISOString().split('T')[0].replace(/-/g, '');
      const time = 
        ('0' + date.getHours()).slice(-2) +
        ('0' + date.getMinutes()).slice(-2);
        
      const signatureFileName = `Signature-${day}_${time}.png`;
      
      // Remove the data:image/png;base64, part
      const base64Data = signature.split(',')[1];
      
      // Save the image to filesystem
      const filePath = `${FileSystem.documentDirectory}${signatureFileName}`;
      await FileSystem.writeAsStringAsync(filePath, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Return the file path and name
      onSignatureCapture(filePath, signatureFileName);
    } catch (error) {
      console.error('Error saving signature:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.signatureContainer}>
        <SignatureScreen
          ref={signatureRef}
          onEnd={handleSignatureEnd}
          onOK={handleSignature}
          autoClear={false}
          descriptionText=""
          webStyle={`.m-signature-pad--footer {display: none;} .m-signature-pad {border: none; box-shadow: none;} .m-signature-pad--body {border: 1px solid ${colors.border};}`}
        />
      </View>
      
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.button} onPress={handleClear}>
          <MaterialIcons name="clear" size={20} color={colors.background} />
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.confirmButton, signatureEmpty && styles.buttonDisabled]}
          onPress={handleConfirm}
          disabled={signatureEmpty}
        >
          <MaterialIcons name="check" size={20} color={colors.background} />
          <Text style={styles.buttonText}>Confirm</Text>
        </TouchableOpacity>
      </View>
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
    textAlign: 'center',
  },
  signatureContainer: {
    height: 200,
    width: '100%',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 4,
    backgroundColor: colors.background,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  button: {
    backgroundColor: colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 4,
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.background,
    marginLeft: spacing.xs,
    fontSize: typography.fontSizes.medium,
  },
});

export default SignatureCapture;