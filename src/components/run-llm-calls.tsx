/**
 * RunLlmCalls — expandable list of a run's LLM calls for the run detail screen.
 *
 * Each row shows a collapsed summary (model · token summary · cost) and expands
 * on tap to reveal full detail: input / output / cached tokens, duration, cost,
 * model, tool call names, and text/thinking previews.
 *
 * ## Type note
 * `runs.getLlmCalls`'s output is inferred from the backend `AppRouter` (sibling
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
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { EmptyState, ErrorState, Loading } from '@/components/query-states';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
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
  costUsd?: number;
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
        {/* Collapsed row: chevron + summary line */}
        <View style={styles.collapsedRow}>
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={styles.chevron}>
            {open ? '▾' : '▸'}
          </ThemedText>
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
          </View>
        </View>
      </Pressable>

      {/* Expanded detail */}
      {open ? (
        <Animated.View entering={FadeIn.duration(200)}>
          <View style={styles.expandedContent}>
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

export function RunLlmCalls({ runId }: { runId: string }) {
  const { data, isPending, isError, error, refetch } = useRunLlmCalls(runId);

  if (isPending) return <Loading message="Loading LLM calls…" />;
  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : undefined}
        onRetry={refetch}
      />
    );
  }

  const items = (data ?? []) as LlmCallItem[];

  if (items.length === 0) {
    return <EmptyState message="No LLM calls for this run." />;
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => <LlmCallRow item={item} />}
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
    padding: Spacing.three,
    gap: Spacing.two,
    flexGrow: 1,
  },
  card: {
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
  collapsedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  chevron: {
    width: 16,
    textAlign: 'center',
  },
  summaryContent: {
    flex: 1,
    gap: Spacing.half,
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
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
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
