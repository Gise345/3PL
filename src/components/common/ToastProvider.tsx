import React, { createContext, useContext, useState, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import Toast from './Toast';

interface ToastOptions {
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
  autoClose?: boolean;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toast, setToast] = useState<ToastOptions | null>(null);

  // Show a toast notification
  const showToast = (options: ToastOptions) => {
    setToast(options);
  };

  // Hide the currently displayed toast
  const hideToast = () => {
    setToast(null);
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <View style={styles.toastContainer}>
          <Toast
            type={toast.type}
            message={toast.message}
            duration={toast.duration}
            autoClose={toast.autoClose}
            onClose={hideToast}
          />
        </View>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
});

export default ToastProvider;