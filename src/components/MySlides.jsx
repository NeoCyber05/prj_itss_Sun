import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { deleteSavedTemplate, listSavedTemplates } from '../services/slideCreationService.js';
import './MySlides.css';

const COPY = {
  ja: {
    title: '私のスライド',
    subtitle: '保存済みテンプレート',
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
    open: '開く',
    delete: '削除',
    deleting: '削除中...',
    manageLink: 'リンクを管理',
    accessTitle: 'アクセス権限一覧',
    tableTemplate: 'テンプレート',
    tablePermission: '現在の権限',
    tableUpdated: '更新日',
    tableAction: 'アクション',
    slides: '{{count}}スライド',
    privateAccess: 'プライベート',
    linkAccess: 'リンクを知っている全員',
    invitedAccess: '招待された人のみ',
    noDate: '未保存',
  },
  vi: {
    title: 'Slide của tôi',
    subtitle: 'Danh sách template đã lưu',
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
    open: 'Mở',
    delete: 'Xóa',
    deleting: 'Đang xóa...',
    manageLink: 'Quản lý link',
    accessTitle: 'Danh sách quyền truy cập',
    tableTemplate: 'Template',
    tablePermission: 'Quyền hiện tại',
    tableUpdated: 'Ngày cập nhật',
    tableAction: 'Thao tác',
    slides: '{{count}} slide',
    privateAccess: 'Riêng tư',
    linkAccess: 'Ai có link đều xem được',
    invitedAccess: 'Chỉ người được mời',
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

  if (Number.isNaN(date.getTime())) {
    return copy.noDate;
  }

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
    return {
      icon: 'users',
      label: copy.invitedAccess,
      tone: 'invited',
    };
  }

  if (template.is_public || template.visibility === 'public') {
    return {
      icon: 'link',
      label: copy.linkAccess,
      tone: 'link',
    };
  }

  return {
    icon: 'lock',
    label: copy.privateAccess,
    tone: 'private',
  };
}

function SmallIcon({ name }) {
  const common = {
    width: 18,
    height: 18,
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
    default:
      return null;
  }
}

function TemplatePreview({ template, title }) {
  if (template.thumbnail_url) {
    return <img src={template.thumbnail_url} alt={title} />;
  }

  return (
    <div className="my-slides-preview-fallback" aria-hidden="true">
      <span />
      <strong>{title}</strong>
      <small>{template.description || 'RakuSlide'}</small>
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

    if (!currentUserId) {
      return () => {
        isMounted = false;
      };
    }

    Promise.resolve()
      .then(() => {
        if (!isMounted) return [];

        setIsLoading(true);
        setError('');
        return listSavedTemplates(currentUserId);
      })
      .then((loadedTemplates) => {
        if (isMounted) {
          setTemplates(loadedTemplates);
        }
      })
      .catch((loadFailure) => {
        if (isMounted) {
          setError(formatCopy(copy.loadError, { message: loadFailure.message }));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [copy.loadError, currentUserId]);

  const sortedTemplates = useMemo(() => {
    const nextTemplates = [...templates];

    if (sortBy === 'name') {
      nextTemplates.sort((a, b) => getTemplateTitle(a, copy).localeCompare(
        getTemplateTitle(b, copy),
        language === 'vi' ? 'vi' : 'ja',
      ));
    } else if (sortBy === 'permission') {
      nextTemplates.sort((a, b) => getAccess(a, copy).label.localeCompare(
        getAccess(b, copy).label,
        language === 'vi' ? 'vi' : 'ja',
      ));
    } else {
      nextTemplates.sort((a, b) => getTemplateTime(b) - getTemplateTime(a));
    }

    return nextTemplates;
  }, [copy, language, sortBy, templates]);

  async function handleDeleteTemplate(template) {
    const title = getTemplateTitle(template, copy);

    if (!window.confirm(formatCopy(copy.deleteConfirm, { title }))) {
      return;
    }

    setDeletingTemplateId(template.id);
    setError('');

    try {
      await deleteSavedTemplate(template.id, currentUserId);
      setTemplates((currentTemplates) => currentTemplates.filter((item) => item.id !== template.id));
    } catch (deleteFailure) {
      setError(formatCopy(copy.deleteError, { message: deleteFailure.message }));
    } finally {
      setDeletingTemplateId('');
    }
  }

  return (
    <section className="my-slides" aria-labelledby="mySlidesTitle">
      <div className="my-slides__header">
        <div>
          <p className="my-slides__eyebrow">{copy.subtitle}</p>
          <h1 id="mySlidesTitle">{copy.title}</h1>
        </div>

        <label className="my-slides__sort">
          <span>{copy.sortLabel}</span>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {copy[`sort${option.charAt(0).toUpperCase()}${option.slice(1)}`]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <div className="my-slides__error" role="alert">{error}</div>}

      {isLoading ? (
        <div className="my-slides__status">{copy.loading}</div>
      ) : sortedTemplates.length === 0 ? (
        <div className="my-slides__empty">
          <h2>{copy.emptyTitle}</h2>
          <p>{copy.emptyText}</p>
        </div>
      ) : (
        <>
          <div className="my-slides__grid">
            {sortedTemplates.map((template) => {
              const title = getTemplateTitle(template, copy);
              const access = getAccess(template, copy);
              const updatedDate = formatDate(template.updated_at ?? template.created_at, language, copy);
              const isDeleting = deletingTemplateId === template.id;

              return (
                <article className="my-slide-card" key={template.id}>
                  <div className="my-slide-card__preview">
                    <TemplatePreview template={template} title={title} />
                  </div>

                  <div className="my-slide-card__body">
                    <div>
                      <h2>{title}</h2>
                      <p>{formatCopy(copy.slides, { count: template.slide_count ?? 0 })} · {updatedDate}</p>
                    </div>

                    <span className={`my-slide-card__access my-slide-card__access--${access.tone}`}>
                      <SmallIcon name={access.icon} />
                      {access.label}
                    </span>

                    <div className="my-slide-card__actions">
                      <button type="button" onClick={() => onOpenTemplate(template.id)}>
                        <SmallIcon name="open" />
                        {copy.open}
                      </button>
                      <button
                        type="button"
                        className="my-slide-card__delete"
                        onClick={() => handleDeleteTemplate(template)}
                        disabled={isDeleting}
                      >
                        <SmallIcon name="trash" />
                        {isDeleting ? copy.deleting : copy.delete}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <section className="my-slides__access-list" aria-labelledby="accessListTitle">
            <h2 id="accessListTitle">{copy.accessTitle}</h2>
            <div className="my-slides__table-wrap">
              <table>
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
                        <td>
                          <button type="button" onClick={() => onOpenTemplate(template.id)}>
                            {copy.open}
                          </button>
                          <button
                            type="button"
                            className="my-slides__table-delete"
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
