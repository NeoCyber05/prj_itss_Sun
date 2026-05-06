import React from 'react';
import logo from '../assets/logo.png';
import './Header.css';

/**
 * Header – top navigation bar.
 * Contains: logo, search bar, language selector.
 */
export default function Header({ onViewChange, currentView }) {
  return (
    <header className="header" id="mainHeader">
      {/* ── Logo ── */}
      <div className="header__left">
        <a href="#" onClick={(e) => { e.preventDefault(); onViewChange('home'); }} className="header__logo" id="logoLink">
          <img
            src={logo}
            alt="RakuSlide"
            className="header__logo-img"
          />
        </a>
      </div>

      {/* ── Search ── */}
      <div className="header__center">
        <div className="header__search" id="searchBar">
          <input
            type="text"
            className="header__search-input"
            id="searchInput"
            placeholder="すうがく"
          />
          <button
            className="header__search-mic"
            id="micBtn"
            aria-label="音声入力"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="22"></line>
            </svg>
          </button>
          <button
            className="header__search-btn"
            id="searchBtn"
            aria-label="検索"
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
        </div>
      </div>

      {/* ── Right Actions ── */}
      <div className="header__right">
        {currentView !== 'login' && currentView !== 'register' && (
          <div className="header__auth-buttons">
            <button className="btn-login-outline" onClick={() => onViewChange('login')}>
              ログイン
            </button>
            <button className="btn-register-solid" onClick={() => onViewChange('register')}>
              新規登録
            </button>
          </div>
        )}
        
        <div className="header__user-lang">
          {currentView !== 'login' && currentView !== 'register' && (
            <div className="header__avatar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
          )}
          <select className="header__lang-select" id="langSelect" defaultValue="jp">
            <option value="jp">JP</option>
            <option value="en">EN</option>
            <option value="vi">VI</option>
          </select>
        </div>
      </div>
    </header>
  );
}
