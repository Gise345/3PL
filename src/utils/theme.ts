// Color palette with modernized colors
export const colors = {
  // Primary colors
  primary: '#00A9B5', // teal
  secondary: '#1859e6', // Blue
  accent: '#ff6f00', // Orange

  // UI backgrounds
  background: '#F5F7FA', // Light gray/blue background
  cardBackground: '#FFFFFF', // White card background
  surface: '#f5f5f5', // Secondary surface color
  listBackground: '#F5F7FA', // Background for lists

  // Text colors
  text: '#333333', // Primary text
  textLight: '#888888', // Secondary text
  textSecondary: '#666666', // Tertiary text
  textDark: '#000000', // Darkest text
  
  // Status and functional colors
  error: '#EE4B2B', // Error red
  success: '#42b883', // Success green
  warning: '#ff9800', // Warning orange
  info: '#2196f3', // Info blue
  
  // Border and divider colors
  border: '#E0E0E0', // Light border color
  divider: 'rgba(0, 0, 0, 0.05)', // Subtle divider color
  
  // Component-specific colors
  actionBar: '#53ba82', // Action bar color (same as primary)
  inputBackground: '#FFFFFF', // Input background
  cardActive: '#F0F9F6', // Active card background (light green tint)
  
  // Shadow colors
  shadowColor: 'rgba(0, 0, 0, 0.1)', // Shadow color for elevation
};

// Enhanced shadow styles for different elevation levels
export const shadows = {
  small: {
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  large: {
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  // Card-specific shadow
  card: {
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  // Floating action button shadow
  fab: {
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  }
};

// Typography system with improved scale and weights
export const typography = {
  fontSizes: {
    xs: 10,
    small: 12,
    medium: 14,
    regular: 16,
    large: 18,
    xlarge: 20,
    xxlarge: 24,
    title: 28,
    heading: 32,
  },
  fontWeights: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    loose: 1.8,
  }
};

// Spacing system with more granular options
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Border radius system for consistent rounding
export const borderRadius = {
  xs: 2,
  small: 4,
  medium: 8,
  large: 12,
  xl: 16,
  xxl: 24,
  circular: 999,
};

// Animation timing presets
export const animation = {
  veryFast: 100,
  fast: 200,
  normal: 300,
  slow: 500,
  verySlow: 800,
};

// Theme export for easy use throughout the app
export default {
  colors,
  shadows,
  typography,
  spacing,
  borderRadius,
  animation,
};