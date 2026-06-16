/**
 * Web implementation of the cookie jar.
 * On web, the browser automatically manages cookies in the cookie jar,
 * so all capture and restore operations are no-ops.
 */

export async function captureFromResponse(response: Response): Promise<void> {
  // No-op: Browser handles Set-Cookie automatically
}

export async function restoreCookies(): Promise<void> {
  // No-op: Browser handles cookie persistence automatically
}

export async function clearCookies(): Promise<void> {
  // On web, cookies are cleared by the browser or by server-set headers during logout.
}

export function getCookieHeaderSync(): string | null {
  // No-op: Browser automatically appends the Cookie header, so we return null
  // so tRPC does not manually append a Cookie header.
  return null;
}
