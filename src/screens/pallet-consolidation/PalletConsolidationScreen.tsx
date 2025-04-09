import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Animated,
  Platform,
  ScrollView,
  StatusBar
} from 'react-native';
import { Page, Button, Input } from '../../components/common';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Clipboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palletService, PalletType, Pallet, PalletStu } from '../../api/palletService';

// Define modern color palette with teal primary color to match other screens
const COLORS = {
  background: '#F5F7FA',
  card: '#FFFFFF',
  cardActive: '#F0F9F6',
  primary: '#00A9B5', // Teal color matching login screen
  secondary: '#333333',
  accent: '#ff6f00',
  text: '#333333',
  textLight: '#888888',
  border: '#E0E0E0',
  shadow: 'rgba(0, 0, 0, 0.1)',
  error: '#ff3b30',
  success: '#4CD964',
  surface: '#F5F7FA',
  inputBackground: '#F5F7FA',
};

const PalletConsolidationScreen: React.FC = () => {
  // State management
  const [loading, setLoading] = useState(false);
  const [palletTypes, setPalletTypes] = useState<PalletType[]>([]);
  const [activePallet, setActivePallet] = useState<Pallet | null>(null);
  const [stuId, setStuId] = useState('');
  const [stuError, setStuError] = useState('');
  const [palletHeight, setPalletHeight] = useState('');
  const [palletIdInput, setPalletIdInput] = useState('');
  const [palletIdError, setPalletIdError] = useState('');
  
  // Animation values
  const [fadeIn] = useState(new Animated.Value(0));
  const [slideUp] = useState(new Animated.Value(30));
  const [titleScale] = useState(new Animated.Value(0.95));

  useEffect(() => {
    fetchPalletTypes();
    
    // Animate components on mount
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(titleScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
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
      
      // Success notification
      Alert.alert(
        'Success', 
        `Pallet #${newPallet.id} created successfully`,
        [{ text: 'OK' }]
      );
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
        Alert.alert(
          'Pallet Closed', 
          'This pallet is closed. Would you like to reopen it?', 
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Reopen', onPress: () => handleReopenPallet(pallet.id) }
          ]
        );
      } else {
        setActivePallet(pallet);
      }
    } catch (error) {
      setPalletIdError('Invalid Pallet ID');
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
    // Clear error first
    setStuError('');
    
    if (!stuId.trim() || !activePallet) {
      setStuError('STU ID cannot be empty');
      return;
    }
    
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
    if (!activePallet) return;
    
    if (!palletHeight.trim()) {
      Alert.alert('Validation Error', 'Please enter pallet height');
      return;
    }
    
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
        'Pallet Closed Successfully',
        `Pallet ID: ${activePallet.id}\nWeight: ${summary.pallet_weight.toFixed(2)}kg\nHeight: ${palletHeight}cm`,
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

  // Render pallet type buttons in a modern styled way
  const renderPalletTypeButtons = () => {
    if (palletTypes.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyText}>No pallet types available</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.palletTypesContainer}>
        {palletTypes.map(type => (
          <TouchableOpacity
            key={type.id}
            style={styles.palletTypeButton}
            onPress={() => handleCreatePallet(type.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.palletTypeEmoji}>📦</Text>
            <Text style={styles.palletTypeText}>{type.pallet_size}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.container,
            { 
              opacity: fadeIn,
              transform: [{ translateY: slideUp }]
            }
          ]}
        >
          {!activePallet ? (
            // Select or Load Pallet View
            <>
              <Animated.View style={{ transform: [{ scale: titleScale }] }}>
                <Text style={styles.headerTitle}>
                  <Text style={styles.headerTitleText}>Pallet </Text>
                  <Text style={[styles.headerTitleText, styles.headerTitleAccent]}>Consolidation</Text>
                </Text>
              </Animated.View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Create New Pallet</Text>
                <Text style={styles.sectionDescription}>Select a pallet size to generate a new pallet</Text>
                
                {loading && !palletTypes.length ? (
                  <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
                ) : (
                  renderPalletTypeButtons()
                )}
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Load Existing Pallet</Text>
                <Text style={styles.sectionDescription}>Enter a pallet ID to load an existing pallet</Text>
                
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
                    inputStyle={styles.inputField}
                  />
                  <Button
                    title="LOAD"
                    onPress={handleLoadPallet}
                    style={styles.loadButton}
                  />
                </View>
              </View>
            </>
          ) : (
            // Active Pallet View
            <>
              <View style={styles.header}>
                <Text style={styles.palletInfoTitle}>
                  Pallet #{activePallet.id}
                </Text>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setActivePallet(null)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Add STU to Pallet</Text>
                <Text style={styles.sectionDescription}>Scan or enter a STU ID to add to this pallet</Text>
                
                <View style={styles.inputRow}>
                  <Input
                    value={stuId}
                    onChangeText={(text) => {
                      setStuId(text);
                      if (stuError) setStuError('');
                    }}
                    placeholder="Scan or enter STU ID"
                    error={stuError}
                    containerStyle={styles.input}
                    inputStyle={styles.inputField}
                  />
                  <Button
                    title="ADD"
                    onPress={handleAddStu}
                    style={styles.addButton}
                  />
                </View>
              </View>

              {activePallet.palletStus && activePallet.palletStus.length > 0 ? (
                <>
                  <View style={styles.card}>
                    <View style={styles.stuHeaderRow}>
                      <Text style={styles.sectionTitle}>STU List</Text>
                      <Text style={styles.stuCount}>
                        {activePallet.palletStus.length} {activePallet.palletStus.length === 1 ? 'item' : 'items'}
                      </Text>
                    </View>
                    
                    <View style={styles.stuTable}>
                      <View style={styles.tableHeader}>
                        <Text style={styles.headerCell}>STU ID</Text>
                        <Text style={styles.headerCell}>Order #</Text>
                        <Text style={[styles.headerCell, styles.actionCell]}></Text>
                      </View>
                      
                      {activePallet.palletStus.map((item) => (
                        <View key={item.id.toString()} style={styles.tableRow}>
                          <Text style={styles.cell}>{item.stu_id}</Text>
                          <Text style={styles.cell}>{item.order_number || '-'}</Text>
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleRemoveStu(item.id)}
                          >
                            <Text style={styles.deleteIcon}>×</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Export Options</Text>
                    <Text style={styles.sectionDescription}>Export STU data in different formats</Text>
                    
                    <View style={styles.exportButtonsContainer}>
                      <TouchableOpacity 
                        style={styles.exportButton} 
                        onPress={exportToExcel}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.exportButtonIcon}>📊</Text>
                        <Text style={styles.exportButtonText}>Excel</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.exportButton} 
                        onPress={exportToCSV}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.exportButtonIcon}>📄</Text>
                        <Text style={styles.exportButtonText}>CSV</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.exportButton} 
                        onPress={copyToClipboard}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.exportButtonIcon}>📋</Text>
                        <Text style={styles.exportButtonText}>Copy</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Finish Pallet</Text>
                    <Text style={styles.sectionDescription}>Enter height measurement and complete this pallet</Text>
                    
                    <Input
                      value={palletHeight}
                      onChangeText={setPalletHeight}
                      placeholder="Enter height (cm)"
                      keyboardType="numeric"
                      containerStyle={styles.heightInput}
                      inputStyle={styles.inputField}
                    />
                    
                    <Button
                      title="FINISH PALLET"
                      onPress={handleFinishPallet}
                      style={styles.finishButton}
                    />
                  </View>
                </>
              ) : (
                <View style={styles.card}>
                  <View style={styles.emptyStateContainer}>
                    <Text style={styles.emptyStateIcon}>📦</Text>
                    <Text style={styles.emptyStateTitle}>No STUs Added Yet</Text>
                    <Text style={styles.emptyStateDescription}>
                      Use the field above to scan or enter STU IDs and add them to this pallet.
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}
          
          {loading && (
            <View style={styles.overlayLoader}>
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loaderText}>Loading...</Text>
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollViewContent: {
    paddingBottom: 40,
  },
  container: {
    padding: 20,
  },
  headerTitle: {
    marginBottom: 20,
    marginTop: 10,
  },
  headerTitleText: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  headerTitleAccent: {
    color: COLORS.primary,
    textShadowColor: 'rgba(0, 169, 181, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 20,
  },
  palletTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  palletTypeButton: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    marginBottom: 10,
    minWidth: 100,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  palletTypeEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  palletTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    marginRight: 10,
    marginBottom: 0,
  },
  inputField: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 8,
    borderWidth: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  loadButton: {
    width: 80,
    borderRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  palletInfoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  backButton: {
    backgroundColor: COLORS.background,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  addButton: {
    width: 80,
    borderRadius: 8,
  },
  stuHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  stuCount: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '500',
    backgroundColor: COLORS.background,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  stuTable: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerCell: {
    flex: 1,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  actionCell: {
    flex: 0,
    width: 50,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  cell: {
    flex: 1,
    fontSize: 14,
  },
  deleteButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIcon: {
    color: COLORS.error,
    fontSize: 20,
    fontWeight: 'bold',
  },
  exportButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  exportButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 5,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  exportButtonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  heightInput: {
    marginBottom: 20,
  },
  finishButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  emptyText: {
    color: COLORS.textLight,
    fontSize: 14,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyStateIcon: {
    fontSize: 40,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    maxWidth: '80%',
  },
  overlayLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loaderContainer: {
    backgroundColor: COLORS.card,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  loaderText: {
    marginTop: 12,
    color: COLORS.text,
    fontWeight: '600',
  },
  loader: {
    marginVertical: 30,
  },
});

export default PalletConsolidationScreen;