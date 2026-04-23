import React, { useState } from 'react';

function LoginForm() {
  const [username, setUsername] = useState('Marcvincent@gmail.com');
  const [password, setPassword] = useState('password123');
  const [message, setMessage] = useState('');

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      const res = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const text = await res.text();
      setMessage(text);

      if (res.ok) {
        alert('Login successful!');
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
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

      <button type="submit" className="etr-signin-button">
        Sign In
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
