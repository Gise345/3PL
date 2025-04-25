import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  SafeAreaView,
  TextInput
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { warehouseService } from '../../api/warehouseService';
import { colors, spacing, typography, shadows } from '../../utils/theme';
import { Operator } from '../../types/warehouse';

interface OperatorSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectOperator: (operator: Operator) => void;
}

const WarehouseOperatorSelector: React.FC<OperatorSelectorProps> = ({
  visible,
  onClose,
  onSelectOperator,
}) => {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [filteredOperators, setFilteredOperators] = useState<Operator[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load operators when modal becomes visible
  useEffect(() => {
    if (visible) {
      loadOperators();
    }
  }, [visible]);

  // Filter operators when search term changes
  useEffect(() => {
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      const filtered = operators.filter(
        operator => 
          `${operator.operator_first_name} ${operator.operator_last_name}`
            .toLowerCase()
            .includes(lowercaseSearch)
      );
      setFilteredOperators(filtered);
    } else {
      setFilteredOperators(operators);
    }
  }, [searchTerm, operators]);

  // Load operators from API
  const loadOperators = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await warehouseService.getWarehouseOperators();
      setOperators(data);
      setFilteredOperators(data);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to load operators');
    }
  };

  // Handle selecting an operator
  const handleSelectOperator = (operator: Operator) => {
    onSelectOperator(operator);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={colors.background} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Operator</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search operators..."
            placeholderTextColor={colors.textLight}
            value={searchTerm}
            onChangeText={setSearchTerm}
            autoCapitalize="none"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')} style={styles.clearButton}>
              <MaterialIcons name="close" size={20} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.centeredContent}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {/* Error Message */}
        {error && (
          <View style={styles.centeredContent}>
            <MaterialIcons name="error-outline" size={48} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadOperators}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Operators List */}
        {!loading && !error && (
          <>
            {filteredOperators.length === 0 ? (
              <View style={styles.centeredContent}>
                <MaterialIcons name="search-off" size={48} color={colors.textLight} />
                <Text style={styles.noResultsText}>No operators found</Text>
                {searchTerm.length > 0 && (
                  <Text style={styles.searchTermText}>
                    No results for "{searchTerm}"
                  </Text>
                )}
              </View>
            ) : (
              <FlatList
                data={filteredOperators}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.operatorItem}
                    onPress={() => handleSelectOperator(item)}
                  >
                    <View style={styles.operatorInfo}>
                      <View style={styles.operatorAvatar}>
                        <MaterialIcons name="person" size={24} color={colors.background} />
                      </View>
                      <View style={styles.operatorDetails}>
                        <Text style={styles.operatorName}>
                          {item.operator_first_name} {item.operator_last_name}
                        </Text>
                        <Text style={styles.operatorId}>ID: {item.id}</Text>
                      </View>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color={colors.textLight} />
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.operatorsList}
              />
            )}
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    padding: spacing.md,
    ...shadows.medium,
  },
  headerTitle: {
    fontSize: typography.fontSizes.large,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.background,
  },
  closeButton: {
    padding: spacing.xs,
  },
  headerRight: {
    width: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: spacing.md,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    ...shadows.small,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: typography.fontSizes.medium,
    color: colors.text,
  },
  clearButton: {
    padding: spacing.xs,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    marginTop: spacing.md,
    fontSize: typography.fontSizes.medium,
    color: colors.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  retryButtonText: {
    color: colors.background,
    fontSize: typography.fontSizes.medium,
    fontWeight: typography.fontWeights.medium as any,
  },
  noResultsText: {
    marginTop: spacing.md,
    fontSize: typography.fontSizes.large,
    fontWeight: typography.fontWeights.medium as any,
    color: colors.text,
  },
  searchTermText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSizes.medium,
    color: colors.textLight,
  },
  operatorsList: {
    padding: spacing.md,
  },
  operatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  operatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  operatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  operatorDetails: {
    flex: 1,
  },
  operatorName: {
    fontSize: typography.fontSizes.medium,
    fontWeight: typography.fontWeights.medium as any,
    color: colors.text,
  },
  operatorId: {
    fontSize: typography.fontSizes.small,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
});

export default WarehouseOperatorSelector;