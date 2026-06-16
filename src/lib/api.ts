import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const API_URL_KEY = 'cascade.apiUrl';

function resolveDefault(): string {
  // Android emulator reaches the host machine via the special 10.0.2.2 alias.
  if (Platform.OS === 'android') return 'http://10.0.2.2:3001';
  // iOS simulator and web both resolve `localhost` to the host machine.
  return 'http://localhost:3001';
}

/**
 * Default base URL for the cascade Dashboard API.
 */
export const DEFAULT_API_URL: string = process.env.EXPO_PUBLIC_API_URL || resolveDefault();

// Keep a copy as API_URL to avoid breaking static imports where it's used as a fallback or placeholder.
export const API_URL = DEFAULT_API_URL;

let currentApiUrl = DEFAULT_API_URL;
let isConfigured = false;

/**
 * Returns whether a custom Cascade instance URL has been configured by the user.
 */
export function isApiUrlConfigured(): boolean {
  return isConfigured;
}

/**
 * Returns the currently active Cascade instance URL.
 */
export function getApiUrl(): string {
  return currentApiUrl;
}

/**
 * Loads the saved Cascade instance URL from storage.
 */
export async function loadApiUrl(): Promise<string> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(API_URL_KEY);
        if (stored) {
          currentApiUrl = stored;
          isConfigured = true;
        }
      }
    } else {
      const stored = await SecureStore.getItemAsync(API_URL_KEY);
      if (stored) {
        currentApiUrl = stored;
        isConfigured = true;
      }
    }
  } catch (err) {
    console.error('Failed to load API URL from storage:', err);
  }
  return currentApiUrl;
}

/**
 * Saves the Cascade instance URL to storage.
 */
export async function saveApiUrl(url: string): Promise<void> {
  // Normalize URL (strip trailing slash if present)
  const normalized = url.trim().replace(/\/+$/, '');
  currentApiUrl = normalized;
  isConfigured = true;
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(API_URL_KEY, normalized);
      }
    } else {
      await SecureStore.setItemAsync(API_URL_KEY, normalized);
    }
  } catch (err) {
    console.error('Failed to save API URL to storage:', err);
  }
}

/**
 * Clears the custom Cascade instance URL from storage and resets to default.
 */
export async function clearApiUrl(): Promise<void> {
  currentApiUrl = DEFAULT_API_URL;
  isConfigured = false;
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(API_URL_KEY);
      }
    } else {
      await SecureStore.deleteItemAsync(API_URL_KEY);
    }
  } catch (err) {
    console.error('Failed to clear API URL from storage:', err);
  }
}


