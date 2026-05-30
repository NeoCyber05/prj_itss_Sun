import { useEffect, useState } from 'react';
import Header from './components/Header';
import ForgotPasswordForm from './components/ForgotPasswordForm';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Home from './components/Home';
import MySlides from './components/MySlides';
import Profile from './components/Profile';
import ResetPasswordForm from './components/ResetPasswordForm';
import SlideEditor from './components/SlideEditor';
import TemplateDetail from './components/TemplateDetail';
import { useLanguage } from './i18n/LanguageContext.jsx';
import { supabase } from './supabaseClient';
import { createBlankDeck, recordTemplateOpened } from './services/slideCreationService.js';

const EDITOR_HASH_PREFIX = '#editor=';
const RESET_PASSWORD_HASH = '#reset-password';
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

function isResetPasswordHash() {
  return window.location.hash === RESET_PASSWORD_HASH;
}

function clearResetPasswordHash() {
  if (isResetPasswordHash()) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

function isPersistedTemplateId(value) {
  return PERSISTED_TEMPLATE_ID_PATTERN.test(String(value ?? ''));
}

function isFetchFailure(error) {
  return error?.name === 'TypeError'
    || String(error?.message ?? '').includes('Failed to fetch');
}

function clearLocalSupabaseSession() {
  if (typeof window === 'undefined') return;

  try {
    for (const key of Object.keys(window.localStorage)) {
      if (/^sb-.+-auth-token/.test(key)) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
    // Ignore storage errors; UI state is still cleared below.
  }
}

/**
 * App – Root component.
 * Manages view state (home ↔ login ↔ register).
 */
export default function App() {
  const { language, t } = useLanguage();
  const initialEditorTemplateId = getEditorTemplateIdFromHash();
  const [view, setView] = useState(isResetPasswordHash() ? 'reset-password' : initialEditorTemplateId ? 'editor' : 'home');
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [hasRecoverySession, setHasRecoverySession] = useState(isResetPasswordHash());
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
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

    function syncSession(session, event = '') {
      if (!isMounted) return;

      const hasSession = Boolean(session);
      setIsLoggedIn(hasSession);
      setUser(session?.user ?? null);
      setIsAuthReady(true);

      if (event === 'PASSWORD_RECOVERY' || isResetPasswordHash()) {
        setHasRecoverySession(hasSession);
        setView('reset-password');
        return;
      }

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
        setHasRecoverySession(false);
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
      (event, session) => {
        syncSession(session, event);
      },
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchProfile() {
      if (!user?.id) {
        if (isMounted) setUserProfile(null);
        return;
      }

      // 1. Ưu tiên đọc dữ liệu profile từ localStorage để hiển thị tức thời
      try {
        const localData = localStorage.getItem(`rakuslide:user-profile:${user.id}`);
        if (localData && isMounted) {
          setUserProfile(JSON.parse(localData));
        }
      } catch (e) {
        console.warn('Failed to read profile from localStorage:', e);
      }

      // 2. Đồng bộ hóa với Database ở dưới nền
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (!isMounted) return;

        if (error) {
          console.error('Error fetching profile:', error.message);
          return;
        }

        if (data) {
          // BẢO VỆ AVATAR CỤC BỘ: Kiểm tra xem local hiện tại có ảnh trong repo không
          let mergedAvatarUrl = data.avatar_url;
          
          try {
            const localData = localStorage.getItem(`rakuslide:user-profile:${user.id}`);
            if (localData) {
              const localProfile = JSON.parse(localData);
              // Nếu local đang lưu avatar tĩnh trong repo (/avatars/), ta ưu tiên giữ lại nó
              // và không cho phép avatar mặc định Google (bắt đầu bằng http) từ DB ghi đè lên
              if (localProfile?.avatar_url && localProfile.avatar_url.startsWith('/avatars/')) {
                mergedAvatarUrl = localProfile.avatar_url;
              }
            }
          } catch (e) {
            console.warn('Failed to read local profile for protection:', e);
          }

          const updatedProfile = {
            ...data,
            avatar_url: mergedAvatarUrl
          };

          setUserProfile(updatedProfile);
          // Cập nhật lại localStorage để bảo toàn dữ liệu chính xác
          localStorage.setItem(`rakuslide:user-profile:${user.id}`, JSON.stringify(updatedProfile));
        } else {
          // Fallback dùng metadata session nếu chưa có dữ liệu trong DB và localStorage
          const userMetadata = user.user_metadata ?? {};
          try {
            const localData = localStorage.getItem(`rakuslide:user-profile:${user.id}`);
            if (!localData) {
              const fallbackData = {
                id: user.id,
                email: user.email,
                display_name: userMetadata.full_name || userMetadata.name || user.email,
                avatar_url: userMetadata.avatar_url || userMetadata.picture || null,
              };
              setUserProfile(fallbackData);
              localStorage.setItem(`rakuslide:user-profile:${user.id}`, JSON.stringify(fallbackData));
            }
          } catch (e) {
            console.warn(e);
          }
        }
      } catch (err) {
        console.error('Failed to load user profile:', err);
      }
    }

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  function handleLoginSuccess(demoUser) {
    const templateId = getEditorTemplateIdFromHash();

    setIsAuthReady(true);
    setIsLoggedIn(true);
    setUser(demoUser);
    setHasRecoverySession(false);

    if (templateId) {
      setActiveTemplateId(templateId);
      setView('editor');
    } else {
      setView('home');
    }
  }

  function resetAuthenticatedState() {
    setIsLoggedIn(false);
    setUser(null);
    setSearchQuery('');
    setSubmittedSearchQuery('');
    setIsSearchActive(false);
    setActiveDeck(null);
    setActiveTemplateId('');
    setDetailTemplate(null);
    setCreateSlideError('');
    setHasRecoverySession(false);
    clearEditorHash();
    clearResetPasswordHash();
    setView('home');
  }

  async function handleLogout() {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });

      if (error) {
        throw error;
      }
    } catch (error) {
      if (!isFetchFailure(error)) {
        alert(t('app.logoutFailed', { message: error.message }));
        return;
      }

      clearLocalSupabaseSession();
    }

    resetAuthenticatedState();
  }

  function handleViewChange(nextView) {
    setView(nextView);

    if (nextView === 'home' || nextView === 'my-slides' || nextView === 'profile' || nextView === 'login') {
      setSearchQuery('');
      setSubmittedSearchQuery('');
      setIsSearchActive(false);
      setActiveDeck(null);
      setActiveTemplateId('');
      setDetailTemplate(null);
      setCreateSlideError('');
      clearEditorHash();
      clearResetPasswordHash();
    }
  }

  function handleForgotPassword(initialEmail = '') {
    setForgotPasswordEmail(initialEmail);
    setView('forgot-password');
    clearEditorHash();
    clearResetPasswordHash();
  }

  function handleBackToLogin() {
    setForgotPasswordEmail('');
    setHasRecoverySession(false);
    setIsLoggedIn(false);
    setUser(null);
    clearEditorHash();
    clearResetPasswordHash();
    setView('login');
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
      setActiveDeck(deck);
      setActiveTemplateId('');
      clearEditorHash();
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

  function handleOpenTemplateFromMySlides(template) {
    const nextTemplate = typeof template === 'string' ? { id: template } : template;

    if (user?.id && isPersistedTemplateId(nextTemplate?.id)) {
      recordTemplateOpened({ templateId: nextTemplate.id, userId: user.id }).catch(() => {});
    }

    setActiveDeck(null);
    setActiveTemplateId(nextTemplate?.id ?? '');
    setDetailTemplate(nextTemplate ?? null);
    setDetailReturnView('my-slides');
    clearEditorHash();
    setView('template-detail');
  }

  function handleOpenRecentTemplate(template) {
    const nextTemplate = typeof template === 'string' ? { id: template } : template;

    if (user?.id && isPersistedTemplateId(nextTemplate?.id)) {
      recordTemplateOpened({ templateId: nextTemplate.id, userId: user.id }).catch(() => {});
    }

    setActiveDeck(null);
    setActiveTemplateId(nextTemplate?.id ?? '');
    setDetailTemplate(nextTemplate ?? null);
    setDetailReturnView('home');
    clearEditorHash();
    setView('template-detail');
  }

  return (
    <>
      <Header
        onViewChange={handleViewChange}
        currentView={view}
        isAuthReady={isAuthReady}
        isLoggedIn={isLoggedIn}
        user={user}
        userProfile={userProfile}
        onLogout={handleLogout}
        onOpenProfile={() => handleViewChange('profile')}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        searchPlaceholder={t('header.searchPlaceholder')}
      />

      <main className={`main${['login', 'register', 'forgot-password', 'reset-password'].includes(view) ? ' main--auth' : ''}`} id="mainContent">
        {view === 'home' && (
          <Home
            currentUserId={user?.id}
            currentUserEmail={user?.email ?? ''}
            isLoggedIn={isLoggedIn}
            submittedSearchQuery={submittedSearchQuery}
            isSearchActive={isSearchActive}
            onCreateNewSlide={handleCreateNewSlide}
            onOpenTemplate={handleOpenTemplateDetail}
            onOpenRecentTemplate={handleOpenRecentTemplate}
            isCreatingSlide={isCreatingSlide}
            createSlideError={createSlideError}
            refreshKey={homeRefreshKey}
          />
        )}
        {view === 'my-slides' && (
          <MySlides
            currentUserId={user?.id}
            currentUserEmail={user?.email ?? ''}
            onOpenTemplate={handleOpenTemplateFromMySlides}
          />
        )}
        {view === 'profile' && (
          <Profile
            user={user}
            userProfile={userProfile}
            onCancel={() => handleViewChange('home')}
            onUserUpdated={setUser}
          />
        )}
        {view === 'template-detail' && (
          <TemplateDetail
            key={detailTemplate?.id ?? activeTemplateId ?? 'template-detail'}
            templateId={detailTemplate?.id ?? activeTemplateId}
            initialTemplate={detailTemplate}
            currentUserId={user?.id}
            currentUserEmail={user?.email ?? ''}
            userProfile={userProfile}
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
            currentUserEmail={user?.email ?? ''}
            onBackHome={handleBackHomeFromEditor}
          />
        )}
        {view === 'login' && (
          <LoginForm
            key="login"
            onLoginSuccess={handleLoginSuccess}
            onSwitchToRegister={() => setView('register')}
            onForgotPassword={handleForgotPassword}
          />
        )}
        {view === 'register' && (
          <RegisterForm
            key="register"
            onSwitchToLogin={() => setView('login')}
          />
        )}
        {view === 'forgot-password' && (
          <ForgotPasswordForm
            initialEmail={forgotPasswordEmail}
            onBackToLogin={handleBackToLogin}
          />
        )}
        {view === 'reset-password' && (
          <ResetPasswordForm
            hasRecoverySession={hasRecoverySession}
            onBackToLogin={handleBackToLogin}
          />
        )}
      </main>
    </>
  );
}
