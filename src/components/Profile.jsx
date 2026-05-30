import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import './Profile.css';

const PROFILE_COPY = {
  ja: {
    title: 'プロフィール',
    myProfile: 'マイプロフィール',
    displayName: '表示名',
    email: 'Email',
    phone: '電話番号',
    joinDate: '参加日',
    changePhoto: '写真を変更',
    save: '変更を保存',
    cancel: 'キャンセル',
    accountSettings: 'アカウント設定',
    changePassword: 'パスワードを変更',
    notifications: '通知設定',
    saved: 'プロフィールを更新しました',
    saveError: 'プロフィールを保存できませんでした: {{message}}',
    loadError: 'プロフィールを読み込めませんでした: {{message}}',
    passwordTodo: 'パスワード変更画面は未実装です。',
    notificationsTodo: '通知設定画面は未実装です。',
    invalidImage: '画像ファイルを選択してください。',
    invalidPhone: '電話番号の形式が無効です。',
    defaultName: 'ユーザー',
  },
  vi: {
    title: 'Hồ sơ',
    myProfile: 'Hồ sơ của tôi',
    displayName: 'Tên hiển thị',
    email: 'Email',
    phone: 'Số điện thoại',
    joinDate: 'Ngày tham gia',
    changePhoto: 'Đổi ảnh',
    save: 'Lưu thay đổi',
    cancel: 'Hủy',
    accountSettings: 'Cài đặt tài khoản',
    changePassword: 'Đổi mật khẩu',
    notifications: 'Cài đặt thông báo',
    saved: 'Đã cập nhật hồ sơ',
    saveError: 'Không thể lưu hồ sơ: {{message}}',
    loadError: 'Không thể tải hồ sơ: {{message}}',
    passwordTodo: 'Màn hình đổi mật khẩu chưa được triển khai.',
    notificationsTodo: 'Màn hình cài đặt thông báo chưa được triển khai.',
    invalidImage: 'Vui lòng chọn tệp ảnh.',
    invalidPhone: 'Số điện thoại không hợp lệ.',
    defaultName: 'Người dùng',
  },
};

const PASSWORD_COPY = {
  ja: {
    currentPassword: '現在のパスワード',
    newPassword: '新しいパスワード',
    confirmPassword: '新しいパスワードを再入力',
    passwordSave: 'パスワードを保存',
    passwordSaved: 'パスワードを更新しました。次回から新しいパスワードを使ってください。',
    passwordCurrentRequired: '現在のパスワードを入力してください。',
    passwordRequired: '新しいパスワードを入力してください。',
    passwordTooShort: 'パスワードは6文字以上で入力してください。',
    passwordMismatch: 'パスワードが一致しません。',
    passwordUnsupported: 'Google/Facebookで登録したアカウントはこのアプリでパスワードを変更できません。ログインプロバイダー側で変更してください。',
    passwordSaveError: 'パスワードを更新できませんでした: {{message}}',
  },
  vi: {
    currentPassword: 'Mật khẩu hiện tại',
    newPassword: 'Mật khẩu mới',
    confirmPassword: 'Nhập lại mật khẩu mới',
    passwordSave: 'Lưu mật khẩu',
    passwordSaved: 'Đã cập nhật mật khẩu. Lần sau hãy đăng nhập bằng mật khẩu mới.',
    passwordCurrentRequired: 'Vui lòng nhập mật khẩu hiện tại.',
    passwordRequired: 'Vui lòng nhập mật khẩu mới.',
    passwordTooShort: 'Mật khẩu phải có ít nhất 6 ký tự.',
    passwordMismatch: 'Mật khẩu không khớp.',
    passwordUnsupported: 'Tài khoản đăng nhập bằng Google/Facebook không thể đổi mật khẩu trong ứng dụng. Vui lòng đổi mật khẩu tại nhà cung cấp đăng nhập.',
    passwordSaveError: 'Không thể cập nhật mật khẩu: {{message}}',
  },
};

function interpolate(template, vars = {}) {
  return String(template).replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ''));
}

function formatJoinDate(value, language) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'ja-JP').format(date);
}

function getInitials(nameOrEmail) {
  const value = String(nameOrEmail ?? '').trim();

  if (!value) return 'U';

  return value
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function isMissingColumnError(error, columnName) {
  const message = String(error?.message ?? '');

  return error?.code === 'PGRST204'
    || message.includes(`'${columnName}' column`)
    || message.includes(`column ${columnName} does not exist`)
    || message.includes(`${columnName} does not exist`);
}

function getAuthProviders(user) {
  const providers = new Set();
  const primaryProvider = user?.app_metadata?.provider;

  if (primaryProvider) {
    providers.add(primaryProvider);
  }

  (user?.identities ?? []).forEach((identity) => {
    if (identity?.provider) {
      providers.add(identity.provider);
    }
  });

  return [...providers];
}

function resizeAndCompressAvatar(file, callback) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 150;
      const MAX_HEIGHT = 150;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Nén ảnh sang JPEG chất lượng 0.7 để có dung lượng siêu nhẹ (~5KB-15KB)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      callback(dataUrl);
    };
    img.src = String(e.target.result ?? '');
  };
  reader.readAsDataURL(file);
}

export default function Profile({ user, userProfile, onCancel, onUserUpdated }) {
  const { language } = useLanguage();
  const copy = PROFILE_COPY[language] ?? PROFILE_COPY.ja;
  const passwordCopy = PASSWORD_COPY[language] ?? PASSWORD_COPY.ja;
  const fileInputRef = useRef(null);
  const userMetadata = useMemo(() => user?.user_metadata ?? {}, [user]);
  const authProviders = useMemo(() => getAuthProviders(user), [user]);
  const canChangePassword = authProviders.includes('email');
  const [formData, setFormData] = useState(() => ({
    avatarUrl: userProfile?.avatar_url || userMetadata.avatar_url || userMetadata.picture || '',
    displayName: userProfile?.display_name || userMetadata.full_name || userMetadata.name || user?.email || '',
    email: user?.email || '',
    phone: userMetadata.phone || '',
  }));
  const [joinDate, setJoinDate] = useState(user?.created_at || '');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    confirmPassword: '',
    currentPassword: '',
    newPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');
  const [passwordFieldErrors, setPasswordFieldErrors] = useState({});
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      if (!user?.id) return;

      setError('');
      setFormData({
        avatarUrl: userProfile?.avatar_url || userMetadata.avatar_url || userMetadata.picture || '',
        displayName: userProfile?.display_name || userMetadata.full_name || userMetadata.name || user.email || '',
        email: user.email || '',
        phone: userMetadata.phone || '',
      });
      setJoinDate(user.created_at || '');

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!isMounted) return;

      if (profileError) {
        setError(interpolate(copy.loadError, { message: profileError.message }));
        return;
      }

      if (data) {
        const profileDisplayName = data.display_name || data.full_name || data.name;

        setFormData((current) => ({
          ...current,
          avatarUrl: data.avatar_url || current.avatarUrl,
          displayName: profileDisplayName || current.displayName,
          email: data.email || current.email,
        }));
        setJoinDate(data.created_at || user.created_at || '');
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [copy.loadError, user, userMetadata]);

  function updateField(field, value) {
    setStatus('');
    setError('');
    setFormData((current) => ({ ...current, [field]: value }));
  }

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(copy.invalidImage);
      event.target.value = '';
      return;
    }

    resizeAndCompressAvatar(file, (compressedBase64) => {
      updateField('avatarUrl', compressedBase64);
    });

    event.target.value = '';
  }

  const PHONE_REGEX = /^[\d\s+\-()]{7,20}$/;

  function isValidPhone(value) {
    return !value || PHONE_REGEX.test(value);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!user?.id) return;

    const nextDisplayName = formData.displayName.trim();
    const nextEmail = formData.email.trim();
    const nextPhone = formData.phone.trim();

    if (!isValidPhone(nextPhone)) {
      setError(copy.invalidPhone);
      return;
    }

    setIsSaving(true);
    setStatus('');
    setError('');

    let finalAvatarUrl = formData.avatarUrl;

    // 1. Gửi ảnh lên Vite middleware để lưu thành file vật lý trong repo public/avatars/
    if (formData.avatarUrl && formData.avatarUrl.startsWith('data:image/')) {
      try {
        const response = await fetch('/api/upload-avatar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            avatarDataUrl: formData.avatarUrl,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.avatarUrl) {
            // Sử dụng URL tĩnh của file trong repo để lưu vào DB
            finalAvatarUrl = result.avatarUrl;
            // Cập nhật lại form state để hiển thị từ URL tĩnh
            setFormData((current) => ({ ...current, avatarUrl: finalAvatarUrl }));
          }
        } else {
          console.error('Failed to upload avatar to local repo');
        }
      } catch (uploadError) {
        console.error('Error uploading avatar to local:', uploadError);
      }
    }

    // 2. Lưu ngay vào localStorage để đảm bảo hiển thị tức thời và bền vững
    const localProfileRow = {
      id: user.id,
      email: nextEmail || user.email,
      display_name: nextDisplayName,
      avatar_url: finalAvatarUrl || null,
      provider: user.app_metadata?.provider || 'email',
      phone: nextPhone,
    };

    try {
      localStorage.setItem(`rakuslide:user-profile:${user.id}`, JSON.stringify(localProfileRow));
    } catch (e) {
      console.warn('Failed to write profile to localStorage:', e);
    }

    // 3. Tiến hành đồng bộ thông tin lên Database và Auth metadata ngầm
    try {
      const authPatch = {
        data: {
          ...userMetadata,
          avatar_url: finalAvatarUrl || null,
          full_name: nextDisplayName,
          name: nextDisplayName,
          phone: nextPhone,
        },
      };

      if (nextEmail && nextEmail !== user.email) {
        authPatch.email = nextEmail;
      }

      const { data: authData, error: authError } = await supabase.auth.updateUser(authPatch);

      if (authError) throw authError;

      const profileRow = {
        id: user.id,
        email: nextEmail || user.email,
        display_name: nextDisplayName,
        avatar_url: finalAvatarUrl || null,
        provider: user.app_metadata?.provider || 'email',
      };
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileRow, { onConflict: 'id' });

      if (isMissingColumnError(profileError, 'display_name')) {
        const fallbackProfileRow = { ...profileRow };
        delete fallbackProfileRow.display_name;
        const { error: fallbackProfileError } = await supabase
          .from('profiles')
          .upsert(fallbackProfileRow, { onConflict: 'id' });

        if (fallbackProfileError) throw fallbackProfileError;
      } else if (profileError) {
        throw profileError;
      }

      if (authData?.user) {
        onUserUpdated(authData.user);
      }
    } catch (dbError) {
      console.warn('Database sync failed, but local profile was successfully saved:', dbError.message);
      // Giả lập cập nhật user state để kích hoạt useEffect fetchProfile bảo vệ local avatar
      const mockUser = {
        ...user,
        user_metadata: {
          ...userMetadata,
          avatar_url: finalAvatarUrl || null,
          full_name: nextDisplayName,
          name: nextDisplayName,
          phone: nextPhone,
        }
      };
      onUserUpdated(mockUser);
    }

    setStatus(copy.saved);
    setIsSaving(false);
  }

  function handleReset() {
    setStatus('');
    setError('');
    setFormData({
      avatarUrl: userMetadata.avatar_url || userMetadata.picture || '',
      displayName: userMetadata.full_name || userMetadata.name || user?.email || '',
      email: user?.email || '',
      phone: userMetadata.phone || '',
    });

    if (onCancel) {
      onCancel();
    }
  }

  function updatePasswordField(field, value) {
    setPasswordData((current) => ({ ...current, [field]: value }));
    setPasswordError('');
    setPasswordStatus('');
    setPasswordFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function handleChangePasswordClick() {
    setPasswordStatus('');
    setPasswordError('');

    if (!canChangePassword) {
      setPasswordError(passwordCopy.passwordUnsupported);
      setIsPasswordFormOpen(false);
      return;
    }

    setIsPasswordFormOpen((isOpen) => !isOpen);
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();

    if (!canChangePassword) {
      setPasswordError(passwordCopy.passwordUnsupported);
      return;
    }

    const fieldErrors = {};
    let firstError = '';

    if (!passwordData.currentPassword) {
      fieldErrors.currentPassword = true;
      firstError = passwordCopy.passwordCurrentRequired;
    }

    if (!passwordData.newPassword) {
      fieldErrors.newPassword = true;
      if (!firstError) firstError = passwordCopy.passwordRequired;
    } else if (passwordData.newPassword.length < 6) {
      fieldErrors.newPassword = true;
      if (!firstError) firstError = passwordCopy.passwordTooShort;
    }

    if (passwordData.confirmPassword !== passwordData.newPassword) {
      fieldErrors.confirmPassword = true;
      if (!firstError) firstError = passwordCopy.passwordMismatch;
    }

    setPasswordFieldErrors(fieldErrors);

    if (firstError) {
      setPasswordError(firstError);
      return;
    }

    setIsPasswordSaving(true);
    setPasswordError('');
    setPasswordStatus('');

    const { data, error: updateError } = await supabase.auth.updateUser({
      currentPassword: passwordData.currentPassword,
      password: passwordData.newPassword,
    });

    setIsPasswordSaving(false);

    if (updateError) {
      setPasswordError(interpolate(passwordCopy.passwordSaveError, { message: updateError.message }));
      return;
    }

    setPasswordData({
      confirmPassword: '',
      currentPassword: '',
      newPassword: '',
    });
    setPasswordFieldErrors({});
    setPasswordStatus(passwordCopy.passwordSaved);
    setIsPasswordFormOpen(false);

    if (data?.user) {
      onUserUpdated(data.user);
    }
  }

  const displayName = formData.displayName || copy.defaultName;

  return (
    <section className="profile-page" aria-labelledby="profileTitle">
      <h1 id="profileTitle">{copy.title}</h1>

      <div className="profile-page__grid">
        <form className="profile-card profile-card--main" onSubmit={handleSubmit}>
          <h2>{copy.myProfile}</h2>

          <div className="profile-card__body">
            <div className="profile-avatar-panel">
              <div className="profile-avatar" aria-hidden="true">
                {formData.avatarUrl ? (
                  <img src={formData.avatarUrl} alt="" />
                ) : (
                  <span>{getInitials(displayName)}</span>
                )}
                <button
                  type="button"
                  className="profile-avatar__upload"
                  aria-label={copy.changePhoto}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span>↑</span>
                </button>
              </div>
              <button
                type="button"
                className="profile-photo-button"
                onClick={() => fileInputRef.current?.click()}
              >
                {copy.changePhoto}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                className="profile-hidden-input"
                onChange={handlePhotoChange}
              />
            </div>

            <div className="profile-fields">
              <label className="profile-field">
                <span>{copy.displayName}</span>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(event) => updateField('displayName', event.target.value)}
                />
              </label>

              <label className="profile-field">
                <span>{copy.email}</span>
                <input
                  type="email"
                  value={formData.email}
                  readOnly
                  tabIndex={-1}
                />
              </label>

              <label className="profile-field">
                <span>{copy.phone}</span>
                <input
                  type="tel"
                  value={formData.phone}
                  pattern="[\d\s+\-()]{7,20}"
                  title={copy.invalidPhone}
                  onChange={(event) => updateField('phone', event.target.value)}
                />
              </label>

              <label className="profile-field">
                <span>{copy.joinDate}</span>
                <input type="text" value={formatJoinDate(joinDate, language)} readOnly />
              </label>

              <div className="profile-actions">
                <button type="submit" className="profile-save-button" disabled={isSaving}>
                  <span aria-hidden="true">▣</span>
                  {copy.save}
                </button>
                <button type="button" className="profile-cancel-button" onClick={handleReset}>
                  {copy.cancel}
                </button>
              </div>
            </div>
          </div>

          {(status || error) && (
            <p className={error ? 'profile-message profile-message--error' : 'profile-message'} role="status">
              {error || status}
            </p>
          )}
        </form>

        <aside className="profile-card profile-card--settings">
          <h2>{copy.accountSettings}</h2>
          <div className="profile-settings-actions">
            <button
              type="button"
              aria-disabled={!canChangePassword}
              className={!canChangePassword ? 'profile-settings-action--disabled' : ''}
              title={!canChangePassword ? passwordCopy.passwordUnsupported : undefined}
              onClick={handleChangePasswordClick}
            >
              {copy.changePassword}
            </button>
          </div>
          {(passwordError || passwordStatus) && (
            <p className={passwordError ? 'profile-password-message profile-password-message--error' : 'profile-password-message'} role="status">
              {passwordError || passwordStatus}
            </p>
          )}
          {isPasswordFormOpen && (
            <form className="profile-password-form" onSubmit={handlePasswordSubmit}>
              <label>
                <span>{passwordCopy.currentPassword}</span>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  className={passwordFieldErrors.currentPassword ? 'profile-password-input--error' : ''}
                  onChange={(event) => updatePasswordField('currentPassword', event.target.value)}
                />
              </label>
              <label>
                <span>{passwordCopy.newPassword}</span>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  className={passwordFieldErrors.newPassword ? 'profile-password-input--error' : ''}
                  onChange={(event) => updatePasswordField('newPassword', event.target.value)}
                />
              </label>
              <label>
                <span>{passwordCopy.confirmPassword}</span>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  className={passwordFieldErrors.confirmPassword ? 'profile-password-input--error' : ''}
                  onChange={(event) => updatePasswordField('confirmPassword', event.target.value)}
                />
              </label>
              <button type="submit" disabled={isPasswordSaving}>
                {isPasswordSaving ? '...' : passwordCopy.passwordSave}
              </button>
            </form>
          )}
        </aside>
      </div>
    </section>
  );
}
