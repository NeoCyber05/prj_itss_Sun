import { useEffect, useState } from 'react';
import Header from './components/Header';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Home from './components/Home';
import MySlides from './components/MySlides';
import SlideEditor from './components/SlideEditor';
import TemplateDetail from './components/TemplateDetail';
import { useLanguage } from './i18n/LanguageContext.jsx';
import { supabase } from './supabaseClient';
import { createBlankDeck, recordTemplateOpened } from './services/slideCreationService.js';

const EDITOR_HASH_PREFIX = '#editor=';
const PERSISTED_TEMPLATE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getEditorTemplateIdFromHash() {
  if (!window.location.hash.startsWith(EDITOR_HASH_PREFIX)) {
    return '';
  }

  return decodeURIComponent(window.location.hash.slice(EDITOR_HASH_PREFIX.length));
}

function setEditorHash(templateId) {
  window.history.replaceState(null, '', `${EDITOR_HASH_PREFIX}${encodeURIComponent(templateId)}`);
}

function clearEditorHash() {
  if (window.location.hash.startsWith(EDITOR_HASH_PREFIX)) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

function isPersistedTemplateId(value) {
  return PERSISTED_TEMPLATE_ID_PATTERN.test(String(value ?? ''));
}

/**
 * App – Root component.
 * Manages view state (home ↔ login ↔ register).
 */
export default function App() {
  const { language, t } = useLanguage();
  const initialEditorTemplateId = getEditorTemplateIdFromHash();
  const [view, setView] = useState(initialEditorTemplateId ? 'editor' : 'home');
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedSearchQuery, setSubmittedSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [activeDeck, setActiveDeck] = useState(null);
  const [activeTemplateId, setActiveTemplateId] = useState(initialEditorTemplateId);
  const [detailTemplate, setDetailTemplate] = useState(null);
  const [detailReturnView, setDetailReturnView] = useState('home');
  const [isCreatingSlide, setIsCreatingSlide] = useState(false);
  const [createSlideError, setCreateSlideError] = useState('');
  const [homeRefreshKey, setHomeRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    function syncSession(session) {
      if (!isMounted) return;

      const hasSession = Boolean(session);
      setIsLoggedIn(hasSession);
      setUser(session?.user ?? null);
      setIsAuthReady(true);

      if (hasSession) {
        const templateId = getEditorTemplateIdFromHash();

        if (templateId) {
          setActiveTemplateId(templateId);
          setView('editor');
        } else {
          setView('home');
        }
      } else {
        const templateId = getEditorTemplateIdFromHash();

        if (templateId) {
          setActiveTemplateId(templateId);
          setView('login');
        } else {
          setView('home');
          setActiveTemplateId('');
        }

        setActiveDeck(null);
        setDetailTemplate(null);
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
    const templateId = getEditorTemplateIdFromHash();

    setIsAuthReady(true);
    setIsLoggedIn(true);
    setUser(demoUser);

    if (templateId) {
      setActiveTemplateId(templateId);
      setView('editor');
    } else {
      setView('home');
    }
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
    setActiveDeck(null);
    setActiveTemplateId('');
    setDetailTemplate(null);
    setCreateSlideError('');
    clearEditorHash();
    setView('home');
  }

  function handleViewChange(nextView) {
    setView(nextView);

    if (nextView === 'home' || nextView === 'my-slides') {
      setSearchQuery('');
      setSubmittedSearchQuery('');
      setIsSearchActive(false);
      setActiveDeck(null);
      setActiveTemplateId('');
      setDetailTemplate(null);
      setCreateSlideError('');
      clearEditorHash();
    }
  }

  function handleSearchSubmit() {
    const query = searchQuery.trim();

    setView('home');
    setActiveDeck(null);
    setActiveTemplateId('');
    setDetailTemplate(null);
    clearEditorHash();
    setSubmittedSearchQuery(query);
    setIsSearchActive(query.length > 0);
  }

  async function handleCreateNewSlide() {
    setCreateSlideError('');

    if (!isLoggedIn || !user?.id) {
      setCreateSlideError(t('home.createNewSlideLoginRequired'));
      return;
    }

    setIsCreatingSlide(true);

    try {
      const deck = await createBlankDeck({ userId: user.id, language });
      recordTemplateOpened({ templateId: deck.template.id, userId: user.id }).catch(() => {});

      setActiveDeck(deck);
      setActiveTemplateId(deck.template.id);
      setEditorHash(deck.template.id);
      setView('editor');
    } catch (error) {
      setCreateSlideError(t('home.createNewSlideError', { message: error.message }));
    } finally {
      setIsCreatingSlide(false);
    }
  }

  function handleOpenSavedTemplate(templateId) {
    if (user?.id && isPersistedTemplateId(templateId)) {
      recordTemplateOpened({ templateId, userId: user.id }).catch(() => {});
    }

    setActiveDeck(null);
    setActiveTemplateId(templateId);
    setDetailTemplate(null);
    setEditorHash(templateId);
    setView('editor');
  }

  function handleOpenTemplateDetail(template) {
    const nextTemplate = typeof template === 'string' ? { id: template } : template;

    if (user?.id && isPersistedTemplateId(nextTemplate?.id)) {
      recordTemplateOpened({ templateId: nextTemplate.id, userId: user.id }).catch(() => {});
    }

    setActiveDeck(null);
    setActiveTemplateId(nextTemplate?.id ?? '');
    setDetailTemplate(nextTemplate ?? null);
    setDetailReturnView((currentReturnView) => (view === 'template-detail' ? currentReturnView : view));
    clearEditorHash();
    setView('template-detail');
  }

  function handleBackFromTemplateDetail() {
    setView(detailReturnView || 'home');
    setActiveDeck(null);
    setActiveTemplateId('');
    setDetailTemplate(null);
    clearEditorHash();
  }

  function handleCreatedDeckFromDetail(deck) {
    if (user?.id && deck?.template?.id) {
      recordTemplateOpened({ templateId: deck.template.id, userId: user.id }).catch(() => {});
    }

    setActiveDeck(deck);
    setActiveTemplateId(deck.template.id);
    setDetailTemplate(null);
    setEditorHash(deck.template.id);
    setView('editor');
  }

  function handleBackHomeFromEditor() {
    setView('home');
    setActiveDeck(null);
    setActiveTemplateId('');
    clearEditorHash();
    setHomeRefreshKey((key) => key + 1);
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
            currentUserId={user?.id}
            isLoggedIn={isLoggedIn}
            submittedSearchQuery={submittedSearchQuery}
            isSearchActive={isSearchActive}
            onCreateNewSlide={handleCreateNewSlide}
            onOpenTemplate={handleOpenTemplateDetail}
            onOpenRecentTemplate={handleOpenSavedTemplate}
            isCreatingSlide={isCreatingSlide}
            createSlideError={createSlideError}
            refreshKey={homeRefreshKey}
          />
        )}
        {view === 'my-slides' && (
          <MySlides
            currentUserId={user?.id}
            onOpenTemplate={handleOpenSavedTemplate}
          />
        )}
        {view === 'template-detail' && (
          <TemplateDetail
            key={detailTemplate?.id ?? activeTemplateId ?? 'template-detail'}
            templateId={detailTemplate?.id ?? activeTemplateId}
            initialTemplate={detailTemplate}
            currentUserId={user?.id}
            onBack={handleBackFromTemplateDetail}
            onCreatedDeck={handleCreatedDeckFromDetail}
            onEditTemplate={handleOpenSavedTemplate}
            onOpenTemplateDetail={handleOpenTemplateDetail}
            onRequireLogin={() => {}}
          />
        )}
        {view === 'editor' && (
          <SlideEditor
            key={activeTemplateId || 'editor'}
            templateId={activeTemplateId}
            initialDeck={activeDeck}
            currentUserId={user?.id}
            onBackHome={handleBackHomeFromEditor}
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
