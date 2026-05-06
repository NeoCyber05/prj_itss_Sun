import React, { useState } from 'react';
import Header from './components/Header';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';

/**
 * App – Root component.
 * Manages auth view state (login ↔ register).
 */
export default function App() {
  const [view, setView] = useState('login'); // 'login' | 'register'

  return (
    <>
      <Header />

      <main className="main" id="mainContent">
        {view === 'login' ? (
          <LoginForm
            key="login"
            onSwitchToRegister={() => setView('register')}
          />
        ) : (
          <RegisterForm
            key="register"
            onSwitchToLogin={() => setView('login')}
          />
        )}
      </main>
    </>
  );
}
