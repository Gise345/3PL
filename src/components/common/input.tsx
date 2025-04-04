import React, { forwardRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, typography, spacing } from '../../utils/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
  errorStyle?: TextStyle;
}

const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      containerStyle,
      labelStyle,
      inputStyle,
      errorStyle,
      ...props
    },
    ref
  ) => {
    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
        <TextInput
          ref={ref}
          style={[
            styles.input,
            error ? styles.inputError : null,
            inputStyle,
          ]}
          placeholderTextColor={colors.textLight}
          {...props}
        />
        {error && <Text style={[styles.error, errorStyle]}>{error}</Text>}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    width: '100%',
  },
  label: {
    fontSize: typography.fontSizes.medium,
    color: colors.text,
    marginBottom: spacing.xs,
    marginLeft: spacing.sm,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: spacing.md,
    fontSize: typography.fontSizes.regular,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.error,
  },
  error: {
    fontSize: typography.fontSizes.small,
    color: colors.error,
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
});

export default Input;