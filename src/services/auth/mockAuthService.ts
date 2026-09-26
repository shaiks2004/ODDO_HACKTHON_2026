import { storage, STORAGE_KEYS } from '../../lib/storage';
import {
  User,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  SendOtpResponse,
  VerifyOtpResponse,
  PasswordResetData,
  MockOtpState,
  VerificationMode,
} from '../../types/auth';
import { mockUsers } from '../../data/mock/users';
import { maskEmail } from '../../utils/maskEmail';
import { IAuthService } from './authInterface';

const OTP_STATE_KEY = 'stocksense_mock_otp_state';
const OTP_EXPIRY_MS = 5 * 60 * 1000;
const OTP_COOLDOWN_SEC = 42;
const MAX_VERIFICATION_ATTEMPTS = 5;

export const DEV_FALLBACK_OTP = '123456';

function getStoredOtpState(): MockOtpState | null {
  try {
    const raw = sessionStorage.getItem(OTP_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveOtpState(state: MockOtpState): void {
  sessionStorage.setItem(OTP_STATE_KEY, JSON.stringify(state));
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function dispatchMockOtp(email: string, mode: VerificationMode): Promise<SendOtpResponse> {
  const normalized = email.toLowerCase().trim();
  const existingState = getStoredOtpState();

  const now = Date.now();
  if (
    existingState &&
    existingState.email === normalized &&
    existingState.mode === mode &&
    now < existingState.cooldownUntil
  ) {
    const remainingSec = Math.ceil((existingState.cooldownUntil - now) / 1000);
    return {
      success: false,
      maskedEmail: maskEmail(normalized),
      cooldownSeconds: remainingSec,
      expiresAt: existingState.expiresAt,
      error: `Please wait ${remainingSec}s before requesting a new verification code.`,
    };
  }

  const otp = generateOtp();
  const expiresAt = now + OTP_EXPIRY_MS;
  const cooldownUntil = now + OTP_COOLDOWN_SEC * 1000;

  const newState: MockOtpState = {
    email: normalized,
    otp,
    mode,
    createdAt: now,
    expiresAt,
    cooldownUntil,
    attempts: 0,
    verified: false,
  };

  saveOtpState(newState);

  console.info(
    `[StockSense Security Gateway] Generated OTP for ${normalized}: ${otp} (Universal test code: ${DEV_FALLBACK_OTP})`
  );

  return {
    success: true,
    maskedEmail: maskEmail(normalized),
    cooldownSeconds: OTP_COOLDOWN_SEC,
    expiresAt,
    message: 'Verification code sent.',
  };
}

export const mockAuthService: IAuthService = {
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
    storage.clearAuth();
    sessionStorage.removeItem(OTP_STATE_KEY);
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
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

    const mockToken = `mock-jwt-${user.id}-${Date.now()}`;
    storage.setString(STORAGE_KEYS.AUTH_TOKEN, mockToken);
    storage.set(STORAGE_KEYS.AUTH_USER, user);
    return { user, token: mockToken };
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: data.name,
      email: data.email,
      role: 'Inventory Specialist',
      department: 'Logistics Operations',
      assignedWarehouse: 'Main Warehouse',
    };

    const mockToken = `mock-jwt-${newUser.id}-${Date.now()}`;
    storage.setString(STORAGE_KEYS.AUTH_TOKEN, mockToken);
    storage.set(STORAGE_KEYS.AUTH_USER, newUser);
    return { user: newUser, token: mockToken };
  },

  async sendLoginOtp(email: string): Promise<SendOtpResponse> {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return dispatchMockOtp(email, 'login');
  },

  async verifyLoginOtp(email: string, enteredOtp: string): Promise<VerifyOtpResponse> {
    await new Promise((resolve) => setTimeout(resolve, 450));
    const normalized = email.toLowerCase().trim();
    const state = getStoredOtpState();

    if (!state || state.email !== normalized) {
      if (enteredOtp.trim() === DEV_FALLBACK_OTP) {
        const existing = mockUsers.find((u) => u.email.toLowerCase() === normalized);
        const user: User = existing || {
          id: `user-${Date.now()}`,
          name: normalized.split('@')[0] || 'Operator',
          email: normalized,
          role: 'Inventory Manager',
          department: 'Warehouse Operations',
          assignedWarehouse: 'Main Warehouse',
        };
        const mockToken = `mock-jwt-otp-${user.id}-${Date.now()}`;
        storage.setString(STORAGE_KEYS.AUTH_TOKEN, mockToken);
        storage.set(STORAGE_KEYS.AUTH_USER, user);
        return { success: true, user, token: mockToken };
      }

      return {
        success: false,
        errorType: 'EXPIRED',
        errorMessage: 'Your verification session has expired. Please request a new code.',
      };
    }

    if (state.attempts >= MAX_VERIFICATION_ATTEMPTS) {
      return {
        success: false,
        errorType: 'RATE_LIMITED',
        errorMessage: 'Too many unsuccessful verification attempts. Try again later.',
      };
    }

    if (Date.now() > state.expiresAt) {
      return {
        success: false,
        errorType: 'EXPIRED',
        errorMessage: 'Your verification code has expired.',
      };
    }

    const trimmedInput = enteredOtp.trim();
    const isValid = trimmedInput === state.otp || trimmedInput === DEV_FALLBACK_OTP;

    if (!isValid) {
      state.attempts += 1;
      saveOtpState(state);
      const remaining = MAX_VERIFICATION_ATTEMPTS - state.attempts;

      if (remaining <= 0) {
        return {
          success: false,
          errorType: 'RATE_LIMITED',
          errorMessage: 'Too many unsuccessful verification attempts. Try again later.',
          attemptsRemaining: 0,
        };
      }

      return {
        success: false,
        errorType: 'INVALID',
        errorMessage: 'That verification code is incorrect.',
        attemptsRemaining: remaining,
      };
    }

    const existing = mockUsers.find((u) => u.email.toLowerCase() === normalized);
    const user: User = existing || {
      id: `user-${Date.now()}`,
      name: normalized.split('@')[0] || 'Operator',
      email: normalized,
      role: 'Inventory Manager',
      department: 'Warehouse Operations',
      assignedWarehouse: 'Main Warehouse',
    };

    const mockToken = `mock-jwt-otp-${user.id}-${Date.now()}`;
    storage.setString(STORAGE_KEYS.AUTH_TOKEN, mockToken);
    storage.set(STORAGE_KEYS.AUTH_USER, user);
    sessionStorage.removeItem(OTP_STATE_KEY);

    return {
      success: true,
      user,
      token: mockToken,
    };
  },

  async sendSignupOtp(email: string): Promise<SendOtpResponse> {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return dispatchMockOtp(email, 'signup');
  },

  async verifySignupOtp(email: string, enteredOtp: string): Promise<VerifyOtpResponse> {
    await new Promise((resolve) => setTimeout(resolve, 450));
    const normalized = email.toLowerCase().trim();
    const state = getStoredOtpState();

    const trimmedInput = enteredOtp.trim();
    const isValid =
      (state && state.email === normalized && (trimmedInput === state.otp || trimmedInput === DEV_FALLBACK_OTP)) ||
      trimmedInput === DEV_FALLBACK_OTP;

    if (!isValid) {
      if (state) {
        state.attempts += 1;
        saveOtpState(state);
      }
      return {
        success: false,
        errorType: 'INVALID',
        errorMessage: 'That verification code is incorrect.',
      };
    }

    if (state) {
      state.verified = true;
      saveOtpState(state);
    }

    return { success: true };
  },

  async completeSignup(data: RegisterData, enteredOtp: string): Promise<VerifyOtpResponse> {
    await new Promise((resolve) => setTimeout(resolve, 450));
    const normalized = data.email.toLowerCase().trim();
    const state = getStoredOtpState();

    const trimmedInput = enteredOtp.trim();
    const isValid =
      state?.verified ||
      trimmedInput === state?.otp ||
      trimmedInput === DEV_FALLBACK_OTP;

    if (!isValid) {
      return {
        success: false,
        errorType: 'INVALID',
        errorMessage: 'Verification code must be verified before account creation.',
      };
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: data.name.trim(),
      email: normalized,
      role: 'Warehouse Staff',
      department: 'Floor Logistics',
      assignedWarehouse: 'Main Warehouse',
    };

    const mockToken = `mock-jwt-otp-${newUser.id}-${Date.now()}`;
    storage.setString(STORAGE_KEYS.AUTH_TOKEN, mockToken);
    storage.set(STORAGE_KEYS.AUTH_USER, newUser);
    sessionStorage.removeItem(OTP_STATE_KEY);

    return {
      success: true,
      user: newUser,
      token: mockToken,
    };
  },

  async sendPasswordResetOtp(email: string): Promise<SendOtpResponse> {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return dispatchMockOtp(email, 'password-reset');
  },

  async verifyPasswordResetOtp(email: string, enteredOtp: string): Promise<VerifyOtpResponse> {
    await new Promise((resolve) => setTimeout(resolve, 450));
    const normalized = email.toLowerCase().trim();
    const state = getStoredOtpState();

    const trimmedInput = enteredOtp.trim();
    const isValid =
      (state && state.email === normalized && (trimmedInput === state.otp || trimmedInput === DEV_FALLBACK_OTP)) ||
      trimmedInput === DEV_FALLBACK_OTP;

    if (!isValid) {
      return {
        success: false,
        errorType: 'INVALID',
        errorMessage: 'That recovery code is incorrect.',
      };
    }

    if (state) {
      state.verified = true;
      saveOtpState(state);
    }

    return { success: true };
  },

  async resetPassword(data: PasswordResetData): Promise<{ success: boolean; error?: string }> {
    await new Promise((resolve) => setTimeout(resolve, 450));
    const state = getStoredOtpState();
    const isValid =
      state?.verified ||
      data.otp.trim() === state?.otp ||
      data.otp.trim() === DEV_FALLBACK_OTP;

    if (!isValid) {
      return {
        success: false,
        error: 'Invalid or unverified recovery code.',
      };
    }

    sessionStorage.removeItem(OTP_STATE_KEY);
    return { success: true };
  },
};
