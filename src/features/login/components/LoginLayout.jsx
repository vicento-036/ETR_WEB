import React from 'react';
import etrLogo from '../../../assets/branding/etr-logo.png';
import LoginForm from './LoginForm';

function LoginLayout() {
  return (
    <main className="etr-login-page">
      <div className="etr-login-bg etr-login-bg-light" />
      <div className="etr-login-bg etr-login-bg-dark" />

      <section className="etr-login-card">
        <div className="etr-login-showcase">
          <h1 className="etr-showcase-title">ETR INTEGRATED SYSTEM</h1>
          <div className="etr-logo-shell">
            <img src={etrLogo} alt="ETR total business solutions provider" className="etr-showcase-logo" />
          </div>
        </div>

        <div className="etr-login-divider" />

        <div className="etr-login-form-panel">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}

export default LoginLayout;
