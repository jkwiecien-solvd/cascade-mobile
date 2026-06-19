/**
 * RunLlmCalls — expandable list of a run's LLM calls for the run detail screen.
 *
 * Each row shows a collapsed summary (model · token summary · cost) and expands
 * on tap to reveal full detail: input / output / cached tokens, duration, cost,
 * model, tool call names, and text/thinking previews.
 *
 * ## Type note
 * `runs.listLlmCalls`'s output is inferred from the backend `AppRouter` (sibling
 * `../cascade` repo, absent in this checkout). Rendering reads the fields through
 * {@link LlmCallItem} — a narrow local view (same cross-repo narrowing idiom as
 * `RunListItem` in `run-card.tsx`) — so the component stays typed (no `any`) and
 * tolerates optional/renamed fields the contract may omit. Field names must be
 * confirmed against `../cascade/src/api/routers/runs.ts`.
 *
 * ## Perf note
 * Each {@link LlmCallRow} owns its own `useState(open)` so toggling one row
 * only re-renders that row (same per-item isolation rationale as `LiveDuration`;
 * React Compiler is on).
 */
import { type ReactElement, useState } from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, Loading } from '@/components/query-states';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useRunLlmCalls } from '@/hooks/use-run-llm-calls';
import { formatDuration, formatLlmCost, formatTokens } from '@/lib/relative-time';

// ─── Narrow local type ──────────────────────────────────────────────────────

/**
 * Narrow view of the fields this component renders per LLM call.
 * Every field but `id` is optional so missing/renamed contract fields render
 * blank, never crash (same idiom as `RunListItem`).
 */
type LlmCallItem = {
  id: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  cachedTokens?: number;
  costUsd?: number | string;
  durationMs?: number;
  toolCalls?: ({ name?: string } | string)[];
  textPreview?: string;
  thinkingPreview?: string;
};

// ─── Detail row helper ──────────────────────────────────────────────────────

/** A single label / value detail row inside an expanded card. */
function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.detailLabel}>
        {label}
      </ThemedText>
      <ThemedText type="small" style={styles.detailValue}>
        {value}
      </ThemedText>
    </View>
  );
}

// ─── LlmCallRow ─────────────────────────────────────────────────────────────

function LlmCallRow({ item }: { item: LlmCallItem }) {
  const [open, setOpen] = useState(false);
  const theme = useTheme();

  const inputStr = formatTokens(item.inputTokens);
  const outputStr = formatTokens(item.outputTokens);
  const cachedStr = formatTokens(item.cachedTokens);
  const cost = formatLlmCost(item.costUsd);
  const duration = formatDuration(item.durationMs);

  // Tool call names.
  const toolCallNames = item.toolCalls
    ?.map((t) => (typeof t === 'string' ? t : t.name))
    .filter(Boolean) as string[] | undefined;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
        {/* Collapsed row: summary line + (when closed) text preview */}
        <View style={styles.summaryContent}>
          {item.model ? (
            <ThemedText type="smallBold" numberOfLines={1} style={styles.modelText}>
              {item.model}
            </ThemedText>
          ) : null}
          <View style={styles.metaRow}>
            {inputStr && outputStr ? (
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {inputStr} → {outputStr}
              </ThemedText>
            ) : inputStr ? (
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {inputStr} in
              </ThemedText>
            ) : null}
            {cost ? (
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {cost}
              </ThemedText>
            ) : null}
          </View>
          {!open && item.textPreview ? (
            <ThemedText
              type="small"
              themeColor="textSecondary"
              numberOfLines={2}
              style={styles.collapsedPreview}>
              {item.textPreview}
            </ThemedText>
          ) : null}
        </View>
      </Pressable>

      {/* Expanded detail */}
      {open ? (
        <Animated.View entering={FadeIn.duration(200)}>
          <View style={[styles.expandedContent, { borderTopColor: theme.border }]}>
            <DetailRow label="Model" value={item.model} />
            <DetailRow label="Input tokens" value={inputStr} />
            <DetailRow label="Output tokens" value={outputStr} />
            <DetailRow label="Cached tokens" value={cachedStr} />
            <DetailRow label="Duration" value={duration} />
            <DetailRow label="Cost" value={cost} />

            {/* Tool calls */}
            {toolCallNames && toolCallNames.length > 0 ? (
              <View style={styles.detailRow}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.detailLabel}>
                  Tool calls
                </ThemedText>
                <ThemedText type="small" style={styles.detailValue} numberOfLines={3}>
                  {toolCallNames.join(', ')}
                </ThemedText>
              </View>
            ) : null}

            {/* Text preview */}
            {item.textPreview ? (
              <View style={styles.previewBlock}>
                <ThemedText type="small" themeColor="textSecondary">
                  Text preview
                </ThemedText>
                <ThemedText type="code">
                  {item.textPreview}
                </ThemedText>
              </View>
            ) : null}

            {/* Thinking preview */}
            {item.thinkingPreview ? (
              <View style={styles.previewBlock}>
                <ThemedText type="small" themeColor="textSecondary">
                  Thinking preview
                </ThemedText>
                <ThemedText type="code">
                  {item.thinkingPreview}
                </ThemedText>
              </View>
            ) : null}
          </View>
        </Animated.View>
      ) : null}
    </ThemedView>
  );
}

// ─── RunLlmCalls ────────────────────────────────────────────────────────────

export function RunLlmCalls({
  runId,
  header,
  tabs,
}: {
  runId: string;
  /** Run header card — scrolls away as the list's `ListHeaderComponent`. */
  header?: ReactElement | null;
  /** Section navigation tabs — pinned in the sticky section header. */
  tabs?: ReactElement | null;
}) {
  const { data, isPending, isError, error, refetch } = useRunLlmCalls(runId);
  const insets = useSafeAreaInsets();

  const isReady = !isPending && !isError;
  const items = isReady ? ((data?.calls ?? []) as LlmCallItem[]) : [];

  const emptyComponent = isPending ? (
    <Loading message="Loading LLM calls…" />
  ) : isError ? (
    <ErrorState message={error instanceof Error ? error.message : undefined} onRetry={refetch} />
  ) : (
    <EmptyState message="No LLM calls for this run." />
  );

  return (
    <SectionList
      sections={[{ data: items }]}
      keyExtractor={(item) => item.id}
      style={styles.list}
      contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + Spacing.three }]}
      stickySectionHeadersEnabled
      ListHeaderComponent={header ?? null}
      renderSectionHeader={() => <ThemedView style={styles.stickyHeader}>{tabs}</ThemedView>}
      renderItem={({ item }) => <LlmCallRow item={item} />}
      // SectionList always counts a header+footer per section, so itemCount is
      // never 0 and ListEmptyComponent never fires — render the state in the
      // (always-rendered) section footer instead.
      renderSectionFooter={() =>
        items.length === 0 ? <View style={styles.stateFooter}>{emptyComponent}</View> : null
      }
    />
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  list: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  listContent: {
    flexGrow: 1,
  },
  stickyHeader: {
    paddingBottom: Spacing.two,
  },
  stateFooter: {
    minHeight: 240,
  },
  card: {
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  pressable: {
    gap: Spacing.half,
  },
  pressed: {
    opacity: 0.7,
  },
  summaryContent: {
    flex: 1,
    gap: Spacing.half,
  },
  collapsedPreview: {
    marginTop: Spacing.half,
  },
  modelText: {
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.two,
  },
  expandedContent: {
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    gap: Spacing.one,
    borderTopWidth: StyleSheet.hairlineWidth,
    // borderTopColor applied dynamically via theme.border
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    paddingVertical: Spacing.half,
  },
  detailLabel: {
    width: 100,
    flexShrink: 0,
  },
  detailValue: {
    flex: 1,
  },
  previewBlock: {
    gap: Spacing.half,
    paddingVertical: Spacing.half,
  },
});
