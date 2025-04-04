import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, shadows } from '../../utils/theme';

// You may need to install a library like react-native-vector-icons
// or use custom back icon image
// import Icon from 'react-native-vector-icons/MaterialIcons';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  rightComponent?: React.ReactNode;
  onBackPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = false,
  rightComponent,
  onBackPress,
}) => {
  const navigation = useNavigation();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <>
      <StatusBar 
        backgroundColor={colors.actionBar} 
        barStyle="light-content" 
      />
      <View style={styles.header}>
        <View style={styles.leftContainer}>
          {showBackButton && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackPress}
            >
              {/* You can replace with your back icon */}
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
        {rightComponent && (
          <View style={styles.rightContainer}>{rightComponent}</View>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.actionBar,
    paddingHorizontal: spacing.md,
    ...shadows.medium,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    paddingRight: spacing.sm,
  },
  backText: {
    color: colors.background,
    fontSize: typography.fontSizes.large,
    fontWeight: typography.fontWeights.bold as any,
  },
  title: {
    color: colors.background,
    fontSize: typography.fontSizes.large,
    fontWeight: typography.fontWeights.bold as any,
    marginLeft: spacing.xs,
  },
  rightContainer: {
    marginLeft: spacing.sm,
  },
});

export default Header;