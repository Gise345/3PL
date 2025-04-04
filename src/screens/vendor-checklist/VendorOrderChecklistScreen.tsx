import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Page } from '../../components/common';
import { colors, typography, spacing } from '../../utils/theme';
import { VendorOrderChecklistScreenProps } from '../../navigation/types';
import { useAppSelector } from '../../hooks/useRedux';

const VendorOrderChecklistScreen: React.FC<VendorOrderChecklistScreenProps> = () => {
  const { warehouse } = useAppSelector((state) => state.settings);

  return (
    <Page 
      title={`Vendor Order Checklist (${warehouse})`} 
      showHeader 
      showBackButton
    >
      <View style={styles.container}>
        <Text style={styles.placeholder}>Vendor Order Checklist Screen - Coming Soon</Text>
        <Text style={styles.subText}>
          This screen will implement the functionality to manage vendor order checklists,
          including loading order details, completing checklist items, adding comments,
          capturing photos, and submitting quality control verifications.
        </Text>
      </View>
    </Page>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  placeholder: {
    fontSize: typography.fontSizes.large,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  subText: {
    fontSize: typography.fontSizes.medium,
    color: colors.text,
    textAlign: 'center',
  },
});

export default VendorOrderChecklistScreen;