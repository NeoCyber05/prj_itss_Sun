import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { CheckIcon, LockIcon } from './Icons';
import './AuthCard.css';

const RESET_COPY = {
  ja: {
    title: '新しいパスワード',
    description: '新しいパスワードを入力してください。',
    passwordPlaceholder: '新しいパスワード',
    confirmPasswordPlaceholder: '新しいパスワードを再入力',
    submit: 'パスワードを更新',
    submitting: '更新中...',
    successTitle: 'パスワードを更新しました',
    successText: '新しいパスワードでログインしてください。',
    backToLogin: 'ログインに戻る',
    passwordRequired: 'パスワードを入力してください。',
    confirmRequired: 'パスワードを再入力してください。',
    passwordTooShort: 'パスワードは6文字以上で入力してください。',
    passwordMismatch: 'パスワードが一致しません。',
    updateError: 'パスワードを更新できませんでした: {{message}}',
    recoveryMissing: 'リセットリンクが無効または期限切れです。もう一度リセットメールを送信してください。',
  },
  vi: {
    title: 'Đặt mật khẩu mới',
    description: 'Nhập mật khẩu mới cho tài khoản của bạn.',
    passwordPlaceholder: 'Mật khẩu mới',
    confirmPasswordPlaceholder: 'Nhập lại mật khẩu mới',
    submit: 'Cập nhật mật khẩu',
    submitting: 'Đang cập nhật...',
    successTitle: 'Đã cập nhật mật khẩu',
    successText: 'Vui lòng đăng nhập lại bằng mật khẩu mới.',
    backToLogin: 'Quay lại đăng nhập',
    passwordRequired: 'Vui lòng nhập mật khẩu.',
    confirmRequired: 'Vui lòng nhập lại mật khẩu.',
    passwordTooShort: 'Mật khẩu phải có ít nhất 6 ký tự.',
    passwordMismatch: 'Mật khẩu không khớp.',
    updateError: 'Không thể cập nhật mật khẩu: {{message}}',
    recoveryMissing: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng gửi lại email đặt lại mật khẩu.',
  },
};

function interpolate(template, vars = {}) {
  return String(template).replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ''));
}

export default function ResetPasswordForm({ hasRecoverySession, onBackToLogin }) {
  const { language } = useLanguage();
  const copy = RESET_COPY[language] ?? RESET_COPY.ja;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const errors = {};
    let firstError = '';

    setError('');

    if (!hasRecoverySession) {
      setError(copy.recoveryMissing);
      return;
    }

    if (!password) {
      errors.password = true;
      firstError = copy.passwordRequired;
    } else if (password.length < 6) {
      errors.password = true;
      firstError = copy.passwordTooShort;
    }

    if (!confirmPassword) {
      errors.confirmPassword = true;
      if (!firstError) firstError = copy.confirmRequired;
    } else if (password !== confirmPassword) {
      errors.confirmPassword = true;
      if (!firstError) firstError = copy.passwordMismatch;
    }

    setFieldErrors(errors);

    if (firstError) {
      setError(firstError);
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setLoading(false);
      setError(interpolate(copy.updateError, { message: updateError.message }));
      return;
    }

    await supabase.auth.signOut();
    setLoading(false);
    setSuccess(true);
  }

  function clearFieldError(field) {
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
    setError('');
  }

  if (success) {
    return (
      <section className="auth-card auth-card--success" id="resetPasswordSuccessCard">
        <div className="auth-card__success-icon">
          <CheckIcon />
        </div>
        <h1 className="auth-card__title">{copy.successTitle}</h1>
        <p className="auth-card__success-text">{copy.successText}</p>
        <button type="button" className="auth-card__switch-link auth-card__standalone-link" onClick={onBackToLogin}>
          {copy.backToLogin}
        </button>
      </section>
    );
  }

  return (
    <section className="auth-card" id="resetPasswordCard">
      <h1 className="auth-card__title">{copy.title}</h1>
      <p className="auth-card__description">{copy.description}</p>

      <form className="auth-card__form" noValidate onSubmit={handleSubmit}>
        <div className={`input-group ${fieldErrors.password ? 'input-group--error' : ''}`}>
          <span className="input-group__icon"><LockIcon /></span>
          <input
            type="password"
            className="input-group__input"
            placeholder={copy.passwordPlaceholder}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              clearFieldError('password');
            }}
          />
        </div>

        <div className={`input-group ${fieldErrors.confirmPassword ? 'input-group--error' : ''}`}>
          <span className="input-group__icon"><LockIcon /></span>
          <input
            type="password"
            className="input-group__input"
            placeholder={copy.confirmPasswordPlaceholder}
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              clearFieldError('confirmPassword');
            }}
          />
        </div>

        <div className="auth-card__error">{error}</div>

        <button type="submit" className="btn btn--primary" disabled={loading}>
          {loading ? copy.submitting : copy.submit}
        </button>
      </form>

      <p className="auth-card__switch">
        <button type="button" className="auth-card__switch-link" onClick={onBackToLogin}>
          {copy.backToLogin}
        </button>
      </p>
    </section>
  );
}
