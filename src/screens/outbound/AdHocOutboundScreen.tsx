import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Page } from '../../components/common';
import { colors, typography, spacing } from '../../utils/theme';
import { AdHocOutboundScreenProps } from '../../navigation/types';
import { useAppSelector } from '../../hooks/useRedux';

const AdHocOutboundScreen: React.FC<AdHocOutboundScreenProps> = () => {
  const { warehouse } = useAppSelector((state) => state.settings);

  return (
    <Page 
      title={`Ad-Hoc Load Out (${warehouse})`} 
      showHeader 
      showBackButton
    >
      <View style={styles.container}>
        <Text style={styles.placeholder}>Ad-Hoc Load Out Screen - Coming Soon</Text>
        <Text style={styles.subText}>
          This screen will implement the functionality to process ad-hoc outbound shipments,
          including single order collection, multiple order collection, and dropship collection.
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

export default AdHocOutboundScreen;