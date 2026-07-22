/** Soft-fail async helpers so network blips don't crash the SPA. */

export async function safeAsync<T>(
  task: () => Promise<T>,
  fallback: T,
): Promise<{ data: T; error: Error | null }> {
  try {
    const data = await task()
    return { data, error: null }
  } catch (error) {
    return {
      data: fallback,
      error: error instanceof Error ? error : new Error('Request failed'),
    }
  }
}

export function sanitizePostgrestFilter(value: string) {
  return value
    .replace(/[%_,.()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
}

export function displayName(value: string | null | undefined, fallback = 'Unknown') {
  const trimmed = value?.trim()
  return trimmed || fallback
}

export function initialLetter(value: string | null | undefined, fallback = '?') {
  const trimmed = value?.trim()
  return trimmed ? trimmed.charAt(0).toUpperCase() : fallback
}
