const RETRY_DELAYS_MINUTES = [1, 5, 15, 60] as const;

export function nextRetryAt(
  attemptCount: number,
  failedAt: string
): string | null {
  const delay = RETRY_DELAYS_MINUTES[attemptCount - 1];
  if (delay === undefined) return null;
  return new Date(new Date(failedAt).getTime() + delay * 60_000).toISOString();
}
