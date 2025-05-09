import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

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

interface OrderDetailsCardProps {
  details: {
    ShipAddress: {
      Name: string;
    }[];
    ShipmentId: string;
    CarrierId: string;
  };
  trackingNumber: string;
}

const OrderDetailsCard: React.FC<OrderDetailsCardProps> = ({
  details,
  trackingNumber,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="local-shipping" size={24} color={COLORS.primary} />
        <Text style={styles.headerText}>Order Details</Text>
      </View>
      
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Address Name:</Text>
          <Text style={styles.detailValue}>
            {details.ShipAddress && details.ShipAddress[0] ? details.ShipAddress[0].Name : 'N/A'}
          </Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Order Number:</Text>
          <Text style={styles.detailValue}>{details.ShipmentId || 'N/A'}</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Carrier ID:</Text>
          <Text style={styles.detailValue}>{details.CarrierId || 'N/A'}</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Tracking Number:</Text>
          <Text style={styles.detailValue}>{trackingNumber}</Text>
        </View>
      </View>
      
      <View style={styles.validationContainer}>
        <MaterialIcons name="check-circle" size={20} color={COLORS.success} />
        <Text style={styles.validationText}>Order validated and ready for cage assignment</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 169, 181, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 8,
  },
  detailsContainer: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textLight,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    flex: 2,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  validationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(76, 217, 100, 0.1)',
  },
  validationText: {
    fontSize: 12,
    color: COLORS.success,
    marginLeft: 8,
  },
});

export default OrderDetailsCard;