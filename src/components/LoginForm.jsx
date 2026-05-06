import React, { useState } from 'react';
import { MailIcon, LockIcon, GoogleIcon, FacebookIcon } from './Icons';
import { supabase } from '../supabaseClient';
import './AuthCard.css';

/**
 * LoginForm – ログイン form component.
 * @param {Object} props
 * @param {function} props.onSwitchToRegister – callback to show register form
 */
export default function LoginForm({ onSwitchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  async function handleSocialLogin(provider) {
    setError('');
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: window.location.origin,
      }
    });

    if (error) {
      setError(`Lỗi đăng nhập ${provider}: ` + error.message);
      setLoading(false);
    }
  }

  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function clearFieldError(field) {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setError('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const errs = {};

    if (!email.trim()) {
      errs.email = true;
      setError('メールアドレスを入力してください。');
    } else if (!isValidEmail(email.trim())) {
      errs.email = true;
      setError('メールアドレスの形式が正しくありません。');
    }

    if (!password) {
      errs.password = true;
      if (!errs.email) setError('パスワードを入力してください。');
    }

    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    // ── Simulated login ──
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('ログイン成功！（デモ）');
    }, 1200);
  }

  return (
    <section className="auth-card" id="loginCard">
      <h1 className="auth-card__title" id="loginTitle">ログイン</h1>

      <form className="auth-card__form" id="loginForm" noValidate onSubmit={handleSubmit}>
        {/* Email */}
        <div className={`input-group ${fieldErrors.email ? 'input-group--error' : ''}`} id="loginEmailGroup">
          <span className="input-group__icon"><MailIcon /></span>
          <input
            type="email"
            className="input-group__input"
            id="loginEmail"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
          />
        </div>

        {/* Password */}
        <div className={`input-group ${fieldErrors.password ? 'input-group--error' : ''}`} id="loginPasswordGroup">
          <span className="input-group__icon"><LockIcon /></span>
          <input
            type="password"
            className="input-group__input"
            id="loginPassword"
            placeholder="パスワード"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
          />
        </div>

        {/* Error */}
        <div className="auth-card__error" id="loginError">{error}</div>

        {/* Submit */}
        <button
          type="submit"
          className="btn btn--primary"
          id="loginSubmitBtn"
          disabled={loading}
        >
          {loading ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>

      {/* Forgot password */}
      <button
        className="auth-card__link--forgot"
        id="forgotPasswordLink"
        type="button"
        onClick={() => alert('パスワードリセット機能は未実装です。')}
      >
        パスワードをお忘れですか？
      </button>

      {/* Social login */}
      <div className="auth-card__social">
        <button
          className="btn btn--social"
          id="googleLoginBtn"
          type="button"
          onClick={() => handleSocialLogin('google')}
          disabled={loading}
        >
          <GoogleIcon />
          <span>Googleでログイン</span>
        </button>
        <button
          className="btn btn--social"
          id="facebookLoginBtn"
          type="button"
          onClick={() => handleSocialLogin('facebook')}
          disabled={loading}
        >
          <FacebookIcon />
          <span>Facebookでログイン</span>
        </button>
      </div>

      {/* Switch to register */}
      <p className="auth-card__switch" id="loginSwitchText">
        新規ユーザーですか？
        <button
          className="auth-card__switch-link"
          id="showRegisterLink"
          type="button"
          onClick={onSwitchToRegister}
        >
          今すぐ登録してください。
        </button>
      </p>
    </section>
  );
}
