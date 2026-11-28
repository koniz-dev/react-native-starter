/** Removes credentials, query, and fragment before a URL reaches logs or reports. */
export function sanitizeUrl(url: string): string {
  return url
    .split(/[?#]/, 1)[0]!
    .replace(/^((?:[a-z][a-z0-9+.-]*:)?\/\/)[^/]*@/i, '$1');
}
