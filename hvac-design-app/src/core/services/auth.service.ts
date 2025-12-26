import { invoke } from '@tauri-apps/api/core';
import { Store } from '@tauri-apps/plugin-store';

const authStore = new Store('auth.dat');

export interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
  emailVerified: boolean;
}

export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  id_token: string;
}

export interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture: string;
  email_verified: boolean;
}

/**
 * Initiate Google OAuth flow with localhost callback
 * Opens browser, waits for user authentication, returns tokens
 */
export async function loginWithGoogle(): Promise<User> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured. Please add them to .env.local');
  }

  try {
    // Call Rust backend to start OAuth flow
    const tokens = await invoke<OAuthTokens>('start_google_oauth', {
      clientId,
      clientSecret,
    });

    // Decode ID token to get user info
    const userInfo = await invoke<GoogleUserInfo>('decode_id_token', {
      idToken: tokens.id_token,
    });

    // Store refresh token and user info securely
    if (tokens.refresh_token) {
      await authStore.set('refresh_token', tokens.refresh_token);
    }
    await authStore.set('user_profile', userInfo);
    await authStore.set('token_expiry', Date.now() + tokens.expires_in * 1000);
    await authStore.save();

    return {
      id: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      emailVerified: userInfo.email_verified,
    };
  } catch (error) {
    console.error('OAuth login failed:', error);
    throw new Error(`Failed to login with Google: ${error}`);
  }
}

/**
 * Get stored session (works offline)
 * Returns user if valid refresh token exists
 */
export async function getStoredSession(): Promise<User | null> {
  try {
    const refreshToken = await authStore.get<string>('refresh_token');
    const userProfile = await authStore.get<GoogleUserInfo>('user_profile');

    if (!refreshToken || !userProfile) {
      return null;
    }

    // Valid session exists (trust refresh token offline)
    return {
      id: userProfile.sub,
      email: userProfile.email,
      name: userProfile.name,
      picture: userProfile.picture,
      emailVerified: userProfile.email_verified,
    };
  } catch (error) {
    console.error('Failed to load session:', error);
    return null;
  }
}

/**
 * Refresh access token (call periodically when online)
 */
export async function refreshTokenIfNeeded(): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return; // Skip if offline
  }

  try {
    const refreshToken = await authStore.get<string>('refresh_token');
    const tokenExpiry = await authStore.get<number>('token_expiry');

    if (!refreshToken) {
      return;
    }

    // Refresh if token expired or expiring soon (5 min buffer)
    const now = Date.now();
    if (tokenExpiry && tokenExpiry > now + 5 * 60 * 1000) {
      return; // Still valid
    }

    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;

    const tokens = await invoke<OAuthTokens>('refresh_access_token', {
      refreshToken,
      clientId,
      clientSecret,
    });

    // Update expiry time
    await authStore.set('token_expiry', Date.now() + tokens.expires_in * 1000);
    await authStore.save();

    console.log('Access token refreshed successfully');
  } catch (error) {
    console.error('Failed to refresh token:', error);
    // Don't throw - allow offline usage to continue
  }
}

/**
 * Logout user (clear all stored credentials)
 */
export async function logout(): Promise<void> {
  await authStore.delete('refresh_token');
  await authStore.delete('user_profile');
  await authStore.delete('token_expiry');
  await authStore.save();
}

/**
 * Check if user is authenticated (has valid session)
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getStoredSession();
  return user !== null;
}
