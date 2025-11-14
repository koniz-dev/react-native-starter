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
import { useAuth } from '@/contexts';

export default function LoginScreen() {
  const theme = useTheme();
  const { login, isLoading, error, isAuthenticated, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  // Navigate to main app when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  const handleLogin = async () => {
    if (!email || !password) {
      setValidationError('Please enter both email and password');
      return;
    }

    setValidationError('');
    try {
      await login({ email, password });
      // Navigation will happen automatically via useEffect when isAuthenticated changes
    } catch {
      // Error is already handled by context
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
            loading={isLoading}
            disabled={isLoading}
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
        visible={!!error || !!validationError}
        onDismiss={() => {
          clearError();
          setValidationError('');
        }}
        duration={4000}
        action={{
          label: 'Dismiss',
          onPress: () => {
            clearError();
            setValidationError('');
          },
        }}
      >
        {error || validationError || 'An error occurred'}
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
