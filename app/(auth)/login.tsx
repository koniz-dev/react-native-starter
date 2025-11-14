import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  TextInput,
  Button,
  useTheme,
  Snackbar,
} from 'react-native-paper';
import { router } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginAsync, selectAuth, clearError } from '@/store/slices/authSlice';

export default function LoginScreen() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { loading, error, isAuthenticated } = useAppSelector(selectAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const dismissedErrorRef = useRef<string | null>(null);

  // Navigate to main app when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  // Show snackbar when error appears (but not if it was already dismissed)
  useEffect(() => {
    if (error && error !== dismissedErrorRef.current) {
      // Schedule state update to avoid synchronous setState in effect
      queueMicrotask(() => {
        setSnackbarVisible(true);
      });
    }
  }, [error]);

  const handleLogin = () => {
    if (!email || !password) {
      dispatch(clearError());
      setSnackbarVisible(true);
      // For validation errors, we'll show a message directly
      // In a real app, you might want to add validation to the slice
      return;
    }

    dispatch(loginAsync({ email, password }));
  };

  const handleDismissSnackbar = () => {
    setSnackbarVisible(false);
    dismissedErrorRef.current = error;
    dispatch(clearError());
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Welcome Back
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Sign in to continue
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            style={styles.input}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Sign In
          </Button>

          <Text
            variant="bodySmall"
            style={[styles.note, { color: theme.colors.onSurfaceVariant }]}
          >
            Note: This is a demo. Update the API endpoint in{' '}
            <Text style={styles.monospace}>services/auth.ts</Text> to connect to
            your backend.
          </Text>
        </View>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={handleDismissSnackbar}
        duration={4000}
        action={{
          label: 'Dismiss',
          onPress: handleDismissSnackbar,
        }}
      >
        {error || 'An error occurred'}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
  },
  note: {
    marginTop: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  monospace: {
    fontFamily: 'monospace',
  },
});
