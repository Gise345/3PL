import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ViewStyle, 
  TextStyle 
} from 'react-native';
import { colors, typography, spacing } from '../../utils/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'warning' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  small?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  small = false,
}) => {
  // Determine the style based on variant
  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primaryButton;
      case 'secondary':
        return styles.secondaryButton;
      case 'warning':
        return styles.warningButton;
      case 'outline':
        return styles.outlineButton;
      default:
        return styles.primaryButton;
    }
  };

  // Determine the text style based on variant
  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return styles.outlineButtonText;
      default:
        return styles.buttonText;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        small && styles.smallButton,
        disabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'outline' ? colors.primary : colors.background} />
      ) : (
        <Text style={[getTextStyle(), small && styles.smallButtonText, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 4,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
  },
  smallButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
  },
  warningButton: {
    backgroundColor: colors.accent,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  disabledButton: {
    backgroundColor: colors.border,
    opacity: 0.7,
  },
  buttonText: {
    color: colors.background,
    fontSize: typography.fontSizes.regular,
    fontWeight: typography.fontWeights.medium as any,
  },
  smallButtonText: {
    fontSize: typography.fontSizes.small,
  },
  outlineButtonText: {
    color: colors.primary,
    fontSize: typography.fontSizes.regular,
    fontWeight: typography.fontWeights.medium as any,
  },
});

export default Button;