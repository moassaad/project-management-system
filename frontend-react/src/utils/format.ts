/**
 * Simple util for unit test demonstration — formats health status for display.
 * Behavior-focused: converts API status to user-visible label.
 */
export function formatStatus(status: string): string {
  if (!status) return 'Unknown'
  return status.toUpperCase()
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}…`
}
