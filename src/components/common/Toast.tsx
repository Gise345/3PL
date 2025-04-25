import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../utils/theme';

interface ToastProps {
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
  onClose?: () => void;
  autoClose?: boolean;
}

const Toast: React.FC<ToastProps> = ({
  type = 'info',
  message,
  duration = 3000,
  onClose,
  autoClose = true,
}) => {
  const [visible, setVisible] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Get icon based on toast type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <MaterialIcons name="check-circle" size={24} color={colors.success} />;
      case 'error':
        return <MaterialIcons name="error" size={24} color={colors.error} />;
      case 'info':
      default:
        return <MaterialIcons name="info" size={24} color={colors.info} />;
    }
  };
  
  // Get background color based on toast type
  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return `${colors.success}15`; // 15% opacity
      case 'error':
        return `${colors.error}15`;
      case 'info':
      default:
        return `${colors.info}15`;
    }
  };
  
  // Get border color based on toast type
  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      case 'info':
      default:
        return colors.info;
    }
  };

  // Handle toast close
  const closeToast = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      if (onClose) onClose();
    });
  };

  // Show toast and auto-close if enabled
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (autoClose) {
      const timer = setTimeout(() => {
        closeToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, []);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          borderLeftColor: getBorderColor(),
          opacity: fadeAnim,
        },
      ]}
    >
      <View style={styles.content}>
        {getIcon()}
        <Text style={styles.message}>{message}</Text>
      </View>
      <TouchableOpacity onPress={closeToast} style={styles.closeButton}>
        <MaterialIcons name="close" size={20} color={colors.textLight} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderLeftWidth: 4,
    borderRadius: 4,
    marginVertical: spacing.sm,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  message: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSizes.medium,
    color: colors.text,
    flex: 1,
  },
  closeButton: {
    padding: spacing.xs,
  },
});

export default Toast;