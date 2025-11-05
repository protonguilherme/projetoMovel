import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

// ============================================
// TYPES
// ============================================

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastConfig {
  title: string;
  message?: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextData {
  showToast: (config: ToastConfig) => void;
}

// ============================================
// TOAST HELPER FUNCTIONS
// ============================================

export const toast = {
  success: (title: string, message?: string, duration?: number): ToastConfig => ({
    type: 'success',
    title,
    message,
    duration
  }),
  
  error: (title: string, message?: string, duration?: number): ToastConfig => ({
    type: 'error',
    title,
    message,
    duration
  }),
  
  warning: (title: string, message?: string, duration?: number): ToastConfig => ({
    type: 'warning',
    title,
    message,
    duration
  }),
  
  info: (title: string, message?: string, duration?: number): ToastConfig => ({
    type: 'info',
    title,
    message,
    duration
  })
};

// ============================================
// CONTEXT
// ============================================

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

// ============================================
// TOAST PROVIDER
// ============================================

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<(ToastConfig & { id: string })[]>([]);

  const showToast = useCallback((config: ToastConfig) => {
    const id = Date.now().toString();
    const duration = config.duration || 3000;

    setToasts(prev => [...prev, { ...config, id }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View style={styles.toastContainer}>
        {toasts.map(toast => (
          <ToastItem key={toast.id} {...toast} />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

// ============================================
// TOAST ITEM COMPONENT
// ============================================

const ToastItem: React.FC<ToastConfig & { id: string }> = ({ type, title, message }) => {
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2400),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return styles.toastSuccess;
      case 'error':
        return styles.toastError;
      case 'warning':
        return styles.toastWarning;
      case 'info':
        return styles.toastInfo;
      default:
        return styles.toastInfo;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return 'ℹ';
    }
  };

  return (
    <Animated.View
      style={[
        styles.toast,
        getToastStyle(),
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.toastIconContainer}>
        <Text style={styles.toastIcon}>{getIcon()}</Text>
      </View>
      <View style={styles.toastContent}>
        <Text style={styles.toastTitle}>{title}</Text>
        {message && <Text style={styles.toastMessage}>{message}</Text>}
      </View>
    </Animated.View>
  );
};

// ============================================
// STYLES
// ============================================

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    width: width - 40,
    marginBottom: 10,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastSuccess: {
    backgroundColor: '#34C759',
  },
  toastError: {
    backgroundColor: '#FF3B30',
  },
  toastWarning: {
    backgroundColor: '#FF9500',
  },
  toastInfo: {
    backgroundColor: '#007AFF',
  },
  toastIconContainer: {
    marginRight: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toastContent: {
    flex: 1,
  },
  toastTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  toastMessage: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
});