import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../utils/theme';
import { Button, Input } from '../../components/common';
import { useAppDispatch } from '../../hooks/useRedux';
import { login } from '../../store/slices/authSlice';
import { LoginScreenProps } from '../../navigation/types';

const LoginScreen: React.FC<LoginScreenProps> = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useAppDispatch();

  // Handle login
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    // Make sure email has @3p-logistics.co.uk domain if not provided
    let fullEmail = email;
    if (!fullEmail.includes('@')) {
      fullEmail += '@3p-logistics.co.uk';
    }

    setLoading(true);
    try {
      await dispatch(login({ email: fullEmail, password })).unwrap();
    } catch (error: any) {
      Alert.alert('Login Failed', error?.toString() || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            {/* Replace with your logo */}
            <Text style={styles.logoText}>3PL Door App</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.title}>Login</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.emailInputWrapper}>
                <Input
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  containerStyle={styles.emailInput}
                  inputStyle={styles.input}
                />
                <Text style={styles.domain}>@3p-logistics.co.uk</Text>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <Input
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                containerStyle={{ marginBottom: 0 }}
                inputStyle={styles.input}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>

            <Button
              title="Login"
              onPress={handleLogin}
              loading={loading}
              disabled={!email || !password}
              style={styles.loginButton}
            />
            {/* Test Login Button - Only visible in development */}
            {__DEV__ && (
              <Button
                title="Test Login (Dev Only)"
                onPress={() => {
                  // Manually set the authenticated state
                  dispatch({ 
                    type: 'auth/login/fulfilled', 
                    payload: { email: 'test@3p-logistics.co.uk', apiKey: 'test-key' } 
                  });
                }}
                style={{ ...styles.loginButton, marginTop: 10 }}
                variant="secondary"
              />
            )}
            
          </View>

          <Text style={styles.version}>v1.0.0</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  logoText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: colors.primary,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    fontSize: typography.fontSizes.xxlarge,
    fontWeight: typography.fontWeights.bold as any,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: spacing.lg,
    position: 'relative',
  },
  label: {
    fontSize: typography.fontSizes.medium,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  emailInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emailInput: {
    flex: 1,
    marginBottom: 0,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSizes.regular,
  },
  domain: {
    marginLeft: spacing.xs,
    color: colors.textLight,
  },
  loginButton: {
    marginTop: spacing.lg,
  },
  eyeIcon: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
  },
  version: {
    textAlign: 'center',
    color: colors.textLight,
    marginTop: spacing.xl,
  },
});

export default LoginScreen;