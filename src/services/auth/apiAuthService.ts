import { apiClient } from '../../lib/apiClient';
import { storage, STORAGE_KEYS } from '../../lib/storage';
import {
  User,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  SendOtpResponse,
  VerifyOtpResponse,
  PasswordResetData,
} from '../../types/auth';
import { IAuthService } from './authInterface';

export const apiAuthService: IAuthService = {
  getCurrentUser(): User | null {
    return storage.get<User | null>(STORAGE_KEYS.AUTH_USER, null);
  },

  getToken(): string {
    return storage.getString(STORAGE_KEYS.AUTH_TOKEN, '');
  },

  isAuthenticated(): boolean {
    return Boolean(storage.getString(STORAGE_KEYS.AUTH_TOKEN));
  },

  logout(): void {
    apiClient.post('/auth/logout').catch(() => {});
    storage.clearAuth();
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    storage.setString(STORAGE_KEYS.AUTH_TOKEN, response.token);
    storage.set(STORAGE_KEYS.AUTH_USER, response.user);
    return response;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    storage.setString(STORAGE_KEYS.AUTH_TOKEN, response.token);
    storage.set(STORAGE_KEYS.AUTH_USER, response.user);
    return response;
  },

  async sendLoginOtp(email: string): Promise<SendOtpResponse> {
    return apiClient.post<SendOtpResponse>('/auth/otp/send-login', { email });
  },

  async verifyLoginOtp(email: string, otp: string): Promise<VerifyOtpResponse> {
    const res = await apiClient.post<VerifyOtpResponse>('/auth/otp/verify-login', { email, otp });
    if (res.success && res.token && res.user) {
      storage.setString(STORAGE_KEYS.AUTH_TOKEN, res.token);
      storage.set(STORAGE_KEYS.AUTH_USER, res.user);
    }
    return res;
  },

  async sendSignupOtp(email: string): Promise<SendOtpResponse> {
    return apiClient.post<SendOtpResponse>('/auth/otp/send-signup', { email });
  },

  async verifySignupOtp(email: string, otp: string): Promise<VerifyOtpResponse> {
    return apiClient.post<VerifyOtpResponse>('/auth/otp/verify-signup', { email, otp });
  },

  async completeSignup(data: RegisterData, otp: string): Promise<VerifyOtpResponse> {
    const res = await apiClient.post<VerifyOtpResponse>('/auth/otp/complete-signup', { ...data, otp });
    if (res.success && res.token && res.user) {
      storage.setString(STORAGE_KEYS.AUTH_TOKEN, res.token);
      storage.set(STORAGE_KEYS.AUTH_USER, res.user);
    }
    return res;
  },

  async sendPasswordResetOtp(email: string): Promise<SendOtpResponse> {
    return apiClient.post<SendOtpResponse>('/auth/otp/send-reset', { email });
  },

  async verifyPasswordResetOtp(email: string, otp: string): Promise<VerifyOtpResponse> {
    return apiClient.post<VerifyOtpResponse>('/auth/otp/verify-reset', { email, otp });
  },

  async resetPassword(data: PasswordResetData): Promise<{ success: boolean; error?: string }> {
    return apiClient.post<{ success: boolean; error?: string }>('/auth/otp/reset-password', data);
  },
};
