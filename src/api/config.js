import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Resolve the backend base URL for the current runtime.
 *
 * Priority:
 *   1. EXPO_PUBLIC_API_BASE env var (e.g. "http://10.0.0.42:3001")
 *   2. Expo Go: derive from the Metro bundler host (the LAN IP of the dev machine)
 *   3. Web / fallback: "http://localhost:3001"
 *
 * This means:
 *   - On the web preview, we hit the backend on the same machine via localhost.
 *   - On a phone running Expo Go, we hit the dev machine's LAN IP automatically.
 *   - You can override anything by setting EXPO_PUBLIC_API_BASE in your shell or .env.
 */
function resolveBase() {
  if (process.env.EXPO_PUBLIC_API_BASE) {
    return process.env.EXPO_PUBLIC_API_BASE.replace(/\/+$/, '');
  }

  if (Platform.OS !== 'web') {
    const hostUri =
      Constants?.expoConfig?.hostUri ||
      Constants?.expoGoConfig?.debuggerHost ||
      Constants?.manifest?.debuggerHost ||
      Constants?.manifest2?.extra?.expoGo?.debuggerHost;

    if (hostUri && typeof hostUri === 'string') {
      const host = hostUri.split(':')[0];
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return `http://${host}:3001`;
      }
    }
  }

  return 'http://localhost:3001';
}

export const API_BASE = resolveBase();
