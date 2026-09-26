import { UnitOfMeasure } from './product';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  assignedWarehouse: string;
}

export interface UserProfile extends User {}

export interface UserSettings {
  defaultWarehouse: string;
  lowStockThreshold: number;
  defaultUnit: UnitOfMeasure;
  notificationsEnabled: boolean;
}

export interface LoginCredentials {
  email: string;
  password?: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password?: string;
  confirmPassword?: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
