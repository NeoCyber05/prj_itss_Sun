import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import {
  listSavedTemplates,
  updateTemplateShareAccess,
  updateTemplateShareSettings,
} from '../services/slideCreationService.js';
import SlidePreviewThumbnail from './SlidePreviewThumbnail.jsx';
import './MySlides.css';

const COPY = {
  ja: {
    sectionTitle: '資料共有',
    sortLabel: '並べ替え',
    sortName: '名前',
    sortUpdated: '更新日時',
    sortPermission: '権限',
    loading: '保存済みスライドを読み込み中...',
    emptyTitle: '保存済みスライドはありません',
    emptyText: 'エディターで保存するとここに表示されます。',
    loadError: '保存済みスライドを読み込めませんでした: {{message}}',
    revokeError: 'アクセス権限を取り消せませんでした: {{message}}',
    open: '編集',
    delete: 'アクセス取り消し',
    revoking: '更新中...',
    manageLink: 'リンクを管理',
    accessTitle: 'アクセス権限一覧',
    tableTemplate: 'テンプレート',
    tablePermission: '現在の権限',
    tableUpdated: '更新日',
    tableAction: 'アクション',
    permissionLabel: '共有権限',
    slides: '{{count}}スライド',
    publicAccess: '公開',
    privateAccess: '非公開',
    invitedAccess: '招待された人のみ',
    invitedCount: '{{count}}名',
    noDate: '未保存',
    cancel: 'キャンセル',
    revokeConfirmTitle: 'アクセス取り消し',
    revokeConfirmBody: '「{{title}}」を非公開に戻しますか？',
    revokeAction: '非公開にする',
    shareDialogTitle: 'プレゼンテーションを共有',
    shareViewingCount: '0名が閲覧中',
    shareSettings: '設定',
    closeShare: '閉じる',
    shareAddUserPlaceholder: '+ ユーザーを追加...',
    shareAddUser: '追加',
    shareOwnerName: 'あなた',
    shareOwnerRole: '所有者',
    shareAccessTitle: 'アクセス権限',
    sharePublicAccess: '公開',
    sharePrivateAccess: '非公開',
    shareInvitedAccess: '招待された人のみ',
    shareCopyLink: 'リンクをコピー',
    shareAccessUpdated: '共有権限を更新しました',
    shareAccessError: '共有権限を更新できませんでした: {{message}}',
    shareInviteAdded: 'ユーザーを追加しました',
    shareInviteEmpty: 'メールアドレスを入力してください',
    shareAdvancedTitle: '詳細設定',
    shareAdvancedDescription: '共有リンクから閲覧者が実行できる操作を管理します。',
    shareAllowDownload: '閲覧者のダウンロードを許可',
    shareAllowCopy: '閲覧者のコピーを許可',
    shareAllowEdit: '閲覧者の編集を許可',
    shareAllowReshare: '閲覧者の再共有を許可',
    shareSettingsUpdated: '共有設定を更新しました',
    shareSettingsLocalOnly: '共有設定を画面上で更新しました。',
    copied: '共有リンクをコピーしました',
    copyFailed: 'リンクをコピーできませんでした',
  },
  vi: {
    sectionTitle: 'Chia sẻ tài liệu',
    sortLabel: 'Sắp xếp',
    sortName: 'Tên',
    sortUpdated: 'Cập nhật',
    sortPermission: 'Quyền',
    loading: 'Đang tải danh sách slide đã lưu...',
    emptyTitle: 'Chưa có slide đã lưu',
    emptyText: 'Sau khi nhấn Lưu trong editor, template sẽ xuất hiện tại đây.',
    loadError: 'Không thể tải slide đã lưu: {{message}}',
    revokeError: 'Không thể thu hồi quyền truy cập: {{message}}',
    open: 'Chỉnh sửa',
    delete: 'Thu hồi quyền truy cập',
    revoking: 'Đang cập nhật...',
    manageLink: 'Quản lý link',
    accessTitle: 'Danh sách quyền truy cập',
    tableTemplate: 'Template',
    tablePermission: 'Quyền hiện tại',
    tableUpdated: 'Ngày cập nhật',
    tableAction: 'Thao tác',
    permissionLabel: 'Quyền chia sẻ',
    slides: '{{count}} slide',
    publicAccess: 'Công khai',
    privateAccess: 'Riêng tư',
    invitedAccess: 'Chỉ dành cho người được mời',
    invitedCount: '{{count}} người',
    noDate: 'Chưa lưu',
    cancel: 'Hủy',
    revokeConfirmTitle: 'Thu hồi quyền truy cập',
    revokeConfirmBody: 'Chuyển "{{title}}" về chế độ riêng tư?',
    revokeAction: 'Chuyển về riêng tư',
    shareDialogTitle: 'Chia sẻ bài thuyết trình',
    shareViewingCount: '0 người đang xem',
    shareSettings: 'Cài đặt',
    closeShare: 'Đóng',
    shareAddUserPlaceholder: '+ Thêm người dùng...',
    shareAddUser: 'Thêm',
    shareOwnerName: 'Bạn',
    shareOwnerRole: 'Chủ sở hữu',
    shareAccessTitle: 'Quyền truy cập',
    sharePublicAccess: 'Công khai',
    sharePrivateAccess: 'Riêng tư',
    shareInvitedAccess: 'Chỉ dành cho người được mời',
    shareCopyLink: 'Sao chép link',
    shareAccessUpdated: 'Đã cập nhật quyền chia sẻ',
    shareAccessError: 'Không thể cập nhật quyền chia sẻ: {{message}}',
    shareInviteAdded: 'Đã thêm người dùng',
    shareInviteEmpty: 'Nhập email người dùng cần thêm',
    shareAdvancedTitle: 'Cài đặt chia sẻ chi tiết',
    shareAdvancedDescription: 'Kiểm soát những thao tác người xem được phép dùng từ link chia sẻ.',
    shareAllowDownload: 'Cho phép người xem tải xuống',
    shareAllowCopy: 'Cho phép người xem sao chép',
    shareAllowEdit: 'Cho phép người xem chỉnh sửa',
    shareAllowReshare: 'Cho phép người xem chia sẻ lại',
    shareSettingsUpdated: 'Đã cập nhật cài đặt chia sẻ',
    shareSettingsLocalOnly: 'Đã cập nhật cài đặt trên giao diện.',
    copied: 'Đã sao chép link chia sẻ',
    copyFailed: 'Không thể sao chép link',
  },
};

const SORT_OPTIONS = ['name', 'updated', 'permission'];
const DEFAULT_SHARE_SETTINGS = {
  accessMode: 'private',
  allowDownload: false,
  allowCopy: true,
  allowEdit: false,
  allowReshare: false,
  invitedEmails: [],
};

function getCopy(language) {
  return COPY[language] ?? COPY.ja;
}

function formatCopy(template, vars = {}) {
  return String(template).replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ''));
}

function formatDate(value, language, copy) {
  if (!value) return copy.noDate;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return copy.noDate;
  return new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'ja-JP', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function getTemplateTitle(template, copy) {
  return template.title?.trim() || copy.emptyTitle;
}

function getTemplateTime(template) {
  return new Date(template.updated_at ?? template.created_at ?? 0).getTime();
}

function getAccess(template, copy) {
  if (template.visibility === 'unlisted') {
    return { icon: 'users', label: copy.invitedAccess, tone: 'invited' };
  }
  if (template.is_public || template.visibility === 'public') {
    return { icon: 'link', label: copy.publicAccess, tone: 'link' };
  }
  return { icon: 'lock', label: copy.privateAccess, tone: 'private' };
}

function canManageTemplate(template, currentUserId) {
  return Boolean(template?.owner_id && currentUserId && template.owner_id === currentUserId);
}

function normalizeInviteEmail(value) {
  return String(value ?? '').trim().toLowerCase();
}

function normalizeInviteEmails(values) {
  if (!Array.isArray(values)) return [];

  return [...new Set(values.map(normalizeInviteEmail).filter(Boolean))];
}

function getShareAccessFromTemplate(template) {
  const accessMode = template?.share_settings?.accessMode ?? template?.shareSettings?.accessMode;

  if (template?.visibility === 'unlisted') return 'unlisted';
  if (accessMode === 'public' || accessMode === 'private' || accessMode === 'unlisted') return accessMode;

  return template?.is_public || template?.visibility === 'public' ? 'public' : 'private';
}

function getShareSettingsFromTemplate(template) {
  const shareSettings = template?.share_settings ?? template?.shareSettings ?? {};
  const accessMode = getShareAccessFromTemplate(template);

  return {
    ...DEFAULT_SHARE_SETTINGS,
    ...shareSettings,
    accessMode: shareSettings.accessMode ?? accessMode,
    invitedEmails: normalizeInviteEmails(shareSettings.invitedEmails ?? shareSettings.invited_emails),
  };
}

function getShareUrl(templateId) {
  if (typeof window === 'undefined' || !templateId) return '';

  return `${window.location.origin}${window.location.pathname}${window.location.search}#editor=${encodeURIComponent(templateId)}`;
}

function SmallIcon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };
  switch (name) {
    case 'link':
      return (
        <svg {...common}>
          <path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
          <path d="M14 11a5 5 0 0 0-7.1 0l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1" />
        </svg>
      );
    case 'lock':
      return (
        <svg {...common}>
          <rect x="5" y="10" width="14" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      );
    case 'users':
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
          <circle cx="9.5" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    default:
      return null;
  }
}

function TemplatePreview({ template, title }) {
  if (template.first_slide) {
    return <SlidePreviewThumbnail slide={template.first_slide} title={title} />;
  }

  if (template.thumbnail_url) {
    return <img src={template.thumbnail_url} alt={title} className="ms-card__thumb-img" />;
  }

  return (
    <div className="ms-card__thumb-fallback" aria-hidden="true">
      <div className="ms-card__thumb-grid">
        <div className="ms-thumb-cell"><span>{title}</span></div>
        <div className="ms-thumb-cell ms-thumb-cell--alt"><span>RakuSlide</span></div>
        <div className="ms-thumb-cell"><span>スライド</span></div>
        <div className="ms-thumb-cell ms-thumb-cell--dim"><span>Slide</span></div>
      </div>
    </div>
  );
}

export default function MySlides({ currentUserEmail, currentUserId, onOpenTemplate }) {
  const { language } = useLanguage();
  const copy = getCopy(language);
  const [templates, setTemplates] = useState([]);
  const [sortBy, setSortBy] = useState('updated');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [revokingTemplateId, setRevokingTemplateId] = useState('');
  const [pendingRevokeTemplate, setPendingRevokeTemplate] = useState(null);
  const [shareTemplate, setShareTemplate] = useState(null);
  const [shareAccess, setShareAccess] = useState('private');
  const [shareSettings, setShareSettings] = useState(DEFAULT_SHARE_SETTINGS);
  const [shareInvitees, setShareInvitees] = useState([]);
  const [shareInviteEmail, setShareInviteEmail] = useState('');
  const [isShareSettingsOpen, setIsShareSettingsOpen] = useState(false);
  const [isUpdatingShareAccess, setIsUpdatingShareAccess] = useState(false);
  const [isUpdatingShareSettings, setIsUpdatingShareSettings] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    if (!currentUserId) return () => { isMounted = false; };

    Promise.resolve()
      .then(() => {
        if (!isMounted) return [];
        setIsLoading(true);
        setError('');
        return listSavedTemplates(currentUserId, currentUserEmail);
      })
      .then((loadedTemplates) => {
        if (isMounted) setTemplates(loadedTemplates);
      })
      .catch((loadFailure) => {
        if (isMounted) setError(formatCopy(copy.loadError, { message: loadFailure.message }));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [copy.loadError, currentUserEmail, currentUserId]);

  const sortedTemplates = useMemo(() => {
    const nextTemplates = [...templates];
    if (sortBy === 'name') {
      nextTemplates.sort((a, b) =>
        getTemplateTitle(a, copy).localeCompare(getTemplateTitle(b, copy), language === 'vi' ? 'vi' : 'ja')
      );
    } else if (sortBy === 'permission') {
      nextTemplates.sort((a, b) =>
        getAccess(a, copy).label.localeCompare(getAccess(b, copy).label, language === 'vi' ? 'vi' : 'ja')
      );
    } else {
      nextTemplates.sort((a, b) => getTemplateTime(b) - getTemplateTime(a));
    }
    return nextTemplates;
  }, [copy, language, sortBy, templates]);

  function handleRequestRevoke(template) {
    setPendingRevokeTemplate(template);
  }

  function openShareDialog(template) {
    const nextSettings = getShareSettingsFromTemplate(template);

    setShareTemplate(template);
    setShareAccess(nextSettings.accessMode);
    setShareSettings(nextSettings);
    setShareInvitees(nextSettings.invitedEmails);
    setShareInviteEmail('');
    setShareMessage('');
    setIsShareSettingsOpen(false);
  }

  function closeShareDialog() {
    if (isUpdatingShareAccess || isUpdatingShareSettings) return;

    setShareTemplate(null);
    setShareMessage('');
  }

  function updateTemplateInList(updatedTemplate, nextSettings) {
    const templateId = updatedTemplate.id ?? shareTemplate?.id;

    setTemplates((currentTemplates) => currentTemplates.map((item) => (
      item.id === templateId
        ? {
            ...item,
            ...updatedTemplate,
            invited_count: updatedTemplate.invited_count ?? nextSettings.invitedEmails.length,
            share_settings: nextSettings,
          }
        : item
    )));
    setShareTemplate((currentTemplate) => (
      currentTemplate?.id === templateId
        ? {
            ...currentTemplate,
            ...updatedTemplate,
            invited_count: updatedTemplate.invited_count ?? nextSettings.invitedEmails.length,
            share_settings: nextSettings,
          }
        : currentTemplate
    ));
  }

  function buildShareSettingsPayload(overrides = {}) {
    return {
      ...shareSettings,
      accessMode: shareAccess,
      invitedEmails: shareInvitees,
      ...overrides,
    };
  }

  async function handleShareAccessChange(event) {
    if (!shareTemplate) return;

    const nextAccess = event.target.value;
    const previousAccess = shareAccess;
    const previousSettings = shareSettings;
    const nextSettings = buildShareSettingsPayload({ accessMode: nextAccess });

    setShareAccess(nextAccess);
    setShareSettings(nextSettings);
    setShareMessage('');
    setIsUpdatingShareAccess(true);

    try {
      const updatedTemplate = await updateTemplateShareAccess({
        accessMode: nextAccess,
        settings: nextSettings,
        templateId: shareTemplate.id,
        userId: currentUserId,
      });

      updateTemplateInList(updatedTemplate, nextSettings);
      setShareMessage(copy.shareAccessUpdated);
    } catch (shareFailure) {
      setShareAccess(previousAccess);
      setShareSettings(previousSettings);
      setShareMessage(formatCopy(copy.shareAccessError, { message: shareFailure.message }));
    } finally {
      setIsUpdatingShareAccess(false);
    }
  }

  async function handleShareSettingChange(settingKey) {
    if (!shareTemplate) return;

    const previousSettings = shareSettings;
    const nextSettings = buildShareSettingsPayload({
      [settingKey]: !shareSettings[settingKey],
    });

    setShareSettings(nextSettings);
    setShareMessage('');
    setIsUpdatingShareSettings(true);

    try {
      const updatedTemplate = await updateTemplateShareSettings({
        settings: nextSettings,
        templateId: shareTemplate.id,
        userId: currentUserId,
      });

      updateTemplateInList(updatedTemplate, nextSettings);
      setShareMessage(
        updatedTemplate.share_settings_persisted === false
          ? copy.shareSettingsLocalOnly
          : copy.shareSettingsUpdated,
      );
    } catch (settingsFailure) {
      setShareSettings(previousSettings);
      setShareMessage(formatCopy(copy.shareAccessError, { message: settingsFailure.message }));
    } finally {
      setIsUpdatingShareSettings(false);
    }
  }

  async function handleAddShareInvite(event) {
    event.preventDefault();
    if (!shareTemplate) return;

    const email = normalizeInviteEmail(shareInviteEmail);

    if (!email) {
      setShareMessage(copy.shareInviteEmpty);
      return;
    }

    const previousInvitees = shareInvitees;
    const previousSettings = shareSettings;
    const nextInvitees = shareInvitees.includes(email) ? shareInvitees : [...shareInvitees, email];
    const nextSettings = buildShareSettingsPayload({ invitedEmails: nextInvitees });

    setShareInvitees(nextInvitees);
    setShareSettings(nextSettings);
    setShareMessage('');
    setIsUpdatingShareSettings(true);

    try {
      const updatedTemplate = await updateTemplateShareSettings({
        settings: nextSettings,
        templateId: shareTemplate.id,
        userId: currentUserId,
      });

      updateTemplateInList(updatedTemplate, nextSettings);
      setShareInviteEmail('');
      setShareMessage(copy.shareInviteAdded);
    } catch (inviteFailure) {
      setShareInvitees(previousInvitees);
      setShareSettings(previousSettings);
      setShareMessage(formatCopy(copy.shareAccessError, { message: inviteFailure.message }));
    } finally {
      setIsUpdatingShareSettings(false);
    }
  }

  function copyShareLink() {
    if (!shareTemplate || !navigator.clipboard?.writeText) {
      setShareMessage(copy.copyFailed);
      return;
    }

    navigator.clipboard.writeText(getShareUrl(shareTemplate.id))
      .then(() => setShareMessage(copy.copied))
      .catch(() => setShareMessage(copy.copyFailed));
  }

  async function handleConfirmRevoke() {
    if (!pendingRevokeTemplate) return;

    setRevokingTemplateId(pendingRevokeTemplate.id);
    setError('');

    try {
      const updatedTemplate = await updateTemplateShareAccess({
        accessMode: 'private',
        settings: pendingRevokeTemplate.share_settings,
        templateId: pendingRevokeTemplate.id,
        userId: currentUserId,
      });

      setTemplates((currentTemplates) => currentTemplates.map((item) => (
        item.id === pendingRevokeTemplate.id
          ? {
              ...item,
              ...updatedTemplate,
              invited_count: updatedTemplate.invited_count ?? 0,
              share_settings: updatedTemplate.share_settings,
              visibility: updatedTemplate.visibility,
            }
          : item
      )));
      setPendingRevokeTemplate(null);
    } catch (revokeFailure) {
      setError(formatCopy(copy.revokeError, { message: revokeFailure.message }));
    } finally {
      setRevokingTemplateId('');
    }
  }

  return (
    <section className="ms-page" aria-labelledby="msSectionTitle">
      <div className="ms-page__header">
        <h1 id="msSectionTitle" className="ms-page__title">{copy.sectionTitle}</h1>

        <div className="ms-sort-bar" aria-label={copy.sortLabel}>
          <span className="ms-sort-bar__label">{copy.sortLabel}:</span>
          {SORT_OPTIONS.map((opt, idx) => {
            const label = copy[`sort${opt.charAt(0).toUpperCase()}${opt.slice(1)}`];
            return (
              <span key={opt}>
                {idx > 0 && <span className="ms-sort-bar__sep"> / </span>}
                <button
                  type="button"
                  className={`ms-sort-bar__opt${sortBy === opt ? ' ms-sort-bar__opt--active' : ''}`}
                  onClick={() => setSortBy(opt)}
                >
                  {label}
                </button>
              </span>
            );
          })}
          <span className="ms-sort-bar__chevron">∨</span>
        </div>
      </div>

      {error && <div className="ms-alert" role="alert">{error}</div>}

      {isLoading ? (
        <div className="ms-status">{copy.loading}</div>
      ) : sortedTemplates.length === 0 ? (
        <div className="ms-empty">
          <h2>{copy.emptyTitle}</h2>
          <p>{copy.emptyText}</p>
        </div>
      ) : (
        <>
          <div className="ms-grid">
            {sortedTemplates.map((template) => {
              const title = getTemplateTitle(template, copy);
              const access = getAccess(template, copy);

              return (
                <article className="ms-card" key={template.id}>
                  <button
                    type="button"
                    className="ms-card__thumb"
                    onClick={() => onOpenTemplate(template.id)}
                    aria-label={`${copy.open} ${title}`}
                  >
                    <TemplatePreview template={template} title={title} />
                  </button>

                  <div className="ms-card__body">
                    <p className="ms-card__perm-label">
                      {title}: {copy.permissionLabel}
                    </p>

                    <div className={`ms-badge ms-badge--${access.tone}`}>
                      <SmallIcon name={access.icon} size={16} />
                      <span>{access.label}</span>
                      {access.tone === 'invited' && (
                        <span className="ms-badge__count">
                          {formatCopy(copy.invitedCount, { count: template.invited_count ?? 0 })}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="ms-card__manage-btn"
                      onClick={() => openShareDialog(template)}
                    >
                      {copy.manageLink}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <section className="ms-access-section" aria-labelledby="msAccessTitle">
            <h2 id="msAccessTitle" className="ms-access-section__title">{copy.accessTitle}</h2>
            <div className="ms-table-wrap">
              <table className="ms-table">
                <thead>
                  <tr>
                    <th>{copy.tableTemplate}</th>
                    <th>{copy.tablePermission}</th>
                    <th>{copy.tableUpdated}</th>
                    <th>{copy.tableAction}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTemplates.map((template) => {
                    const title = getTemplateTitle(template, copy);
                    const access = getAccess(template, copy);
                    const canManage = canManageTemplate(template, currentUserId);
                    const isRevoking = revokingTemplateId === template.id;

                    return (
                      <tr key={`access-${template.id}`}>
                        <td>{title}</td>
                        <td>{access.label}</td>
                        <td>{formatDate(template.updated_at ?? template.created_at, language, copy)}</td>
                        <td className="ms-table__actions">
                          <button
                            type="button"
                            className="ms-table-btn ms-table-btn--edit"
                            onClick={() => onOpenTemplate(template.id)}
                          >
                            {copy.open}
                          </button>
                          {canManage && (
                            <button
                              type="button"
                              className="ms-table-btn ms-table-btn--revoke"
                              onClick={() => handleRequestRevoke(template)}
                              disabled={isRevoking}
                            >
                              {isRevoking ? copy.revoking : copy.delete}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {pendingRevokeTemplate && (
        <div className="ms-modal" role="dialog" aria-modal="true" aria-labelledby="msRevokeTitle">
          <div className="ms-modal__card">
            <h2 id="msRevokeTitle" className="ms-modal__title">{copy.revokeConfirmTitle}</h2>
            <p className="ms-modal__text">
              {formatCopy(copy.revokeConfirmBody, {
                title: getTemplateTitle(pendingRevokeTemplate, copy),
              })}
            </p>
            <div className="ms-modal__actions">
              <button
                type="button"
                className="ms-modal__btn ms-modal__btn--ghost"
                onClick={() => setPendingRevokeTemplate(null)}
                disabled={Boolean(revokingTemplateId)}
              >
                {copy.cancel}
              </button>
              <button
                type="button"
                className="ms-modal__btn ms-modal__btn--danger"
                onClick={handleConfirmRevoke}
                disabled={Boolean(revokingTemplateId)}
              >
                {revokingTemplateId ? copy.revoking : copy.revokeAction}
              </button>
            </div>
          </div>
        </div>
      )}

      {shareTemplate && (
        <div className="ms-modal" role="dialog" aria-modal="true" aria-labelledby="msShareTitle">
          <div className="ms-share-dialog">
            <div className="ms-share-header">
              <div>
                <strong id="msShareTitle">{copy.shareDialogTitle}</strong>
                <span>{copy.shareViewingCount}</span>
              </div>
              <div className="ms-share-header__actions">
                <button
                  type="button"
                  className="ms-share-settings"
                  aria-expanded={isShareSettingsOpen}
                  onClick={() => setIsShareSettingsOpen((isOpen) => !isOpen)}
                >
                  <SmallIcon name="users" size={18} />
                  {copy.shareSettings}
                </button>
                <button type="button" className="ms-share-close" onClick={closeShareDialog}>
                  {copy.closeShare}
                </button>
              </div>
            </div>

            {isShareSettingsOpen && (
              <section className="ms-share-advanced" aria-label={copy.shareAdvancedTitle}>
                <div>
                  <strong>{copy.shareAdvancedTitle}</strong>
                  <p>{copy.shareAdvancedDescription}</p>
                </div>
                {[
                  ['allowDownload', copy.shareAllowDownload],
                  ['allowCopy', copy.shareAllowCopy],
                  ['allowEdit', copy.shareAllowEdit],
                  ['allowReshare', copy.shareAllowReshare],
                ].map(([settingKey, label]) => (
                  <label key={settingKey} className="ms-share-toggle">
                    <span>{label}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(shareSettings[settingKey])}
                      disabled={isUpdatingShareSettings}
                      onChange={() => handleShareSettingChange(settingKey)}
                    />
                  </label>
                ))}
              </section>
            )}

            <form className="ms-share-add-user" onSubmit={handleAddShareInvite}>
              <input
                type="email"
                value={shareInviteEmail}
                placeholder={copy.shareAddUserPlaceholder}
                onChange={(event) => setShareInviteEmail(event.target.value)}
              />
              <button type="submit" disabled={isUpdatingShareSettings}>{copy.shareAddUser}</button>
            </form>

            <div className="ms-share-user-row">
              <span className="ms-share-avatar">{copy.shareOwnerName.charAt(0)}</span>
              <div>
                <strong>{copy.shareOwnerName}</strong>
                <small>{copy.shareOwnerRole}</small>
              </div>
              <button type="button" aria-label={copy.shareSettings}>
                <SmallIcon name="users" size={18} />
              </button>
            </div>

            {shareInvitees.length > 0 && (
              <div className="ms-share-invitees">
                {shareInvitees.map((email) => (
                  <span key={email}>{email}</span>
                ))}
              </div>
            )}

            <div className="ms-share-access">
              <h2>{copy.shareAccessTitle}</h2>
              <label>
                <span className="ms-share-access-icon">
                  <SmallIcon name={shareAccess === 'public' ? 'link' : shareAccess === 'unlisted' ? 'users' : 'lock'} />
                </span>
                <select
                  value={shareAccess}
                  onChange={handleShareAccessChange}
                  disabled={isUpdatingShareAccess}
                >
                  <option value="public">{copy.sharePublicAccess}</option>
                  <option value="private">{copy.sharePrivateAccess}</option>
                  <option value="unlisted">{copy.shareInvitedAccess}</option>
                </select>
              </label>
            </div>

            {shareMessage && <p className="ms-share-message">{shareMessage}</p>}

            <button type="button" className="ms-share-copy" onClick={copyShareLink}>
              <SmallIcon name="link" size={22} />
              {copy.shareCopyLink}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
