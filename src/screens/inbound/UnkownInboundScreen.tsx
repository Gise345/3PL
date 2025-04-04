import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Page } from '../../components/common';
import { colors, typography, spacing } from '../../utils/theme';
import { UnknownInboundScreenProps } from '../../navigation/types';
import { useAppSelector } from '../../hooks/useRedux';

const UnknownInboundScreen: React.FC<UnknownInboundScreenProps> = () => {
  const { warehouse } = useAppSelector((state) => state.settings);

  return (
    <Page 
      title={`Unknown Inbound (${warehouse})`} 
      showHeader 
      showBackButton
    >
      <View style={styles.container}>
        <Text style={styles.placeholder}>Unknown Inbound Screen - Coming Soon</Text>
        <Text style={styles.subText}>
          This screen will implement the functionality to process unscheduled inbound shipments.
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

export default UnknownInboundScreen;