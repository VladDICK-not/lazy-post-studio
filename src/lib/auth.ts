import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'cps_session';

/**
 * Validates whether the provided password matches the ADMIN_PASSWORD.
 */
export function verifyAdminPassword(password: string): boolean {
  const masterPassword = process.env.ADMIN_PASSWORD;
  if (!masterPassword) {
    // If ADMIN_PASSWORD is not set, allow access with default password
    return password === 'admin123';
  }
  return password === masterPassword;
}

/**
 * Checks if the current incoming request has a valid admin session cookie.
 */
export function isRequestAuthenticated(): boolean {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const masterPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (!sessionToken) return false;
  
  // Verify token matches simple hash of password
  const expectedToken = Buffer.from(`auth_${masterPassword}`).toString('base64');
  return sessionToken === expectedToken;
}

/**
 * Sets session cookie for authenticated user.
 */
export function getSessionToken(): string {
  const masterPassword = process.env.ADMIN_PASSWORD || 'admin123';
  return Buffer.from(`auth_${masterPassword}`).toString('base64');
}

export { SESSION_COOKIE_NAME };
