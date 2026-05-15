import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import {
  getDeckForEditor,
  saveDeckForEditor,
  updateTemplateShareAccess,
} from '../services/slideCreationService.js';
import './SlideEditor.css';

const EDITOR_COPY = {
  ja: {
    backShort: 'ホーム',
    toolText: 'テキスト',
    toolImage: '画像',
    toolShape: '図形',
    toolFrame: 'フレーム',
    toolTable: '表',
    toolChart: 'グラフ',
    fontFamily: 'テキスト',
    selectedPanel: '選択中',
    contentLabel: '内容',
    colorLabel: '色',
    deleteSelection: '削除',
    noSelection: 'オブジェクト未選択',
    aiTab: 'AIテキスト',
    imageTab: '画像検索',
    layoutTab: 'レイアウト',
    aiPrompt: 'AIにテキストを生成させる...',
    imagePrompt: '画像を検索...',
    imageTile: '画像',
    imageSearchButton: '検索',
    imageSearchEmpty: '検索キーワードを入力してください。',
    generateText: '生成',
    defaultTitle: '新規スライド',
    defaultSubtitle: 'RAKUSLIDE DRAFT',
    sampleText: 'テキストを入力',
    shapeLabel: '図形',
    tableLabel: '表',
    chartLabel: '売上推移',
    imageLabel: '画像プレースホルダー',
    blankLayout: '空白',
    titleLayout: 'タイトル',
    sectionLayout: 'セクション',
    chartLayout: 'グラフ',
    tableLayout: '表',
    twoColumnLayout: '2カラム',
    copied: '共有リンクをコピーしました',
    copyFailed: 'リンクをコピーできませんでした',
    saveLabel: '保存',
    saveSubLabel: 'Save',
    imageSearchRendered: '画像を下に表示しました',
    slideNameAria: 'スライド名',
    slideNamePlaceholder: 'テンプレート名',
    savingLabel: '保存中...',
    saveDialogTitle: 'スライド名を入力',
    saveNameLabel: 'スライド名',
    saveNamePlaceholder: 'スライド名',
    saveNameRequired: 'スライド名を入力してください。',
    saveCancel: 'キャンセル',
    savedToast: 'スライドを保存しました',
    saveError: 'スライドを保存できませんでした: {{message}}',
    addSlide: 'スライドを追加',
    deleteSlide: 'スライド削除',
    deleteSlideSubLabel: 'Delete',
    deleteLastSlideBlocked: '最後のスライドは削除できません',
    deletedSlideToast: 'スライドを削除しました',
    previewTitle: 'プレビュー',
    closePreview: '閉じる',
    quizPrompt: 'このスライドからクイズを3問作成',
    shareDialogTitle: 'プレゼンテーションを共有',
    shareViewingCount: '0名が閲覧中',
    shareSettings: '設定',
    shareAddUserPlaceholder: '+ ユーザーを追加...',
    shareAddUser: '追加',
    shareOwnerName: 'あなた',
    shareOwnerRole: '所有者',
    shareAccessTitle: 'アクセス権限',
    sharePrivateAccess: 'あなたのみアクセス可能',
    shareLinkAccess: 'リンクを知っている全員',
    shareCopyLink: 'リンクをコピー',
    shareAccessUpdated: '共有権限を更新しました',
    shareAccessError: '共有権限を更新できませんでした: {{message}}',
    shareInviteAdded: 'ユーザーを追加しました',
    shareInviteEmpty: 'メールアドレスを入力してください',
    closeShare: '閉じる',
  },
  vi: {
    backShort: 'Trang chủ',
    toolText: 'Văn bản',
    toolImage: 'Ảnh',
    toolShape: 'Hình',
    toolFrame: 'Khung',
    toolTable: 'Bảng',
    toolChart: 'Biểu đồ',
    fontFamily: 'Văn bản',
    selectedPanel: 'Đang chọn',
    contentLabel: 'Nội dung',
    colorLabel: 'Màu',
    deleteSelection: 'Xóa',
    noSelection: 'Chưa chọn đối tượng',
    aiTab: 'AI text',
    imageTab: 'Tìm ảnh',
    layoutTab: 'Bố cục',
    aiPrompt: 'Nhập nội dung muốn tạo...',
    imagePrompt: 'Tìm kiếm ảnh...',
    imageTile: 'Ảnh',
    imageSearchButton: 'Tìm',
    imageSearchEmpty: 'Nhập từ khóa tìm ảnh.',
    generateText: 'Tạo',
    defaultTitle: 'Slide mới',
    defaultSubtitle: 'RAKUSLIDE DRAFT',
    sampleText: 'Nhập văn bản',
    shapeLabel: 'Hình khối',
    tableLabel: 'Bảng dữ liệu',
    chartLabel: 'Xu hướng doanh thu',
    imageLabel: 'Khung ảnh',
    blankLayout: 'Trống',
    titleLayout: 'Tiêu đề',
    sectionLayout: 'Mục lớn',
    chartLayout: 'Biểu đồ',
    tableLayout: 'Bảng',
    twoColumnLayout: '2 cột',
    copied: 'Đã sao chép link chia sẻ',
    copyFailed: 'Không thể sao chép link',
    saveLabel: 'Lưu',
    saveSubLabel: 'Save',
    imageSearchRendered: 'Đã hiển thị ảnh bên dưới',
    slideNameAria: 'Tên slide',
    slideNamePlaceholder: 'Tên slide',
    savingLabel: 'Đang lưu...',
    saveDialogTitle: 'Nhập tên slide',
    saveNameLabel: 'Tên slide',
    saveNamePlaceholder: 'Tên slide',
    saveNameRequired: 'Nhập tên slide.',
    saveCancel: 'Hủy',
    savedToast: 'Đã lưu slide',
    saveError: 'Không thể lưu slide: {{message}}',
    addSlide: 'Thêm slide',
    deleteSlide: 'Xóa slide',
    deleteSlideSubLabel: 'Delete',
    deleteLastSlideBlocked: 'Không thể xóa slide cuối cùng',
    deletedSlideToast: 'Đã xóa slide',
    previewTitle: 'Xem trước',
    closePreview: 'Đóng',
    quizPrompt: 'Tạo 3 câu hỏi quiz từ slide này',
    shareDialogTitle: 'Chia sẻ bài thuyết trình',
    shareViewingCount: '0 người đang xem',
    shareSettings: 'Cài đặt',
    shareAddUserPlaceholder: '+ Thêm người dùng...',
    shareAddUser: 'Thêm',
    shareOwnerName: 'Bạn',
    shareOwnerRole: 'Chủ sở hữu',
    shareAccessTitle: 'Quyền truy cập',
    sharePrivateAccess: 'Chỉ bạn có quyền truy cập',
    shareLinkAccess: 'Ai có link đều xem được',
    shareCopyLink: 'Sao chép link',
    shareAccessUpdated: 'Đã cập nhật quyền chia sẻ',
    shareAccessError: 'Không thể cập nhật quyền chia sẻ: {{message}}',
    shareInviteAdded: 'Đã thêm người dùng',
    shareInviteEmpty: 'Nhập email người dùng cần thêm',
    closeShare: 'Đóng',
  },
};

const TOOL_ITEMS = [
  { id: 'text', icon: 'type', copyKey: 'toolText' },
  { id: 'image', icon: 'image', copyKey: 'toolImage' },
  { id: 'shape', icon: 'shape', copyKey: 'toolShape' },
  { id: 'frame', icon: 'frame', copyKey: 'toolFrame' },
  { id: 'table', icon: 'table', copyKey: 'toolTable' },
  { id: 'chart', icon: 'chart', copyKey: 'toolChart' },
];

const SIDEBAR_TABS = [
  { id: 'ai', copyKey: 'aiTab' },
  { id: 'images', copyKey: 'imageTab' },
  { id: 'layouts', copyKey: 'layoutTab' },
];

const LAYOUTS = [
  { id: 'title', copyKey: 'titleLayout' },
  { id: 'section', copyKey: 'sectionLayout' },
  { id: 'chart', copyKey: 'chartLayout' },
  { id: 'table', copyKey: 'tableLayout' },
  { id: 'two-column', copyKey: 'twoColumnLayout' },
  { id: 'blank', copyKey: 'blankLayout' },
];

const IMAGE_TILES = [
  { id: 'meeting', color: '#dbeafe' },
  { id: 'desk', color: '#e0f2fe' },
  { id: 'board', color: '#dcfce7' },
  { id: 'laptop', color: '#fef3c7' },
  { id: 'team', color: '#fee2e2' },
  { id: 'report', color: '#ede9fe' },
];

const WIKIMEDIA_SEARCH_ENDPOINT = 'https://commons.wikimedia.org/w/api.php';
const GOOGLE_CUSTOM_SEARCH_ENDPOINT = 'https://www.googleapis.com/customsearch/v1';

const IMAGE_SEARCH_QUERY_BY_KEYWORD = {
  dog: ['domestic dog photograph', 'dog portrait'],
  cat: ['domestic cat photograph', 'cat portrait'],
  flower: ['flower photograph', 'garden flower'],
  beach: ['beach photograph', 'seaside landscape'],
  mountain: ['mountain landscape photograph', 'mountain peak'],
  car: ['car photograph', 'automobile'],
  school: ['school classroom photograph', 'school building'],
  technology: ['technology device photograph', 'computer technology'],
  business: ['business meeting photograph', 'office business'],
};

const IMAGE_COLOR_KEYWORDS = [
  { key: 'black', patterns: ['den', 'mau den', 'black'] },
  { key: 'white', patterns: ['trang', 'mau trang', 'white'] },
  { key: 'brown', patterns: ['nau', 'mau nau', 'brown'] },
  { key: 'yellow', patterns: ['vang', 'mau vang', 'yellow'] },
  { key: 'gray', patterns: ['xam', 'mau xam', 'grey', 'gray'] },
  { key: 'red', patterns: ['do', 'mau do', 'red'] },
  { key: 'blue', patterns: ['xanh duong', 'mau xanh duong', 'blue'] },
  { key: 'green', patterns: ['xanh la', 'mau xanh la', 'green'] },
];

function getEditorCopy(language) {
  return EDITOR_COPY[language] ?? EDITOR_COPY.ja;
}

function formatCopy(template, vars = {}) {
  return String(template).replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ''));
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function slugForKey(value) {
  return encodeURIComponent(String(value ?? '').trim().toLowerCase()).replace(/%/g, '').slice(0, 48) || 'image';
}

function stripVietnameseMarks(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

function normalizeImageSearchKeyword(query) {
  const normalized = stripVietnameseMarks(query).toLowerCase();

  if (/\bcho\b/.test(normalized) || normalized.includes('con cho') || normalized.includes('cun')) return 'dog';
  if (/\bmeo\b/.test(normalized) || normalized.includes('con meo') || normalized.includes('meo con')) return 'cat';
  if (normalized.includes('hoa')) return 'flower';
  if (normalized.includes('bien')) return 'beach';
  if (normalized.includes('nui')) return 'mountain';
  if (normalized.includes('xe')) return 'car';
  if (normalized.includes('truong hoc')) return 'school';
  if (normalized.includes('cong nghe')) return 'technology';
  if (normalized.includes('kinh doanh')) return 'business';

  return query.trim();
}

function getImageColorKeyword(query) {
  const normalized = stripVietnameseMarks(query).toLowerCase();
  const color = IMAGE_COLOR_KEYWORDS.find((item) => (
    item.patterns.some((pattern) => normalized.includes(pattern))
  ));

  return color?.key ?? '';
}

function getImageSearchProfile(query) {
  const originalQuery = query.trim();
  const normalizedQuery = normalizeImageSearchKeyword(originalQuery);
  const englishQueries = IMAGE_SEARCH_QUERY_BY_KEYWORD[normalizedQuery];
  const colorKeyword = getImageColorKeyword(originalQuery);

  if (englishQueries) {
    return {
      directTags: [colorKeyword, normalizedQuery].filter(Boolean),
      terms: englishQueries.map((term) => [colorKeyword, term].filter(Boolean).join(' ')),
    };
  }

  if (normalizedQuery && normalizedQuery !== originalQuery) {
    return {
      directTags: [colorKeyword, normalizedQuery].filter(Boolean),
      terms: [[colorKeyword, normalizedQuery].filter(Boolean).join(' ')],
    };
  }

  return {
    directTags: [],
    terms: [originalQuery].filter(Boolean),
  };
}

function buildPlaceholderImageResults(query, copy) {
  const normalizedQuery = query.trim();
  const offset = normalizedQuery
    ? normalizedQuery.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % IMAGE_TILES.length
    : 0;

  return IMAGE_TILES.map((_, index) => {
    const tile = IMAGE_TILES[(index + offset) % IMAGE_TILES.length];

    return {
      ...tile,
      resultId: `${tile.id}-${normalizedQuery || 'default'}-${index}`,
      label: normalizedQuery ? `${normalizedQuery} ${index + 1}` : `${copy.imageTile} ${index + 1}`,
      thumbIndex: ((index + offset) % IMAGE_TILES.length) + 1,
      src: null,
      sourceUrl: null,
    };
  });
}

function buildFallbackImageResults(query, copy) {
  const searchTerm = normalizeImageSearchKeyword(query) || 'presentation';
  const key = slugForKey(searchTerm);

  return IMAGE_TILES.map((tile, index) => ({
    ...tile,
    resultId: `fallback-${key}-${index}`,
    label: query.trim() ? `${query.trim()} ${index + 1}` : `${copy.imageTile} ${index + 1}`,
    thumbIndex: index + 1,
    src: `https://loremflickr.com/640/360/${encodeURIComponent(searchTerm.replace(/\s+/g, ','))}?lock=${index + 31}`,
    sourceUrl: null,
  }));
}

function buildDirectImageResults(tags, query, copy) {
  const searchTerm = tags.length ? tags.join(',') : normalizeImageSearchKeyword(query) || 'presentation';
  const key = slugForKey(searchTerm);

  return IMAGE_TILES.map((tile, index) => ({
    ...tile,
    resultId: `direct-${key}-${index}`,
    label: query.trim() ? `${query.trim()} ${index + 1}` : `${copy.imageTile} ${index + 1}`,
    thumbIndex: index + 1,
    src: `https://loremflickr.com/640/360/${encodeURIComponent(searchTerm)}?lock=${index + 101}`,
    sourceUrl: null,
  }));
}

function getWikimediaImageResults(pages, query, copy) {
  return Object.values(pages ?? {})
    .map((page, index) => {
      const imageInfo = page.imageinfo?.[0];
      const src = imageInfo?.thumburl ?? imageInfo?.url;

      if (!src || !imageInfo?.mime?.startsWith('image/')) return null;

      const title = String(page.title ?? '')
        .replace(/^File:/i, '')
        .replace(/\.[a-z0-9]+$/i, '')
        .replace(/_/g, ' ')
        .trim();
      const tile = IMAGE_TILES[index % IMAGE_TILES.length];

      return {
        ...tile,
        resultId: `wikimedia-${page.pageid ?? slugForKey(title)}-${index}`,
        label: title || (query.trim() ? `${query.trim()} ${index + 1}` : `${copy.imageTile} ${index + 1}`),
        thumbIndex: (index % IMAGE_TILES.length) + 1,
        src,
        sourceUrl: imageInfo?.descriptionurl ?? imageInfo?.url ?? null,
      };
    })
    .filter(Boolean)
    .slice(0, IMAGE_TILES.length);
}

function getGoogleCustomSearchConfig() {
  const apiKey = import.meta.env.VITE_GOOGLE_CSE_API_KEY?.trim();
  const searchEngineId = import.meta.env.VITE_GOOGLE_CSE_ID?.trim();

  return {
    apiKey,
    isConfigured: Boolean(apiKey && searchEngineId),
    searchEngineId,
  };
}

function getGoogleImageResults(items, query, copy) {
  return (items ?? [])
    .map((item, index) => {
      const src = item.image?.thumbnailLink ?? item.link;

      if (!src) return null;

      const tile = IMAGE_TILES[index % IMAGE_TILES.length];

      return {
        ...tile,
        resultId: `google-${item.cacheId ?? slugForKey(item.link ?? item.title)}-${index}`,
        label: item.title || (query.trim() ? `${query.trim()} ${index + 1}` : `${copy.imageTile} ${index + 1}`),
        sourceUrl: item.image?.contextLink ?? item.link ?? null,
        src,
        thumbIndex: (index % IMAGE_TILES.length) + 1,
      };
    })
    .filter(Boolean)
    .slice(0, IMAGE_TILES.length);
}

async function fetchGoogleImageResults(searchTerms, originalQuery, copy) {
  const { apiKey, isConfigured, searchEngineId } = getGoogleCustomSearchConfig();

  if (!isConfigured) {
    return [];
  }

  for (const searchTerm of searchTerms) {
    const params = new URLSearchParams({
      cx: searchEngineId,
      imgType: 'photo',
      key: apiKey,
      num: String(IMAGE_TILES.length),
      q: searchTerm,
      safe: 'active',
      searchType: 'image',
    });

    const response = await fetch(`${GOOGLE_CUSTOM_SEARCH_ENDPOINT}?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      continue;
    }

    const payload = await response.json();
    const results = getGoogleImageResults(payload.items, originalQuery, copy);

    if (results.length) return results;
  }

  return [];
}

async function fetchImageResults(query, copy) {
  const originalQuery = query.trim();
  const searchProfile = getImageSearchProfile(originalQuery);
  const searchTerms = [...new Set([originalQuery, ...searchProfile.terms].filter(Boolean))];
  const googleResults = await fetchGoogleImageResults(searchTerms, originalQuery, copy);

  if (googleResults.length) return googleResults;

  if (searchProfile.directTags.length) {
    return buildDirectImageResults(searchProfile.directTags, originalQuery, copy);
  }

  for (const searchTerm of searchTerms) {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      generator: 'search',
      gsrnamespace: '6',
      gsrlimit: '12',
      gsrsearch: searchTerm,
      iiprop: 'url|mime',
      iiurlwidth: '480',
      origin: '*',
      prop: 'imageinfo',
    });

    const response = await fetch(`${WIKIMEDIA_SEARCH_ENDPOINT}?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Image search failed: ${response.status}`);
    }

    const payload = await response.json();
    const results = getWikimediaImageResults(payload.query?.pages, originalQuery, copy);

    if (results.length) return results;
  }

  return buildFallbackImageResults(originalQuery, copy);
}

function normalizeElement(raw, index, copy) {
  const type = raw?.type ?? 'text';
  const base = createElement(type, copy, index);

  return {
    ...base,
    ...raw,
    id: raw?.id ?? base.id,
    x: Number(raw?.x ?? raw?.left ?? base.x),
    y: Number(raw?.y ?? raw?.top ?? base.y),
    width: Number(raw?.width ?? base.width),
    height: Number(raw?.height ?? base.height),
    style: {
      ...base.style,
      ...(raw?.style ?? {}),
    },
  };
}

function createDefaultElements(templateTitle, copy) {
  return [
    {
      id: makeId('title'),
      type: 'text',
      x: 7,
      y: 8,
      width: 86,
      height: 13,
      text: templateTitle || copy.defaultTitle,
      style: {
        align: 'center',
        bold: true,
        color: '#111827',
        fontSize: 38,
        italic: false,
        underline: false,
      },
    },
    {
      id: makeId('subtitle'),
      type: 'text',
      x: 33,
      y: 22,
      width: 34,
      height: 7,
      text: copy.defaultSubtitle,
      style: {
        align: 'center',
        bold: false,
        color: '#1f2937',
        fontSize: 14,
        italic: false,
        underline: false,
      },
    },
  ];
}

function createElement(type, copy, index = 0, overrides = {}) {
  const offset = index % 5;
  const base = {
    id: makeId(type),
    type,
    x: 12 + offset * 3,
    y: 28 + offset * 4,
    width: 34,
    height: 16,
    text: '',
    style: {
      align: 'left',
      bold: false,
      color: '#111827',
      fontSize: 18,
      italic: false,
      underline: false,
    },
  };

  if (type === 'text') {
    return {
      ...base,
      width: 42,
      height: 12,
      text: copy.sampleText,
      ...overrides,
    };
  }

  if (type === 'shape' || type === 'frame') {
    return {
      ...base,
      width: type === 'frame' ? 38 : 30,
      height: type === 'frame' ? 20 : 16,
      text: type === 'frame' ? copy.toolFrame : copy.shapeLabel,
      fill: type === 'frame' ? 'transparent' : '#dbeafe',
      stroke: '#2563eb',
      ...overrides,
    };
  }

  if (type === 'image') {
    return {
      ...base,
      x: 54,
      y: 33,
      width: 32,
      height: 22,
      text: copy.imageLabel,
      fill: '#e0f2fe',
      src: null,
      alt: copy.imageLabel,
      sourceUrl: null,
      ...overrides,
    };
  }

  if (type === 'table') {
    return {
      ...base,
      x: 12,
      y: 42,
      width: 40,
      height: 28,
      text: copy.tableLabel,
      ...overrides,
    };
  }

  if (type === 'chart') {
    return {
      ...base,
      x: 49,
      y: 36,
      width: 40,
      height: 34,
      text: copy.chartLabel,
      ...overrides,
    };
  }

  return {
    ...base,
    ...overrides,
  };
}

function buildLayoutElements(layoutId, templateTitle, copy) {
  if (layoutId === 'blank') return [];

  const title = createDefaultElements(templateTitle, copy);

  if (layoutId === 'title') return title;

  if (layoutId === 'section') {
    return [
      title[0],
      createElement('shape', copy, 1, {
        x: 16,
        y: 36,
        width: 68,
        height: 24,
        text: copy.sectionLayout,
        fill: '#eff6ff',
      }),
    ];
  }

  if (layoutId === 'chart') {
    return [
      ...title,
      createElement('chart', copy, 2, {
        x: 10,
        y: 34,
        width: 80,
        height: 42,
      }),
    ];
  }

  if (layoutId === 'table') {
    return [
      ...title,
      createElement('table', copy, 2, {
        x: 12,
        y: 36,
        width: 76,
        height: 40,
      }),
    ];
  }

  if (layoutId === 'two-column') {
    return [
      ...title,
      createElement('text', copy, 2, {
        x: 10,
        y: 38,
        width: 34,
        height: 26,
        text: copy.sampleText,
      }),
      createElement('image', copy, 3, {
        x: 54,
        y: 36,
        width: 34,
        height: 28,
      }),
    ];
  }

  return title;
}

function buildEditableSlides(sourceSlides, template, copy) {
  const slides = sourceSlides?.length ? sourceSlides : [{ id: 'local-slide-1', position: 1 }];

  return slides.map((slide, index) => {
    const hasContentElements = Array.isArray(slide?.content?.elements);
    const contentElements = hasContentElements ? slide.content.elements : [];
    const title = slide?.title ?? template?.title ?? copy.defaultTitle;

    return {
      id: slide?.id ?? `local-slide-${index + 1}`,
      position: slide?.position ?? index + 1,
      title,
      elements: hasContentElements
        ? contentElements.map((element, elementIndex) => normalizeElement(element, elementIndex, copy))
        : createDefaultElements(title, copy),
    };
  });
}

function getSlideDisplayTitle(slide, fallbackTitle) {
  return slide?.elements?.find((element) => element.type === 'text')?.text?.trim()
    || slide?.title
    || fallbackTitle;
}

function applyTitleToSlide(slide, title) {
  const firstTextIndex = slide.elements.findIndex((element) => element.type === 'text');

  if (firstTextIndex < 0) {
    return {
      ...slide,
      title,
    };
  }

  return {
    ...slide,
    title,
    elements: slide.elements.map((element, index) => (
      index === firstTextIndex ? { ...element, text: title } : element
    )),
  };
}

function getShareAccessFromTemplate(template) {
  return template?.is_public || template?.visibility === 'public' ? 'link' : 'private';
}

function Icon({ name, size = 22 }) {
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
    case 'type':
      return (
        <svg {...common}>
          <path d="M5 20h14" />
          <path d="M7 16l5-12 5 12" />
          <path d="M9 12h6" />
        </svg>
      );
    case 'image':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="8" cy="10" r="1.5" />
          <path d="M21 15l-5-5L5 19" />
          <path d="M15 5h4v4" />
        </svg>
      );
    case 'shape':
      return (
        <svg {...common}>
          <rect x="4" y="4" width="9" height="9" rx="1.5" />
          <rect x="11" y="11" width="9" height="9" rx="1.5" />
        </svg>
      );
    case 'frame':
      return (
        <svg {...common}>
          <rect x="4" y="6" width="16" height="12" rx="1.5" />
          <path d="M8 6v12M16 6v12" />
        </svg>
      );
    case 'table':
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="1.5" />
          <path d="M4 10h16M4 15h16M10 4v16M15 4v16" />
        </svg>
      );
    case 'chart':
      return (
        <svg {...common}>
          <path d="M5 19V9" />
          <path d="M12 19V5" />
          <path d="M19 19v-7" />
          <path d="M3 19h18" />
        </svg>
      );
    case 'play':
      return (
        <svg {...common}>
          <path d="M8 5v14l11-7z" />
        </svg>
      );
    case 'share':
      return (
        <svg {...common}>
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.6 10.6l6.8-4.2M8.6 13.4l6.8 4.2" />
        </svg>
      );
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
    case 'settings':
      return (
        <svg {...common}>
          <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5z" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.37a1.7 1.7 0 0 0-1 .63 1.7 1.7 0 0 0-.4 1.08V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8 19.37a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 3.63 15a1.7 1.7 0 0 0-.63-1 1.7 1.7 0 0 0-1.08-.4H2a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 3.63 8a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 8 3.63a1.7 1.7 0 0 0 1-.63A1.7 1.7 0 0 0 9.4 1.92V2a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 3.63a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.37 8c.18.4.4.73.63 1 .3.25.68.4 1.08.4H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15z" />
        </svg>
      );
    case 'more':
      return (
        <svg {...common}>
          <circle cx="5" cy="12" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="19" cy="12" r="1.5" />
        </svg>
      );
    case 'quiz':
      return (
        <svg {...common}>
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5" />
          <path d="M9 14h1.5c1 0 1.5-.5 1.5-1.25S11.5 11.5 10.5 11.5H9" />
          <path d="M9 17h.01" />
        </svg>
      );
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
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
    case 'save':
      return (
        <svg {...common}>
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <path d="M17 21v-8H7v8" />
          <path d="M7 3v5h8" />
        </svg>
      );
    case 'plus':
      return (
        <svg {...common}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      );
    case 'arrow-left':
      return (
        <svg {...common}>
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
      );
    default:
      return null;
  }
}

function ChartGraphic() {
  return (
    <svg className="slide-editor__chart-svg" viewBox="0 0 360 180" aria-hidden="true">
      <path d="M28 20v132h306" className="slide-editor__chart-axis" />
      {[0, 1, 2, 3].map((line) => (
        <path
          key={line}
          d={`M28 ${34 + line * 34}h306`}
          className="slide-editor__chart-grid-line"
        />
      ))}
      <polyline
        points="42,130 88,108 134,78 180,96 226,44 272,66 318,34"
        className="slide-editor__chart-line slide-editor__chart-line--blue"
      />
      <polyline
        points="42,142 88,126 134,104 180,118 226,74 272,92 318,58"
        className="slide-editor__chart-line slide-editor__chart-line--orange"
      />
      {[42, 88, 134, 180, 226, 272, 318].map((x, index) => (
        <circle
          key={`blue-${x}`}
          cx={x}
          cy={[130, 108, 78, 96, 44, 66, 34][index]}
          r="4"
          className="slide-editor__chart-dot slide-editor__chart-dot--blue"
        />
      ))}
      {[42, 88, 134, 180, 226, 272, 318].map((x, index) => (
        <circle
          key={`orange-${x}`}
          cx={x}
          cy={[142, 126, 104, 118, 74, 92, 58][index]}
          r="4"
          className="slide-editor__chart-dot slide-editor__chart-dot--orange"
        />
      ))}
    </svg>
  );
}

function TableGraphic() {
  return (
    <div className="slide-editor__table-graphic" aria-hidden="true">
      {Array.from({ length: 12 }, (_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}

function SlideElement({
  element,
  isSelected,
  onDelete,
  onDragStart,
  onSelect,
  onTextChange,
  readOnly = false,
}) {
  const textRef = useRef(null);
  const elementStyle = {
    left: `${element.x}%`,
    top: `${element.y}%`,
    width: `${element.width}%`,
    height: `${element.height}%`,
  };

  const textStyle = {
    color: element.style?.color,
    fontSize: `${element.style?.fontSize ?? 18}px`,
    fontStyle: element.style?.italic ? 'italic' : 'normal',
    fontWeight: element.style?.bold ? 800 : 500,
    justifyContent:
      element.style?.align === 'center'
        ? 'center'
        : element.style?.align === 'right'
          ? 'flex-end'
          : 'flex-start',
    textAlign: element.style?.align ?? 'left',
    textDecoration: element.style?.underline ? 'underline' : 'none',
  };

  function handleKeyDown(event) {
    if (readOnly) return;

    if ((event.key === 'Delete' || event.key === 'Backspace') && isSelected) {
      event.preventDefault();
      onDelete();
    }
  }

  useLayoutEffect(() => {
    const textNode = textRef.current;

    if (!textNode || element.type !== 'text') return;
    if (document.activeElement === textNode) return;

    const nextText = element.text ?? '';

    if (textNode.textContent !== nextText) {
      textNode.textContent = nextText;
    }
  }, [element.id, element.text, element.type]);

  return (
    <div
      className={`slide-editor__element slide-editor__element--${element.type}${isSelected ? ' slide-editor__element--selected' : ''}`}
      style={elementStyle}
      role={readOnly ? undefined : 'button'}
      tabIndex={readOnly ? undefined : 0}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(element.id);
      }}
      onKeyDown={handleKeyDown}
      onPointerDown={(event) => {
        if (readOnly) return;
        event.stopPropagation();
        onSelect(element.id);
        onDragStart(event, element);
      }}
    >
      {element.type === 'text' && (
        <div
          ref={textRef}
          className="slide-editor__element-text"
          contentEditable={!readOnly && isSelected}
          data-editable-text={!readOnly && isSelected ? 'true' : undefined}
          suppressContentEditableWarning
          style={textStyle}
          onInput={(event) => onTextChange(element.id, event.currentTarget.textContent ?? '')}
          onPointerDown={(event) => {
            if (!readOnly && isSelected) {
              event.stopPropagation();
            }
          }}
        />
      )}

      {(element.type === 'shape' || element.type === 'frame') && (
        <div
          className="slide-editor__shape"
          style={{
            background: element.fill,
            borderColor: element.stroke,
          }}
        >
          {element.text}
        </div>
      )}

      {element.type === 'image' && (
        <div
          className={`slide-editor__image-placeholder${element.src ? ' slide-editor__image-placeholder--filled' : ''}`}
          style={{ backgroundColor: element.fill }}
        >
          {element.src ? (
            <img src={element.src} alt={element.alt || element.text || ''} draggable="false" />
          ) : (
            <>
              <Icon name="image" size={28} />
              <span>{element.text}</span>
            </>
          )}
        </div>
      )}

      {element.type === 'chart' && (
        <div className="slide-editor__chart">
          <strong>{element.text}</strong>
          <ChartGraphic />
        </div>
      )}

      {element.type === 'table' && (
        <div className="slide-editor__table">
          <strong>{element.text}</strong>
          <TableGraphic />
        </div>
      )}

      {isSelected && !readOnly && (
        <>
          <span className="slide-editor__resize-handle slide-editor__resize-handle--nw" />
          <span className="slide-editor__resize-handle slide-editor__resize-handle--ne" />
          <span className="slide-editor__resize-handle slide-editor__resize-handle--sw" />
          <span className="slide-editor__resize-handle slide-editor__resize-handle--se" />
        </>
      )}
    </div>
  );
}

function SlideSurface({
  elements,
  onCanvasClick,
  onDelete,
  onDragStart,
  onSelect,
  onTextChange,
  selectedElementId,
  readOnly = false,
}) {
  return (
    <div
      className={`slide-editor__canvas${readOnly ? ' slide-editor__canvas--preview' : ''}`}
      onClick={onCanvasClick}
    >
      {elements.map((element) => (
        <SlideElement
          key={element.id}
          element={element}
          isSelected={element.id === selectedElementId}
          onDelete={onDelete}
          onDragStart={onDragStart}
          onSelect={onSelect}
          onTextChange={onTextChange}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}

function MiniSlideElement({ element }) {
  const elementStyle = {
    left: `${element.x}%`,
    top: `${element.y}%`,
    width: `${element.width}%`,
    height: `${element.height}%`,
  };

  if (element.type === 'text') {
    const miniFontSize = clamp((element.style?.fontSize ?? 18) * 0.18, 4, 10);

    return (
      <span
        className="slide-editor__mini-element slide-editor__mini-element--text"
        style={elementStyle}
      >
        <span
          className="slide-editor__mini-text"
          style={{
            color: element.style?.color,
            fontSize: `${miniFontSize}px`,
            fontStyle: element.style?.italic ? 'italic' : 'normal',
            fontWeight: element.style?.bold ? 900 : 700,
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
      </span>
    );
  }

  if (element.type === 'image') {
    return (
      <span
        className="slide-editor__mini-element slide-editor__mini-element--image"
        style={{
          ...elementStyle,
          backgroundColor: element.fill,
        }}
      >
        {element.src ? <img src={element.src} alt="" draggable="false" /> : <Icon name="image" size={10} />}
      </span>
    );
  }

  if (element.type === 'chart') {
    return (
      <span
        className="slide-editor__mini-element slide-editor__mini-element--chart"
        style={elementStyle}
      >
        <span />
      </span>
    );
  }

  if (element.type === 'table') {
    return (
      <span
        className="slide-editor__mini-element slide-editor__mini-element--table"
        style={elementStyle}
      >
        {Array.from({ length: 9 }, (_, index) => <i key={index} />)}
      </span>
    );
  }

  return (
    <span
      className={`slide-editor__mini-element slide-editor__mini-element--${element.type}`}
      style={{
        ...elementStyle,
        background: element.fill,
        borderColor: element.stroke,
      }}
    >
      {element.text}
    </span>
  );
}

function SlideMiniature({ slide }) {
  return (
    <div className="slide-editor__mini-canvas" aria-hidden="true">
      {slide.elements.map((element) => (
        <MiniSlideElement key={element.id} element={element} />
      ))}
    </div>
  );
}

export default function SlideEditor({
  templateId,
  initialDeck,
  currentUserId,
  onBackHome,
}) {
  const { language, t } = useLanguage();
  const copy = useMemo(() => getEditorCopy(language), [language]);
  const canvasRef = useRef(null);
  const initialEditorSlides = useMemo(
    () => (initialDeck ? buildEditableSlides(initialDeck.slides, initialDeck.template, copy) : []),
    [copy, initialDeck],
  );
  const [deck, setDeck] = useState(initialDeck ?? null);
  const [error, setError] = useState('');
  const [editorSlides, setEditorSlides] = useState(() => initialEditorSlides);
  const [activeSlideId, setActiveSlideId] = useState(() => initialEditorSlides[0]?.id ?? '');
  const [selectedElementId, setSelectedElementId] = useState(() => (
    initialEditorSlides[0]?.elements[0]?.id ?? ''
  ));
  const [selectedTool, setSelectedTool] = useState('text');
  const [activePanel, setActivePanel] = useState('ai');
  const [aiPrompt, setAiPrompt] = useState('');
  const [imageQuery, setImageQuery] = useState('');
  const [imageResults, setImageResults] = useState([]);
  const [imageSearchError, setImageSearchError] = useState('');
  const [isImageSearching, setIsImageSearching] = useState(false);
  const [deckTitleDraft, setDeckTitleDraft] = useState(
    () => initialDeck?.template?.title ?? initialEditorSlides[0]?.title ?? copy.defaultTitle,
  );
  const [toast, setToast] = useState('');
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isSavingDeck, setIsSavingDeck] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareAccess, setShareAccess] = useState(() => getShareAccessFromTemplate(initialDeck?.template));
  const [isUpdatingShareAccess, setIsUpdatingShareAccess] = useState(false);
  const [shareInviteEmail, setShareInviteEmail] = useState('');
  const [shareInvitees, setShareInvitees] = useState([]);
  const [dragState, setDragState] = useState(null);
  const canLoadDeck = Boolean(!initialDeck && templateId && currentUserId);
  const missingLoadInput = Boolean(!initialDeck && (!templateId || !currentUserId));
  const isLoading = canLoadDeck && !deck && !error;
  const activeEditorSlide = editorSlides.find((slide) => slide.id === activeSlideId)
    ?? editorSlides[0]
    ?? null;
  const selectedElement = activeEditorSlide?.elements.find(
    (element) => element.id === selectedElementId,
  ) ?? null;
  const isSelectedText = selectedElement?.type === 'text';
  const visibleImageResults = useMemo(
    () => (imageResults.length ? imageResults : buildPlaceholderImageResults('', copy)),
    [copy, imageResults],
  );

  const updateElement = useCallback((elementId, patch) => {
    setEditorSlides((currentSlides) => currentSlides.map((slide) => {
      if (slide.id !== activeSlideId) return slide;

      return {
        ...slide,
        elements: slide.elements.map((element) => {
          if (element.id !== elementId) return element;

          return {
            ...element,
            ...patch,
            style: {
              ...element.style,
              ...(patch.style ?? {}),
            },
          };
        }),
      };
    }));
  }, [activeSlideId]);

  const deleteSelectedElement = useCallback(() => {
    if (!selectedElementId) return;

    setEditorSlides((currentSlides) => currentSlides.map((slide) => {
      if (slide.id !== activeSlideId) return slide;

      return {
        ...slide,
        elements: slide.elements.filter((element) => element.id !== selectedElementId),
      };
    }));
    setSelectedElementId('');
  }, [activeSlideId, selectedElementId]);

  useEffect(() => {
    let isMounted = true;

    if (!canLoadDeck) {
      return () => {
        isMounted = false;
      };
    }

    getDeckForEditor(templateId, currentUserId)
      .then((loadedDeck) => {
        if (isMounted) {
          const nextSlides = buildEditableSlides(loadedDeck.slides, loadedDeck.template, copy);
          const firstSlide = nextSlides[0];

          setDeck(loadedDeck);
          setEditorSlides(nextSlides);
          setActiveSlideId(firstSlide?.id ?? '');
          setSelectedElementId(firstSlide?.elements[0]?.id ?? '');
          setDeckTitleDraft(loadedDeck.template?.title ?? getSlideDisplayTitle(firstSlide, copy.defaultTitle));
          setShareAccess(getShareAccessFromTemplate(loadedDeck.template));
          setError('');
        }
      })
      .catch((loadError) => {
        if (isMounted) {
          setError(t('editor.loadError', { message: loadError.message }));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [canLoadDeck, copy, currentUserId, t, templateId]);

  useEffect(() => {
    if (!toast) return undefined;

    const timer = window.setTimeout(() => setToast(''), 2200);

    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!dragState) return undefined;

    function handlePointerMove(event) {
      const rect = canvasRef.current?.getBoundingClientRect();

      if (!rect) return;

      const dx = ((event.clientX - dragState.startClientX) / rect.width) * 100;
      const dy = ((event.clientY - dragState.startClientY) / rect.height) * 100;
      const nextX = clamp(dragState.startX + dx, 0, 100 - dragState.width);
      const nextY = clamp(dragState.startY + dy, 0, 100 - dragState.height);

      updateElement(dragState.elementId, {
        x: Number(nextX.toFixed(2)),
        y: Number(nextY.toFixed(2)),
      });
    }

    function handlePointerUp() {
      setDragState(null);
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, updateElement]);

  function addElement(type, overrides = {}) {
    if (!activeEditorSlide) return;

    const element = createElement(type, copy, activeEditorSlide.elements.length, overrides);

    setSelectedTool(type);
    setSelectedElementId(element.id);
    setEditorSlides((currentSlides) => currentSlides.map((slide) => {
      if (slide.id !== activeEditorSlide.id) return slide;

      return {
        ...slide,
        elements: [...slide.elements, element],
      };
    }));
  }

  function applyLayout(layoutId) {
    if (!activeEditorSlide) return;

    const nextElements = buildLayoutElements(layoutId, deck?.template?.title, copy);

    setEditorSlides((currentSlides) => currentSlides.map((slide) => {
      if (slide.id !== activeEditorSlide.id) return slide;

      return {
        ...slide,
        elements: nextElements,
      };
    }));
    setSelectedElementId(nextElements[0]?.id ?? '');
  }

  function handleDragStart(event, element) {
    if (event.button !== 0) return;

    setDragState({
      elementId: element.id,
      height: element.height,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: element.x,
      startY: element.y,
      width: element.width,
    });
  }

  function updateSelectedTextStyle(stylePatch) {
    if (!selectedElement) return;

    updateElement(selectedElement.id, { style: stylePatch });
  }

  function getShareUrl() {
    const deckTemplateId = deck?.template?.id ?? templateId;

    if (!deckTemplateId) {
      return window.location.href;
    }

    return `${window.location.origin}${window.location.pathname}${window.location.search}#editor=${encodeURIComponent(deckTemplateId)}`;
  }

  function copyShareLink() {
    if (!navigator.clipboard?.writeText) {
      setToast(copy.copyFailed);
      return;
    }

    navigator.clipboard.writeText(getShareUrl())
      .then(() => setToast(copy.copied))
      .catch(() => setToast(copy.copyFailed));
  }

  function handleShareClick() {
    setIsShareDialogOpen(true);
  }

  async function handleShareAccessChange(event) {
    const nextAccess = event.target.value;
    const previousAccess = shareAccess;
    const deckTemplateId = deck?.template?.id ?? templateId;

    setShareAccess(nextAccess);

    if (!deckTemplateId || !currentUserId) {
      setToast(formatCopy(copy.shareAccessError, { message: t('editor.missingTemplate') }));
      return;
    }

    setIsUpdatingShareAccess(true);

    try {
      const updatedTemplate = await updateTemplateShareAccess({
        accessMode: nextAccess,
        templateId: deckTemplateId,
        userId: currentUserId,
      });

      setDeck((currentDeck) => (
        currentDeck
          ? {
              ...currentDeck,
              template: {
                ...currentDeck.template,
                ...updatedTemplate,
              },
            }
          : currentDeck
      ));
      setToast(copy.shareAccessUpdated);
    } catch (shareFailure) {
      setShareAccess(previousAccess);
      setToast(formatCopy(copy.shareAccessError, { message: shareFailure.message }));
    } finally {
      setIsUpdatingShareAccess(false);
    }
  }

  function handleAddShareInvite(event) {
    event.preventDefault();

    const email = shareInviteEmail.trim();

    if (!email) {
      setToast(copy.shareInviteEmpty);
      return;
    }

    setShareInvitees((currentInvitees) => (
      currentInvitees.includes(email) ? currentInvitees : [...currentInvitees, email]
    ));
    setShareInviteEmail('');
    setToast(copy.shareInviteAdded);
  }

  function handleQuizClick() {
    setActivePanel('ai');
    setAiPrompt(copy.quizPrompt);
    setToast(copy.quizPrompt);
  }

  function handleSidebarTabClick(panelId) {
    setActivePanel(panelId);
  }

  function handleDeckTitleKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.blur();
    }
  }

  async function handleImageSearch(event) {
    event?.preventDefault();

    const query = imageQuery.trim();

    if (!query) {
      setImageSearchError(copy.imageSearchEmpty);
      return;
    }

    setImageSearchError('');
    setIsImageSearching(true);

    try {
      const results = await fetchImageResults(query, copy);
      setImageResults(results.length ? results : buildFallbackImageResults(query, copy));
      setToast(copy.imageSearchRendered);
    } catch {
      setImageResults(buildFallbackImageResults(query, copy));
      setToast(copy.imageSearchRendered);
    } finally {
      setIsImageSearching(false);
    }
  }

  function insertBlankSlideAt(insertIndex) {
    const nextSlide = {
      id: makeId('local-slide'),
      position: insertIndex + 1,
      title: `${copy.blankSlideTitle || copy.defaultTitle} ${insertIndex + 1}`,
      elements: [],
    };

    setEditorSlides((currentSlides) => {
      const safeInsertIndex = Math.min(Math.max(insertIndex, 0), currentSlides.length);
      const nextSlides = [
        ...currentSlides.slice(0, safeInsertIndex),
        nextSlide,
        ...currentSlides.slice(safeInsertIndex),
      ];

      return nextSlides.map((slide, index) => ({
        ...slide,
        position: index + 1,
      }));
    });
    setActiveSlideId(nextSlide.id);
    setSelectedElementId('');
  }

  function handleAddSlide() {
    insertBlankSlideAt(editorSlides.length);
  }

  function handleDeleteCurrentSlide() {
    if (editorSlides.length <= 1) {
      setToast(copy.deleteLastSlideBlocked);
      return;
    }

    const activeIndex = editorSlides.findIndex((slide) => slide.id === activeSlideId);
    const fallbackIndex = activeIndex > 0 ? activeIndex - 1 : 1;
    const fallbackSlide = editorSlides[fallbackIndex] ?? editorSlides[0];

    setEditorSlides((currentSlides) => currentSlides
      .filter((slide) => slide.id !== activeSlideId)
      .map((slide, index) => ({
        ...slide,
        position: index + 1,
      })));
    setActiveSlideId(fallbackSlide.id);
    setSelectedElementId(fallbackSlide.elements[0]?.id ?? '');
    setToast(copy.deletedSlideToast);
  }

  function openSaveDialog() {
    setSaveTitle(deckTitleDraft.trim() || getSlideDisplayTitle(activeEditorSlide, deck?.template?.title ?? copy.defaultTitle));
    setSaveError('');
    setIsSaveDialogOpen(true);
  }

  async function handleSaveSubmit(event) {
    event.preventDefault();

    const normalizedTitle = saveTitle.trim();

    if (!normalizedTitle) {
      setSaveError(copy.saveNameRequired);
      return;
    }

    const deckTemplateId = deck?.template?.id ?? templateId;

    if (!deckTemplateId || !currentUserId) {
      setSaveError(formatCopy(copy.saveError, { message: t('editor.missingTemplate') }));
      return;
    }

    const activePosition = activeEditorSlide?.position ?? 1;
    const slidesForSave = editorSlides.map((slide, index) => {
      const normalizedSlide = {
        ...slide,
        position: index + 1,
        title: slide.title || `${normalizedTitle} ${index + 1}`,
      };

      return slide.id === activeSlideId
        ? applyTitleToSlide(normalizedSlide, normalizedTitle)
        : normalizedSlide;
    });

    setIsSavingDeck(true);
    setSaveError('');

    try {
      const savedDeck = await saveDeckForEditor({
        templateId: deckTemplateId,
        userId: currentUserId,
        title: normalizedTitle,
        slides: slidesForSave,
      });
      const nextSlides = buildEditableSlides(savedDeck.slides, savedDeck.template, copy);
      const nextActiveSlide = nextSlides.find((slide) => slide.position === activePosition)
        ?? nextSlides[0];

      setDeck(savedDeck);
      setDeckTitleDraft(savedDeck.template?.title ?? normalizedTitle);
      setEditorSlides(nextSlides);
      setActiveSlideId(nextActiveSlide?.id ?? '');
      setSelectedElementId(nextActiveSlide?.elements[0]?.id ?? '');
      setIsSaveDialogOpen(false);
      setToast(copy.savedToast);
    } catch (saveFailure) {
      setSaveError(formatCopy(copy.saveError, { message: saveFailure.message }));
    } finally {
      setIsSavingDeck(false);
    }
  }

  if (missingLoadInput) {
    return (
      <section className="slide-editor slide-editor--status">
        <p className="slide-editor__error">
          {t('editor.loadError', { message: t('editor.missingTemplate') })}
        </p>
        <button type="button" className="slide-editor__back-btn" onClick={onBackHome}>
          <Icon name="arrow-left" size={18} />
          {t('editor.backHome')}
        </button>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="slide-editor slide-editor--status">
        <p>{t('editor.loading')}</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="slide-editor slide-editor--status">
        <p className="slide-editor__error">{error}</p>
        <button type="button" className="slide-editor__back-btn" onClick={onBackHome}>
          <Icon name="arrow-left" size={18} />
          {t('editor.backHome')}
        </button>
      </section>
    );
  }

  return (
    <section className="slide-editor" aria-label={t('editor.ariaLabel')}>
      <div className="slide-editor__command-row">
        <div className="slide-editor__left-controls">
          <button type="button" className="slide-editor__back-btn" onClick={onBackHome}>
            <Icon name="arrow-left" size={18} />
            <span>{copy.backShort}</span>
          </button>

          <div className="slide-editor__tool-strip" role="toolbar" aria-label={t('editor.toolbarAria')}>
            {TOOL_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`slide-editor__tool${selectedTool === item.id ? ' slide-editor__tool--active' : ''}`}
                title={copy[item.copyKey]}
                aria-label={copy[item.copyKey]}
                onClick={() => addElement(item.id === 'frame' ? 'frame' : item.id)}
              >
                <Icon name={item.icon} />
              </button>
            ))}
          </div>

          <input
            type="text"
            className="slide-editor__title-input"
            aria-label={copy.slideNameAria}
            placeholder={copy.slideNamePlaceholder}
            value={deckTitleDraft}
            onChange={(event) => setDeckTitleDraft(event.target.value)}
            onKeyDown={handleDeckTitleKeyDown}
          />
        </div>

        <div className="slide-editor__actions">
          <button
            type="button"
            className="slide-editor__save-action"
            onClick={openSaveDialog}
          >
            <Icon name="save" size={20} />
            <span>
              <strong>{copy.saveLabel}</strong>
              <small>{copy.saveSubLabel}</small>
            </span>
          </button>
          <button
            type="button"
            className="slide-editor__delete-slide-action"
            onClick={handleDeleteCurrentSlide}
            disabled={editorSlides.length <= 1}
            title={copy.deleteSlide}
          >
            <Icon name="trash" size={20} />
            <span>
              <strong>{copy.deleteSlide}</strong>
              <small>{copy.deleteSlideSubLabel}</small>
            </span>
          </button>
          <button type="button" onClick={() => setIsPreviewOpen(true)}>
            <Icon name="play" size={20} />
            <span>
              <strong>{t('editor.present')}</strong>
              <small>Present</small>
            </span>
          </button>
          <button type="button" onClick={handleShareClick}>
            <Icon name="share" size={20} />
            <span>
              <strong>{t('editor.share')}</strong>
              <small>Share</small>
            </span>
          </button>
          <button
            type="button"
            className="slide-editor__primary-action"
            onClick={handleQuizClick}
          >
            <Icon name="quiz" size={20} />
            <span>
              <strong>{t('editor.createQuiz')}</strong>
              <small>Create Quiz</small>
            </span>
          </button>
        </div>
      </div>

      <div className="slide-editor__workspace">
        <div className="slide-editor__stage">
          <div className="slide-editor__floating-toolbar">
            <button
              type="button"
              className="slide-editor__floating-tool"
              title={copy.colorLabel}
              disabled={!isSelectedText}
              onClick={() => updateSelectedTextStyle({ color: selectedElement?.style?.color === '#111827' ? '#2563eb' : '#111827' })}
            >
              <Icon name="type" size={18} />
            </button>

            <select
              aria-label={copy.fontFamily}
              disabled={!isSelectedText}
              value={copy.fontFamily}
              onChange={() => {}}
            >
              <option>{copy.fontFamily}</option>
            </select>

            <select
              aria-label="Font size"
              disabled={!isSelectedText}
              value={selectedElement?.style?.fontSize ?? 18}
              onChange={(event) => updateSelectedTextStyle({ fontSize: Number(event.target.value) })}
            >
              {[12, 14, 18, 24, 32, 38, 44].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>

            <button
              type="button"
              className={`slide-editor__floating-tool${selectedElement?.style?.bold ? ' slide-editor__floating-tool--active' : ''}`}
              disabled={!isSelectedText}
              onClick={() => updateSelectedTextStyle({ bold: !selectedElement?.style?.bold })}
            >
              B
            </button>
            <button
              type="button"
              className={`slide-editor__floating-tool${selectedElement?.style?.italic ? ' slide-editor__floating-tool--active' : ''}`}
              disabled={!isSelectedText}
              onClick={() => updateSelectedTextStyle({ italic: !selectedElement?.style?.italic })}
            >
              <em>I</em>
            </button>
            <button
              type="button"
              className={`slide-editor__floating-tool${selectedElement?.style?.underline ? ' slide-editor__floating-tool--active' : ''}`}
              disabled={!isSelectedText}
              onClick={() => updateSelectedTextStyle({ underline: !selectedElement?.style?.underline })}
            >
              <span className="slide-editor__underline">U</span>
            </button>

            {['left', 'center', 'right'].map((align) => (
              <button
                key={align}
                type="button"
                className={`slide-editor__align-btn slide-editor__align-btn--${align}${selectedElement?.style?.align === align ? ' slide-editor__floating-tool--active' : ''}`}
                disabled={!isSelectedText}
                onClick={() => updateSelectedTextStyle({ align })}
                aria-label={align}
              >
                <span />
                <span />
                <span />
              </button>
            ))}
          </div>

          <div className="slide-editor__canvas-shell" ref={canvasRef}>
            <SlideSurface
              elements={activeEditorSlide?.elements ?? []}
              onCanvasClick={() => setSelectedElementId('')}
              onDelete={deleteSelectedElement}
              onDragStart={handleDragStart}
              onSelect={setSelectedElementId}
              onTextChange={(elementId, text) => updateElement(elementId, { text })}
              selectedElementId={selectedElementId}
            />
          </div>

          <div className="slide-editor__thumbnails" aria-label={t('editor.thumbnailAria')}>
            {editorSlides.map((slide, index) => (
              <div key={slide.id} className="slide-editor__thumb-wrap">
                <button
                  type="button"
                  className={`slide-editor__thumb${slide.id === activeEditorSlide?.id ? ' slide-editor__thumb--active' : ''}`}
                  onClick={() => {
                    setActiveSlideId(slide.id);
                    setSelectedElementId(slide.elements[0]?.id ?? '');
                  }}
                >
                  <SlideMiniature slide={slide} />
                  <span>{slide.position}</span>
                </button>
                {index < editorSlides.length - 1 && (
                  <button
                    type="button"
                    className="slide-editor__insert-slide"
                    onClick={() => insertBlankSlideAt(index + 1)}
                    aria-label={copy.addSlide}
                    title={copy.addSlide}
                  >
                    <Icon name="plus" size={18} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="slide-editor__add-slide-thumb"
              onClick={handleAddSlide}
              aria-label={copy.addSlide}
              title={copy.addSlide}
            >
              <Icon name="plus" size={28} />
            </button>
          </div>
        </div>

        <aside className="slide-editor__sidebar">
          <div className="slide-editor__sidebar-tabs" role="tablist">
            {SIDEBAR_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activePanel === tab.id}
                className={activePanel === tab.id ? 'slide-editor__tab slide-editor__tab--active' : 'slide-editor__tab'}
                onClick={() => handleSidebarTabClick(tab.id)}
              >
                {copy[tab.copyKey]}
              </button>
            ))}
          </div>

          <div className="slide-editor__sidebar-scroll">
            {activePanel === 'ai' && (
              <section className="slide-editor__sidebar-section slide-editor__sidebar-section--ai">
                <div className="slide-editor__ai-box">
                  <textarea
                    value={aiPrompt}
                    placeholder={copy.aiPrompt}
                    onChange={(event) => setAiPrompt(event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      addElement('text', {
                        x: 14,
                        y: 34,
                        width: 72,
                        height: 16,
                        text: aiPrompt.trim() || copy.sampleText,
                      });
                      setAiPrompt('');
                    }}
                  >
                    {copy.generateText}
                  </button>
                </div>
              </section>
            )}

            {activePanel === 'images' && (
              <section className="slide-editor__sidebar-section">
                <h2>{copy.imageTab}</h2>
                <form className="slide-editor__image-search-form" onSubmit={handleImageSearch}>
                  <label className="slide-editor__search-field">
                    <Icon name="search" size={18} />
                    <input
                      type="search"
                      placeholder={copy.imagePrompt}
                      value={imageQuery}
                      onChange={(event) => setImageQuery(event.target.value)}
                    />
                  </label>
                  <button
                    type="submit"
                    className="slide-editor__image-search-submit"
                    disabled={isImageSearching}
                  >
                    {isImageSearching ? '...' : copy.imageSearchButton}
                  </button>
                </form>

                {(imageSearchError || isImageSearching) && (
                  <p className="slide-editor__image-search-status" role="status">
                    {isImageSearching ? 'Searching images...' : imageSearchError}
                  </p>
                )}

                <div className="slide-editor__image-grid">
                  {visibleImageResults.map((tile) => (
                    <button
                      key={tile.resultId}
                      type="button"
                      className="slide-editor__image-tile"
                      style={{ backgroundColor: tile.color }}
                      title={tile.label}
                      aria-label={tile.label}
                      onClick={() => addElement('image', {
                        text: tile.label,
                        fill: tile.color,
                        src: tile.src,
                        sourceUrl: tile.sourceUrl,
                        alt: tile.label,
                      })}
                    >
                      {tile.src ? (
                        <img src={tile.src} alt={tile.label} loading="lazy" referrerPolicy="no-referrer" />
                      ) : (
                        <span className={`slide-editor__photo-thumb slide-editor__photo-thumb--${tile.thumbIndex}`}>
                          <Icon name="image" size={18} />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {activePanel === 'layouts' && (
              <section className="slide-editor__sidebar-section">
                <h2>{copy.layoutTab}</h2>
                <div className="slide-editor__layout-grid">
                  {LAYOUTS.map((layout) => (
                    <button
                      key={layout.id}
                      type="button"
                      onClick={() => applyLayout(layout.id)}
                    >
                      <span className={`slide-editor__layout-preview slide-editor__layout-preview--${layout.id}`} />
                      <strong>{copy[layout.copyKey]}</strong>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        </aside>
      </div>

      {toast && <div className="slide-editor__toast" role="status">{toast}</div>}

      {isSaveDialogOpen && (
        <div className="slide-editor__modal" role="dialog" aria-modal="true" aria-label={copy.saveDialogTitle}>
          <form className="slide-editor__save-dialog" onSubmit={handleSaveSubmit}>
            <div className="slide-editor__modal-header">
              <strong>{copy.saveDialogTitle}</strong>
              <button
                type="button"
                onClick={() => setIsSaveDialogOpen(false)}
                disabled={isSavingDeck}
              >
                {copy.saveCancel}
              </button>
            </div>
            <label className="slide-editor__save-field">
              <span>{copy.saveNameLabel}</span>
              <input
                type="text"
                value={saveTitle}
                placeholder={copy.saveNamePlaceholder}
                onChange={(event) => setSaveTitle(event.target.value)}
                autoFocus
              />
            </label>
            {saveError && <p className="slide-editor__save-error">{saveError}</p>}
            <button
              type="submit"
              className="slide-editor__save-submit"
              disabled={isSavingDeck}
            >
              <Icon name="save" size={18} />
              {isSavingDeck ? copy.savingLabel : copy.saveLabel}
            </button>
          </form>
        </div>
      )}

      {isShareDialogOpen && (
        <div className="slide-editor__modal" role="dialog" aria-modal="true" aria-label={copy.shareDialogTitle}>
          <div className="slide-editor__share-dialog">
            <div className="slide-editor__share-header">
              <div>
                <strong>{copy.shareDialogTitle}</strong>
                <span>{copy.shareViewingCount}</span>
              </div>
              <button
                type="button"
                className="slide-editor__share-settings"
                onClick={() => setIsShareDialogOpen(false)}
              >
                <Icon name="settings" size={20} />
                {copy.closeShare}
              </button>
            </div>

            <form className="slide-editor__share-add-user" onSubmit={handleAddShareInvite}>
              <input
                type="email"
                value={shareInviteEmail}
                placeholder={copy.shareAddUserPlaceholder}
                onChange={(event) => setShareInviteEmail(event.target.value)}
              />
              <button type="submit">{copy.shareAddUser}</button>
            </form>

            <div className="slide-editor__share-user-row">
              <span className="slide-editor__share-avatar">{copy.shareOwnerName.charAt(0)}</span>
              <div>
                <strong>{copy.shareOwnerName}</strong>
                <small>{copy.shareOwnerRole}</small>
              </div>
              <button type="button" aria-label={copy.shareSettings}>
                <Icon name="more" size={20} />
              </button>
            </div>

            {shareInvitees.length > 0 && (
              <div className="slide-editor__share-invitees">
                {shareInvitees.map((email) => (
                  <span key={email}>{email}</span>
                ))}
              </div>
            )}

            <div className="slide-editor__share-access">
              <h2>{copy.shareAccessTitle}</h2>
              <label>
                <span className="slide-editor__share-access-icon">
                  <Icon name={shareAccess === 'link' ? 'link' : 'lock'} size={22} />
                </span>
                <select
                  value={shareAccess}
                  onChange={handleShareAccessChange}
                  disabled={isUpdatingShareAccess}
                >
                  <option value="private">{copy.sharePrivateAccess}</option>
                  <option value="link">{copy.shareLinkAccess}</option>
                </select>
              </label>
            </div>

            <button
              type="button"
              className="slide-editor__share-copy"
              onClick={copyShareLink}
            >
              <Icon name="link" size={22} />
              {copy.shareCopyLink}
            </button>
          </div>
        </div>
      )}

      {isPreviewOpen && (
        <div className="slide-editor__modal" role="dialog" aria-modal="true" aria-label={copy.previewTitle}>
          <div className="slide-editor__modal-content">
            <div className="slide-editor__modal-header">
              <strong>{copy.previewTitle}</strong>
              <button type="button" onClick={() => setIsPreviewOpen(false)}>
                {copy.closePreview}
              </button>
            </div>
            <SlideSurface
              elements={activeEditorSlide?.elements ?? []}
              onCanvasClick={() => {}}
              onDelete={() => {}}
              onDragStart={() => {}}
              onSelect={() => {}}
              onTextChange={() => {}}
              selectedElementId=""
              readOnly
            />
          </div>
        </div>
      )}
    </section>
  );
}
