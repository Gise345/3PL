import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl
} from 'react-native';
import { Page } from '../../components/common';
import { colors, typography, spacing, shadows} from '../../utils/theme';
import { InboundScreenProps } from '../../navigation/types';
import { useAppSelector } from '../../hooks/useRedux';
import { inboundService } from '../../api/inboundService';

// Define interfaces for our data
interface Inbound {
  poNumber: string;
  inboundId: string;
  companyName: string;
  companyCode: string;
  warehouse: string;
  requestedDate: string;
  timeSlot: string;
  transitType: string;
  containerType: string;
  numberPallets?: number;
  numberCartons?: number;
  inboundService: string;
  mrnRequired: boolean;
  mrn?: string;
}

const InboundScreen: React.FC<InboundScreenProps> = ({ navigation }) => {
  const { warehouse } = useAppSelector((state) => state.settings);
  const { user } = useAppSelector((state) => state.auth);
  
  // State management
  const [loading, setLoading] = useState(true);
  const [inbounds, setInbounds] = useState<Inbound[]>([]);
  const [filteredInbounds, setFilteredInbounds] = useState<Inbound[]>([]);
  const [searchPhrase, setSearchPhrase] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectMode, setSelectMode] = useState(true);
  const [selectedInbound, setSelectedInbound] = useState<Inbound | null>(null);
  
  // Scroll view ref to handle scrolling
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Load inbounds on component mount and when warehouse changes
  useEffect(() => {
    getInbounds();
  }, [warehouse]);
  
  const getInbounds = async () => {
    try {
      setLoading(true);
      const response = await inboundService.getInbounds({ warehouse });
      if (response.data && Array.isArray(response.data)) {
        setInbounds(response.data);
        setFilteredInbounds(response.data);
      }
    } catch (error) {
      console.error('Error fetching inbounds:', error);
      Alert.alert('Error', 'Failed to load inbound shipments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    getInbounds();
  };
  
  const onSearchChange = (text: string) => {
    setSearchPhrase(text);
    if (text) {
      const filtered = inbounds.filter((item) =>
        item.poNumber.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredInbounds(filtered);
    } else {
      setFilteredInbounds(inbounds);
    }
  };
  
  const handleReceiveInbound = (inbound: Inbound) => {
    setSelectedInbound(inbound);
    setSelectMode(false);
    
    // Navigate to InboundDetailScreen with the selected inbound
    navigation.navigate('InboundDetail', { inbound });
  };
  
  const handleUnknownInbound = () => {
    navigation.navigate('UnknownInbound');
  };

  // Render an individual inbound item
  const renderInboundItem = ({ item }: { item: Inbound }) => (
    <TouchableOpacity
      style={styles.inboundItem}
      onPress={() => handleReceiveInbound(item)}
    >
      <View style={styles.inboundHeader}>
        <Text style={styles.poNumber}>{item.poNumber}</Text>
        <Text style={styles.inboundService}>{item.inboundService}</Text>
      </View>
      
      <View style={styles.inboundRow}>
        <Text style={styles.inboundLabel}>Warehouse:</Text>
        <Text style={styles.inboundValue}>{item.warehouse}</Text>
        <Text style={styles.inboundDate}>{item.requestedDate}</Text>
        <Text style={styles.timeSlot}>{item.timeSlot}</Text>
      </View>
      
      <View style={styles.inboundRow}>
        <Text style={styles.inboundLabel}>Company:</Text>
        <Text style={styles.inboundValue}>{item.companyName}</Text>
      </View>
      
      <View style={styles.inboundRow}>
        <Text style={styles.inboundLabel}>Transit Type:</Text>
        <Text style={styles.inboundValue}>{item.transitType}</Text>
      </View>
      
      <View style={styles.inboundRow}>
        <Text style={styles.inboundLabel}>Container Type:</Text>
        <Text style={styles.inboundValue}>{item.containerType}</Text>
      </View>
      
      {item.numberPallets && (
        <View style={styles.inboundRow}>
          <Text style={styles.inboundLabel}>Number of Pallets:</Text>
          <Text style={styles.inboundValue}>{item.numberPallets}</Text>
        </View>
      )}
      
      {item.numberCartons && (
        <View style={styles.inboundRow}>
          <Text style={styles.inboundLabel}>Number of Cartons:</Text>
          <Text style={styles.inboundValue}>{item.numberCartons}</Text>
        </View>
      )}
      
      <TouchableOpacity 
        style={styles.receiveButton}
        onPress={() => handleReceiveInbound(item)}
      >
        <Text style={styles.receiveButtonText}>Receive Inbound</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
  
  // Render the empty state when no results are found
  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Text style={styles.emptyStateText}>
        {searchPhrase
          ? `No results found for "${searchPhrase}"`
          : "No scheduled inbounds available"}
      </Text>
      
      <TouchableOpacity
        style={styles.unknownInboundButton}
        onPress={handleUnknownInbound}
      >
        <Text style={styles.unknownInboundButtonText}>Land Unknown Inbound</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Page
      title={`Inbound (${warehouse})`}
      showHeader
      showBackButton
    >
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.container}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search PO Number..."
              value={searchPhrase}
              onChangeText={onSearchChange}
              autoCapitalize="none"
            />
          </View>
          
          {/* Inbounds List */}
          {filteredInbounds.length > 0 ? (
            <FlatList
              data={filteredInbounds}
              renderItem={renderInboundItem}
              keyExtractor={(item) => item.poNumber}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl 
                  refreshing={refreshing} 
                  onRefresh={onRefresh}
                  colors={[colors.primary]}
                />
              }
            />
          ) : (
            renderEmptyState()
          )}
        </View>
      )}
    </Page>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: typography.fontSizes.regular,
  },
  listContent: {
    padding: spacing.md,
  },
  inboundItem: {
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  inboundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  poNumber: {
    fontSize: typography.fontSizes.large,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.text,
  },
  inboundService: {
    fontSize: typography.fontSizes.medium,
    color: colors.primary,
  },
  inboundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    flexWrap: 'wrap',
  },
  inboundLabel: {
    fontSize: typography.fontSizes.medium,
    color: colors.textLight,
    marginRight: spacing.xs,
    minWidth: 120,
  },
  inboundValue: {
    fontSize: typography.fontSizes.medium,
    color: colors.text,
    flex: 1,
  },
  inboundDate: {
    fontSize: typography.fontSizes.medium,
    color: colors.textSecondary,
  },
  timeSlot: {
    fontSize: typography.fontSizes.medium,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  receiveButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  receiveButtonText: {
    color: 'white',
    fontWeight: typography.fontWeights.medium as any,
    fontSize: typography.fontSizes.medium,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyStateText: {
    fontSize: typography.fontSizes.large,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  unknownInboundButton: {
    backgroundColor: colors.secondary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    width: '80%',
  },
  unknownInboundButtonText: {
    color: 'white',
    fontWeight: typography.fontWeights.medium as any,
    fontSize: typography.fontSizes.medium,
  },
});

export default InboundScreen;