/**
 * LiveDuration — a self-contained, ticking elapsed-time label for *running*
 * runs. It renders `formatDuration(now - startedAt)` and advances once per
 * second via a `setInterval` owned by a `useEffect` (cleared on unmount).
 *
 * Isolating the tick here — rather than threading a list-wide "now" through the
 * Runs `FlatList` — means only the handful of mounted running cards re-render
 * each second, not every row (see `ai/RULES.md` perf note; React Compiler is
 * on, so the clock is mutated only inside the effect, never during render).
 */
import { useEffect, useState } from 'react';

import { ThemedText, type ThemedTextProps } from '@/components/themed-text';
import { formatDuration } from '@/lib/relative-time';

type Props = {
  /** Run start time (ISO string, epoch millis, or `Date`). */
  startedAt: string | number | Date;
} & Pick<ThemedTextProps, 'type' | 'themeColor' | 'style'>;

function toMillis(input: string | number | Date): number | null {
  if (input instanceof Date) {
    const ms = input.getTime();
    return Number.isNaN(ms) ? null : ms;
  }
  if (typeof input === 'number') return Number.isFinite(input) ? input : null;
  const parsed = Date.parse(input);
  return Number.isNaN(parsed) ? null : parsed;
}

export function LiveDuration({ startedAt, type = 'small', themeColor, style }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const start = toMillis(startedAt);
  const elapsed = start == null ? null : formatDuration(now - start);
  if (!elapsed) return null;

  return (
    <ThemedText type={type} themeColor={themeColor} style={style}>
      {elapsed}
    </ThemedText>
  );
}
