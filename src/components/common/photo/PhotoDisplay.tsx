import React from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity, StyleProp, ImageStyle, ViewStyle } from 'react-native';
import { colors, typography, spacing } from '../../../utils/theme';
import { MaterialIcons } from '@expo/vector-icons';

interface PhotoDisplayProps {
  imageUri: string;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
}

const PhotoDisplay: React.FC<PhotoDisplayProps> = ({
  imageUri,
  label,
  size = 'medium',
  onPress,
}) => {
  // Determine dimensions based on size
  const getDimensions = (): { width: number | string, height: number } => {
    switch (size) {
      case 'small':
        return { width: 75, height: 75 };
      case 'large':
        return { width: '100%' as const, height: 200 };
      case 'medium':
      default:
        return { width: 120, height: 120 };
    }
  };

  const dimensions = getDimensions();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.imageContainer, 
          { 
            width: dimensions.width, 
            height: dimensions.height 
          } as StyleProp<ViewStyle>
        ]}
        onPress={onPress}
        disabled={!onPress}
      >
        <Image 
          source={{ uri: imageUri }} 
          style={[
            styles.image, 
            { 
              width: dimensions.width, 
              height: dimensions.height 
            } as StyleProp<ImageStyle>
          ]} 
          resizeMode="cover"
        />
        {onPress && (
          <View style={styles.overlay}>
            <MaterialIcons name="zoom-in" size={24} color={colors.background} />
          </View>
        )}
      </TouchableOpacity>
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: spacing.xs,
    alignItems: 'center',
  },
  imageContainer: {
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  image: {
    borderRadius: 4,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    marginTop: spacing.xs,
    fontSize: typography.fontSizes.small,
    color: colors.text,
    textAlign: 'center',
  },
});

export default PhotoDisplay;