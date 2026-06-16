/**
 * relative-time — pure, dependency-free formatting helpers for the Runs feed.
 *
 * No date library (see `ai/RULES.md §2` — "ask before adding deps"): these are
 * small, self-contained functions that turn the raw `runs.list` fields into the
 * compact strings the `RunCard` renders. Every helper tolerates `null` /
 * `undefined` / unparseable input by returning `null` (or a neutral fallback)
 * so the card stays correct even when the contract omits a field.
 */

/** Coerce an ISO string, epoch-millis number, or `Date` into millis, or `null`. */
export function toMillis(input: string | number | Date | null | undefined): number | null {
  if (input == null) return null;
  if (input instanceof Date) {
    const ms = input.getTime();
    return Number.isNaN(ms) ? null : ms;
  }
  if (typeof input === 'number') {
    return Number.isFinite(input) ? input : null;
  }
  const parsed = Date.parse(input);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Format a start time as a compact relative string: `"just now"`, `"5m ago"`,
 * `"3h ago"`, `"2d ago"`. Returns `null` for missing/unparseable input.
 *
 * `now` is injectable for deterministic tests.
 */
export function formatRelativeTime(
  input: string | number | Date | null | undefined,
  now: number = Date.now(),
): string | null {
  const ms = toMillis(input);
  if (ms == null) return null;

  const diffSeconds = Math.round((now - ms) / 1000);
  // Future timestamps (clock skew) collapse to "just now" rather than negatives.
  if (diffSeconds < 60) return 'just now';

  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Format a duration in milliseconds as a compact `"1m 23s"` / `"2h 5m"` /
 * `"45s"`. Returns `null` for missing/negative input.
 */
export function formatDuration(ms: number | null | undefined): string | null {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return null;

  const totalSeconds = Math.floor(ms / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

/**
 * Format a USD cost as `"$0.12"`. Returns `null` for missing input so the
 * caller can omit the segment entirely (zero is a real value → `"$0.00"`).
 */
export function formatCost(usd: number | null | undefined): string | null {
  if (usd == null || !Number.isFinite(usd)) return null;
  return `$${usd.toFixed(2)}`;
}

/**
 * Prettify an agent-type slug for display: `implementation` → `Implementation`,
 * `respond-to-pr-comment` → `Respond to PR comment`. Reuses the same
 * separator-split + title-case idiom as `run-status-badge.tsx`'s `prettify`,
 * with a `PR` special-case so it isn't rendered as `Pr`.
 */
export function formatAgentType(type: string | null | undefined): string {
  if (!type) return 'Run';
  const words = type
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return 'Run';

  return words
    .map((word, index) => {
      if (word.toLowerCase() === 'pr') return 'PR';
      // Capitalise only the first word; keep the rest lower-case so multi-word
      // types read as a sentence ("Respond to PR comment").
      if (index === 0) return word.charAt(0).toUpperCase() + word.slice(1);
      return word;
    })
    .join(' ');
}
