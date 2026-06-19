/**
 * Pure helper: extract a `runId` from a notification's data payload.
 *
 * Pulled out of the provider so it is unit-testable without the native module.
 * The expected shape matches the proposed backend payload:
 * `{ title, body, data: { runId } }`.
 */

/**
 * Extract `runId` from the notification data, or `null` when the payload does
 * not carry one (e.g. a notification that isn't about a specific run).
 */
export function extractRunId(data: Record<string, unknown> | undefined | null): string | null {
  if (!data) return null;
  const runId = data.runId;
  if (typeof runId === 'string' && runId.length > 0) return runId;
  return null;
}
