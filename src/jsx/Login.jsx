import React from 'react';
import LoginLayout from './LoginLayout.jsx';

function LoginPage({ onLoginSuccess }) {
  return <LoginLayout onLoginSuccess={onLoginSuccess} />;
}

export default LoginPage;
