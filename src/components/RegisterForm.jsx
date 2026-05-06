import React, { useState } from 'react';
import { UserIcon, MailIcon, LockIcon, GoogleIcon, FacebookIcon } from './Icons';
import { supabase } from '../supabaseClient';
import './AuthCard.css';

/**
 * RegisterForm – 新規登録 form component.
 * @param {Object} props
 * @param {function} props.onSwitchToLogin – callback to show login form
 */
export default function RegisterForm({ onSwitchToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
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
      setError(`Lỗi đăng ký ${provider}: ` + error.message);
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
    let firstError = '';

    if (!name.trim()) {
      errs.name = true;
      if (!firstError) firstError = 'お名前を入力してください。';
    }

    if (!email.trim()) {
      errs.email = true;
      if (!firstError) firstError = 'メールアドレスを入力してください。';
    } else if (!isValidEmail(email.trim())) {
      errs.email = true;
      if (!firstError) firstError = 'メールアドレスの形式が正しくありません。';
    }

    if (!password) {
      errs.password = true;
      if (!firstError) firstError = 'パスワードを入力してください。';
    }

    if (!confirmPassword) {
      errs.confirmPassword = true;
      if (!firstError) firstError = 'パスワードを再入力してください。';
    } else if (password !== confirmPassword) {
      errs.confirmPassword = true;
      if (!firstError) firstError = 'パスワードが一致しません。';
    }

    if (!termsAccepted) {
      if (!firstError) firstError = '利用規約に同意してください。';
    }

    setFieldErrors(errs);
    if (firstError) {
      setError(firstError);
      return;
    }

    // ── Simulated register ──
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('登録成功！（デモ）');
      onSwitchToLogin();
    }, 1200);
  }

  return (
    <section className="auth-card" id="registerCard">
      <h1 className="auth-card__title" id="registerTitle">新規登録</h1>

      <form className="auth-card__form" id="registerForm" noValidate onSubmit={handleSubmit}>
        {/* Name */}
        <div className={`input-group ${fieldErrors.name ? 'input-group--error' : ''}`} id="registerNameGroup">
          <span className="input-group__icon"><UserIcon /></span>
          <input
            type="text"
            className="input-group__input"
            id="registerName"
            placeholder="お名前"
            value={name}
            onChange={(e) => { setName(e.target.value); clearFieldError('name'); }}
          />
        </div>

        {/* Email */}
        <div className={`input-group ${fieldErrors.email ? 'input-group--error' : ''}`} id="registerEmailGroup">
          <span className="input-group__icon"><MailIcon /></span>
          <input
            type="email"
            className="input-group__input"
            id="registerEmail"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
          />
        </div>

        {/* Password */}
        <div className={`input-group ${fieldErrors.password ? 'input-group--error' : ''}`} id="registerPasswordGroup">
          <span className="input-group__icon"><LockIcon /></span>
          <input
            type="password"
            className="input-group__input"
            id="registerPassword"
            placeholder="パスワード"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
          />
        </div>

        {/* Confirm Password */}
        <div className={`input-group ${fieldErrors.confirmPassword ? 'input-group--error' : ''}`} id="registerConfirmPasswordGroup">
          <span className="input-group__icon"><LockIcon /></span>
          <input
            type="password"
            className="input-group__input"
            id="registerConfirmPassword"
            placeholder="パスワードを再入力"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError('confirmPassword'); }}
          />
        </div>

        {/* Error */}
        <div className="auth-card__error" id="registerError">{error}</div>

        {/* Submit */}
        <button
          type="submit"
          className="btn btn--primary"
          id="registerSubmitBtn"
          disabled={loading}
        >
          {loading ? '登録中...' : '登録する'}
        </button>
      </form>

      {/* Terms */}
      <label className="auth-card__terms" id="termsLabel">
        <input
          type="checkbox"
          className="auth-card__terms-checkbox"
          id="termsCheckbox"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
        />
        <span>利用規約とプライバシーポリシーに同意する</span>
      </label>

      {/* Social register */}
      <div className="auth-card__social">
        <button
          className="btn btn--social"
          id="googleRegisterBtn"
          type="button"
          onClick={() => handleSocialLogin('google')}
          disabled={loading}
        >
          <GoogleIcon />
          <span>Googleで登録</span>
        </button>
        <button
          className="btn btn--social"
          id="facebookRegisterBtn"
          type="button"
          onClick={() => handleSocialLogin('facebook')}
          disabled={loading}
        >
          <FacebookIcon />
          <span>Facebookで登録</span>
        </button>
      </div>

      {/* Switch to login */}
      <p className="auth-card__switch" id="registerSwitchText">
        既にアカウントをお持ちですか？
        <button
          className="auth-card__switch-link"
          id="showLoginLink"
          type="button"
          onClick={onSwitchToLogin}
        >
          ログインしてください。
        </button>
      </p>
    </section>
  );
}
