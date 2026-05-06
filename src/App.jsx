import React, { useState } from 'react';
import Header from './components/Header';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Home from './components/Home';

/**
 * App – Root component.
 * Manages view state (home ↔ login ↔ register).
 */
export default function App() {
  const [view, setView] = useState('home'); // 'home' | 'login' | 'register'

  return (
    <>
      <Header onViewChange={setView} currentView={view} />

      <main className="main" id="mainContent">
        {view === 'home' && (
          <Home />
        )}
        {view === 'login' && (
          <LoginForm
            key="login"
            onSwitchToRegister={() => setView('register')}
          />
        )}
        {view === 'register' && (
          <RegisterForm
            key="register"
            onSwitchToLogin={() => setView('login')}
          />
        )}
      </main>
    </>
  );
}
