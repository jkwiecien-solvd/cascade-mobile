/**
 * RunStatusBadge — a small themed pill that renders a run's status with a
 * status-specific label + color.
 *
 * The status→color map is co-located here (mirroring the inline color literals
 * already used in `login.tsx`) rather than expanded into `constants/theme.ts`,
 * which is reserved for the shared light/dark palette. Unknown/new statuses
 * degrade gracefully to a neutral pill with a prettified label, so the badge
 * stays correct even if the backend enum gains a value before this map does.
 *
 * Built from `ThemedText` + a tinted `View` pill (the tint needs a per-status
 * background, so a plain `View` is used rather than a fixed-palette `ThemedView`).
 */
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

const NEUTRAL = '#8b8d98';

/** Maps a backend run status (lower-cased) to a display label + accent color. */
const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  queued: { label: 'Queued', color: NEUTRAL },
  pending: { label: 'Pending', color: NEUTRAL },
  running: { label: 'Running', color: '#3c87f7' },
  in_progress: { label: 'In progress', color: '#3c87f7' },
  succeeded: { label: 'Succeeded', color: '#30a46c' },
  success: { label: 'Succeeded', color: '#30a46c' },
  completed: { label: 'Completed', color: '#30a46c' },
  failed: { label: 'Failed', color: '#e5484d' },
  error: { label: 'Error', color: '#e5484d' },
  cancelled: { label: 'Cancelled', color: '#d97706' },
  canceled: { label: 'Cancelled', color: '#d97706' },
};

/** Turn an unknown status like `needs_review` into a readable `Needs Review`. */
function prettify(status: string): string {
  return status
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function RunStatusBadge({ status }: { status: string }) {
  const known = STATUS_STYLES[status.toLowerCase()];
  const color = known?.color ?? NEUTRAL;
  const label = known?.label ?? prettify(status) ?? status;

  return (
    <View style={[styles.badge, { backgroundColor: `${color}22`, borderColor: color }]}>
      <ThemedText type="smallBold" style={{ color }}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.five,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
