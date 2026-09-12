import { useEffect, useState } from 'react'

/**
 * Debounce a fast-changing value (e.g., search input) so queries only fire
 * after the user pauses. Default 300ms per FE-S010-01.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])

  return debounced
}
