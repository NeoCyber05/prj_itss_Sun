import { useEffect, useRef, useState } from 'react';
import logo from '../assets/logo.png';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import './Header.css';

/**
 * Header – top navigation bar.
 * Contains: logo, search bar, language selector.
 */
export default function Header({
  onViewChange,
  currentView,
  isAuthReady,
  isLoggedIn,
  user,
  userProfile,
  onLogout,
  onOpenProfile,
  searchQuery,
  onSearchQueryChange,
  onSearchSubmit,
  searchPlaceholder,
}) {
  const { language, setLanguage, t } = useLanguage();
  const isAuthView = ['login', 'register', 'forgot-password', 'reset-password'].includes(currentView);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef(null);
  const userMetadata = user?.user_metadata ?? {};
  const avatarUrl = userProfile?.avatar_url || userMetadata.avatar_url || userMetadata.picture;

  useEffect(() => {
    function handleClickOutside(event) {
      if (!avatarMenuRef.current?.contains(event.target)) {
        setIsAvatarMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsAvatarMenuOpen(false);
      }
    }

    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  function handleUserInfoClick() {
    setIsAvatarMenuOpen(false);
    onOpenProfile();
  }

  function handleLogoutClick() {
    setIsAvatarMenuOpen(false);
    onLogout();
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    onSearchSubmit();
  }

  return (
    <header className="header" id="mainHeader">
      <div className="header__left">
        <a
          href="#"
          onClick={(event) => {
            event.preventDefault();
            onViewChange('home');
          }}
          className="header__logo"
          id="logoLink"
        >
          <img src={logo} alt="RakuSlide" className="header__logo-img" />
        </a>
      </div>

      <div className="header__center">
        <form className="header__search" id="searchBar" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            className="header__search-input"
            id="searchInput"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
          />
          <button
            type="submit"
            className="header__search-btn"
            id="searchBtn"
            aria-label={t('header.searchAria')}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </form>
      </div>

      <div className="header__right">
        {isAuthReady && !isLoggedIn && !isAuthView && (
          <div className="header__auth-buttons">
            <button className="btn-login-outline" onClick={() => onViewChange('login')}>
              {t('header.login')}
            </button>
            <button className="btn-register-solid" onClick={() => onViewChange('register')}>
              {t('header.register')}
            </button>
          </div>
        )}

        <div className="header__user-lang">
          {isAuthReady && isLoggedIn && !isAuthView && (
          <>
            <button
              type="button"
              className={`btn-my-slides${currentView === 'my-slides' ? ' btn-my-slides--active' : ''}`}
              onClick={() => onViewChange('my-slides')}
            >
              {t('header.mySlides')}
            </button>
            <div className="header__user-menu" ref={avatarMenuRef}>
              <button
                type="button"
                className="header__avatar"
                aria-label={t('header.userMenuAria')}
                aria-expanded={isAvatarMenuOpen}
                aria-haspopup="menu"
                onClick={() => setIsAvatarMenuOpen((open) => !open)}
              >
                {avatarUrl ? (
                  <img className="header__avatar-img" src={avatarUrl} alt="" />
                ) : (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                )}
              </button>

              {isAvatarMenuOpen && (
                <div className="header__avatar-menu" role="menu">
                  <button
                    type="button"
                    className="header__avatar-menu-item"
                    role="menuitem"
                    onClick={handleUserInfoClick}
                  >
                    {t('header.userInfo')}
                  </button>
                  <button
                    type="button"
                    className="header__avatar-menu-item header__avatar-menu-item--danger"
                    role="menuitem"
                    onClick={handleLogoutClick}
                  >
                    {t('header.logout')}
                  </button>
                </div>
              )}
            </div>
          </>
          )}
          <select
            className="header__lang-select"
            id="langSelect"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            aria-label={t('header.languageSelectAria')}
          >
            <option value="ja">JP</option>
            <option value="vi">VI</option>
          </select>
        </div>
      </div>
    </header>
  );
}
