import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import {
  createDeckFromTemplateDetail,
  getDeckForEditor,
  updateTemplateRating,
} from '../services/slideCreationService.js';
import { supabase } from '../supabaseClient.js';
import './TemplateDetail.css';

const COPY = {
  ja: {
    pageTitle: 'SLIDEテンプレート詳細',
    back: '戻る',
    loading: 'テンプレート詳細を読み込み中...',
    loadError: 'テンプレート詳細を読み込めませんでした: {{message}}',
    useTemplate: 'このテンプレートを使用',
    preview: '評価',
    download: 'ダウンロード',
    save: 'マイプロジェクトに保存',
    saving: '保存中...',
    using: '準備中...',
    relatedTitle: '関連するテンプレート',
    slideCount: 'スライド数: {{count}} slides',
    language: '言語: {{language}}',
    category: 'カテゴリ: {{category}}',
    author: '作成者: {{author}}',
    updated: '最終更新: {{date}}',
    defaultDescription: '選択したテンプレートの内容を確認してから編集できます。',
    defaultCategory: 'テンプレート',
    defaultAuthor: 'RakuSlide',
    loginRequired: 'ログインするとテンプレートを保存できます。',
    saved: 'マイプロジェクトに保存しました',
    alreadySaved: 'このテンプレートはすでにマイプロジェクトにあります',
    closePreview: '閉じる',
    nextSlide: '次のスライド',
    previousSlide: '前のスライド',
    ratingDialogTitle: 'スライドテンプレートの評価',
    ratingTarget: '評価対象',
    ratingBad: '悪い',
    ratingExcellent: '素晴らしい',
    ratingSubmit: '評価を送信',
    ratingCancel: 'キャンセル',
    ratingSubmitted: '評価を送信しました',
    ratingLoginRequired: 'テンプレートを評価するにはログインが必要です。',
  },
  vi: {
    pageTitle: 'CHI TIẾT MẪU SLIDE',
    back: 'Trở lại',
    loading: 'Đang tải chi tiết template...',
    loadError: 'Không thể tải chi tiết template: {{message}}',
    useTemplate: 'Sử dụng template này',
    preview: 'Đánh giá',
    download: 'Tải xuống',
    save: 'Lưu vào dự án của tôi',
    saving: 'Đang lưu...',
    using: 'Đang chuẩn bị...',
    relatedTitle: 'Các mẫu liên quan',
    slideCount: 'Số slide: {{count}} slides',
    language: 'Ngôn ngữ: {{language}}',
    category: 'Danh mục: {{category}}',
    author: 'Tác giả: {{author}}',
    updated: 'Cập nhật cuối: {{date}}',
    defaultDescription: 'Xem nội dung template trước khi mở màn hình chỉnh sửa.',
    defaultCategory: 'Template',
    defaultAuthor: 'RakuSlide',
    loginRequired: 'Bạn cần đăng nhập để lưu template.',
    saved: 'Đã lưu vào dự án của tôi',
    alreadySaved: 'Template này đã có trong dự án của bạn',
    closePreview: 'Đóng',
    nextSlide: 'Slide sau',
    previousSlide: 'Slide trước',
    ratingDialogTitle: 'Đánh giá mẫu slide',
    ratingTarget: 'Đánh giá',
    ratingBad: 'Tệ',
    ratingExcellent: 'Tuyệt vời',
    ratingSubmit: 'Gửi đánh giá',
    ratingCancel: 'Hủy',
    ratingSubmitted: 'Đã gửi đánh giá',
    ratingLoginRequired: 'Bạn cần đăng nhập để đánh giá mẫu slide.',
  },
};

const RELATED_TEMPLATES = [
  {
    id: 'related-n4-vocab',
    title: 'N4語彙: 交通',
    category: 'N4 語彙',
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=480&q=80',
    slides: 14,
  },
  {
    id: 'related-n4-shopping',
    title: 'N4会話: 買い物',
    category: 'N4 会話',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=480&q=80',
    slides: 12,
  },
  {
    id: 'related-n4-grammar',
    title: 'N4文法: 推量',
    category: 'N4 文法',
    image: 'https://images.unsplash.com/photo-1456406644174-8ddd4cd52a06?auto=format&fit=crop&w=480&q=80',
    slides: 18,
  },
  {
    id: 'related-business-report',
    title: 'ビジネス報告テンプレート',
    category: 'Business',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=480&q=80',
    slides: 16,
  },
];

function getCopy(language) {
  return COPY[language] ?? COPY.ja;
}

function formatCopy(template, vars = {}) {
  return String(template).replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ''));
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function isPersistedUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    .test(String(value ?? ''));
}

function formatDate(value, language) {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'ja-JP', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date());
  }

  return new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'ja-JP', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function getSlideElements(slide) {
  return slide?.content_json?.elements
    ?? slide?.content?.elements
    ?? slide?.elements
    ?? [];
}

function makeTextElement(id, text, x, y, width, height, style = {}) {
  return {
    id,
    type: 'text',
    x,
    y,
    width,
    height,
    text,
    style: {
      align: 'left',
      bold: false,
      color: '#111827',
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: 18,
      italic: false,
      underline: false,
      ...style,
    },
  };
}

function buildCatalogElements(template, index, copy) {
  const title = template.title || copy.defaultCategory;
  const category = template.category || template.topic || copy.defaultCategory;

  if (index === 0) {
    return [
      makeTextElement('title', title, 8, 10, 84, 16, {
        align: 'center',
        bold: true,
        color: '#123b61',
        fontSize: 34,
      }),
      makeTextElement('subtitle', template.description || copy.defaultDescription, 12, 34, 76, 14, {
        align: 'center',
        color: '#334155',
        fontSize: 18,
      }),
      {
        id: 'accent',
        type: 'shape',
        x: 31,
        y: 61,
        width: 38,
        height: 8,
        text: category,
        fill: '#dbeafe',
        stroke: '#2563eb',
      },
    ];
  }

  if (index % 3 === 1) {
    return [
      makeTextElement('heading', `${category} ${index + 1}`, 8, 9, 84, 12, {
        bold: true,
        color: '#123b61',
        fontSize: 28,
      }),
      makeTextElement('body-a', 'Assum has 198 (13)', 12, 30, 34, 11, { fontSize: 17 }),
      makeTextElement('body-b', 'Choose the correct answer and compare examples.', 52, 30, 38, 16, { fontSize: 15 }),
      {
        id: 'table',
        type: 'table',
        x: 10,
        y: 54,
        width: 80,
        height: 30,
        text: 'Reference table',
      },
    ];
  }

  if (index % 3 === 2) {
    return [
      makeTextElement('heading', title, 8, 10, 84, 12, {
        bold: true,
        color: '#123b61',
        fontSize: 26,
      }),
      {
        id: 'chart',
        type: 'chart',
        x: 10,
        y: 32,
        width: 80,
        height: 43,
        text: 'Learning progress',
      },
    ];
  }

  return [
    makeTextElement('heading', `${copy.defaultAuthor} template`, 10, 12, 80, 12, {
      align: 'center',
      bold: true,
      color: '#123b61',
      fontSize: 28,
    }),
    makeTextElement('body', template.description || copy.defaultDescription, 15, 36, 70, 22, {
      align: 'center',
      fontSize: 18,
    }),
    {
      id: 'frame',
      type: 'frame',
      x: 24,
      y: 66,
      width: 52,
      height: 12,
      text: category,
      fill: 'transparent',
      stroke: '#2563eb',
    },
  ];
}

function buildCatalogSlides(template, copy) {
  const count = clamp(Number(template.slide_count ?? template.slides ?? 5), 1, 25);

  return Array.from({ length: count }, (_, index) => ({
    id: `${template.id ?? 'template'}-slide-${index + 1}`,
    title: `${template.title || copy.defaultCategory} ${index + 1}`,
    position: index + 1,
    image: index === 0 ? template.image ?? template.thumbnail_url : null,
    thumbnail_url: index === 0 ? template.image ?? template.thumbnail_url : null,
    content: { elements: buildCatalogElements(template, index, copy) },
  }));
}

function normalizeDetailSlide(slide, index, fallbackTitle) {
  return {
    id: slide.id ?? `slide-${index + 1}`,
    title: slide.title || `${fallbackTitle} ${index + 1}`,
    position: slide.position ?? slide.page_order ?? index + 1,
    image: slide.image ?? slide.thumbnail_url ?? null,
    thumbnail_url: slide.thumbnail_url ?? slide.image ?? null,
    content: slide.content_json ?? slide.content ?? { elements: slide.elements ?? [] },
  };
}

function buildDetailFromDeck(deck, copy, language, currentUserId, currentUserEmail, userProfile) {
  const template = deck?.template;
  const title = template?.title?.trim() || copy.defaultCategory;
  const slides = (deck?.slides?.length ? deck.slides : [])
    .map((slide, index) => normalizeDetailSlide(slide, index, title));

  const ownerId = template?.owner_id;
  const userDisplayName = userProfile?.display_name || userProfile?.full_name || userProfile?.name;
  const fallbackAuthor = (ownerId && currentUserId && ownerId === currentUserId)
    ? (userDisplayName || currentUserEmail?.split('@')[0] || copy.defaultAuthor)
    : copy.defaultAuthor;

  return {
    id: template?.id ?? '',
    title,
    description: template?.description || copy.defaultDescription,
    category: template?.subject || template?.category || copy.defaultCategory,
    author: template?.author || fallbackAuthor,
    date: formatDate(template?.updated_at ?? template?.created_at, language),
    image: template?.thumbnail_url ?? slides[0]?.thumbnail_url ?? null,
    language: language === 'vi' ? 'Tiếng Việt' : '日本語',
    slide_count: template?.slide_count ?? template?.page_count ?? slides.length,
    rating: Number(template?.rating_average ?? template?.rating ?? 0),
    slides: slides.length ? slides : buildCatalogSlides({ ...template, title, slides: 5 }, copy),
    isPersisted: Boolean(template?.id),
    owner_id: ownerId,
  };
}

function buildDetailFromTemplate(template, copy, language, currentUserId, currentUserEmail, userProfile) {
  const title = template?.title?.trim() || copy.defaultCategory;
  const slides = template?.detailSlides?.length
    ? template.detailSlides.map((slide, index) => normalizeDetailSlide(slide, index, title))
    : buildCatalogSlides(template ?? { title }, copy);

  const isPersisted = isPersistedUuid(template?.id);
  const ownerId = template?.owner_id ?? template?.template?.owner_id;

  const userDisplayName = userProfile?.display_name || userProfile?.full_name || userProfile?.name;
  const fallbackAuthor = (ownerId && currentUserId && ownerId === currentUserId)
    ? (userDisplayName || currentUserEmail?.split('@')[0] || copy.defaultAuthor)
    : copy.defaultAuthor;

  // Sinh tên tác giả chân thực và sinh động cho các slide tĩnh
  let author = template?.author;
  if (!author) {
    if (template?.id === 'popular-1') author = language === 'vi' ? 'Ban Giám Đốc RakuSlide' : 'RakuSlide役員会';
    else if (template?.id === 'popular-2') author = language === 'vi' ? 'Phòng Marketing RakuSlide' : 'RakuSlideマーケティング部';
    else if (template?.id === 'popular-3') author = language === 'vi' ? 'Phòng Phát Triển Sản Phẩm' : '製品開発部';
    else if (template?.id === 'popular-4') author = language === 'vi' ? 'Bộ Phận Đào Tạo Nhân Sự' : '人事研修担当';
    else if (template?.id === 'popular-5') author = language === 'vi' ? 'Phòng Tài Chính Kế Toán' : '財務経理課';
    else if (template?.id === 'popular-6') author = language === 'vi' ? 'Ban Quản Lý Dự Án' : 'プロジェクト管理事務局';
    else if (template?.id === 'popular-7') author = language === 'vi' ? 'Bộ Phận Chăm Sóc Khách Hàng' : 'カスタマーサポート担当';
    else if (template?.id === 'popular-8') author = language === 'vi' ? 'Hội Đồng Chiến Lược' : '経営戦略会議';
    else if (template?.id === 'recommended-1') author = language === 'vi' ? 'Founder & CEO RakuSlide' : 'RakuSlide創業者兼CEO';
    else if (template?.id === 'recommended-2') author = language === 'vi' ? 'Bộ Phận Phân Tích Kế Hoạch' : '計画分析部';
    else if (template?.id === 'recommended-3') author = language === 'vi' ? 'Ban Quản Lý Sản Phẩm' : 'プロダクトマネジメントチーム';
    else if (template?.id === 'recommended-4') author = language === 'vi' ? 'Phòng Nhân Sự' : 'RakuSlide人事部';
    else author = fallbackAuthor;
  }

  // Tự động tính ngày cập nhật động sinh động dựa theo ngày hiện tại cho slide tĩnh
  let dateStr = template?.date;
  if (!isPersisted && dateStr) {
    const today = new Date();
    let offsetDays = 0;
    if (template?.id === 'popular-1' || template?.id === 'recommended-1') offsetDays = 0; // Hôm nay
    else if (template?.id === 'popular-2' || template?.id === 'recommended-2') offsetDays = 1; // Hôm qua
    else if (template?.id === 'popular-3' || template?.id === 'recommended-3') offsetDays = 2; // 2 ngày trước
    else if (template?.id === 'popular-4' || template?.id === 'recommended-4') offsetDays = 3; // 3 ngày trước
    else if (template?.id === 'popular-5') offsetDays = 4;
    else if (template?.id === 'popular-6') offsetDays = 5;
    else if (template?.id === 'popular-7') offsetDays = 6;
    else if (template?.id === 'popular-8') offsetDays = 7;
    else offsetDays = 10;

    today.setDate(today.getDate() - offsetDays);
    dateStr = new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'ja-JP', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(today);
  } else if (!dateStr) {
    dateStr = formatDate(template?.updated_at ?? template?.created_at, language);
  }

  return {
    id: template?.id ?? '',
    title,
    description: template?.description || copy.defaultDescription,
    category: template?.category || template?.topic || copy.defaultCategory,
    author,
    date: dateStr,
    image: template?.image ?? template?.thumbnail_url ?? slides[0]?.thumbnail_url ?? null,
    language: template?.language || (language === 'vi' ? 'Tiếng Việt' : '日本語'),
    slide_count: template?.slide_count ?? template?.slides ?? slides.length,
    rating: Number(template?.rating_average ?? template?.rating ?? 0),
    slides,
    isPersisted,
    owner_id: ownerId,
  };
}

function DetailIcon({ name }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };

  switch (name) {
    case 'arrow-left':
      return (
        <svg {...common}>
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
      );
    case 'download':
      return (
        <svg {...common}>
          <path d="M12 3v12" />
          <path d="M7 10l5 5 5-5" />
          <path d="M5 21h14" />
        </svg>
      );
    case 'folder':
      return (
        <svg {...common}>
          <path d="M3 7h7l2 2h9v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </svg>
      );
    case 'plus':
      return (
        <svg {...common}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      );
    case 'close':
      return (
        <svg {...common}>
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      );
    default:
      return null;
  }
}

function StarRating({ rating = 0, maxStars = 5 }) {
  const safeRating = Number.isFinite(rating) ? Math.min(Math.max(rating, 0), maxStars) : 0;
  const fullStars = Math.floor(safeRating);
  const hasHalf = safeRating - fullStars >= 0.5;

  return (
    <div className="template-detail__rating" aria-label={`Rating: ${safeRating} out of ${maxStars} stars`}>
      {Array.from({ length: maxStars }, (_, index) => {
        const starIndex = index + 1;
        const isFull = starIndex <= fullStars;
        const isHalf = !isFull && starIndex === fullStars + 1 && hasHalf;

        return (
          <svg
            key={index}
            className={`template-detail__star${isFull ? ' template-detail__star--full' : ''}${isHalf ? ' template-detail__star--half' : ''}`}
            viewBox="0 0 24 24"
            width="24"
            height="24"
          >
            <defs>
              {isHalf && (
                <linearGradient id={`half-${index}`}>
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#d1d5db" />
                </linearGradient>
              )}
            </defs>
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={isFull ? '#f59e0b' : isHalf ? `url(#half-${index})` : '#d1d5db'}
              stroke="#f59e0b"
              strokeWidth="1"
            />
          </svg>
        );
      })}
      <span className="template-detail__rating-value">{safeRating.toFixed(1)}</span>
    </div>
  );
}

// eslint-disable-next-line no-unused-vars
function buildExportText(detail) {
  let text = `${detail.title}\n`;
  text += `=========================================\n\n`;
  text += `Description: ${detail.description}\n`;
  text += `Category: ${detail.category}\n`;
  text += `Author: ${detail.author}\n`;
  text += `Updated: ${detail.date}\n`;
  text += `Total Slides: ${detail.slide_count}\n\n`;
  text += `=========================================\n\n`;

  (detail.slides || []).forEach((slide, index) => {
    text += `--- Slide ${index + 1}: ${slide.title} ---\n\n`;
    
    const elements = getSlideElements(slide);
    if (elements.length === 0) {
      text += `(No content)\n\n`;
    } else {
      elements.forEach((element) => {
        if (element.type === 'text') {
          text += `${element.text}\n\n`;
        } else if (element.type === 'image') {
          text += `[Image${element.text ? `: ${element.text}` : ''}]\n\n`;
        } else if (element.type === 'chart') {
          text += `[Chart: ${element.text || 'Data Chart'}]\n\n`;
        } else if (element.type === 'table') {
          text += `[Table: ${element.text || 'Data Table'}]\n\n`;
        } else {
          text += `[${element.type.charAt(0).toUpperCase() + element.type.slice(1)}${element.text ? `: ${element.text}` : ''}]\n\n`;
        }
      });
    }
  });

  return text;
}

function PreviewChart() {
  return (
    <svg className="template-detail-chart" viewBox="0 0 360 180" aria-hidden="true">
      <path d="M30 150h300" />
      <path d="M30 150V26" />
      <rect x="42" y="100" width="30" height="50" className="template-detail-chart__bar" />
      <rect x="112" y="70" width="30" height="80" className="template-detail-chart__bar" />
      <rect x="178" y="90" width="30" height="60" className="template-detail-chart__bar" />
      <rect x="246" y="40" width="30" height="110" className="template-detail-chart__bar" />
      <rect x="318" y="60" width="30" height="90" className="template-detail-chart__bar" />
    </svg>
  );
}

function PreviewTable() {
  return (
    <div className="template-detail-table" aria-hidden="true">
      {Array.from({ length: 16 }, (_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}

function TemplateSlidePreview({ slide, title, scale = 1 }) {
  const elements = getSlideElements(slide);
  const image = slide?.image ?? slide?.thumbnail_url;

  const renderContent = (currentScale) => {
    return (
      <>
        {image && (
          <img className="template-detail-slide-preview__watermark" src={image} alt="" />
        )}
        {elements.length === 0 ? (
          <div className="template-detail-slide-preview__fallback">
            <strong>{title}</strong>
          </div>
        ) : elements.map((element) => {
          const elementStyle = {
            left: `${element.x ?? 8}%`,
            top: `${element.y ?? 8}%`,
            width: `${element.width ?? 84}%`,
            height: `${element.height ?? 16}%`,
          };

          if (element.type === 'text') {
            return (
              <span
                key={element.id}
                className="template-detail-slide-text"
                style={{
                  ...elementStyle,
                  color: element.style?.color,
                  fontFamily: element.style?.fontFamily,
                  fontSize: `${clamp((element.style?.fontSize ?? 18) * currentScale, 5, 42)}px`,
                  fontStyle: element.style?.italic ? 'italic' : 'normal',
                  fontWeight: element.style?.bold ? 900 : 600,
                  justifyContent:
                    element.style?.align === 'center'
                      ? 'center'
                      : element.style?.align === 'right'
                        ? 'flex-end'
                        : 'flex-start',
                  textAlign: element.style?.align ?? 'left',
                  textDecoration: element.style?.underline ? 'underline' : 'none',
                }}
              >
                {element.text}
              </span>
            );
          }

          if (element.type === 'image') {
            return (
              <span
                key={element.id}
                className="template-detail-slide-image"
                style={{ ...elementStyle, backgroundColor: element.fill }}
              >
                {element.src ? <img src={element.src} alt={element.alt || element.text || ''} /> : element.text}
              </span>
            );
          }

          if (element.type === 'chart') {
            return (
              <span key={element.id} className="template-detail-slide-chart" style={elementStyle}>
                <strong>{element.text}</strong>
                <PreviewChart />
              </span>
            );
          }

          if (element.type === 'table') {
            return (
              <span key={element.id} className="template-detail-slide-table-wrap" style={elementStyle}>
                <strong>{element.text}</strong>
                <PreviewTable />
              </span>
            );
          }

          return (
            <span
              key={element.id}
              className={`template-detail-slide-shape template-detail-slide-shape--${element.type}`}
              style={{
                ...elementStyle,
                background: element.fill,
                borderColor: element.stroke,
              }}
            >
              {element.text}
            </span>
          );
        })}
      </>
    );
  };

  if (scale !== 1) {
    const virtualWidthPercent = 100 / scale;
    return (
      <div className="template-detail-slide-preview-scale-wrapper" style={{
        width: '100%',
        aspectRatio: '16 / 9',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${virtualWidthPercent}%`,
          aspectRatio: '16 / 9',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          left: 0,
          top: 0,
        }}>
          <div className="template-detail-slide-preview" style={{ width: '100%', height: '100%' }}>
            {image && elements.length === 0 ? (
              <img src={image} alt={title} />
            ) : renderContent(1)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="template-detail-slide-preview">
      {image && elements.length === 0 ? (
        <img src={image} alt={title} />
      ) : renderContent(1)}
    </div>
  );
}

export default function TemplateDetail({
  templateId,
  initialTemplate,
  currentUserEmail,
  currentUserId,
  userProfile,
  onBack,
  onCreatedDeck,
  onEditTemplate,
  onOpenTemplateDetail,
  onRequireLogin,
}) {
  const exportRef = useRef(null);
  const { language } = useLanguage();
  const copy = getCopy(language);
  const [loadedDeck, setLoadedDeck] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUsing, setIsUsing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [savedDeckId, setSavedDeckId] = useState('');
  const [toast, setToast] = useState('');
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [localRating, setLocalRating] = useState(null);
  const [dbTemplate, setDbTemplate] = useState(null);
  const shouldLoadSavedDeck = Boolean(
    isPersistedUuid(templateId) &&
    currentUserId &&
    !String(templateId).startsWith('00000000-0000-0000-0000-00000000000'),
  );

  // Tự động fetch thông tin rating và cập nhật của template từ database
  useEffect(() => {
    let isMounted = true;

    if (
      isPersistedUuid(templateId) &&
      !String(templateId).startsWith('00000000-0000-0000-0000-00000000000')
    ) {
      supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .maybeSingle()
        .then(({ data, error }) => {
          if (!error && data && isMounted) {
            setDbTemplate(data);
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [templateId]);

  const detail = useMemo(() => {
    if (loadedDeck) return buildDetailFromDeck(loadedDeck, copy, language, currentUserId, currentUserEmail, userProfile);
    
    // Merge dữ liệu động từ dbTemplate (rating, owner_id, date...) vào initialTemplate tĩnh
    const baseTemplate = dbTemplate 
      ? { ...initialTemplate, ...dbTemplate } 
      : initialTemplate;

    return buildDetailFromTemplate(baseTemplate, copy, language, currentUserId, currentUserEmail, userProfile);
  }, [copy, initialTemplate, language, loadedDeck, dbTemplate, currentUserId, currentUserEmail, userProfile]);

  const [authorName, setAuthorName] = useState('');

  useEffect(() => {
    let isMounted = true;
    const ownerId = detail.owner_id;

    if (ownerId && isPersistedUuid(ownerId)) {
      supabase
        .from('profiles')
        .select('display_name, full_name, name')
        .eq('id', ownerId)
        .maybeSingle()
        .then(({ data, error }) => {
          if (!error && data && isMounted) {
            const name = data.display_name || data.full_name || data.name;
            if (name) {
              setAuthorName(name);
            }
          }
        });
    } else {
      setAuthorName('');
    }

    return () => {
      isMounted = false;
    };
  }, [detail.owner_id]);
  const slideCount = detail.slides.length;
  const goToSlide = useCallback((index) => {
    setActiveSlideIndex(clamp(index, 0, slideCount - 1));
  }, [slideCount]);

  useEffect(() => {
    function handleFullscreenChange() {
      if (!document.fullscreenElement) {
        setIsPreviewOpen(false);
      }
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!isPreviewOpen) return undefined;

    function handlePreviewKeyDown(event) {
      const target = event.target;
      const isInteractiveTarget = target instanceof HTMLElement
        && target.closest('button, input, textarea, select, a');

      if (isInteractiveTarget) return;

      if (event.key === 'ArrowRight' || event.key === ' ') {
        event.preventDefault();
        goToSlide(activeSlideIndex + 1);
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToSlide(activeSlideIndex - 1);
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        setIsPreviewOpen(false);
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }
    }

    document.addEventListener('keydown', handlePreviewKeyDown);
    return () => document.removeEventListener('keydown', handlePreviewKeyDown);
  }, [activeSlideIndex, goToSlide, isPreviewOpen]);

  useEffect(() => {
    let isMounted = true;

    if (!shouldLoadSavedDeck) {
      return () => {
        isMounted = false;
      };
    }

    getDeckForEditor(templateId, currentUserId, currentUserEmail)
      .then((deck) => {
        if (isMounted) setLoadedDeck(deck);
      })
      .catch((error) => {
        if (isMounted) setLoadError(formatCopy(copy.loadError, { message: error.message }));
      });

    return () => {
      isMounted = false;
    };
  }, [copy.loadError, currentUserEmail, currentUserId, shouldLoadSavedDeck, templateId]);

  const ratingToShow = localRating !== null ? localRating : detail.rating;

  const activeSlide = detail.slides[activeSlideIndex] ?? detail.slides[0];
  const canEditExisting = Boolean(
    loadedDeck?.template?.id
    && currentUserId
    && loadedDeck.template.owner_id === currentUserId,
  );

  useEffect(() => {
    if (!toast) return undefined;

    const timer = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function requireLogin() {
    setToast(copy.loginRequired);
    onRequireLogin?.();
  }

  async function saveTemplateToMyProjects() {
    if (canEditExisting) {
      setToast(copy.alreadySaved);
      return loadedDeck;
    }

    if (savedDeckId) {
      setToast(copy.alreadySaved);
      return { template: { id: savedDeckId } };
    }

    if (!currentUserId) {
      requireLogin();
      return null;
    }

    setIsSaving(true);

    try {
      const savedDeck = await createDeckFromTemplateDetail({
        userId: currentUserId,
        language,
        template: detail,
      });

      setSavedDeckId(savedDeck.template.id);
      setToast(copy.saved);
      return savedDeck;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUseTemplate() {
    if (canEditExisting) {
      onEditTemplate(loadedDeck.template.id);
      return;
    }

    if (savedDeckId) {
      onEditTemplate(savedDeckId);
      return;
    }

    if (!currentUserId) {
      requireLogin();
      return;
    }

    setIsUsing(true);

    try {
      const savedDeck = await createDeckFromTemplateDetail({
        userId: currentUserId,
        language,
        template: detail,
      });

      onCreatedDeck(savedDeck);
    } finally {
      setIsUsing(false);
    }
  }

  async function handleSaveTemplate() {
    try {
      await saveTemplateToMyProjects();
    } catch (error) {
      setToast(error.message);
    }
  }

  async function handleSubmitRating() {
    if (ratingValue === 0) return;

    if (!currentUserId) {
      setToast(copy.ratingLoginRequired || 'Bạn cần đăng nhập để đánh giá mẫu slide.');
      setIsRatingOpen(false);
      setRatingValue(0);
      onRequireLogin?.();
      return;
    }

    setIsSubmittingRating(true);

    try {
      const isPersisted = isPersistedUuid(detail.id);
      let newRating = ratingValue;

      if (isPersisted) {
        const updatedTemplate = await updateTemplateRating(detail.id, ratingValue, currentUserId);
        if (updatedTemplate) {
          setDbTemplate(updatedTemplate);
        }
        newRating = Number(updatedTemplate?.rating_average ?? ratingValue);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      setLocalRating(newRating);
      setToast(copy.ratingSubmitted);
      setIsRatingOpen(false);
      setRatingValue(0);
    } catch (error) {
      setToast('Đánh giá thất bại: ' + error.message);
    } finally {
      setIsSubmittingRating(false);
    }
  }

  function closeRatingDialog() {
    if (isSubmittingRating) return;
    setIsRatingOpen(false);
    setRatingValue(0);
  }

  async function handleDownload() {
    if (!exportRef.current || isDownloading) return;
    setIsDownloading(true);

    const SLIDE_W = 960;
    const SLIDE_H = 540;
    // jsPDF unit='px', so format matches exactly
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [SLIDE_W, SLIDE_H] });
    const slideEls = exportRef.current.querySelectorAll('.pdf-slide');

    try {
      for (let i = 0; i < slideEls.length; i++) {
        const canvas = await html2canvas(slideEls[i], {
          scale: 2,
          useCORS: true,
          width: SLIDE_W,
          height: SLIDE_H,
          windowWidth: SLIDE_W,
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.98);

        if (i > 0) pdf.addPage([SLIDE_W, SLIDE_H], 'landscape');
        pdf.addImage(imgData, 'JPEG', 0, 0, SLIDE_W, SLIDE_H);
      }

      pdf.save(`${detail.title.replace(/[\\/:*?"<>|]+/g, '-').slice(0, 80) || 'template'}.pdf`);
    } catch (error) {
      setToast('Download failed: ' + error.message);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <section className="template-detail" aria-labelledby="templateDetailTitle">
      <div className="template-detail__top">
        <h1 id="templateDetailTitle">{copy.pageTitle}</h1>
        <button type="button" className="template-detail__back" onClick={onBack}>
          <DetailIcon name="arrow-left" />
          {copy.back}
        </button>
      </div>

      {shouldLoadSavedDeck && !loadedDeck && !loadError && (
        <div className="template-detail__status">{copy.loading}</div>
      )}

      {loadError && <div className="template-detail__error" role="alert">{loadError}</div>}

      <div className="template-detail__grid">
        <div className="template-detail__preview-column">
          <div className="template-detail__main-preview">
            <TemplateSlidePreview slide={activeSlide} title={detail.title} />
          </div>

          <div className="template-detail__thumb-row" aria-label={copy.preview}>
            {detail.slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={`template-detail__thumb${index === activeSlideIndex ? ' template-detail__thumb--active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`${copy.preview} ${index + 1}`}
              >
                <TemplateSlidePreview slide={slide} title={slide.title} scale={0.22} />
              </button>
            ))}
          </div>

          {currentUserId && (
            <div className="template-detail__primary-actions">
              <button type="button" className="template-detail__use" onClick={handleUseTemplate} disabled={isUsing || isSaving}>
                <span>{isUsing ? copy.using : copy.useTemplate}</span>
                <DetailIcon name="plus" />
              </button>
              <button type="button" className="template-detail__preview-btn" onClick={() => {
                setIsRatingOpen(true);
                setRatingValue(0);
              }}>
                {copy.preview}
              </button>
            </div>
          )}
        </div>

        <aside className="template-detail__info">
          <div className="template-detail__info-header">
            <h2>{detail.title}</h2>
            <StarRating rating={ratingToShow} />
          </div>

          <ul>
            <li>{formatCopy(copy.slideCount, { count: detail.slide_count })}</li>
            <li>{formatCopy(copy.language, { language: detail.language })}</li>
            <li>{formatCopy(copy.category, { category: detail.category })}</li>
            <li>{formatCopy(copy.author, { author: authorName || detail.author })}</li>
            <li>{formatCopy(copy.updated, { date: detail.date })}</li>
          </ul>

          <div className={`template-detail__secondary-actions${!currentUserId ? ' template-detail__secondary-actions--single' : ''}`}>
            <button type="button" onClick={handleDownload}>
              <DetailIcon name="download" />
              {copy.download}
            </button>
            {currentUserId && (
              <button type="button" onClick={handleSaveTemplate} disabled={isSaving || isUsing}>
                <DetailIcon name="folder" />
                {isSaving ? copy.saving : copy.save}
              </button>
            )}
          </div>

          <section className="template-detail__related" aria-labelledby="relatedTemplatesTitle">
            <h3 id="relatedTemplatesTitle">{copy.relatedTitle}</h3>
            <div className="template-detail__related-grid">
              {RELATED_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className="template-detail__related-card"
                  onClick={() => onOpenTemplateDetail(template)}
                >
                  <TemplateSlidePreview
                    slide={buildCatalogSlides(template, copy)[0]}
                    title={template.title}
                    scale={0.18}
                  />
                  <strong>{template.title}</strong>
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {toast && <div className="template-detail__toast" role="status">{toast}</div>}

      {isRatingOpen && (
        <div className="template-detail__modal template-detail__modal--rating" role="dialog" aria-modal="true" aria-label={copy.ratingDialogTitle}>
          <div className="template-detail__rating-dialog">
            <h2 className="template-detail__rating-dialog__title">{copy.ratingDialogTitle}</h2>

            <div className="template-detail__rating-dialog__target">
              <div className="template-detail__rating-dialog__thumb">
                <TemplateSlidePreview slide={detail.slides[0]} title={detail.title} scale={0.3} />
              </div>
              <div className="template-detail__rating-dialog__target-info">
                <strong>{copy.ratingTarget}:</strong>
                <span>{detail.title}</span>
              </div>
            </div>

            <div className="template-detail__rating-dialog__stars">
              <span className="template-detail__rating-dialog__label-min">{copy.ratingBad}</span>
              <div className="template-detail__rating-dialog__star-group">
                {Array.from({ length: 5 }, (_, index) => {
                  const starValue = index + 1;
                  const isActive = starValue <= ratingValue;
                  return (
                    <button
                      key={index}
                      type="button"
                      className={`template-detail__rating-dialog__star${isActive ? ' template-detail__rating-dialog__star--active' : ''}`}
                      onClick={() => setRatingValue(starValue)}
                      aria-label={`${starValue} sao`}
                    >
                      <svg viewBox="0 0 24 24" width="48" height="48">
                        <path
                          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                          fill={isActive ? '#f59e0b' : '#d1d5db'}
                          stroke={isActive ? '#f59e0b' : '#9ca3af'}
                          strokeWidth="1"
                        />
                      </svg>
                    </button>
                  );
                })}
              </div>
              <span className="template-detail__rating-dialog__label-max">{copy.ratingExcellent}</span>
            </div>

            <div className="template-detail__rating-dialog__actions">
              <button
                type="button"
                className="template-detail__rating-dialog__btn template-detail__rating-dialog__btn--submit"
                onClick={handleSubmitRating}
                disabled={ratingValue === 0 || isSubmittingRating}
              >
                {isSubmittingRating ? '...' : copy.ratingSubmit}
              </button>
              <button
                type="button"
                className="template-detail__rating-dialog__btn template-detail__rating-dialog__btn--cancel"
                onClick={closeRatingDialog}
                disabled={isSubmittingRating}
              >
                {copy.ratingCancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {isPreviewOpen && (
        <div className="template-detail__modal" role="dialog" aria-modal="true" aria-label={copy.preview}>
          <div className="template-detail__modal-content">
            <div className="template-detail__modal-header">
              <strong>{activeSlide.title}</strong>
              <button type="button" onClick={() => {
                setIsPreviewOpen(false);
                if (document.fullscreenElement) {
                  document.exitFullscreen().catch(() => {});
                }
              }} aria-label={copy.closePreview}>
                <DetailIcon name="close" />
              </button>
            </div>
            <TemplateSlidePreview slide={activeSlide} title={detail.title} scale={1.12} />
            <div className="template-detail__modal-controls">
              <button
                type="button"
                onClick={() => goToSlide(activeSlideIndex - 1)}
                disabled={activeSlideIndex === 0}
              >
                {copy.previousSlide}
              </button>
              <span>{activeSlideIndex + 1} / {detail.slides.length}</span>
              <button
                type="button"
                onClick={() => goToSlide(activeSlideIndex + 1)}
                disabled={activeSlideIndex >= detail.slides.length - 1}
              >
                {copy.nextSlide}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div ref={exportRef}>
          {detail.slides.map((slide) => (
            <div key={slide.id} className="pdf-slide" style={{ width: '960px', height: '540px', background: '#fff', position: 'relative' }}>
              <TemplateSlidePreview slide={slide} title={detail.title} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
