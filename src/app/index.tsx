import { Redirect } from 'expo-router';

import { useAuth } from '@/lib/auth';

/**
 * Root index route.
 * Redirects authenticated users to `/runs` (the default tab) and unauthenticated users to `/login`.
 */
export default function RootIndex() {
  const { status } = useAuth();

  if (status === 'bootstrapping') {
    return null;
  }

  if (status === 'unauthenticated') {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/runs" />;
}
