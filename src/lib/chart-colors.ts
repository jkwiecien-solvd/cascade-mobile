/**
 * Agent-type color mapping for the project Stats charts.
 *
 * Ported from `../cascade/web/src/lib/chart-colors.ts` so the mobile pie/bar
 * charts use the same per-agent palette as the reference web client. SVG (like
 * recharts on web) needs concrete color values, so we keep hex palettes rather
 * than theme tokens, and pick the light/dark variant from the color scheme via
 * {@link useAgentColor}.
 */
import { useColorScheme } from '@/hooks/use-color-scheme';

// Hex approximations of the light-mode chart colors from the web `index.css`.
export const CHART_PALETTE_LIGHT = [
  '#e8642a', // planning — orange
  '#3aada0', // implementation — teal
  '#4a7a9b', // review — steel blue
  '#d4c02a', // splitting — yellow
  '#d99c27', // debug — amber
  '#9b59b6', // respond-to-review — purple
  '#e74c3c', // respond-to-ci — red
  '#2ecc71', // other agents — green
] as const;

// Hex approximations of the dark-mode chart colors from the web `.dark` theme.
export const CHART_PALETTE_DARK = [
  '#4060d8', // planning — blue-violet
  '#40c087', // implementation — emerald
  '#d99c27', // review — amber
  '#b045d4', // splitting — purple
  '#e04a3a', // debug — red-orange
  '#7b68ee', // respond-to-review — slate blue
  '#ff6b6b', // respond-to-ci — salmon
  '#52d67a', // other agents — green
] as const;

/** Stable palette index per known agent type (mirrors the web mapping). */
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

/**
 * Resolve a color for an agent type against a palette: known types get their
 * stable index; unknown types fall back to a deterministic hash so the same
 * slug always renders the same color.
 */
export function getAgentColor(agentType: string, palette: readonly string[]): string {
  const idx = KNOWN_AGENT_TYPES[agentType];
  if (idx !== undefined) return palette[idx % palette.length];

  let hash = 0;
  for (let i = 0; i < agentType.length; i++) {
    hash = (hash * 31 + agentType.charCodeAt(i)) % palette.length;
  }
  return palette[Math.abs(hash) % palette.length];
}

/**
 * Theme-aware agent-color resolver: returns a `(agentType) => hex` function
 * bound to the active light/dark palette (parallels web's `useChartColors`).
 */
export function useAgentColor(): (agentType: string) => string {
  const scheme = useColorScheme();
  const palette = scheme === 'dark' ? CHART_PALETTE_DARK : CHART_PALETTE_LIGHT;
  return (agentType: string) => getAgentColor(agentType, palette);
}
