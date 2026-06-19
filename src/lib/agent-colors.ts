/**
 * Agent-type colors + duration-segment helpers for the project Work view.
 *
 * Ported from cascade-web's `src/lib/chart-colors.ts` + the pure
 * `buildDurationSegments` from `work-item-duration-bar.tsx`, so the mobile Work
 * screen colors each agent type the same way the web dashboard does. Hex
 * palettes (not CSS vars) with a light/dark split selected via {@link useAgentColor}.
 */
import { useColorScheme } from '@/hooks/use-color-scheme';

// Light-mode palette (hex approximations of the web chart-N oklch colors).
const CHART_PALETTE_LIGHT = [
  '#e8642a', // planning — orange
  '#3aada0', // implementation — teal
  '#4a7a9b', // review — steel blue
  '#d4c02a', // splitting — yellow
  '#d99c27', // debug — amber
  '#9b59b6', // respond-to-review — purple
  '#e74c3c', // respond-to-ci — red
  '#2ecc71', // other — green
] as const;

// Dark-mode palette.
const CHART_PALETTE_DARK = [
  '#4060d8', // planning — blue-violet
  '#40c087', // implementation — emerald
  '#d99c27', // review — amber
  '#b045d4', // splitting — purple
  '#e04a3a', // debug — red-orange
  '#7b68ee', // respond-to-review — slate blue
  '#ff6b6b', // respond-to-ci — salmon
  '#52d67a', // other — green
] as const;

const KNOWN_AGENT_TYPES: Record<string, number> = {
  planning: 0,
  implementation: 1,
  review: 2,
  splitting: 3,
  debug: 4,
  'respond-to-review': 5,
  'respond-to-ci': 6,
  'respond-to-pr-comment': 6,
  'respond-to-planning-comment': 6,
};

function pickColor(agentType: string, palette: readonly string[]): string {
  const idx = KNOWN_AGENT_TYPES[agentType];
  if (idx !== undefined) return palette[idx];
  // Hash-based fallback for unknown agent types (stable per string).
  let hash = 0;
  for (let i = 0; i < agentType.length; i++) {
    hash = (hash * 31 + agentType.charCodeAt(i)) % palette.length;
  }
  return palette[Math.abs(hash) % palette.length];
}

/** Returns a theme-aware `(agentType) => color` resolver. */
export function useAgentColor(): (agentType: string) => string {
  const scheme = useColorScheme();
  const palette = scheme === 'dark' ? CHART_PALETTE_DARK : CHART_PALETTE_LIGHT;
  return (agentType: string) => pickColor(agentType, palette);
}

// ─── Duration segments ──────────────────────────────────────────────────────

export type RunSegmentInput = {
  agentType: string;
  durationMs: number;
  status: string;
};

export type DurationSegment = {
  agentType: string;
  durationMs: number;
  status: string;
  color: string;
  pct: number;
};

/**
 * Converts run breakdowns into stacked-bar segments (pure; mirrors the web
 * `buildDurationSegments`). Runs with no duration are dropped; `pct` is each
 * run's share of the total.
 */
export function buildDurationSegments(
  runs: RunSegmentInput[],
  colorFn: (agentType: string) => string,
): DurationSegment[] {
  const withDuration = runs.filter((r) => r.durationMs > 0);
  if (withDuration.length === 0) return [];

  const totalMs = withDuration.reduce((sum, r) => sum + r.durationMs, 0);
  return withDuration.map((run) => ({
    agentType: run.agentType,
    durationMs: run.durationMs,
    status: run.status,
    color: colorFn(run.agentType),
    pct: totalMs > 0 ? (run.durationMs / totalMs) * 100 : 0,
  }));
}
