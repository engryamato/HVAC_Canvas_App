'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/core/store/auth.store';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, error, login, initializeSession, clearError } =
    useAuthStore();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Initialize session on mount
  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    clearError();

    try {
      await login();
      // Will auto-redirect via useEffect above
    } catch (err) {
      setIsLoggingIn(false);
      // Error is stored in auth store
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingCard}>
          <div className={styles.spinner}></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <h1 className={styles.title}>SizeWise HVAC Canvas</h1>
          <p className={styles.subtitle}>Professional HVAC design and estimation</p>
        </div>

        <div className={styles.content}>
          <button
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className={styles.googleButton}
          >
            {isLoggingIn ? (
              <>
                <div className={styles.buttonSpinner}></div>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <svg className={styles.googleIcon} viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </button>

          {error && (
            <div className={styles.errorBox}>
              <span className={styles.errorIcon}>⚠️</span>
              <p className={styles.errorMessage}>{error}</p>
            </div>
          )}

          <div className={styles.notice}>
            <p className={styles.noticeText}>
              <strong>Note:</strong> Internet connection required for first login.
            </p>
            <p className={styles.noticeText}>App works offline after authentication.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
