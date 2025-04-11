import React from 'react';
import { Modal, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import SignatureCapture from './SignatureCapture';
import { colors } from '../../utils/theme';

interface SignatureModalProps {
  visible: boolean;
  onClose: () => void;
  onSignatureCapture: (signatureUri: string, signatureName: string) => void;
  title?: string;
}

const SignatureModal: React.FC<SignatureModalProps> = ({
  visible,
  onClose,
  onSignatureCapture,
  title,
}) => {
  const handleSignatureCapture = (uri: string, fileName: string) => {
    onSignatureCapture(uri, fileName);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      transparent={false}
    >
      <StatusBar backgroundColor={colors.actionBar} barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        <SignatureCapture
          onSignatureCapture={handleSignatureCapture}
          title={title}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
});

export default SignatureModal;