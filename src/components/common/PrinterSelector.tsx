import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { colors, typography, spacing } from '../../utils/theme';
import { MaterialIcons } from '@expo/vector-icons';
import Card from './Card';

export interface Printer {
  name: string;
  value: string;
}

interface PrinterSelectorProps {
  onSelectPrinter: (printer: Printer) => void;
  selectedPrinter: Printer | null;
  warehouse: string;
}

const PrinterSelector: React.FC<PrinterSelectorProps> = ({
  onSelectPrinter,
  selectedPrinter,
  warehouse,
}) => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // In a real app, this would come from the API
    // For now, we're mocking the data based on the warehouse
    const warehousePrinters = getWarehousePrinters(warehouse);
    setPrinters(warehousePrinters);
  }, [warehouse]);

  // Mock function to get printers for a specific warehouse
  const getWarehousePrinters = (warehouse: string): Printer[] => {
    switch (warehouse.toUpperCase()) {
      case 'TFH':
        return [
          { name: 'Front Door Printer', value: 'printer1' },
          { name: 'Rear Door Printer on Trade Bench', value: 'printer2' },
        ];
      case 'RDC':
        return [{ name: 'Door Printer', value: 'printer3' }];
      default:
        return [
          { name: 'Generic / Text Only', value: 'Generic / Text Only' },
          { name: 'Test Printer', value: 'test_printer' },
        ];
    }
  };

  const renderPrinterItem = ({ item }: { item: Printer }) => {
    const isSelected = selectedPrinter?.value === item.value;

    return (
      <TouchableOpacity 
        style={[styles.printerItem, isSelected && styles.selectedPrinter]} 
        onPress={() => onSelectPrinter(item)}
      >
        <Text style={[styles.printerName, isSelected && styles.selectedPrinterText]}>
          {item.name}
        </Text>
        {isSelected && (
          <MaterialIcons name="check-circle" size={24} color={colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Printers</Text>
      
      <Card style={styles.printerList}>
        {printers.length > 0 ? (
          <FlatList
            data={printers}
            renderItem={renderPrinterItem}
            keyExtractor={(item) => item.value}
            contentContainerStyle={styles.list}
          />
        ) : (
          <Text style={styles.emptyText}>No printers available for this warehouse</Text>
        )}
      </Card>
      
      {selectedPrinter && (
        <View style={styles.selectedContainer}>
          <Text style={styles.selectedText}>
            Selected Printer: <Text style={styles.selectedPrinterName}>{selectedPrinter.name}</Text>
          </Text>
        </View>
      )}
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
  printerList: {
    overflow: 'hidden',
  },
  list: {
    paddingVertical: spacing.xs,
  },
  printerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectedPrinter: {
    backgroundColor: colors.primary + '15', // 15% opacity
  },
  printerName: {
    fontSize: typography.fontSizes.medium,
    color: colors.text,
  },
  selectedPrinterText: {
    fontWeight: typography.fontWeights.medium as any,
    color: colors.primary,
  },
  emptyText: {
    textAlign: 'center',
    padding: spacing.md,
    color: colors.textLight,
  },
  selectedContainer: {
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: 4,
    backgroundColor: colors.primary + '15',
  },
  selectedText: {
    fontSize: typography.fontSizes.small,
    color: colors.text,
  },
  selectedPrinterName: {
    fontWeight: typography.fontWeights.bold as any,
    color: colors.primary,
  },
});

export default PrinterSelector;