import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { MailIcon, LockIcon, GoogleIcon, FacebookIcon } from './Icons';
import { supabase } from '../supabaseClient';
import './AuthCard.css';

/**
 * LoginForm – ログイン form component.
 * @param {Object} props
 * @param {function} props.onLoginSuccess – callback after successful login
 * @param {function} props.onSwitchToRegister – callback to show register form
 */
export default function LoginForm({ onLoginSuccess, onSwitchToRegister }) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  async function handleSocialLogin(provider) {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: window.location.origin,
      }
    });

    if (error) {
      setError(t('auth.socialLoginError', { provider, message: error.message }));
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
      setError(t('auth.errors.emailRequired'));
    } else if (!isValidEmail(email.trim())) {
      errs.email = true;
      setError(t('auth.errors.emailInvalid'));
    }

    if (!password) {
      errs.password = true;
      if (!errs.email) setError(t('auth.errors.passwordRequired'));
    }

    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    // ── Simulated login ──
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess({ email: email.trim() });
    }, 1200);
  }

  return (
    <section className="auth-card" id="loginCard">
      <h1 className="auth-card__title" id="loginTitle">{t('auth.loginTitle')}</h1>

      <form className="auth-card__form" id="loginForm" noValidate onSubmit={handleSubmit}>
        {/* Email */}
        <div className={`input-group ${fieldErrors.email ? 'input-group--error' : ''}`} id="loginEmailGroup">
          <span className="input-group__icon"><MailIcon /></span>
          <input
            type="email"
            className="input-group__input"
            id="loginEmail"
            placeholder={t('auth.emailPlaceholder')}
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
            placeholder={t('auth.passwordPlaceholder')}
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
          {loading ? t('auth.loginSubmitting') : t('auth.loginSubmit')}
        </button>
      </form>

      {/* Forgot password */}
      <button
        className="auth-card__link--forgot"
        id="forgotPasswordLink"
        type="button"
        onClick={() => alert(t('auth.forgotPasswordAlert'))}
      >
        {t('auth.forgotPassword')}
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
          <span>{t('auth.googleLogin')}</span>
        </button>
        <button
          className="btn btn--social"
          id="facebookLoginBtn"
          type="button"
          onClick={() => handleSocialLogin('facebook')}
          disabled={loading}
        >
          <FacebookIcon />
          <span>{t('auth.facebookLogin')}</span>
        </button>
      </div>

      {/* Switch to register */}
      <p className="auth-card__switch" id="loginSwitchText">
        {t('auth.loginSwitchPrompt')}
        <button
          className="auth-card__switch-link"
          id="showRegisterLink"
          type="button"
          onClick={onSwitchToRegister}
        >
          {t('auth.loginSwitchAction')}
        </button>
      </p>
    </section>
  );
}
