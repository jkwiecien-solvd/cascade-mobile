import { Platform } from 'react-native';

function resolveDefault(): string {
  // Android emulator reaches the host machine via the special 10.0.2.2 alias.
  if (Platform.OS === 'android') return 'http://10.0.2.2:3001';
  // iOS simulator and web both resolve `localhost` to the host machine.
  return 'http://localhost:3001';
}

/**
 * Base URL for the cascade Dashboard API.
 *
 * Resolution order:
 *  1. `EXPO_PUBLIC_API_URL` (inlined at build/runtime by Expo) — REQUIRED for
 *     physical devices, which cannot reach `localhost` or `10.0.2.2`.
 *  2. Platform-specific default suitable for the iOS simulator, Android
 *     emulator, and web dev server.
 *
 * For physical devices, set this in `.env.local` to the host machine's LAN IP
 * (e.g. `EXPO_PUBLIC_API_URL=http://192.168.1.42:3001`). This cannot be
 * auto-detected at build time.
 */
export const API_URL: string = process.env.EXPO_PUBLIC_API_URL ?? resolveDefault();
