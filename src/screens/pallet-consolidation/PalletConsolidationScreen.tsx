import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Page, Button, Input } from '../../components/common';
import { colors, typography, spacing } from '../../utils/theme';
import { palletService, PalletType, Pallet, PalletStu } from '../../api/palletService';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Clipboard } from 'react-native';

const PalletConsolidationScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [palletTypes, setPalletTypes] = useState<PalletType[]>([]);
  const [activePallet, setActivePallet] = useState<Pallet | null>(null);
  const [stuId, setStuId] = useState('');
  const [stuError, setStuError] = useState('');
  const [palletHeight, setPalletHeight] = useState('');
  const [palletIdInput, setPalletIdInput] = useState('');
  const [palletIdError, setPalletIdError] = useState('');

  useEffect(() => {
    fetchPalletTypes();
  }, []);

   const fetchPalletTypes = async () => {
    try {
      setLoading(true);
      const data = await palletService.getPalletTypes();
      setPalletTypes(data);
    } catch (error) {
      console.error('Error fetching pallet types:', error);
      Alert.alert('Error', 'Failed to load pallet types');
    } finally {
      setLoading(false);
    }
  };
  

  const handleCreatePallet = async (palletTypeId: number) => {
    try {
      setLoading(true);
      const newPallet = await palletService.insertPallet({
        pallet_type_id: palletTypeId,
        description: 'New Pallet'
      });
      setActivePallet(newPallet);
      Alert.alert('Success', `Pallet #${newPallet.id} created`);
    } catch (error) {
      Alert.alert('Error', 'Failed to create pallet');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadPallet = async () => {
    // Clear any existing error first
    setPalletIdError('');
    
    if (palletTypes.length === 0) {
      // Only use the alert for immediate visibility
      Alert.alert('Error', 'Please select a pallet size first');
      return;
    }
    
    if (!palletIdInput.trim()) {
      setPalletIdError('Pallet ID cannot be empty');
      return;
    }

    try {
      setLoading(true);
      const pallet = await palletService.getPallet(palletIdInput);
      if (pallet.closed) {
        Alert.alert('Pallet Closed', 'Would you like to reopen it?', [
          { text: 'Cancel' },
          { text: 'Reopen', onPress: () => handleReopenPallet(pallet.id) }
        ]);
      } else {
        setActivePallet(pallet);
      }
    } catch (error) {
      // Only use a simple alert instead of setting an error in the input
      Alert.alert('Error', 'Invalid Pallet ID');
    } finally {
      setLoading(false);
    }
  };

  const handleReopenPallet = async (id: number) => {
    try {
      setLoading(true);
      const updatedPallet = await palletService.updatePallet({
        id,
        closed: false
      });
      setActivePallet(updatedPallet);
      Alert.alert('Success', `Pallet #${id} reopened`);
    } catch (error) {
      Alert.alert('Error', 'Failed to reopen pallet');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStu = async () => {
    if (!stuId.trim() || !activePallet) return;
    
    try {
      setLoading(true);
      // Validate STU first
      const stuDetails = await palletService.getStuDetails(stuId);
      
      await palletService.insertPalletStu({
        pallet_id: activePallet.id,
        stu_id: stuId,
        operator_id: 1 // You should replace this with the actual operator ID from your state or context
      });
      
      const updatedPallet = await palletService.getPallet(activePallet.id);
      setActivePallet(updatedPallet);
      setStuId('');
    } catch (error) {
      setStuError('Invalid STU ID');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStu = async (palletStuId: number) => {
    try {
      setLoading(true);
      await palletService.deletePalletStu({ id: palletStuId }); // Pass as object
      // Refresh pallet data
      if (activePallet) {
        const refreshedPallet = await palletService.getPallet(activePallet.id);
        setActivePallet(refreshedPallet);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to remove STU from pallet');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFinishPallet = async () => {
    if (!activePallet || !palletHeight) return;
    
    try {
      setLoading(true);
      // Close pallet
      await palletService.updatePallet({
        id: activePallet.id,
        closed: true,
        height: palletHeight
      });
      
      // Get final summary
      const summary = await palletService.getPalletSummary(activePallet.id);
      Alert.alert(
        'Pallet Closed',
        `Weight: ${summary.pallet_weight.toFixed(2)}kg\nHeight: ${palletHeight}cm`,
        [{ text: 'OK', onPress: () => setActivePallet(null) }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to close pallet');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = async () => {
    if (!activePallet || !activePallet.palletStus || activePallet.palletStus.length === 0) {
      Alert.alert('Export Error', 'No STU data available to export');
      return;
    }
    try {
      // Add a header row
      const csvHeader = 'STU ID,Order Number\n';
      const csvContent = csvHeader + activePallet.palletStus
        .map(stu => `${stu.stu_id},${stu.order_number}`)
        .join('\n');
      
      const fileUri = FileSystem.documentDirectory + `pallet-${activePallet.id}-${Date.now()}.csv`;
      console.log('Writing CSV to:', fileUri);
      await FileSystem.writeAsStringAsync(fileUri, csvContent);
      
      if (await Sharing.isAvailableAsync()) {
        console.log('Sharing CSV file');
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export STU Data',
          UTI: 'public.comma-separated-values-text' // Add UTI for iOS
        });
      } else {
        Alert.alert('Sharing Unavailable', 'File saved but sharing is not available on this device');
      }
    } catch (error) {
      console.error('CSV export error:', error);
      Alert.alert('Export Error', 'Failed to export CSV: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const exportToExcel = async () => {
    if (!activePallet || !activePallet.palletStus || activePallet.palletStus.length === 0) {
      Alert.alert('Export Error', 'No STU data available to export');
      return;
    }
    try {
      // Add a header row
      const excelHeader = 'STU ID\tOrder Number\n';
      const excelContent = excelHeader + activePallet.palletStus
        .map(stu => `${stu.stu_id}\t${stu.order_number}`)
        .join('\n');
      
      const fileUri = FileSystem.documentDirectory + `pallet-${activePallet.id}-${Date.now()}.xls`;
      console.log('Writing Excel to:', fileUri);
      await FileSystem.writeAsStringAsync(fileUri, excelContent);
      
      if (await Sharing.isAvailableAsync()) {
        console.log('Sharing Excel file');
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/vnd.ms-excel',
          dialogTitle: 'Export STU Data',
          UTI: 'com.microsoft.excel.xls' // Add UTI for iOS
        });
      } else {
        Alert.alert('Sharing Unavailable', 'File saved but sharing is not available on this device');
      }
    } catch (error) {
      console.error('Excel export error:', error);
      Alert.alert('Export Error', 'Failed to export Excel: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const copyToClipboard = async () => {
    if (!activePallet || !activePallet.palletStus || activePallet.palletStus.length === 0) {
      Alert.alert('Copy Error', 'No STU data available to copy');
      return;
    }
    try {
      const text = activePallet.palletStus
        .map(stu => `STU ID: ${stu.stu_id} - Order: ${stu.order_number}`)
        .join('\n');
      
      Clipboard.setString(text);
      Alert.alert('Success', 'STU data copied to clipboard');
    } catch (error) {
      console.error('Clipboard error:', error);
      Alert.alert('Copy Error', 'Failed to copy data to clipboard');
    }
  };

  // Render pallet type buttons in a more mobile-friendly way
  const renderPalletTypeButtons = () => {
    if (palletTypes.length === 0) {
      return <Text style={styles.emptyText}>No pallet types available</Text>;
    }
    
    return (
      <View style={styles.palletTypesContainer}>
        {palletTypes.map(type => (
          <TouchableOpacity
            key={type.id}
            style={styles.palletTypeButton}
            onPress={() => handleCreatePallet(type.id)}
          >
            <Text style={styles.palletTypeText}>{type.pallet_size}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Page style={styles.container}>
      {!activePallet ? (
        <>
          <Text style={styles.title}>Pallet Consolidation</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select a pallet size to generate a pallet</Text>
            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              renderPalletTypeButtons()
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Load Existing Pallet</Text>
            <View style={styles.inputRow}>
              <Input
                value={palletIdInput}
                onChangeText={(text) => {
                  setPalletIdInput(text);
                  // Clear error when user types
                  if (palletIdError) setPalletIdError('');
                }}
                placeholder="Enter Pallet ID"
                error={palletIdError}
                containerStyle={styles.input}
              />
              <Button
                title="LOAD PALLET"
                onPress={handleLoadPallet}
                style={styles.loadButton}
              />
            </View>
            {palletIdError ? (
              <Text style={styles.errorText}>{palletIdError}</Text>
            ) : null}
          </View>
        </>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Pallet #{activePallet.id}</Text>
            <Button
              title="← Back"
              onPress={() => setActivePallet(null)}
              style={styles.backButton}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add STU to Pallet</Text>
            <View style={styles.inputRow}>
              <Input
                value={stuId}
                onChangeText={setStuId}
                placeholder="Scan or enter STU ID"
                error={stuError}
                containerStyle={styles.input}
              />
              <Button
                title="ADD STU TO PALLET"
                onPress={handleAddStu}
                style={styles.addButton}
              />
            </View>

            {activePallet.palletStus && activePallet.palletStus.length > 0 && (
              <>
                <View style={styles.stuTable}>
                  <View style={styles.tableHeader}>
                    <Text style={styles.headerCell}>STU ID</Text>
                    <Text style={styles.headerCell}>Order Number</Text>
                    <Text style={styles.headerCell}></Text>
                  </View>
                  <FlatList
                    data={activePallet.palletStus}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => (
                      <View style={styles.tableRow}>
                        <Text style={styles.cell}>{item.stu_id}</Text>
                        <Text style={styles.cell}>{item.order_number}</Text>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleRemoveStu(item.id)}
                        >
                          <Text style={styles.deleteIcon}>×</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  />
                </View>

                {/* Export options - only shown when STUs have been added */}
                <View style={styles.exportSection}>
                  <Text style={styles.sectionTitle}>Export Options</Text>
                  <View style={styles.exportButtonsContainer}>
                    <Button
                      title="Export as Excel"
                      onPress={exportToExcel}
                      style={styles.exportButton}
                    />
                    <Button
                      title="Export as CSV"
                      onPress={exportToCSV}
                      style={styles.exportButton}
                    />
                    <Button
                      title="Copy to Clipboard"
                      onPress={copyToClipboard}
                      style={styles.exportButton}
                    />
                  </View>
                </View>
              </>
            )}
          </View>

          {activePallet.palletStus && activePallet.palletStus.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Finish Pallet</Text>
              <Input
                value={palletHeight}
                onChangeText={setPalletHeight}
                placeholder="Enter height (cm)"
                keyboardType="numeric"
                containerStyle={styles.input}
              />
              <Button
                title="Finish Pallet"
                onPress={handleFinishPallet}
                style={styles.finishButton}
              />
            </View>
          )}
        </>
      )}
    </Page>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    color: colors.primary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  palletTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  palletTypeButton: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    margin: spacing.xs,
  },
  palletTypeText: {
    color: colors.primary,
    fontWeight: '500',
    fontSize: 16,
  },
  emptyText: {
    color: colors.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    marginRight: spacing.sm,
  },
  loadButton: {
    width: 100,
  },
  stuTable: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  headerCell: {
    flex: 1,
    fontWeight: '600',
  },
  tableRow: {
    flexDirection: 'row',
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cell: {
    flex: 1,
  },
  deleteButton: {
    padding: spacing.xs,
    width: 40,
    alignItems: 'center',
  },
  deleteIcon: {
    color: colors.error,
    fontSize: 20,
  },
  errorText: {
    color: colors.error,
    marginTop: spacing.xs,
    fontSize: 14,
  },
  finishButton: {
    marginTop: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 80,
  },
  addButton: {
    width: 80,
    marginLeft: spacing.sm,
  },
  exportSection: {
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  exportButtonsContainer: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  exportButton: {
    marginBottom: spacing.sm,
  },
});

export default PalletConsolidationScreen;