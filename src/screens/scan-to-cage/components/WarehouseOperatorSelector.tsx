import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { EmptyState } from '../../../components/common';

// Define colors to match the main theme
const COLORS = {
  background: '#F5F7FA',
  card: '#FFFFFF',
  primary: '#00A9B5',
  text: '#333333',
  textLight: '#888888',
  border: '#E0E0E0',
  shadow: 'rgba(0, 0, 0, 0.1)',
  success: '#4CD964',
};

// Operator interface
interface Operator {
  id: number;
  operator_first_name: string;
  operator_last_name: string;
}

interface WarehouseOperatorSelectorProps {
  operators: Operator[];
  onSelect: (operator: Operator) => void;
  loading: boolean;
}

const WarehouseOperatorSelector: React.FC<WarehouseOperatorSelectorProps> = ({
  operators,
  onSelect,
  loading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter operators based on search query
  const filteredOperators = searchQuery.trim() === ''
    ? operators
    : operators.filter(operator => {
        const fullName = `${operator.operator_first_name} ${operator.operator_last_name}`.toLowerCase();
        return fullName.includes(searchQuery.toLowerCase());
      });
  
  // Render each operator item
  const renderOperatorItem = ({ item }: { item: Operator }) => (
    <TouchableOpacity
      style={styles.operatorItem}
      onPress={() => onSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.operatorInfo}>
        <View style={styles.operatorAvatar}>
          <Text style={styles.avatarText}>
            {item.operator_first_name.charAt(0)}{item.operator_last_name.charAt(0)}
          </Text>
        </View>
        <View style={styles.operatorDetails}>
          <Text style={styles.operatorName}>
            {item.operator_first_name} {item.operator_last_name}
          </Text>
          <Text style={styles.operatorId}>ID: {item.id}</Text>
        </View>
      </View>
      <MaterialIcons name="chevron-right" size={24} color={COLORS.textLight} />
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Operator</Text>
      
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={COLORS.textLight} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search operator..."
          placeholderTextColor={COLORS.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <MaterialIcons name="close" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        )}
      </View>
      
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Loading operators...</Text>
        </View>
      ) : filteredOperators.length > 0 ? (
        <FlatList
          data={filteredOperators}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOperatorItem}
          style={styles.operatorList}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <EmptyState
          icon="🔍"
          title="No Operators Found"
          message={searchQuery.trim() !== '' 
            ? `No operators match "${searchQuery}"`
            : "There are no operators available."}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
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
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: COLORS.text,
  },
  clearButton: {
    padding: 4,
  },
  operatorList: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  operatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  operatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  operatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  operatorDetails: {
    flex: 1,
  },
  operatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  operatorId: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loaderText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: 16,
  }
});

export default WarehouseOperatorSelector;