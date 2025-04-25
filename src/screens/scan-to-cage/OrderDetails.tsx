import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../../components/common';
import { colors, spacing, typography } from '../../utils/theme';
import { MaterialIcons } from '@expo/vector-icons';

interface OrderDetailsProps {
  orderDetails: {
    ShipmentId: string;
    CarrierId: string;
    ShipAddress: Array<{
      Name: string;
      Address1?: string;
      City?: string;
      PostCode?: string;
      Country?: string;
    }>;
  };
  trackingNumber: string;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ orderDetails, trackingNumber }) => {
  if (!orderDetails) return null;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <MaterialIcons name="local-shipping" size={24} color={colors.primary} style={styles.icon} />
        <Text style={styles.headerText}>Order Details</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Order Number:</Text>
        <Text style={styles.detailValue}>{orderDetails.ShipmentId || 'N/A'}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Carrier ID:</Text>
        <Text style={styles.detailValue}>{orderDetails.CarrierId || 'N/A'}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Tracking Number:</Text>
        <Text style={styles.detailValue}>{trackingNumber}</Text>
      </View>

      {orderDetails.ShipAddress && orderDetails.ShipAddress.length > 0 && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Ship To:</Text>
          <Text style={styles.detailValue}>
            {orderDetails.ShipAddress[0].Name || 'N/A'}
          </Text>
        </View>
      )}

      {orderDetails.ShipAddress && 
       orderDetails.ShipAddress.length > 0 && 
       orderDetails.ShipAddress[0].Address1 && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Address:</Text>
          <Text style={styles.detailValue}>
            {`${orderDetails.ShipAddress[0].Address1 || ''}, ${orderDetails.ShipAddress[0].City || ''}, ${orderDetails.ShipAddress[0].PostCode || ''}`}
          </Text>
        </View>
      )}

      <View style={styles.validationStatus}>
        <MaterialIcons name="check-circle" size={20} color={colors.success} />
        <Text style={styles.validationText}>Order verified</Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  icon: {
    marginRight: spacing.sm,
  },
  headerText: {
    fontSize: typography.fontSizes.large,
    fontWeight: typography.fontWeights.medium as any,
    color: colors.text,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    width: 120,
    fontSize: typography.fontSizes.medium,
    fontWeight: typography.fontWeights.medium as any,
    color: colors.textLight,
  },
  detailValue: {
    flex: 1,
    fontSize: typography.fontSizes.medium,
    color: colors.text,
  },
  validationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  validationText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSizes.medium,
    color: colors.success,
  },
});

export default OrderDetails;