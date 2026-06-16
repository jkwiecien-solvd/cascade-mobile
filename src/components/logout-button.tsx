/**
 * Sign-out affordance. Calls `useAuth().signOut()` and shows a spinner while the
 * request is in flight. The auth gate handles the redirect to `/login` once the
 * status flips to `unauthenticated`, so there is no manual navigation here.
 *
 * Mounted in Settings → General (`src/app/(tabs)/settings/index.tsx`).
 */
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';

export function LogoutButton() {
  const { signOut } = useAuth();
  const theme = useTheme();
  const [pending, setPending] = useState(false);

  async function handlePress() {
    try {
      setPending(true);
      await signOut();
    } finally {
      // The component unmounts on redirect, but guard against staying mounted.
      setPending(false);
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={pending}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundElement" style={styles.button}>
        {pending ? (
          <ActivityIndicator color={theme.text} />
        ) : (
          <ThemedText type="link">Sign out</ThemedText>
        )}
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  button: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 40,
  },
});
