/**
 * Login screen — lives at the root, outside the `(tabs)` group, so it is
 * reachable while unauthenticated.
 *
 * On submit it calls `useAuth().signIn`; there is **no** manual
 * `router.replace('/')` — the auth gate in the root layout redirects once the
 * status flips to `authenticated`.
 */
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AuthError, useAuth } from '@/lib/auth';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    try {
      setSubmitting(true);
      setError(null);
      await signIn(email.trim(), password);
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'Unable to sign in');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedView style={styles.form}>
            <ThemedText type="title" style={styles.title}>
              Sign in
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              Sign in to your Cascade account to continue.
            </ThemedText>

            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
              placeholder="Email"
              placeholderTextColor={theme.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              keyboardType="email-address"
              editable={!submitting}
            />
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
              placeholder="Password"
              placeholderTextColor={theme.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              editable={!submitting}
            />

            {error ? (
              <ThemedText type="small" style={styles.error}>
                {error}
              </ThemedText>
            ) : null}

            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={({ pressed }) => pressed && styles.pressed}>
              <ThemedView type="backgroundElement" style={styles.submitButton}>
                {submitting ? (
                  <ActivityIndicator color={theme.text} />
                ) : (
                  <ThemedText type="link">Sign in</ThemedText>
                )}
              </ThemedView>
            </Pressable>
          </ThemedView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  form: {
    gap: Spacing.three,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  input: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    fontSize: 16,
  },
  error: {
    color: '#e5484d',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  submitButton: {
    flexDirection: 'row',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 52,
    marginTop: Spacing.two,
  },
});
