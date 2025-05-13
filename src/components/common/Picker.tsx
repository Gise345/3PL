// src/components/common/Picker.tsx

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  FlatList,
  TextInput
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../utils/theme';

interface PickerItem {
  id?: string;
  value: string;
  label?: string;
}

interface PickerProps {
  items: PickerItem[] | any[];
  selectedValue: string;
  onValueChange: (value: string, index: number) => void;
  placeholder?: string;
  label?: string;
  valueKey?: string;
  labelKey?: string;
  style?: object;
}

const Picker: React.FC<PickerProps> = ({
  items,
  selectedValue,
  onValueChange,
  placeholder = 'Select an item',
  label,
  valueKey = 'value',
  labelKey = 'label',
  style,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Format items to ensure consistent structure
  const formattedItems = items.map((item, index) => {
    if (typeof item === 'object') {
      return {
        id: item.id || `item-${index}`,
        value: item[valueKey] || '',
        label: item[labelKey] || item[valueKey] || '',
      };
    } else {
      return {
        id: `item-${index}`,
        value: item,
        label: item,
      };
    }
  });

  // Get selected item label
  const getSelectedItemLabel = () => {
    const selectedItem = formattedItems.find(item => item.value === selectedValue);
    return selectedItem ? selectedItem.label : placeholder;
  };

  // Filter items based on search text
  const filteredItems = searchText
    ? formattedItems.filter(item => 
        item.label.toLowerCase().includes(searchText.toLowerCase())
      )
    : formattedItems;

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setModalVisible(true)}
      >
        <Text 
          style={[
            styles.selectedValueText,
            !selectedValue && styles.placeholderText
          ]}
          numberOfLines={1}
        >
          {getSelectedItemLabel()}
        </Text>
        <MaterialIcons name="arrow-drop-down" size={24} color={colors.textLight} />
      </TouchableOpacity>
      
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Select an option'}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              value={searchText}
              onChangeText={setSearchText}
            />
            
            <FlatList
              data={filteredItems}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.item,
                    item.value === selectedValue && styles.selectedItem
                  ]}
                  onPress={() => {
                    onValueChange(item.value, index);
                    setModalVisible(false);
                    setSearchText('');
                  }}
                >
                  <Text 
                    style={[
                      styles.itemText,
                      item.value === selectedValue && styles.selectedItemText
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.value === selectedValue && (
                    <MaterialIcons name="check" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  No items found
                </Text>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSizes.medium,
    color: colors.text,
    marginBottom: spacing.xs,
    marginLeft: spacing.sm,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: spacing.md,
    height: 48,
  },
  selectedValueText: {
    fontSize: typography.fontSizes.medium,
    color: colors.text,
    flex: 1,
  },
  placeholderText: {
    color: colors.textLight,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '70%',
    backgroundColor: colors.background,
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: typography.fontSizes.large,
    fontWeight: typography.fontWeights.medium as any,
    color: colors.text,
  },
  closeButton: {
    padding: spacing.xs,
  },
  searchInput: {
    margin: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: typography.fontSizes.medium,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectedItem: {
    backgroundColor: colors.primary + '15', // 15% opacity
  },
  itemText: {
    fontSize: typography.fontSizes.medium,
    color: colors.text,
  },
  selectedItemText: {
    fontWeight: typography.fontWeights.medium as any,
    color: colors.primary,
  },
  emptyText: {
    padding: spacing.lg,
    textAlign: 'center',
    color: colors.textLight,
    fontSize: typography.fontSizes.medium,
  },
});

export default Picker;