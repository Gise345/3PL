import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  ScrollView,
  Keyboard,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../utils/theme';
import { Input } from '../../components/common';
import { useAppDispatch } from '../../hooks/useRedux';
import { login } from '../../store/slices/authSlice';
import { detectWarehouse } from '../../store/slices/settingsSlice';
import { LoginScreenProps } from '../../navigation/types';
import authService from '../../api/authService';

// Get device dimensions for responsive sizing
const { width, height } = Dimensions.get('window');

// Define modern color palette with teal primary color
const COLORS = {
  background: '#FFFFFF',
  primary: '#00A9B5', // Teal color like in the example
  secondary: '#333333',
  text: '#333333',
  textLight: '#888888',
  border: '#E0E0E0',
  inputBackground: '#F5F7FA',
};

const SeamlessLoginScreen: React.FC<LoginScreenProps> = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const dispatch = useAppDispatch();

  // Animation values
  const [fadeIn] = useState(new Animated.Value(0));
  const [slideUp] = useState(new Animated.Value(30));
  const [welcomeScale] = useState(new Animated.Value(0.5));
  const [welcomeOpacity] = useState(new Animated.Value(0));
  const [sloganOpacity] = useState(new Animated.Value(0));
  
  // Animate components on mount
  useEffect(() => {
    // Initial page load animation
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
    
    // Delay the welcome text animation
    setTimeout(() => {
      Animated.sequence([
        Animated.parallel([
          Animated.spring(welcomeScale, {
            toValue: 1,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(welcomeOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          })
        ]),
        // Fade in the slogan after welcome text
        Animated.timing(sloganOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }, 400); // Delay of 400ms after initial load
    
    // Add keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    // Clean up listeners
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Handle login
  
const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert('Error', 'Please enter both username and password');
    return;
  }

  // Construct the full email
  const fullEmail = email.includes('@') ? email : `${email}@3p-logistics.co.uk`;
  
  setLoading(true);
  try {
    console.log('Attempting login with:', { email: fullEmail });
    
    // Use Redux login action
    const result = await dispatch(login({ 
      email: fullEmail, 
      password 
    })).unwrap();
    
    console.log('Login successful');
    
    // Automatically detect warehouse after successful login
    dispatch(detectWarehouse());
  } catch (error: any) {
    console.error('Login error:', error);
    Alert.alert(
      'Login Failed', 
      error?.toString() || 'An error occurred during login. Please check your credentials and try again.'
    );
  } finally {
    setLoading(false);
  }
};



  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View 
            style={[
              styles.container,
              { 
                opacity: fadeIn,
                transform: [{ translateY: slideUp }]
              }
            ]}
          >
            {/* Logo and Title */}
            <View style={[
              styles.logoContainer,
              keyboardVisible && styles.logoContainerCondensed
            ]}>
              <Text style={styles.logoText}>3PL</Text>
              <Text style={styles.logoSubtext}>Door App</Text>
            </View>
            
            {/* Welcome Text with Pop Animation - Hide when keyboard is visible */}
            {!keyboardVisible && (
              <View style={styles.welcomeContainer}>
                <Animated.Text 
                  style={[
                    styles.welcomeText,
                    {
                      opacity: welcomeOpacity,
                      transform: [{ scale: welcomeScale }]
                    }
                  ]}
                >
                  Welcome back!
                </Animated.Text>
                <Animated.Text 
                  style={[
                    styles.sloganText,
                    { opacity: sloganOpacity }
                  ]}
                >
                  Let's MAKE SHIP HAPPEN
                </Animated.Text>
              </View>
            )}

            {/* Forklift Image - Hide when keyboard is visible */}
            {!keyboardVisible && (
              <View style={styles.imageContainer}>
                <Text style={styles.warehouseIcon}>🚚</Text>
              </View>
            )}
            
            {/* Login Form */}
            <View style={styles.formContainer}>
              {/* Username Input with Domain */}
              <View style={styles.inputContainer}>
                <View style={styles.emailInputWrapper}>
                  <Input
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Username"
                    autoCapitalize="none"
                    containerStyle={styles.emailInput}
                    inputStyle={styles.inputField}
                  />
                  <Text style={styles.domain}>@3p-logistics.co.uk</Text>
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                {/* Custom implementation for password input with toggle */}
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    secureTextEntry={!showPassword}
                    style={styles.passwordInput}
                  />
                  <TouchableOpacity 
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={loading || !email || !password}
                activeOpacity={0.8}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? 'SIGNING IN...' : 'SIGN IN'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Dev Mode Test Login */}
            {__DEV__ && (
              <TouchableOpacity
                style={styles.devButton}
                onPress={() => {
                  dispatch({ 
                    type: 'auth/login/fulfilled', 
                    payload: { email: 'test@3p-logistics.co.uk', apiKey: 'test-key' } 
                  });
                  
                  // Detect warehouse
                  dispatch(detectWarehouse());
                }}
              >
                <Text style={styles.devButtonText}>Dev Login</Text>
              </TouchableOpacity>
            )}
            
            {/* Version Text */}
            <Text style={styles.versionText}>v1.0.0</Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 30,
    paddingTop: 20,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  logoContainerCondensed: {
    marginTop: 5,
    marginBottom: 5,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  logoSubtext: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary,
    marginTop: 4,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
  },
  sloganText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textLight,
    marginTop: 8,
  },
  imageContainer: {
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
    backgroundColor: 'rgba(0, 169, 181, 0.08)',
    borderRadius: 60,
  },
  warehouseIcon: {
    fontSize: 52,
  },
  formContainer: {
    width: '100%',
    marginTop: 20,
  },
  inputContainer: {
    marginBottom: 16,
    width: '100%',
  },
  emailInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: 8,
    paddingRight: 12,
  },
  emailInput: {
    flex: 1,
    marginBottom: 0,
  },
  domain: {
    color: COLORS.textLight,
    fontSize: 14,
  },
  input: {
    marginBottom: 0,
    width: '100%',
  },
  inputField: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 0,
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  passwordToggle: {
    padding: 8,
  },
  eyeIcon: {
    fontSize: 20,
    color: COLORS.textLight,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    width: '100%',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  devButton: {
    marginTop: 20,
    padding: 8,
  },
  devButtonText: {
    color: COLORS.textLight,
    fontSize: 14,
  },
  versionText: {
    marginTop: 20,
    fontSize: 12,
    color: COLORS.textLight,
  },
});

export default SeamlessLoginScreen;