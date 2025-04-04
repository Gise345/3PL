import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors } from '../../utils/theme';
import Header from './Header';

interface PageProps {
  children: React.ReactNode;
  title?: string;
  showHeader?: boolean;
  showBackButton?: boolean;
  rightComponent?: React.ReactNode;
  loading?: boolean;
  style?: ViewStyle;
  scrollable?: boolean;
  onBackPress?: () => void;
}

const Page: React.FC<PageProps> = ({
  children,
  title,
  showHeader = true,
  showBackButton = false,
  rightComponent,
  loading = false,
  style,
  scrollable = true,
  onBackPress,
}) => {
  const Container = scrollable ? ScrollView : View;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        {showHeader && title && (
          <Header
            title={title}
            showBackButton={showBackButton}
            rightComponent={rightComponent}
            onBackPress={onBackPress}
          />
        )}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <Container
            style={[styles.content, style]}
            contentContainerStyle={scrollable ? styles.scrollContent : undefined}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </Container>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: colors.listBackground,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Page;