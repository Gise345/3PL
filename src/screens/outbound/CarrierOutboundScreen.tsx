import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Page } from '../../components/common';
import { colors, typography, spacing } from '../../utils/theme';
import { CarrierOutboundScreenProps } from '../../navigation/types';
import { useAppSelector } from '../../hooks/useRedux';

const CarrierOutboundScreen: React.FC<CarrierOutboundScreenProps> = () => {
  const { warehouse } = useAppSelector((state) => state.settings);

  return (
    <Page 
      title={`Carrier Load Out (${warehouse})`} 
      showHeader 
      showBackButton
    >
      <View style={styles.container}>
        <Text style={styles.placeholder}>Carrier Load Out Screen - Coming Soon</Text>
        <Text style={styles.subText}>
          This screen will implement the functionality to process outbound carrier shipments.
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

export default CarrierOutboundScreen;