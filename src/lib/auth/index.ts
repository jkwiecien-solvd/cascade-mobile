/**
 * Public surface of the auth layer. Import from `@/lib/auth` rather than
 * reaching into individual modules.
 */
export { AuthProvider, useAuth } from './auth-provider';
export { AuthError } from './auth-service';
export type { AuthState, AuthStatus } from './auth-provider';
export type { AuthUser } from './auth-service';
