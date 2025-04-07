import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  FlatList, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { Button, Input } from '../../components/common';
import { colors, typography, spacing, shadows } from '../../utils/theme';
import { palletService } from '../../api/palletService';
import { PalletType, PalletTypeForm } from '../../types/pallet';

interface PalletTypesDialogProps {
  visible: boolean;
  onClose: () => void;
  onPalletTypesChanged: () => void;
}

const PalletTypesDialog: React.FC<PalletTypesDialogProps> = ({ 
  visible, 
  onClose,
  onPalletTypesChanged
}) => {
  const [loading, setLoading] = useState(false);
  const [palletTypes, setPalletTypes] = useState<PalletType[]>([]);
  const [form, setForm] = useState<PalletTypeForm>({
    pallet_size: '',
    length: '',
    width: '',
    weight: ''
  });
  const [error, setError] = useState<string | null>(null);

  // Load pallet types when dialog opens
  useEffect(() => {
    if (visible) {
      loadPalletTypes();
    }
  }, [visible]);

  // Load pallet types from API
  const loadPalletTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await palletService.getPalletTypes();
      setPalletTypes(data);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to load pallet types');
    }
  };

  // Update form field
  const updateField = (field: keyof PalletTypeForm, value: string) => {
    setForm({ ...form, [field]: value });
  };

  // Check if form is valid
  const isFormValid = () => {
    return (
      form.pallet_size.trim() !== '' && 
      form.length !== '' && 
      form.width !== '' && 
      form.weight !== ''
    );
  };

  // Create new pallet type
  const createPalletType = async () => {
    if (!isFormValid()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Convert numeric strings to numbers
      const formData = {
        ...form,
        length: Number(form.length),
        width: Number(form.width),
        weight: Number(form.weight)
      };
      
      await palletService.insertPalletType(formData);
      
      // Reset form and reload pallet types
      setForm({
        pallet_size: '',
        length: '',
        width: '',
        weight: ''
      });
      
      await loadPalletTypes();
      onPalletTypesChanged();
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to create pallet type');
    }
  };

  // Delete pallet type with confirmation
  const handleDeletePalletType = (id: number) => {
    Alert.alert(
      'Delete Pallet Type',
      'Are you sure you want to delete this pallet type?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await palletService.deletePalletType(id);
              await loadPalletTypes();
              onPalletTypesChanged();
              setLoading(false);
            } catch (err: any) {
              setLoading(false);
              setError(err.message || 'Failed to delete pallet type');
            }
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add Pallet Type</Text>
          
          {/* Form */}
          <View style={styles.formRow}>
            <View style={styles.formColumn}>
              <Input
                label="Pallet Size (name)"
                value={form.pallet_size}
                onChangeText={(value) => updateField('pallet_size', value)}
                containerStyle={styles.input}
              />
            </View>
            
            <View style={styles.formColumn}>
              <Input
                label="Length (cm)"
                value={form.length.toString()}
                onChangeText={(value) => updateField('length', value)}
                keyboardType="numeric"
                containerStyle={styles.input}
              />
            </View>
            
            <View style={styles.formColumn}>
              <Input
                label="Width (cm)"
                value={form.width.toString()}
                onChangeText={(value) => updateField('width', value)}
                keyboardType="numeric"
                containerStyle={styles.input}
              />
            </View>
            
            <View style={styles.formColumn}>
              <Input
                label="Weight (kg)"
                value={form.weight.toString()}
                onChangeText={(value) => updateField('weight', value)}
                keyboardType="numeric"
                containerStyle={styles.input}
              />
            </View>
          </View>
          
          <Button
            title="Create Pallet Type"
            onPress={createPalletType}
            disabled={!isFormValid() || loading}
            style={styles.createButton}
          />
          
          {error && <Text style={styles.errorText}>{error}</Text>}
          
          {/* Pallet Types List */}
          <Text style={styles.listTitle}>Existing Pallet Types</Text>
          
          {palletTypes.length === 0 ? (
            <Text style={styles.emptyText}>No pallet types found</Text>
          ) : (
            <FlatList
              data={palletTypes}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.palletTypeItem}>
                  <View style={styles.palletTypeInfo}>
                    <Text style={styles.palletTypeName}>{item.pallet_size}</Text>
                    <Text style={styles.palletTypeDimensions}>
                      {`${item.length}cm × ${item.width}cm, ${item.weight}kg`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeletePalletType(item.id)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
              style={styles.palletTypesList}
            />
          )}
          
          <Button
            title="Close"
            onPress={onClose}
            variant="outline"
            style={styles.closeButton}
          />
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
    width: '90%',
    maxHeight: '90%',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.lg,
    ...shadows.medium,
  },
  modalTitle: {
    fontSize: typography.fontSizes.large,
    fontWeight: typography.fontWeights.bold as any,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  formRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
    marginBottom: spacing.md,
  },
  formColumn: {
    flex: 1,
    minWidth: 200,
    padding: spacing.xs,
  },
  input: {
    marginBottom: 0,
  },
  createButton: {
    marginBottom: spacing.lg,
  },
  errorText: {
    color: colors.error,
    marginBottom: spacing.md,
  },
  listTitle: {
    fontSize: typography.fontSizes.medium,
    fontWeight: typography.fontWeights.bold as any,
    marginBottom: spacing.sm,
  },
  emptyText: {
    color: colors.textLight,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  palletTypesList: {
    maxHeight: 200,
    marginBottom: spacing.md,
  },
  palletTypeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  palletTypeInfo: {
    flex: 1,
  },
  palletTypeName: {
    fontSize: typography.fontSizes.medium,
    fontWeight: typography.fontWeights.medium as any,
  },
  palletTypeDimensions: {
    fontSize: typography.fontSizes.small,
    color: colors.textLight,
  },
  deleteButton: {
    padding: spacing.sm,
  },
  deleteButtonText: {
    color: colors.error,
    fontSize: typography.fontSizes.medium,
    fontWeight: typography.fontWeights.bold as any,
  },
  closeButton: {
    marginTop: spacing.md,
  },
});

export default PalletTypesDialog;