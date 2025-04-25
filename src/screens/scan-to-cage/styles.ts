import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../utils/theme';
// For styles.ts - Add these imports at the top:
import { Platform, StatusBar } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  operatorSection: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.md,
  },
  card: {
    marginVertical: spacing.sm,
  },
  scanningSection: {
    flex: 1,
    padding: spacing.md,
  },
  selectedOperatorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  operatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  operatorIcon: {
    marginRight: spacing.md,
  },
  operatorNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  operatorNameWrapper: {
    marginLeft: spacing.xs,
  },
  operatorName: {
    fontSize: typography.fontSizes.medium,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.text,
  },
  operatorId: {
    fontSize: typography.fontSizes.small,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  verifiedIcon: {
    marginLeft: spacing.xs,
  },
  operatorDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  changeOperatorButton: {
    marginTop: 0,
  },
  inputSection: {
    marginTop: spacing.md,
  },
  inputContainer: {
    position: 'relative',
  },
  scanButton: {
    position: 'absolute',
    right: spacing.md,
    top: 35,
    padding: spacing.xs,
  },
  messageContainer: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  messageCard: {
    marginTop: spacing.md,
    padding: spacing.md,
  },
  errorCard: {
    backgroundColor: `${colors.error}10`,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  successCard: {
    backgroundColor: `${colors.success}10`,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  messageContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageIcon: {
    marginRight: spacing.sm,
  },
  errorText: {
    color: colors.error,
    flex: 1,
  },
  successText: {
    color: colors.success,
    flex: 1,
  },
// Updated style properties to match your colors object
safeArea: {
  flex: 1,
  backgroundColor: colors.background,
},
header: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 16,
  paddingVertical: 16,
  backgroundColor: colors.background,
  borderBottomWidth: 1,
  borderBottomColor: colors.border,
  marginTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
  ...Platform.select({
    ios: {
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
    },
  }),
},
backButton: {
  width: 40,
  height: 40,
  borderRadius: 20,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.cardBackground,
  ...Platform.select({
    ios: {
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
    },
  }),
},
backButtonText: {
  fontSize: 24,
  color: colors.primary,
  fontWeight: '500',
},
headerTitle: {
  flex: 1,
  textAlign: 'center',
  paddingHorizontal: 10,
},
headerTitleText: {
  fontSize: 20,
  fontWeight: '700',
  color: colors.text,
},
warehouseText: {
  color: colors.primary,
},
headerPlaceholder: {
  width: 40,
},
});