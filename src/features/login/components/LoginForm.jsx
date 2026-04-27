import React, { useEffect, useState } from 'react';
import { clearAuth, isTokenExpired, saveAuth } from '../../../services/authStorage';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isTokenExpired()) {
      clearAuth();
    }

    let isMounted = true;

    const checkHealth = async () => {
      try {
        await fetch('/api/health');
      } catch {
        if (isMounted) {
          setMessage('Unable to reach the server.');
        }
      }
    };

    checkHealth();
        
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data?.errors) {
          const fieldErrors = Object.values(data.errors).flat().join(' ');
          setMessage(fieldErrors || data.message || 'Login failed.');
        } else {
          setMessage(data.message || 'Login failed.');
        }

        return;
      }

      saveAuth(data);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="etr-login-form" onSubmit={handleLogin}>
      <h2>SIGN IN</h2>

      <label className="etr-input-box">
        <span className="etr-input-label">Email Address</span>
        <input
          className="etr-form-input"
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
      </label>

      <label className="etr-input-box">
        <span className="etr-input-label">Password</span>
        <div className="etr-password-wrapper">
          <input
            className="etr-form-input"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            type="button"
            className="etr-password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.26 3.39m-3.27-1.37a6 6 0 0 1-8.88 8.88"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            )}
          </button>
        </div>
      </label>

      <button type="submit" className="etr-signin-button" disabled={isSubmitting}>
        {isSubmitting ? 'Signing In...' : 'Sign In'}
      </button>

      <div className="etr-login-links">
        <a href="/">Forgot your password?</a>
        <a href="/">Sign Up</a>
      </div>

      {message ? <p className="etr-login-message">{message}</p> : null}
    </form>
  );
}

export default LoginForm;