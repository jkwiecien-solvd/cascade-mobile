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

import { AnimatedIcon } from '@/components/animated-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { DEFAULT_API_URL, getApiUrl } from '@/lib/api';

export default function WelcomeScreen() {
  const { connect } = useAuth();
  const theme = useTheme();
  const [url, setUrl] = useState(getApiUrl() || DEFAULT_API_URL);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  async function handleConnect() {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    try {
      setConnecting(true);
      setError(null);
      await connect(url.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to connect to Cascade');
    } finally {
      setConnecting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedView style={styles.content}>
            <ThemedView style={styles.logoSection}>
              <AnimatedIcon />
              <ThemedText type="title" style={styles.title}>
                Cascade
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.subtitle}>
                Connect to your Cascade instance to continue.
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.form}>
              <ThemedView
                type="backgroundElement"
                style={[
                  styles.inputWrapper,
                  { backgroundColor: theme.backgroundElement },
                ]}>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Cascade Instance URL"
                  placeholderTextColor={theme.textSecondary}
                  value={url}
                  onChangeText={(val) => {
                    setUrl(val);
                    if (error) setError(null);
                  }}
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect={false}
                  keyboardType="url"
                  editable={!connecting}
                />
                {url ? (
                  <Pressable
                    onPress={() => setUrl('')}
                    disabled={connecting}
                    hitSlop={8}
                    style={styles.clearButton}>
                    <ThemedText themeColor="textSecondary" style={styles.clearText}>
                      ✕
                    </ThemedText>
                  </Pressable>
                ) : null}
              </ThemedView>

              {error ? (
                <ThemedText type="small" style={styles.error}>
                  {error}
                </ThemedText>
              ) : null}

              <Pressable
                onPress={handleConnect}
                disabled={connecting}
                style={({ pressed }) => pressed && styles.pressed}>
                <ThemedView type="backgroundElement" style={styles.submitButton}>
                  {connecting ? (
                    <ActivityIndicator color={theme.text} />
                  ) : (
                    <ThemedText type="link">Connect</ThemedText>
                  )}
                </ThemedView>
              </Pressable>

              <Pressable
                onPress={() => {
                  setUrl(DEFAULT_API_URL);
                  if (error) setError(null);
                }}
                disabled={connecting}
                style={({ pressed }) => pressed && styles.pressed}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.hintText}>
                  Reset to default: <ThemedText type="code">{DEFAULT_API_URL}</ThemedText>
                </ThemedText>
              </Pressable>
            </ThemedView>
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
  content: {
    gap: Spacing.five,
  },
  logoSection: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    textAlign: 'center',
    marginTop: Spacing.two,
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 320,
  },
  form: {
    gap: Spacing.three,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  clearButton: {
    padding: Spacing.one,
    marginLeft: Spacing.one,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearText: {
    fontSize: 16,
    fontWeight: 'bold',
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
  },
  hintText: {
    textAlign: 'center',
    marginTop: Spacing.one,
  },
});
