import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  Animated,
  Platform,
  StatusBar,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InboundScreenProps } from '../../navigation/types';
import { useAppSelector } from '../../hooks/useRedux';
import { inboundService } from '../../api/inboundService';
import { ModernButton } from '../../components/common';
import { Inbound } from '../../types/inbound';
import { formatDate } from '../../utils/dateUtils';

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
  success: '#4CD964',
  surface: '#F5F7FA',
  inputBackground: '#F5F7FA',
};

const ModernInboundScreen: React.FC<InboundScreenProps> = ({ navigation }) => {
  const { warehouse } = useAppSelector((state) => state.settings);
  
  // State management
  const [loading, setLoading] = useState(true);
  const [inbounds, setInbounds] = useState<Inbound[]>([]);
  const [filteredInbounds, setFilteredInbounds] = useState<Inbound[]>([]);
  const [searchPhrase, setSearchPhrase] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation values
  const [fadeIn] = useState(new Animated.Value(0));
  const [slideUp] = useState(new Animated.Value(30));
  const [titleScale] = useState(new Animated.Value(0.95));
  
  // Load inbounds on component mount and when warehouse changes
  useEffect(() => {
    getInbounds();
    
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
    navigation.navigate('InboundDetail', { inbound });
  };
  
  const handleUnknownInbound = () => {
    navigation.navigate('UnknownInbound');
  };

  // Render an individual inbound item with modern styling
  const renderInboundItem = ({ item }: { item: Inbound }) => (
    <TouchableOpacity
      style={styles.inboundItem}
      onPress={() => handleReceiveInbound(item)}
      activeOpacity={0.7}
    >
      <View style={styles.inboundHeader}>
        <Text style={styles.poNumber}>{item.poNumber}</Text>
        <View style={styles.serviceTag}>
          <Text style={styles.serviceTagText}>{item.inboundService}</Text>
        </View>
      </View>
      
      <View style={styles.inboundDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailContainer}>
            <Text style={styles.detailLabel}>Warehouse</Text>
            <Text style={styles.detailValue}>{item.warehouse}</Text>
          </View>
          
          <View style={styles.detailContainer}>
            <Text style={styles.detailLabel}>Scheduled</Text>
            <Text style={styles.detailValue}>
              {item.requestedDate} • {item.timeSlot}
            </Text>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.detailRow}>
          <View style={styles.detailContainer}>
            <Text style={styles.detailLabel}>Company</Text>
            <Text style={styles.detailValue}>{item.companyName}</Text>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.detailRow}>
          <View style={styles.detailContainer}>
            <Text style={styles.detailLabel}>Transit Type</Text>
            <Text style={styles.detailValue}>{item.transitType}</Text>
          </View>
          
          <View style={styles.detailContainer}>
            <Text style={styles.detailLabel}>Container</Text>
            <Text style={styles.detailValue}>{item.containerType}</Text>
          </View>
        </View>
        
        {(item.numberPallets || item.numberCartons) && (
          <>
            <View style={styles.divider} />
            
            <View style={styles.detailRow}>
              {item.numberPallets && (
                <View style={styles.detailContainer}>
                  <Text style={styles.detailLabel}>Pallets</Text>
                  <Text style={styles.detailValue}>{item.numberPallets}</Text>
                </View>
              )}
              
              {item.numberCartons && (
                <View style={styles.detailContainer}>
                  <Text style={styles.detailLabel}>Cartons</Text>
                  <Text style={styles.detailValue}>{item.numberCartons}</Text>
                </View>
              )}
            </View>
          </>
        )}
      </View>
      
      <ModernButton
        title="Receive Inbound"
        onPress={() => handleReceiveInbound(item)}
        variant="primary"
        size="small"
        style={styles.receiveButton}
      />
    </TouchableOpacity>
  );
  
  // Render the empty state when no results are found
  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Text style={styles.emptyStateIcon}>📦</Text>
      <Text style={styles.emptyStateTitle}>
        {searchPhrase
          ? `No results found for "${searchPhrase}"`
          : "No scheduled inbounds available"}
      </Text>
      <Text style={styles.emptyStateDescription}>
        You can process an unknown inbound delivery instead
      </Text>
      
      <ModernButton
        title="Land Unknown Inbound"
        onPress={handleUnknownInbound}
        variant="primary"
        style={styles.unknownInboundButton}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <Animated.View 
        style={[
          styles.container,
          { 
            opacity: fadeIn,
            transform: [{ translateY: slideUp }]
          }
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          
          <Animated.Text 
            style={[
              styles.headerTitle,
              { transform: [{ scale: titleScale }] }
            ]}
          >
            <Text style={styles.headerTitleText}>Inbound </Text>
            <Text style={[styles.headerTitleText, styles.warehouseText]}>({warehouse})</Text>
          </Animated.Text>
          
          <View style={styles.headerRight} />
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search PO Number..."
            value={searchPhrase}
            onChangeText={onSearchChange}
            autoCapitalize="none"
            placeholderTextColor={COLORS.textLight}
          />
        </View>
        
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <>
            {/* Inbounds List */}
            {filteredInbounds.length > 0 ? (
              <FlatList
                data={filteredInbounds}
                renderItem={renderInboundItem}
                keyExtractor={(item) => item.poNumber}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl 
                    refreshing={refreshing} 
                    onRefresh={onRefresh}
                    colors={[COLORS.primary]}
                    tintColor={COLORS.primary}
                  />
                }
              />
            ) : (
              renderEmptyState()
            )}
          </>
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
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
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: '500',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerTitleText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  warehouseText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  headerRight: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchInput: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // Add extra padding at bottom for better scrolling
  },
  inboundItem: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  inboundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  poNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  serviceTag: {
    backgroundColor: 'rgba(0, 169, 181, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  serviceTagText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  inboundDetails: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  detailContainer: {
    minWidth: '48%',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  receiveButton: {
    margin: 16,
    marginTop: 0,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 24,
  },
  unknownInboundButton: {
    width: '80%',
    marginTop: 16,
  },
});

export default ModernInboundScreen;