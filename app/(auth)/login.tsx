import { useState } from 'react';
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
import { authService } from '@/services/auth';

export default function LoginScreen() {
  const theme = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Please fill in all fields');
      setSnackbarVisible(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authService.login({ username, password });
      // Navigate to main app after successful login
      router.replace('/(tabs)');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(errorMessage);
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
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
            label="Username"
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            autoCapitalize="none"
            autoComplete="username"
            style={styles.input}
            testID="login-username"
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
            testID="login-password"
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.button}
            testID="login-submit"
          >
            Sign In
          </Button>

          <Text
            variant="bodySmall"
            style={[styles.note, { color: theme.colors.onSurfaceVariant }]}
          >
            Demo credentials: <Text style={styles.monospace}>emilys</Text> /{' '}
            <Text style={styles.monospace}>emilyspass</Text>. Set{' '}
            <Text style={styles.monospace}>EXPO_PUBLIC_AUTH_API_URL</Text> and
            adapt <Text style={styles.monospace}>services/auth.ts</Text> for
            your backend.
          </Text>
        </View>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
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
