import React, { useEffect, useState } from 'react';
import { clearAuth, isTokenExpired, saveAuth } from '../../../services/authStorage';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        <input
          className="etr-form-input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
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