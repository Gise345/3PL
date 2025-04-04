import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Page } from '../../components/common';
import { colors, typography, spacing } from '../../utils/theme';
import { ScanToCageScreenProps } from '../../navigation/types';
import { useAppSelector } from '../../hooks/useRedux';

const ScanToCageScreen: React.FC<ScanToCageScreenProps> = () => {
  const { warehouse } = useAppSelector((state) => state.settings);

  return (
    <Page 
      title={`Scan To Cage (${warehouse})`} 
      showHeader 
      showBackButton
    >
      <View style={styles.container}>
        <Text style={styles.placeholder}>Scan To Cage Screen - Coming Soon</Text>
        <Text style={styles.subText}>
          This screen will implement the functionality to scan items into cages,
          including operator selection, tracking number scanning, and cage ID association.
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

export default ScanToCageScreen;