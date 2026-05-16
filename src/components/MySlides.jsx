import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { deleteSavedTemplate, listSavedTemplates } from '../services/slideCreationService.js';
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
    deleteError: 'テンプレートを削除できませんでした: {{message}}',
    deleteConfirm: '「{{title}}」を削除しますか？',
    open: '編集',
    delete: 'アクセス取り消し',
    deleting: '削除中...',
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
    deleteError: 'Không thể xóa template: {{message}}',
    deleteConfirm: 'Xóa template "{{title}}" khỏi danh sách đã lưu?',
    open: 'Chỉnh sửa',
    delete: 'Thu hồi quyền truy cập',
    deleting: 'Đang xóa...',
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
  },
};

const SORT_OPTIONS = ['name', 'updated', 'permission'];

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
    case 'trash':
      return (
        <svg {...common}>
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 14H6L5 6" />
        </svg>
      );
    case 'open':
      return (
        <svg {...common}>
          <path d="M7 17L17 7" />
          <path d="M8 7h9v9" />
        </svg>
      );
    case 'pencil':
      return (
        <svg {...common}>
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      );
    case 'chevron':
      return (
        <svg {...common} width={14} height={14}>
          <path d="M6 9l6-6 6 6" />
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

export default function MySlides({ currentUserId, onOpenTemplate }) {
  const { language } = useLanguage();
  const copy = getCopy(language);
  const [templates, setTemplates] = useState([]);
  const [sortBy, setSortBy] = useState('updated');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletingTemplateId, setDeletingTemplateId] = useState('');

  useEffect(() => {
    let isMounted = true;
    if (!currentUserId) return () => { isMounted = false; };

    Promise.resolve()
      .then(() => {
        if (!isMounted) return [];
        setIsLoading(true);
        setError('');
        return listSavedTemplates(currentUserId);
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
  }, [copy.loadError, currentUserId]);

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

  async function handleDeleteTemplate(template) {
    const title = getTemplateTitle(template, copy);
    if (!window.confirm(formatCopy(copy.deleteConfirm, { title }))) return;
    setDeletingTemplateId(template.id);
    setError('');
    try {
      await deleteSavedTemplate(template.id, currentUserId);
      setTemplates((curr) => curr.filter((item) => item.id !== template.id));
    } catch (deleteFailure) {
      setError(formatCopy(copy.deleteError, { message: deleteFailure.message }));
    } finally {
      setDeletingTemplateId('');
    }
  }

  return (
    <section className="ms-page" aria-labelledby="msSectionTitle">
      {/* ───── Section header ───── */}
      <div className="ms-page__header">
        <h1 id="msSectionTitle" className="ms-page__title">{copy.sectionTitle}</h1>

        {/* Sort selector */}
        <div className="ms-sort-bar" aria-label={copy.sortLabel}>
          <span className="ms-sort-bar__label">{copy.sortLabel}：</span>
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
          {/* ───── Slide cards ───── */}
          <div className="ms-grid">
            {sortedTemplates.map((template) => {
              const title = getTemplateTitle(template, copy);
              const access = getAccess(template, copy);

              return (
                <article className="ms-card" key={template.id}>
                  {/* Preview thumbnail */}
                  <button
                    type="button"
                    className="ms-card__thumb"
                    onClick={() => onOpenTemplate(template.id)}
                    aria-label={`${copy.open} ${title}`}
                  >
                    <TemplatePreview template={template} title={title} />
                  </button>

                  {/* Card body */}
                  <div className="ms-card__body">
                    <p className="ms-card__perm-label">
                      {title}：{copy.permissionLabel}
                    </p>

                    {/* Permission badge */}
                    <div className={`ms-badge ms-badge--${access.tone}`}>
                      <SmallIcon name={access.icon} size={16} />
                      <span>{access.label}</span>
                      {access.tone === 'invited' && (
                        <span className="ms-badge__count">
                          {formatCopy(copy.invitedCount, { count: template.invited_count ?? 5 })}
                        </span>
                      )}
                    </div>

                    {/* Manage link button */}
                    <button
                      type="button"
                      className="ms-card__manage-btn"
                      onClick={() => onOpenTemplate(template.id)}
                    >
                      {copy.manageLink}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {/* ───── Access table ───── */}
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
                    const isDeleting = deletingTemplateId === template.id;

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
                          <button
                            type="button"
                            className="ms-table-btn ms-table-btn--revoke"
                            onClick={() => handleDeleteTemplate(template)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? copy.deleting : copy.delete}
                          </button>
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
    </section>
  );
}
