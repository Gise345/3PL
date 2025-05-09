// src/components/common/Checkbox.tsx
import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../utils/theme';

interface CheckboxProps {
  checked: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  size?: number;
}

const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onValueChange,
  disabled = false,
  size = 24
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.checkbox,
        { width: size, height: size },
        checked ? styles.checked : styles.unchecked,
        disabled && styles.disabled
      ]}
      onPress={() => !disabled && onValueChange(!checked)}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {checked && (
        <MaterialIcons
          name="check"
          size={size * 0.8}
          color={disabled ? colors.textLight : colors.background}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  checkbox: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  checked: {
    backgroundColor: colors.primary,
    borderWidth: 0,
  },
  unchecked: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  disabled: {
    backgroundColor: colors.border,
    borderColor: colors.textLight,
    opacity: 0.5,
  },
});

export default Checkbox;