import { useState, useEffect } from 'react';
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
import { useAuthStore, useAuthLoading, useAuthError } from '@/stores';

export default function LoginScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  // Use Zustand store for auth state
  const login = useAuthStore(state => state.login);
  const clearError = useAuthStore(state => state.clearError);
  const loading = useAuthLoading();
  const error = useAuthError();

  // Show snackbar when error changes
  useEffect(() => {
    if (error) {
      // Defer state update to avoid synchronous setState in effect
      setTimeout(() => {
        setSnackbarVisible(true);
      }, 0);
    }
  }, [error]);

  const handleLogin = async () => {
    if (!email || !password) {
      // For validation errors, show snackbar directly
      setSnackbarVisible(true);
      return;
    }

    clearError();
    setSnackbarVisible(false);

    try {
      await login({ email, password });
      // Navigate to main app after successful login
      router.replace('/(tabs)');
    } catch {
      // Error is already set in the store, snackbar will show via useEffect
      // No need to set snackbarVisible here as useEffect handles it
    }
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
            your backend. State is managed with Zustand (no provider needed!).
          </Text>
        </View>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => {
          setSnackbarVisible(false);
          clearError();
        }}
        duration={4000}
        action={{
          label: 'Dismiss',
          onPress: () => {
            setSnackbarVisible(false);
            clearError();
          },
        }}
      >
        {error || 'Please fill in all fields'}
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
