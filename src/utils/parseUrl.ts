export function parseUrl(url: string): [string | null, string | null] {
  const match = url.match(/^(.*:\/\/)(.*)$/)
  if (!match) {
    return [null, null]
  }
  const [, protocol, rest] = match
  return [protocol, rest]
}
