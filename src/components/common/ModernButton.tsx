import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ViewStyle, 
  TextStyle,
  View,
  Platform
} from 'react-native';
import { colors, shadows, typography, spacing, borderRadius } from '../../utils/theme';



interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  rounded?: boolean;
  fullWidth?: boolean;
}

const ModernButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
  rounded = false,
  fullWidth = false,
}) => {
  // Define all styles first
  const styles = StyleSheet.create({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: rounded ? borderRadius.circular : borderRadius.medium,
      ...shadows.small,
    },
    primaryButton: {
      backgroundColor: colors.primary,
    },
    secondaryButton: {
      backgroundColor: colors.secondary,
    },
    accentButton: {
      backgroundColor: colors.accent,
    },
    outlineButton: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.primary,
      ...Platform.select({
        ios: {
          shadowOpacity: 0,
        },
        android: {
          elevation: 0,
        },
      }),
    },
    ghostButton: {
      backgroundColor: 'transparent',
      ...Platform.select({
        ios: {
          shadowOpacity: 0,
        },
        android: {
          elevation: 0,
        },
      }),
    },
    disabledButton: {
      opacity: 0.6,
    },
    smallButton: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      minHeight: 36,
    },
    mediumButton: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      minHeight: 44,
    },
    largeButton: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      minHeight: 52,
    },
    fullWidthButton: {
      width: '100%',
    },
    contentContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    icon: {
      marginRight: iconPosition === 'left' ? spacing.sm : 0,
      marginLeft: iconPosition === 'right' ? spacing.sm : 0,
    },
    baseText: {
      textAlign: 'center',
      fontWeight: typography.fontWeights.medium as any,
    },
    primaryText: {
      color: 'white',
    },
    secondaryText: {
      color: 'white',
    },
    accentText: {
      color: 'white',
    },
    outlineText: {
      color: colors.primary,
    },
    ghostText: {
      color: colors.primary,
    },
    smallText: {
      fontSize: typography.fontSizes.small,
    },
    mediumText: {
      fontSize: typography.fontSizes.regular,
    },
    largeText: {
      fontSize: typography.fontSizes.large,
    },
  });

  // Get button style based on variant and state
  const getButtonStyles = (): ViewStyle[] => {
    const buttonStyles: ViewStyle[] = [styles.base];
    
    // Add variant-specific styles
    switch (variant) {
      case 'primary':
        buttonStyles.push(styles.primaryButton);
        break;
      case 'secondary':
        buttonStyles.push(styles.secondaryButton);
        break;
      case 'accent':
        buttonStyles.push(styles.accentButton);
        break;
      case 'outline':
        buttonStyles.push(styles.outlineButton);
        break;
      case 'ghost':
        buttonStyles.push(styles.ghostButton);
        break;
    }
    
    // Add size-specific styles
    switch (size) {
      case 'small':
        buttonStyles.push(styles.smallButton);
        break;
      case 'medium':
        buttonStyles.push(styles.mediumButton);
        break;
      case 'large':
        buttonStyles.push(styles.largeButton);
        break;
    }
    
    // Add fullWidth style if needed
    if (fullWidth) {
      buttonStyles.push(styles.fullWidthButton);
    }
    
    // Add disabled style if needed
    if (disabled) {
      buttonStyles.push(styles.disabledButton);
    }
    
    return buttonStyles;
  };
  
  // Get text style based on variant and size
  const getTextStyles = (): TextStyle[] => {
    const textStyles: TextStyle[] = [styles.baseText];
    
    // Add variant-specific text style
    switch (variant) {
      case 'primary':
        textStyles.push(styles.primaryText);
        break;
      case 'secondary':
        textStyles.push(styles.secondaryText);
        break;
      case 'accent':
        textStyles.push(styles.accentText);
        break;
      case 'outline':
        textStyles.push(styles.outlineText);
        break;
      case 'ghost':
        textStyles.push(styles.ghostText);
        break;
    }
    
    // Add size-specific text style
    switch (size) {
      case 'small':
        textStyles.push(styles.smallText);
        break;
      case 'medium':
        textStyles.push(styles.mediumText);
        break;
      case 'large':
        textStyles.push(styles.largeText);
        break;
    }
    
    return textStyles;
  };
  
  return (
    <TouchableOpacity
      style={[...getButtonStyles(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      <View style={styles.contentContainer}>
        {loading ? (
          <ActivityIndicator 
            size="small" 
            color={variant === 'outline' || variant === 'ghost' ? colors.primary : 'white'} 
          />
        ) : (
          <>
            {icon && iconPosition === 'left' && <View style={styles.icon}>{icon}</View>}
            <Text style={[...getTextStyles(), textStyle]}>{title}</Text>
            {icon && iconPosition === 'right' && <View style={styles.icon}>{icon}</View>}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default ModernButton;