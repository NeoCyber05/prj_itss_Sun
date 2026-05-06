import React from 'react';
import logo from '../assets/logo.png';
import './Header.css';

/**
 * Header – top navigation bar.
 * Contains: logo, search bar, language selector.
 */
export default function Header() {
  return (
    <header className="header" id="mainHeader">
      {/* ── Logo ── */}
      <div className="header__left">
        <a href="/" className="header__logo" id="logoLink">
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
            placeholder="スライド、テンプレート、またはプロジェクトを検索..."
          />
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

      {/* ── Language ── */}
      <div className="header__right">
        <select className="header__lang-select" id="langSelect" defaultValue="jp">
          <option value="jp">JP</option>
          <option value="en">EN</option>
          <option value="vi">VI</option>
        </select>
      </div>
    </header>
  );
}
