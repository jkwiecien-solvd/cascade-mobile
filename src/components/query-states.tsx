/**
 * QueryStates — small themed building blocks for the loading / empty / error
 * states shared by the projects list and the project-runs detail screen.
 *
 * Centralising these here keeps the screens declarative (`if (isPending) return
 * <Loading />`) and avoids duplicating state UI. They are built from the
 * existing themed primitives and follow the `Pressable` + `pressed`-opacity
 * idiom used in `explore.tsx` / `org-switcher.tsx`.
 */
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Centered spinner with an optional caption. */
export function Loading({ message }: { message?: string }) {
  const theme = useTheme();
  return (
    <ThemedView style={styles.center}>
      <ActivityIndicator color={theme.text} />
      {message ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
          {message}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

/** Centered "nothing here yet" message. */
export function EmptyState({ message }: { message: string }) {
  return (
    <ThemedView style={styles.center}>
      <ThemedText themeColor="textSecondary" style={styles.message}>
        {message}
      </ThemedText>
    </ThemedView>
  );
}

/** Centered error message with an optional Retry affordance. */
export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <ThemedView style={styles.center}>
      <ThemedText type="small" style={styles.error}>
        {message ?? 'Something went wrong.'}
      </ThemedText>
      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          style={({ pressed }) => pressed && styles.pressed}>
          <ThemedView type="backgroundElement" style={styles.retryButton}>
            <ThemedText type="link">Retry</ThemedText>
          </ThemedView>
        </Pressable>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  message: {
    textAlign: 'center',
  },
  error: {
    color: '#e5484d',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  retryButton: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
  },
});
