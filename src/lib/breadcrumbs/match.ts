/**
 * Match a pathname against a route pattern. Patterns use `:name` for dynamic
 * segments (e.g. `/wizard-demo/:id/view`). Returns the captured params, or
 * `null` if the pattern does not match.
 *
 * Intentionally tiny — no wildcards, no optional segments. Add only when
 * a real consumer needs it.
 */
export function matchPath(
  pattern: string,
  pathname: string,
): Record<string, string> | null {
  const p = pattern.split("/").filter(Boolean)
  const s = pathname.split("/").filter(Boolean)
  if (p.length !== s.length) return null

  const params: Record<string, string> = {}
  for (let i = 0; i < p.length; i++) {
    const seg = p[i]
    if (seg.startsWith(":")) {
      params[seg.slice(1)] = decodeURIComponent(s[i])
    } else if (seg !== s[i]) {
      return null
    }
  }
  return params
}
