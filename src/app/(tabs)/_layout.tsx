import { Redirect } from 'expo-router';

import AppTabs from '@/components/app-tabs';
import { useAuth } from '@/lib/auth';

export default function TabsLayout() {
  const { status } = useAuth();

  if (status === 'unauthenticated') {
    return <Redirect href="/login" />;
  }

  return <AppTabs />;
}
