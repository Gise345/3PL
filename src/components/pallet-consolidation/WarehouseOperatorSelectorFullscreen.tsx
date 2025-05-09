import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { Page } from '../../components/common';
import { colors, typography, spacing, shadows } from '../../utils/theme';
import { palletService } from '../../api/palletService';
import { Operator } from '../../types/pallet';

interface WarehouseOperatorSelectorFullscreenProps {
  onSelectOperator: (operator: Operator) => void;
  onCancel: () => void;
}

const WarehouseOperatorSelectorFullscreen: React.FC<WarehouseOperatorSelectorFullscreenProps> = ({ 
  onSelectOperator, 
  onCancel
}) => {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [filteredOperators, setFilteredOperators] = useState<Operator[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load operators on component mount
  useEffect(() => {
    loadOperators();
  }, []);

  // Filter operators when search changes
  useEffect(() => {
    if (search) {
      const lowercaseSearch = search.toLowerCase();
      const filtered = operators.filter(
        op => 
          op.operator_first_name.toLowerCase().includes(lowercaseSearch) || 
          op.operator_last_name.toLowerCase().includes(lowercaseSearch)
      );
      setFilteredOperators(filtered);
    } else {
      setFilteredOperators(operators);
    }
  }, [search, operators]);

  // Load operators from API
  const loadOperators = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await palletService.getWarehouseOperators();
      setOperators(data);
      setFilteredOperators(data);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to load operators');
    }
  };

  return (
    <Page
      title="Select Operator"
      showHeader
      showBackButton
      onBackPress={onCancel}
      loading={loading}
    >
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search operators..."
            placeholderTextColor={colors.textLight}
          />
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : filteredOperators.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {search ? `No operators found matching "${search}"` : "No operators available"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredOperators}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.operatorItem}
                onPress={() => onSelectOperator(item)}
              >
                <Text style={styles.operatorName}>
                  {`${item.operator_first_name} ${item.operator_last_name}`}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </Page>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: typography.fontSizes.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  operatorItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  operatorName: {
    fontSize: typography.fontSizes.large,
    color: colors.text,
  },
  errorContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSizes.medium,
    textAlign: 'center',
  },
  emptyContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textLight,
    fontSize: typography.fontSizes.medium,
    textAlign: 'center',
  },
});

export default WarehouseOperatorSelectorFullscreen;