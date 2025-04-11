import React from 'react';
import { Modal, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import CameraCapture from './CameraCapture';
import { colors } from '../../../utils/theme';

interface CameraModalProps {
  visible: boolean;
  onClose: () => void;
  onImageCaptured: (imageUri: string, imageName: string) => void;
  category: string;
  type: string;
  companyCode?: string;
  referenceNumber?: string;
}

const CameraModal: React.FC<CameraModalProps> = ({
  visible,
  onClose,
  onImageCaptured,
  category,
  type,
  companyCode,
  referenceNumber,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <StatusBar backgroundColor={colors.actionBar} barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        <CameraCapture
          onImageCaptured={onImageCaptured}
          onCancel={onClose}
          category={category}
          type={type}
          companyCode={companyCode}
          referenceNumber={referenceNumber}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

export default CameraModal;