import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Page, Button, Input } from '../../components/common';
import { colors, typography, spacing } from '../../utils/theme';
import { PalletConsolidationScreenProps } from '../../navigation/types';
import { useAppSelector } from '../../hooks/useRedux';

const PalletConsolidationScreen: React.FC<PalletConsolidationScreenProps> = () => {
  const { warehouse } = useAppSelector((state) => state.settings);
  const [loading, setLoading] = useState(false);

  return (
    <Page 
      title={`Pallet Consolidation (${warehouse})`} 
      showHeader 
      showBackButton
    >
      <View style={styles.container}>
        <Text style={styles.title}>Pallet Consolidation</Text>
        <Text style={styles.subtitle}>
          This screen will allow you to manage pallets, including:
        </Text>
        <View style={styles.featureList}>
          <Text style={styles.featureItem}>• Selecting warehouse operators</Text>
          <Text style={styles.featureItem}>• Creating new pallets</Text>
          <Text style={styles.featureItem}>• Loading existing pallets</Text>
          <Text style={styles.featureItem}>• Adding STUs to pallets</Text>
          <Text style={styles.featureItem}>• Closing and generating labels for pallets</Text>
        </View>
        
        <Text style={styles.placeholder}>Coming soon in Phase 2 of development</Text>
      </View>
    </Page>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.fontSizes.xlarge,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.fontSizes.medium,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  featureList: {
    alignSelf: 'flex-start',
    marginVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    width: '100%',
  },
  featureItem: {
    fontSize: typography.fontSizes.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  placeholder: {
    marginTop: spacing.lg,
    fontSize: typography.fontSizes.medium,
    color: colors.textLight,
    fontStyle: 'italic',
  },
});

export default PalletConsolidationScreen;