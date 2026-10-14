import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type TextInput as NativeTextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  TextInput,
  Button,
  HelperText,
  useTheme,
} from 'react-native-paper';
import { useSession } from '@/shared/session/SessionProvider';
import { errorMessage } from '@/shared/http/errorMessage';
import { toApiError } from '@/shared/http/apiError';
import { logger } from '@/shared/lib/logger';
// @demo remove-block-start
// eslint-disable-next-line project/import-boundaries -- the demo is removable (npm run remove-demo)
import { DemoCredentialsHint } from '@/features/demo-auth/DemoCredentialsHint';
// @demo remove-block-end
import { t } from '@/shared/i18n';
import { DocumentTitle } from '@/shared/ui/DocumentTitle';
import { useAnnouncement } from '@/shared/ui/useAnnouncement';

export function LoginScreen() {
  const theme = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Which fields the last "fill in all fields" error was about.
  const [missing, setMissing] = useState({ username: false, password: false });
  const passwordRef = useRef<NativeTextInput>(null);
  const { signIn } = useSession();
  // Set synchronously, so a second "Go" before the re-render is ignored.
  const submittingRef = useRef(false);
  const repeatErrorRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(repeatErrorRef.current), []);
  useAnnouncement(error);

  const handleLogin = async () => {
    if (submittingRef.current) return;
    clearTimeout(repeatErrorRef.current);
    const empty = { username: !username.trim(), password: !password.trim() };
    if (empty.username || empty.password) {
      setMissing(empty);
      // Name the missing field in words, not only by the field's color.
      const message = t(
        empty.username && empty.password
          ? 'login.error.emptyFields'
          : empty.username
            ? 'login.error.usernameRequired'
            : 'login.error.passwordRequired'
      );
      if (message === error) {
        // The same message again: clear it for a moment, so screen readers
        // (the live region, and the iOS announcement) say it again.
        setError(null);
        repeatErrorRef.current = setTimeout(() => setError(message), 100);
      } else {
        setError(message);
      }
      return;
    }

    submittingRef.current = true;
    setMissing({ username: false, password: false });
    setLoading(true);
    setError(null);

    try {
      // Signing in flips the route guards in app/_layout.tsx: this screen
      // (signed-out only) is removed, back to the screen that opened it.
      await signIn({ username, password });
    } catch (err) {
      // Not a server answer (e.g. no AuthAdapter registered): the user sees a
      // generic message, the developer the reason.
      if (toApiError(err).code === 'unknown') {
        logger.error('Sign-in failed', err);
      }
      setError(errorMessage(err, 'login.error.generic'));
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };
  const submit = () => {
    void handleLogin();
  };

  return (
    <SafeAreaView
      edges={['bottom', 'left', 'right']}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <DocumentTitle title={t('login.headerTitle')} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.body}>
            <View style={styles.header}>
              <Text
                variant="headlineMedium"
                style={styles.title}
                accessibilityRole="header"
              >
                {t('login.title')}
              </Text>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {t('login.subtitle')}
              </Text>
            </View>

            <TextInput
              label={t('login.username')}
              accessibilityLabel={t('login.username')}
              value={username}
              onChangeText={setUsername}
              mode="outlined"
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              autoComplete="username"
              textContentType="username"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => passwordRef.current?.focus()}
              error={missing.username}
              style={styles.input}
              testID="login-username"
            />

            <TextInput
              ref={passwordRef}
              label={t('login.password')}
              accessibilityLabel={t('login.password')}
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={submit}
              error={missing.password}
              style={styles.input}
              testID="login-password"
            />

            {/* Under the fields, so the keyboard doesn't hide it. */}
            <HelperText
              type="error"
              visible={error !== null}
              accessibilityLiveRegion="polite"
              testID="login-error"
            >
              {error ?? ''}
            </HelperText>

            <Button
              mode="contained"
              onPress={submit}
              loading={loading}
              disabled={loading}
              style={styles.button}
              testID="login-submit"
            >
              {t('login.submit')}
            </Button>

            {/* @demo remove-block-start */}
            <DemoCredentialsHint />
            {/* @demo remove-block-end */}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  // A form reads best narrow: centered and capped on tablets and the web.
  body: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
  },
});
