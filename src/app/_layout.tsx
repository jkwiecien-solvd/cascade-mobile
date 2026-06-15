/**
 * Root layout — app-wide providers, the navigation stack, and the auth gate.
 *
 * Provider order matters: `QueryClientProvider` is outermost because
 * `AuthProvider` calls `queryClient.fetchQuery(auth.me)` during its launch
 * bootstrap, so it must sit inside the query client. `OrgProvider` nests inside
 * `AuthProvider` — it reads the auth status to gate `auth.me` and registers the
 * `x-org-context` header getter. `ThemeProvider` wraps the rendered tree (theme
 * is derived from the OS color scheme exactly as before).
 *
 * The `AnimatedSplashOverlay` stays at the root so it plays once over whichever
 * screen the auth gate lands on (login or tabs), rather than only inside the app.
 *
 * SDK 56 note: `Stack` is imported from `expo-router/stack` (it is no longer
 * re-exported from the `expo-router` root entry). Expo Router auto-discovers
 * `(tabs)/_layout.tsx` and `login.tsx` as children of this Stack.
 */
import { QueryClientProvider } from '@tanstack/react-query';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
  useRouter,
  useSegments,
} from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, useColorScheme, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth, type AuthStatus } from '@/lib/auth';
import { OrgProvider } from '@/lib/org-context';
import { queryClient } from '@/lib/query-client';

/**
 * Redirect between the authenticated `(tabs)` group and the root `login` screen
 * based on auth status. No-op while `bootstrapping` (the caller renders a
 * spinner instead) to avoid a wrong-screen flash before the session is known.
 */
function useProtectedRoute(status: AuthStatus) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === 'bootstrapping') return;

    const inAuthGroup = segments[0] === '(tabs)';

    if (status === 'unauthenticated' && inAuthGroup) {
      router.replace('/login');
    } else if (status === 'authenticated' && segments[0] === 'login') {
      router.replace('/');
    }
  }, [status, segments, router]);
}

function RootNavigator() {
  const { status } = useAuth();
  useProtectedRoute(status);

  if (status === 'bootstrapping') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OrgProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <AnimatedSplashOverlay />
            <RootNavigator />
          </ThemeProvider>
        </OrgProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
