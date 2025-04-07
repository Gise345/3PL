import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { Input, Button } from '../../components/common';
import { colors, typography, spacing } from '../../utils/theme';
import { PalletStu } from '../../types/pallet';
import { palletService } from '../../api/palletService';

interface PalletStuListProps {
  palletStus: PalletStu[];
  onStuRemoved: () => void;
  closed: boolean;
}

const PalletStuList: React.FC<PalletStuListProps> = ({ 
  palletStus, 
  onStuRemoved,
  closed
}) => {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Filter STUs based on search
  const filteredStus = search
    ? palletStus.filter(
        stu => 
          stu.stu_id.toLowerCase().includes(search.toLowerCase()) || 
          stu.order_number.toLowerCase().includes(search.toLowerCase())
      )
    : palletStus;

  // Handle STU removal
  const handleRemoveStu = (id: number) => {
    if (closed) {
      Alert.alert('Cannot Remove', 'This pallet is closed. You cannot remove STUs from a closed pallet.');
      return;
    }
    
    Alert.alert(
      'Remove STU',
      'Are you sure you want to remove this STU from the pallet?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await palletService.deletePalletStu(id);
              onStuRemoved();
              setLoading(false);
            } catch (err: any) {
              setLoading(false);
              Alert.alert('Error', err.message || 'Failed to remove STU');
            }
          }
        }
      ]
    );
  };

  // Group STUs by order number
  const stusByOrder = palletStus.reduce((acc, stu) => {
    if (!acc[stu.order_number]) {
      acc[stu.order_number] = [];
    }
    acc[stu.order_number].push(stu);
    return acc;
  }, {} as Record<string, PalletStu[]>);

  const orderNumbers = Object.keys(stusByOrder);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>STUs on Pallet</Text>
      <Text style={styles.count}>
        Total STUs: {palletStus.length} | Orders: {orderNumbers.length}
      </Text>
      
      <Input
        value={search}
        onChangeText={setSearch}
        placeholder="Search by STU ID or Order Number"
        containerStyle={styles.searchContainer}
      />
      
      {palletStus.length === 0 ? (
        <Text style={styles.emptyText}>No STUs on this pallet</Text>
      ) : (
        <>
          <View style={styles.headerRow}>
            <Text style={[styles.headerCell, styles.stuIdCell]}>STU ID</Text>
            <Text style={[styles.headerCell, styles.orderNumberCell]}>Order Number</Text>
            {!closed && <Text style={[styles.headerCell, styles.actionCell]}>Action</Text>}
          </View>
          
          <FlatList
            data={filteredStus}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Text style={[styles.cell, styles.stuIdCell]}>{item.stu_id}</Text>
                <Text style={[styles.cell, styles.orderNumberCell]}>{item.order_number}</Text>
                {!closed && (
                  <TouchableOpacity
                    style={[styles.cell, styles.actionCell]}
                    onPress={() => handleRemoveStu(item.id)}
                    disabled={loading}
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            style={styles.list}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSizes.large,
    fontWeight: typography.fontWeights.bold as any,
    marginBottom: spacing.xs,
  },
  count: {
    fontSize: typography.fontSizes.small,
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  searchContainer: {
    marginBottom: spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textLight,
    marginVertical: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.xs,
    marginBottom: spacing.xs,
  },
  headerCell: {
    fontWeight: typography.fontWeights.bold as any,
    fontSize: typography.fontSizes.small,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cell: {
    fontSize: typography.fontSizes.small,
    paddingRight: spacing.xs,
  },
  stuIdCell: {
    flex: 1,
  },
  orderNumberCell: {
    flex: 2,
  },
  actionCell: {
    width: 70,
    alignItems: 'center',
  },
  removeText: {
    color: colors.error,
  },
  list: {
    maxHeight: 300,
  },
});

export default PalletStuList;