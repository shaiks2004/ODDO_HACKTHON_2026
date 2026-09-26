import { DATA_SOURCE } from '../../config/dataSource';
import { apiClient } from '../../lib/apiClient';
import { storage, STORAGE_KEYS } from '../../lib/storage';
import { User, LoginCredentials, RegisterData, AuthResponse } from '../../types/auth';
import { mockUsers } from '../../data/mock/users';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (DATA_SOURCE === 'api') {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      storage.setString(STORAGE_KEYS.AUTH_TOKEN, response.token);
      storage.set(STORAGE_KEYS.AUTH_USER, response.user);
      return response;
    }

    // Mock Authentication Logic
    const normalizedEmail = credentials.email.toLowerCase().trim();
    const existing = mockUsers.find((u) => u.email.toLowerCase() === normalizedEmail);

    const user: User = existing || {
      id: `user-${Date.now()}`,
      name: credentials.email.split('@')[0] || 'Operator',
      email: credentials.email,
      role: 'Inventory Manager',
      department: 'Warehouse Operations',
      assignedWarehouse: 'Main Warehouse',
    };

    const mockToken = `mock-jwt-token-${user.id}-${Date.now()}`;
    storage.setString(STORAGE_KEYS.AUTH_TOKEN, mockToken);
    storage.set(STORAGE_KEYS.AUTH_USER, user);

    return { user, token: mockToken };
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    if (DATA_SOURCE === 'api') {
      const response = await apiClient.post<AuthResponse>('/auth/register', data);
      storage.setString(STORAGE_KEYS.AUTH_TOKEN, response.token);
      storage.set(STORAGE_KEYS.AUTH_USER, response.user);
      return response;
    }

    // Mock Registration Logic
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: data.name,
      email: data.email,
      role: 'Inventory Specialist',
      department: 'Logistics Operations',
      assignedWarehouse: 'Main Warehouse',
    };

    const mockToken = `mock-jwt-token-${newUser.id}-${Date.now()}`;
    storage.setString(STORAGE_KEYS.AUTH_TOKEN, mockToken);
    storage.set(STORAGE_KEYS.AUTH_USER, newUser);

    return { user: newUser, token: mockToken };
  },

  logout(): void {
    if (DATA_SOURCE === 'api') {
      apiClient.post('/auth/logout').catch(() => {
        // Suppress network error during logout cleanup
      });
    }
    storage.clearAuth();
  },

  getCurrentUser(): User | null {
    return storage.get<User | null>(STORAGE_KEYS.AUTH_USER, null);
  },

  getToken(): string {
    return storage.getString(STORAGE_KEYS.AUTH_TOKEN, '');
  },

  isAuthenticated(): boolean {
    return Boolean(storage.getString(STORAGE_KEYS.AUTH_TOKEN));
  },
};
