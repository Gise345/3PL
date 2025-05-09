import React from 'react';
import { 
  View, 
  StyleSheet, 
  ViewStyle, 
  TouchableOpacity, 
  Platform 
} from 'react-native';
import { colors, shadows, borderRadius, spacing } from '../../utils/theme';


interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  elevation?: 'small' | 'medium' | 'large';
  backgroundColor?: string;
  borderRadius?: number;
  padding?: number;
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  elevation = 'medium',
  backgroundColor = colors.cardBackground,
  borderRadius: customBorderRadius = borderRadius.medium,
  padding = spacing.md,
}) => {
  // Get shadow based on elevation
  const getShadow = () => {
    switch (elevation) {
      case 'small':
        return shadows.small;
      case 'medium':
        return shadows.medium;
      case 'large':
        return shadows.large;
      default:
        return shadows.medium;
    }
  };
  
  // Base card styles
  const cardStyles = [
    styles.card,
    {
      backgroundColor,
      borderRadius: customBorderRadius,
      padding,
      ...getShadow(),
    },
    style,
  ];
  
  // Return touchable card if onPress is provided, otherwise return a regular view
  if (onPress) {
    return (
      <TouchableOpacity 
        style={cardStyles} 
        onPress={onPress} 
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    );
  }
  
  return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});

export default Card;