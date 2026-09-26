/**
 * Isolated Storage Utility
 *
 * Encapsulates all browser storage access (session tokens, user data, prototype state).
 * UI components must NOT call window.localStorage directly.
 */

const STORAGE_PREFIX = 'stocksense_';

export const STORAGE_KEYS = {
  AUTH_TOKEN: `${STORAGE_PREFIX}auth_token`,
  AUTH_USER: `${STORAGE_PREFIX}auth_user`,
  PRODUCTS: `${STORAGE_PREFIX}products_v2`,
  WAREHOUSES: `${STORAGE_PREFIX}warehouses_v2`,
  LOCATIONS: `${STORAGE_PREFIX}locations_v2`,
  RECEIPTS: `${STORAGE_PREFIX}receipts_v2`,
  DELIVERIES: `${STORAGE_PREFIX}deliveries_v2`,
  MOVEMENTS: `${STORAGE_PREFIX}movements_v2`,
  SETTINGS: `${STORAGE_PREFIX}settings_v2`,
  PROFILE: `${STORAGE_PREFIX}profile_v2`,
} as const;

export const storage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore quota exceeded or private browsing errors gracefully
    }
  },

  getString(key: string, defaultValue = ''): string {
    return localStorage.getItem(key) || defaultValue;
  },

  setString(key: string, value: string): void {
    localStorage.setItem(key, value);
  },

  remove(key: string): void {
    localStorage.removeItem(key);
  },

  clearAuth(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  },

  clearAllDemoData(): void {
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.WAREHOUSES);
    localStorage.removeItem(STORAGE_KEYS.LOCATIONS);
    localStorage.removeItem(STORAGE_KEYS.RECEIPTS);
    localStorage.removeItem(STORAGE_KEYS.DELIVERIES);
    localStorage.removeItem(STORAGE_KEYS.MOVEMENTS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
  },
};
