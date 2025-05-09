import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../../utils/theme';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  label?: string;
  placeholder?: string;
  mode?: 'date' | 'time' | 'datetime';
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
  error?: string;
  dateFormat?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label = 'Select Date',
  placeholder = 'Select a date',
  mode = 'date',
  minimumDate,
  maximumDate,
  disabled = false,
  error,
  dateFormat = 'DD/MM/YYYY',
}) => {
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState(value);

  // Format the date for display
  const formatDate = (date: Date): string => {
    try {
      switch (mode) {
        case 'date':
          return dateFormat
            .replace('DD', String(date.getDate()).padStart(2, '0'))
            .replace('MM', String(date.getMonth() + 1).padStart(2, '0'))
            .replace('YYYY', String(date.getFullYear()));
        case 'time':
          return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        case 'datetime':
          const dateStr = dateFormat
            .replace('DD', String(date.getDate()).padStart(2, '0'))
            .replace('MM', String(date.getMonth() + 1).padStart(2, '0'))
            .replace('YYYY', String(date.getFullYear()));
          return `${dateStr} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        default:
          return date.toLocaleDateString();
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Open the date picker
  const showDatePicker = () => {
    if (disabled) return;
    setShow(true);
  };

  // Handle date change (Android)
  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }
    
    if (event.type === 'set' && selectedDate) {
      // For Android, apply the change immediately
      if (Platform.OS === 'android') {
        onChange(selectedDate);
      } 
      // For iOS, store the date temporarily
      else {
        setTempDate(selectedDate);
      }
    }
  };

  // Confirm the selection (iOS only)
  const handleConfirm = () => {
    onChange(tempDate);
    setShow(false);
  };

  // Cancel the selection (iOS only)
  const handleCancel = () => {
    setShow(false);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={[
          styles.input,
          error ? styles.inputError : null,
          disabled ? styles.inputDisabled : null,
        ]}
        onPress={showDatePicker}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.inputText,
            !value && styles.placeholder,
            disabled && styles.disabledText,
          ]}
        >
          {value ? formatDate(value) : placeholder}
        </Text>
        
        <MaterialIcons 
          name={mode === 'time' ? 'access-time' : 'calendar-today'}
          size={20}
          color={disabled ? colors.textLight : colors.text}
        />
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      {show && (
        Platform.OS === 'ios' ? (
          // iOS uses a modal
          <Modal
            transparent={true}
            animationType="slide"
            visible={show}
            onRequestClose={handleCancel}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={handleCancel} style={styles.modalButton}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.modalTitle}>
                    {mode === 'time' ? 'Select Time' : 'Select Date'}
                  </Text>
                  
                  <TouchableOpacity onPress={handleConfirm} style={styles.modalButton}>
                    <Text style={styles.confirmText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
                
                <DateTimePicker
                  value={tempDate}
                  mode={mode === 'datetime' ? 'date' : mode}
                  display="spinner"
                  onChange={handleChange}
                  minimumDate={minimumDate}
                  maximumDate={maximumDate}
                  style={styles.picker}
                />
                
                {mode === 'datetime' && (
                  <DateTimePicker
                    value={tempDate}
                    mode="time"
                    display="spinner"
                    onChange={handleChange}
                    style={styles.picker}
                  />
                )}
              </View>
            </View>
          </Modal>
        ) : (
          // Android uses the native dialog
          <DateTimePicker
            value={value}
            mode={mode === 'datetime' ? 'date' : mode}
            display="default"
            onChange={handleChange}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
          />
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    width: '100%',
  },
  label: {
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.xs,
    marginLeft: spacing.sm,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputError: {
    borderColor: colors.error,
  },
  inputDisabled: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  inputText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  placeholder: {
    color: colors.textLight,
  },
  disabledText: {
    color: colors.textLight,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.large,
    borderTopRightRadius: borderRadius.large,
    paddingBottom: Platform.OS === 'ios' ? 30 : 0, // Extra padding for iOS
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  modalButton: {
    padding: spacing.sm,
  },
  cancelText: {
    color: colors.textLight,
    fontSize: 16,
  },
  confirmText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  picker: {
    height: 200,
  },
});

export default DatePicker;