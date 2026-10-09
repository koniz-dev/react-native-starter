import { StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { getConfig } from '@/shared/config/env';
import { t } from '@/shared/i18n';
import { DEMO_CREDENTIALS } from './dummyJsonAdapter';

/** The demo account, shown on the login screen only with the demo backends. */
export function DemoCredentialsHint() {
  const theme = useTheme();
  // Routes render only with a valid config (see app/_layout.tsx).
  if (!getConfig().useDemoBackends) {
    return null;
  }
  return (
    <Text
      variant="bodySmall"
      style={[styles.note, { color: theme.colors.onSurfaceVariant }]}
      testID="demo-credentials-hint"
    >
      {t('login.demoHint', DEMO_CREDENTIALS)}
    </Text>
  );
}

const styles = StyleSheet.create({
  note: {
    marginTop: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
});
