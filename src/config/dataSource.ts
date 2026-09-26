/**
 * Central configuration for data source (Mock vs API)
 *
 * Configured via environment variables:
 * - VITE_DATA_SOURCE: 'mock' (default) | 'api'
 * - VITE_API_BASE_URL: Backend REST API endpoint (e.g. 'http://localhost:8000')
 */

export type DataSourceType = 'mock' | 'api';

const rawDataSource = (import.meta.env.VITE_DATA_SOURCE || 'mock').toLowerCase();
export const DATA_SOURCE: DataSourceType = rawDataSource === 'api' ? 'api' : 'mock';

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const isMockMode = (): boolean => DATA_SOURCE === 'mock';
export const isApiMode = (): boolean => DATA_SOURCE === 'api';
