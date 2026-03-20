// src/api/auth.ts
// All authentication API calls

import apiClient from './client';
import { ApiResponse, AuthUser, LoginCredentials, RegisterCredentials } from '../types';

interface AuthResponseData {
  user: AuthUser;
  token: string;
}

/**
 * Register a new user account.
 */
export async function registerUser(
  credentials: RegisterCredentials
): Promise<AuthResponseData> {
  const response = await apiClient.post<ApiResponse<AuthResponseData>>(
    '/auth/register',
    credentials
  );
  return response.data.data!;
}

/**
 * Log in with email and password. Returns user and JWT token.
 */
export async function loginUser(
  credentials: LoginCredentials
): Promise<AuthResponseData> {
  const response = await apiClient.post<ApiResponse<AuthResponseData>>(
    '/auth/login',
    credentials
  );
  return response.data.data!;
}

/**
 * Fetch the currently authenticated user's profile.
 */
export async function fetchCurrentUser(): Promise<AuthUser> {
  const response = await apiClient.get<ApiResponse<{ user: AuthUser }>>('/auth/me');
  return response.data.data!.user;
}
