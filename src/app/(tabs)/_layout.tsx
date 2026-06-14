/**
 * Layout for the authenticated tab group.
 *
 * Parenthesized segments are URL-transparent, so `/` and `/explore` are
 * unchanged — the `(tabs)` group simply lets the whole authed app sit behind one
 * layout while `login.tsx` lives at the root, outside it. App-wide providers and
 * the auth gate live in the root layout (`src/app/_layout.tsx`).
 */
import AppTabs from '@/components/app-tabs';

export default function TabsLayout() {
  return <AppTabs />;
}
