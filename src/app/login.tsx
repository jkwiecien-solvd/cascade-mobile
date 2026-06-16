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
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AuthError, useAuth } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
            <ThemedView
              type="backgroundElement"
              style={[
                styles.inputWrapper,
                { backgroundColor: theme.backgroundElement },
              ]}>
              <TextInput
                style={[styles.inputField, { color: theme.text }]}
                placeholder="Password"
                placeholderTextColor={theme.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                editable={!submitting}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                disabled={submitting}
                hitSlop={8}
                style={styles.showHideButton}>
                <SymbolView
                  name={
                    showPassword
                      ? { ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' }
                      : { ios: 'eye', android: 'visibility', web: 'visibility' }
                  }
                  size={20}
                  tintColor={theme.textSecondary}
                />
              </Pressable>
            </ThemedView>

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

            <Pressable
              onPress={() => router.push('/welcome')}
              disabled={submitting}
              style={({ pressed }) => pressed && styles.pressed}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.changeInstanceText}>
                Connecting to: <ThemedText type="code">{getApiUrl()}</ThemedText> (Change)
              </ThemedText>
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
  changeInstanceText: {
    textAlign: 'center',
    marginTop: Spacing.two,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  inputField: {
    flex: 1,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  showHideButton: {
    padding: Spacing.one,
    marginLeft: Spacing.one,
    justifyContent: 'center',
    alignItems: 'center',
  },
  showHideText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
