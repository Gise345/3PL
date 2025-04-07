import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { Button, Input } from '../../components/common';
import { colors, typography, spacing, shadows } from '../../utils/theme';

interface ClosePalletDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (height: string) => void;
}

const ClosePalletDialog: React.FC<ClosePalletDialogProps> = ({
  visible,
  onClose,
  onConfirm,
}) => {
  const [palletHeight, setPalletHeight] = useState('');
  const [isValid, setIsValid] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (visible) {
      setPalletHeight('');
      setIsValid(false);
    }
  }, [visible]);

  // Validate input
  useEffect(() => {
    setIsValid(palletHeight.trim() !== '' && !isNaN(Number(palletHeight)));
  }, [palletHeight]);

  // Handle confirmation
  const handleConfirm = () => {
    if (isValid) {
      onConfirm(palletHeight);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Please Confirm Pallet Height</Text>
          
          <Input
            label="Pallet Height (cm)"
            value={palletHeight}
            onChangeText={setPalletHeight}
            keyboardType="numeric"
            autoFocus={true}
            onSubmitEditing={handleConfirm}
            containerStyle={styles.input}
          />
          
          <View style={styles.buttonRow}>
            <Button
              title="Cancel"
              onPress={onClose}
              variant="outline"
              style={styles.button}
            />
            <Button
              title="Finish Pallet"
              onPress={handleConfirm}
              disabled={!isValid}
              style={styles.button}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.lg,
    ...shadows.medium,
  },
  title: {
    fontSize: typography.fontSizes.large,
    fontWeight: typography.fontWeights.bold as any,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  input: {
    marginBottom: spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
});

export default ClosePalletDialog;