// src/screens/outbound/components/OutboundSummary.tsx

import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { Card } from '../../../components/common';
import { colors, typography, spacing } from '../../../utils/theme';

interface OutboundSummaryProps {
  orderNumbers?: string[];
  carrierName: string;
  numberOfParcels: number;
  driverReg: string;
  parcelPhoto: string | null;
}

const OutboundSummary: React.FC<OutboundSummaryProps> = ({
  orderNumbers,
  carrierName,
  numberOfParcels,
  driverReg,
  parcelPhoto,
}) => {
  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Summary</Text>
      
      {/* Order Numbers */}
      {orderNumbers && orderNumbers.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Order Number{orderNumbers.length > 1 ? 's' : ''}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.orderNumbersScroll}>
            <View style={styles.orderNumbersContainer}>
              {orderNumbers.map((orderNumber, index) => (
                <Text key={index} style={styles.orderNumber}>
                  {orderNumber}
                </Text>
              ))}
            </View>
          </ScrollView>
        </>
      )}
      
      {/* Carrier */}
      <View style={styles.row}>
        <Text style={styles.label}>Carrier:</Text>
        <Text style={styles.value}>{carrierName}</Text>
      </View>
      
      {/* Number of Parcels */}
      <View style={styles.row}>
        <Text style={styles.label}>Number of Parcels:</Text>
        <Text style={styles.value}>{numberOfParcels}</Text>
      </View>
      
      {/* Driver Registration */}
      <View style={styles.row}>
        <Text style={styles.label}>Registration:</Text>
        <Text style={styles.value}>{driverReg}</Text>
      </View>
      
      {/* Parcel Photo */}
      {parcelPhoto && (
        <>
          <Text style={styles.photoLabel}>Parcel Photo:</Text>
          <View style={styles.photoContainer}>
            <Image source={{ uri: parcelPhoto }} style={styles.photo} />
          </View>
        </>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  title: {
    fontSize: typography.fontSizes.large,
    fontWeight: typography.fontWeights.bold as any,
    marginBottom: spacing.md,
    textAlign: 'center',
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.medium,
    fontWeight: typography.fontWeights.semibold as any,
    marginBottom: spacing.xs,
  },
  orderNumbersScroll: {
    marginBottom: spacing.md,
  },
  orderNumbersContainer: {
    flexDirection: 'row',
    paddingVertical: spacing.xs,
  },
  orderNumber: {
    fontSize: typography.fontSizes.medium,
    color: colors.text,
    marginRight: spacing.md,
    backgroundColor: colors.cardActive,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontSize: typography.fontSizes.medium,
    color: colors.textLight,
    flex: 1,
  },
  value: {
    fontSize: typography.fontSizes.medium,
    fontWeight: typography.fontWeights.medium as any,
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  photoLabel: {
    fontSize: typography.fontSizes.medium,
    color: colors.textLight,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  photoContainer: {
    alignItems: 'center',
  },
  photo: {
    width: 150,
    height: 150,
    borderRadius: 4,
    resizeMode: 'cover',
  },
});

export default OutboundSummary;