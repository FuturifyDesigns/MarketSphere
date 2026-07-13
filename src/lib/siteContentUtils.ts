export function getAtPath<T = unknown>(source: unknown, path: string): T | undefined {
  if (!path) return source as T
  const parts = path.split('.')
  let current: unknown = source
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined
    const index = Number(part)
    if (!Number.isNaN(index) && Array.isArray(current)) {
      current = current[index]
      continue
    }
    current = (current as Record<string, unknown>)[part]
  }
  return current as T | undefined
}

function ensureChild(
  current: Record<string, unknown> | unknown[],
  part: string,
  nextPart?: string,
): Record<string, unknown> | unknown[] {
  const index = Number(part)
  const isIndex = !Number.isNaN(index) && Array.isArray(current)
  const nextIsIndex = nextPart !== undefined && !Number.isNaN(Number(nextPart))

  if (isIndex) {
    const arr = current as unknown[]
    if (arr[index] == null || typeof arr[index] !== 'object') {
      arr[index] = nextIsIndex ? [] : {}
    }
    return arr[index] as Record<string, unknown> | unknown[]
  }

  const record = current as Record<string, unknown>
  if (record[part] == null || typeof record[part] !== 'object') {
    record[part] = nextIsIndex ? [] : {}
  }
  return record[part] as Record<string, unknown> | unknown[]
}

export function setAtPath<T extends Record<string, unknown> | unknown[]>(
  source: T,
  path: string,
  value: unknown,
): T {
  const parts = path.split('.')
  const root = structuredClone(source) as Record<string, unknown> | unknown[]
  let current: Record<string, unknown> | unknown[] = root

  parts.forEach((part, index) => {
    const isLast = index === parts.length - 1
    const numeric = Number(part)
    const isIndex = !Number.isNaN(numeric) && Array.isArray(current)

    if (isLast) {
      if (isIndex) {
        ;(current as unknown[])[numeric] = value
      } else {
        ;(current as Record<string, unknown>)[part] = value
      }
      return
    }

    current = ensureChild(current, part, parts[index + 1])
  })

  return root as T
}
