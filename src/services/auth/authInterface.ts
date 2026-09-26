import {
  User,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  SendOtpResponse,
  VerifyOtpResponse,
  PasswordResetData,
} from '../../types/auth';

export interface IAuthService {
  login(credentials: LoginCredentials): Promise<AuthResponse>;
  register(data: RegisterData): Promise<AuthResponse>;
  logout(): void;
  getCurrentUser(): User | null;
  getToken(): string;
  isAuthenticated(): boolean;

  sendLoginOtp(email: string): Promise<SendOtpResponse>;
  verifyLoginOtp(email: string, otp: string): Promise<VerifyOtpResponse>;

  sendSignupOtp(email: string): Promise<SendOtpResponse>;
  verifySignupOtp(email: string, otp: string): Promise<VerifyOtpResponse>;
  completeSignup(data: RegisterData, otp: string): Promise<VerifyOtpResponse>;

  sendPasswordResetOtp(email: string): Promise<SendOtpResponse>;
  verifyPasswordResetOtp(email: string, otp: string): Promise<VerifyOtpResponse>;
  resetPassword(data: PasswordResetData): Promise<{ success: boolean; error?: string }>;
}
