import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { CheckIcon, MailIcon } from './Icons';
import './AuthCard.css';

const FORGOT_COPY = {
  ja: {
    title: 'パスワードをリセット',
    description: '登録済みのメールアドレスを入力してください。パスワード再設定リンクを送信します。',
    emailPlaceholder: 'メールアドレス',
    submit: 'リセットリンクを送信',
    submitting: '送信中...',
    sentTitle: 'メールを送信しました',
    sentText: '受信箱を確認し、メール内のリンクから新しいパスワードを設定してください。',
    backToLogin: 'ログインに戻る',
    emailRequired: 'メールアドレスを入力してください。',
    emailInvalid: 'メールアドレスの形式が正しくありません。',
    oauthUnsupported: 'Google/Facebookで登録したアカウントはこのアプリのパスワードリセットを利用できません。ログインプロバイダー側で変更してください。',
    sendError: 'リセットメールを送信できませんでした: {{message}}',
  },
  vi: {
    title: 'Quên mật khẩu',
    description: 'Nhập email đã đăng ký. Hệ thống sẽ gửi liên kết đặt lại mật khẩu đến email của bạn.',
    emailPlaceholder: 'Email',
    submit: 'Gửi liên kết đặt lại',
    submitting: 'Đang gửi...',
    sentTitle: 'Đã gửi email',
    sentText: 'Vui lòng kiểm tra hộp thư và mở liên kết trong email để đặt mật khẩu mới.',
    backToLogin: 'Quay lại đăng nhập',
    emailRequired: 'Vui lòng nhập email.',
    emailInvalid: 'Email không đúng định dạng.',
    oauthUnsupported: 'Tài khoản đăng nhập bằng Google/Facebook không thể đặt lại mật khẩu trong ứng dụng. Vui lòng đổi mật khẩu tại nhà cung cấp đăng nhập.',
    sendError: 'Không thể gửi email đặt lại mật khẩu: {{message}}',
  },
};

function interpolate(template, vars = {}) {
  return String(template).replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ''));
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getPasswordResetRedirectUrl() {
  return `${window.location.origin}${window.location.pathname}#reset-password`;
}

async function getProfileProviderByEmail(email) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    return '';
  }

  return String(data?.provider ?? '').toLowerCase();
}

export default function ForgotPasswordForm({ initialEmail = '', onBackToLogin }) {
  const { language } = useLanguage();
  const copy = FORGOT_COPY[language] ?? FORGOT_COPY.ja;
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const nextEmail = email.trim();

    setError('');
    setFieldError(false);

    if (!nextEmail) {
      setFieldError(true);
      setError(copy.emailRequired);
      return;
    }

    if (!isValidEmail(nextEmail)) {
      setFieldError(true);
      setError(copy.emailInvalid);
      return;
    }

    setLoading(true);

    const provider = await getProfileProviderByEmail(nextEmail);

    if (provider && provider !== 'email') {
      setLoading(false);
      setError(copy.oauthUnsupported);
      return;
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(nextEmail, {
      redirectTo: getPasswordResetRedirectUrl(),
    });

    setLoading(false);

    if (resetError) {
      setError(interpolate(copy.sendError, { message: resetError.message }));
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <section className="auth-card auth-card--success" id="forgotPasswordSentCard">
        <div className="auth-card__success-icon">
          <CheckIcon />
        </div>
        <h1 className="auth-card__title">{copy.sentTitle}</h1>
        <p className="auth-card__success-text">{copy.sentText}</p>
        <button type="button" className="auth-card__switch-link auth-card__standalone-link" onClick={onBackToLogin}>
          {copy.backToLogin}
        </button>
      </section>
    );
  }

  return (
    <section className="auth-card" id="forgotPasswordCard">
      <h1 className="auth-card__title">{copy.title}</h1>
      <p className="auth-card__description">{copy.description}</p>

      <form className="auth-card__form" noValidate onSubmit={handleSubmit}>
        <div className={`input-group ${fieldError ? 'input-group--error' : ''}`}>
          <span className="input-group__icon"><MailIcon /></span>
          <input
            type="email"
            className="input-group__input"
            placeholder={copy.emailPlaceholder}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError('');
              setFieldError(false);
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
