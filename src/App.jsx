import { useEffect, useState } from 'react';
import Header from './components/Header';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Home from './components/Home';
import { useLanguage } from './i18n/LanguageContext.jsx';
import { supabase } from './supabaseClient';

/**
 * App – Root component.
 * Manages view state (home ↔ login ↔ register).
 */
export default function App() {
  const { t } = useLanguage();
  const [view, setView] = useState('home'); // 'home' | 'login' | 'register'
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedSearchQuery, setSubmittedSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  useEffect(() => {
    let isMounted = true;

    function syncSession(session) {
      if (!isMounted) return;

      const hasSession = Boolean(session);
      setIsLoggedIn(hasSession);
      setUser(session?.user ?? null);
      setIsAuthReady(true);

      if (hasSession) {
        setView('home');
      }
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        if (isMounted) setIsAuthReady(true);
        return;
      }

      syncSession(data.session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        syncSession(session);
      },
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  function handleLoginSuccess(demoUser) {
    setIsAuthReady(true);
    setIsLoggedIn(true);
    setUser(demoUser);
    setView('home');
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(t('app.logoutFailed', { message: error.message }));
      return;
    }

    setIsLoggedIn(false);
    setUser(null);
    setSearchQuery('');
    setSubmittedSearchQuery('');
    setIsSearchActive(false);
    setView('home');
  }

  function handleViewChange(nextView) {
    setView(nextView);

    if (nextView === 'home') {
      setSearchQuery('');
      setSubmittedSearchQuery('');
      setIsSearchActive(false);
    }
  }

  function handleSearchSubmit() {
    const query = searchQuery.trim();

    setView('home');
    setSubmittedSearchQuery(query);
    setIsSearchActive(query.length > 0);
  }

  return (
    <>
      <Header
        onViewChange={handleViewChange}
        currentView={view}
        isAuthReady={isAuthReady}
        isLoggedIn={isLoggedIn}
        user={user}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        searchPlaceholder={t('header.searchPlaceholder')}
      />

      <main className={`main${view === 'login' || view === 'register' ? ' main--auth' : ''}`} id="mainContent">
        {view === 'home' && (
          <Home
            isLoggedIn={isLoggedIn}
            submittedSearchQuery={submittedSearchQuery}
            isSearchActive={isSearchActive}
          />
        )}
        {view === 'login' && (
          <LoginForm
            key="login"
            onLoginSuccess={handleLoginSuccess}
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
