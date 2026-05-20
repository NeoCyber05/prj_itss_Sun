import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import {
  getDeckForEditor,
  saveDeckForEditor,
  updateTemplateShareAccess,
  updateTemplateShareSettings,
} from '../services/slideCreationService.js';
import { generateAiTextWithGemini } from '../services/geminiSlideService.js';
import ReactMarkdown from 'react-markdown';
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
    aiGenerating: 'Generating...',
    aiGenerated: 'AI draft generated',
    aiGenerateError: 'Could not generate AI draft: {{message}}',
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
    shareSettingsLocalOnly: '共有設定を画面上で更新しました。保存するには Supabase に share_settings 列を追加してください。',
    closeShare: '閉じる',
    uploadImageLabel: 'Upload image',
    copySelection: 'Copy',
    copiedSelection: 'Copied selected object',
    invalidImageFile: 'Please choose an image file.',
    tableDialogTitle: 'Add table',
    rowLabel: 'Rows',
    columnLabel: 'Columns',
    insertTable: 'Insert table',
    tableSizeError: 'Rows and columns must be from 1 to 20.',
    chartDialogTitle: 'Add chart',
    chartTitleLabel: 'Title',
    chartLabelsLabel: 'Labels',
    chartValuesLabel: 'Values',
    chartLabelsPlaceholder: 'Q1, Q2, Q3, Q4',
    chartValuesPlaceholder: '120, 180, 150, 240',
    insertChart: 'Insert chart',
    chartValuesError: 'Enter numeric values separated by commas.',
    linkLabel: 'Link',
    linkDialogTitle: 'Add link',
    linkUrlLabel: 'URL',
    linkUrlPlaceholder: 'https://example.com',
    applyLink: 'Apply',
    removeLink: 'Remove',
    invalidLink: 'Enter a valid URL.',
    underlineColorLabel: 'Underline color',
    previewPrevious: 'Previous',
    previewNext: 'Next',
    quizDialogTitle: 'Quiz',
    quizQuestionLabel: 'Question',
    quizAnswerLabel: 'Answer',
    closeQuiz: 'Close',
    quizBuilderTitle: 'Create Quiz',
    quizTypeLabel: 'Question type',
    quizTypeChoice: 'Multiple choice',
    quizTypeWritten: 'Written answer',
    quizQuestionPlaceholder: 'Enter question text',
    quizHintLabel: 'Hint',
    quizHintPlaceholder: 'Optional hint',
    quizOptionPlaceholder: 'Option {{letter}}',
    quizCorrectLabel: 'Correct',
    quizAddOption: 'Add option',
    quizOptionLimit: 'Up to 4 options.',
    quizSaveQuestion: 'Save question',
    quizUpdateQuestion: 'Update question',
    quizOverviewTitle: 'Quiz summary',
    quizQuestionCount: 'Questions: {{count}}',
    quizQuestionListTitle: 'Question list',
    quizColumnNumber: 'No.',
    quizColumnQuestion: 'Question',
    quizColumnType: 'Type',
    quizColumnAction: 'Action',
    quizEditQuestion: 'Edit',
    quizDeleteQuestion: 'Delete',
    quizFinish: 'Finish quiz',
    quizBack: 'Back',
    quizNoQuestions: 'No questions yet.',
    quizValidationQuestion: 'Enter the question.',
    quizValidationChoice: 'Enter at least two options.',
    quizValidationAnswer: 'Enter the answer.',
    quizInserted: 'Inserted {{count}} quiz slides',
    quizFinishing: 'Saving quiz...',
    quizSlideTitle: 'Quiz',
    quizTargetSlidePreview: 'Target slide preview',
    quizCheckAnswer: 'Check answer',
    quizCorrectFeedback: 'Correct',
    quizWrongFeedback: 'Not correct',
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
    aiGenerating: 'Đang tạo...',
    aiGenerated: 'Đã tạo bản nháp bằng AI',
    aiGenerateError: 'Không thể tạo bản nháp AI: {{message}}',
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
    shareSettingsLocalOnly: 'Đã cập nhật cài đặt trên giao diện. Thêm cột share_settings vào Supabase để lưu lâu dài.',
    closeShare: 'Đóng',
    uploadImageLabel: 'Tải ảnh lên',
    copySelection: 'Sao chép',
    copiedSelection: 'Đã sao chép đối tượng đang chọn',
    invalidImageFile: 'Vui lòng chọn tệp ảnh.',
    tableDialogTitle: 'Thêm bảng',
    rowLabel: 'Số hàng',
    columnLabel: 'Số cột',
    insertTable: 'Chèn bảng',
    tableSizeError: 'Số hàng và cột phải từ 1 đến 20.',
    chartDialogTitle: 'Thêm biểu đồ',
    chartTitleLabel: 'Tiêu đề',
    chartLabelsLabel: 'Nhãn',
    chartValuesLabel: 'Giá trị',
    chartLabelsPlaceholder: 'Q1, Q2, Q3, Q4',
    chartValuesPlaceholder: '120, 180, 150, 240',
    insertChart: 'Chèn biểu đồ',
    chartValuesError: 'Nhập các số, phân tách bằng dấu phẩy.',
    linkLabel: 'Liên kết',
    linkDialogTitle: 'Thêm liên kết',
    linkUrlLabel: 'URL',
    linkUrlPlaceholder: 'https://example.com',
    applyLink: 'Áp dụng',
    removeLink: 'Xóa',
    invalidLink: 'Nhập URL hợp lệ.',
    underlineColorLabel: 'Màu gạch chân',
    previewPrevious: 'Trước',
    previewNext: 'Tiếp',
    quizDialogTitle: 'Quiz',
    quizQuestionLabel: 'Câu hỏi',
    quizAnswerLabel: 'Đáp án',
    closeQuiz: 'Đóng',
    quizBuilderTitle: 'Tạo quiz',
    quizTypeLabel: 'Loại câu hỏi',
    quizTypeChoice: 'Lựa chọn',
    quizTypeWritten: 'Trả lời ngắn',
    quizQuestionPlaceholder: 'Nhập câu hỏi',
    quizHintLabel: 'Gợi ý',
    quizHintPlaceholder: 'Gợi ý tùy chọn',
    quizOptionPlaceholder: 'Lựa chọn {{letter}}',
    quizCorrectLabel: 'Đúng',
    quizAddOption: 'Thêm lựa chọn',
    quizOptionLimit: 'Tối đa 4 lựa chọn.',
    quizSaveQuestion: 'Lưu câu hỏi',
    quizUpdateQuestion: 'Cập nhật câu hỏi',
    quizOverviewTitle: 'Tổng quan quiz',
    quizQuestionCount: 'Số câu hỏi: {{count}}',
    quizQuestionListTitle: 'Danh sách câu hỏi',
    quizColumnNumber: 'Số',
    quizColumnQuestion: 'Câu hỏi',
    quizColumnType: 'Loại',
    quizColumnAction: 'Hành động',
    quizEditQuestion: 'Sửa',
    quizDeleteQuestion: 'Xóa',
    quizFinish: 'Hoàn tất quiz',
    quizBack: 'Quay lại',
    quizNoQuestions: 'Chưa có câu hỏi.',
    quizValidationQuestion: 'Nhập nội dung câu hỏi.',
    quizValidationChoice: 'Nhập ít nhất hai lựa chọn.',
    quizValidationAnswer: 'Nhập đáp án.',
    quizInserted: 'Đã chèn {{count}} slide quiz',
    quizFinishing: 'Đang lưu quiz...',
    quizSlideTitle: 'Quiz',
    quizTargetSlidePreview: 'Ảnh xem trước slide',
    quizCheckAnswer: 'Kiểm tra',
    quizCorrectFeedback: 'Chính xác',
    quizWrongFeedback: 'Chưa chính xác',
  },
};

const TOOL_ITEMS = [
  { id: 'text', icon: 'type', copyKey: 'toolText' },
  { id: 'image', icon: 'image', copyKey: 'toolImage' },
  { id: 'copy', icon: 'copy', copyKey: 'copySelection' },
  { id: 'shape', icon: 'shape', copyKey: 'toolShape' },
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
  { id: 'table', copyKey: 'tableLayout' },
  { id: 'two-column', copyKey: 'twoColumnLayout' },
  { id: 'title-image', labels: { ja: 'Title + image', vi: 'Tiêu đề + ảnh' } },
  { id: 'image-left', labels: { ja: 'Image + text', vi: 'Ảnh + nội dung' } },
  { id: 'comparison', labels: { ja: 'Comparison', vi: 'So sánh' } },
  { id: 'bar-chart', labels: { ja: 'Bar chart', vi: 'Biểu đồ cột' } },
  { id: 'quote', labels: { ja: 'Quote', vi: 'Trích dẫn' } },
  { id: 'timeline', labels: { ja: 'Timeline', vi: 'Timeline' } },
  { id: 'cards', labels: { ja: '3 cards', vi: '3 thẻ' } },
  { id: 'blank', copyKey: 'blankLayout' },
];

const TEXT_FONT_FAMILIES = [
  { label: 'Sans', value: 'Inter, Arial, sans-serif' },
  { label: 'Serif', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Mono', value: '"Courier New", monospace' },
  { label: 'Display', value: 'Impact, Haettenschweiler, sans-serif' },
];

const DEFAULT_TEXT_FONT_FAMILY = TEXT_FONT_FAMILIES[0].value;
const DEFAULT_SHARE_SETTINGS = {
  accessMode: 'private',
  allowDownload: false,
  allowCopy: true,
  allowEdit: false,
  allowReshare: false,
  invitedEmails: [],
};
const MIN_TABLE_SIZE = 1;
const MAX_TABLE_SIZE = 20;
const DEFAULT_TABLE_ROWS = 3;
const DEFAULT_TABLE_COLUMNS = 4;
const DEFAULT_CHART_VALUES = [120, 180, 150, 240];
const DEFAULT_QUIZ_OPTION_COUNT = 4;
const MAX_QUIZ_OPTIONS = 4;
const QUIZ_TYPE_OPTIONS = [
  { id: 'choice', copyKey: 'quizTypeChoice' },
  { id: 'written', copyKey: 'quizTypeWritten' },
];
const AI_TEXT_LABEL = '\u00dd ch\u00ednh';
const AI_NOTES_LABEL = 'Ghi ch\u00fa';
const AI_DRAFT_LABEL = 'AI draft';
const AI_SLIDE_PALETTES = [
  {
    accent: '#2563eb',
    accentSoft: '#dbeafe',
    panel: '#f8fbff',
    note: '#ecfeff',
    noteBorder: '#67e8f9',
    title: '#0f172a',
    body: '#1e293b',
  },
  {
    accent: '#0f766e',
    accentSoft: '#ccfbf1',
    panel: '#f7fffb',
    note: '#f0fdfa',
    noteBorder: '#5eead4',
    title: '#134e4a',
    body: '#1f2937',
  },
  {
    accent: '#b45309',
    accentSoft: '#fef3c7',
    panel: '#fffaf0',
    note: '#fff7ed',
    noteBorder: '#fdba74',
    title: '#451a03',
    body: '#334155',
  },
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

function createTableCells(rows = DEFAULT_TABLE_ROWS, columns = DEFAULT_TABLE_COLUMNS) {
  return Array.from({ length: rows * columns }, (_, index) => (
    index < columns ? `H${index + 1}` : ''
  ));
}

function normalizeTableConfig(raw = {}) {
  const rows = clamp(Number(raw.rows ?? DEFAULT_TABLE_ROWS), MIN_TABLE_SIZE, MAX_TABLE_SIZE);
  const columns = clamp(Number(raw.columns ?? raw.cols ?? DEFAULT_TABLE_COLUMNS), MIN_TABLE_SIZE, MAX_TABLE_SIZE);
  const cellCount = rows * columns;
  const sourceCells = Array.isArray(raw.cells) ? raw.cells : [];
  const defaultCells = createTableCells(rows, columns);

  return {
    rows,
    columns,
    cells: Array.from({ length: cellCount }, (_, index) => (
      String(sourceCells[index] ?? defaultCells[index] ?? '')
    )),
  };
}

function parseNumberList(value) {
  return String(value ?? '')
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item));
}

function parseLabelList(value, count) {
  const labels = String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return Array.from({ length: count }, (_, index) => labels[index] || `C${index + 1}`);
}

function normalizeChartConfig(raw = {}, copy) {
  const values = Array.isArray(raw.values)
    ? raw.values.map(Number).filter((item) => Number.isFinite(item))
    : DEFAULT_CHART_VALUES;
  const safeValues = values.length ? values : DEFAULT_CHART_VALUES;
  const labels = Array.isArray(raw.labels) && raw.labels.length
    ? raw.labels.map((label) => String(label))
    : parseLabelList('', safeValues.length);

  return {
    title: raw.title || copy?.chartLabel || 'Chart',
    labels: parseLabelList(labels.join(','), safeValues.length),
    values: safeValues,
  };
}

function getQuizOptionLetter(index) {
  return String.fromCharCode(65 + index);
}

function createDefaultQuizOptions(copy) {
  return Array.from({ length: DEFAULT_QUIZ_OPTION_COUNT }, (_, index) => (
    formatCopy(copy.quizOptionPlaceholder, { letter: getQuizOptionLetter(index) })
  ));
}

function createEmptyQuizForm(copy) {
  return {
    type: 'choice',
    question: '',
    hint: '',
    options: createDefaultQuizOptions(copy),
    correctOptionIndex: 0,
    answer: '',
  };
}

function normalizeQuizConfig(raw = {}, copy) {
  const type = raw.type === 'written' ? 'written' : 'choice';
  const defaultOptions = createDefaultQuizOptions(copy);
  const rawOptions = Array.isArray(raw.options) ? raw.options : [];
  const options = rawOptions.length
    ? rawOptions.slice(0, MAX_QUIZ_OPTIONS).map((option) => String(option ?? ''))
    : defaultOptions;
  const safeCorrectIndex = Math.trunc(clamp(
    Number(raw.correctOptionIndex ?? raw.correctIndex ?? 0),
    0,
    Math.max(options.length - 1, 0),
  ));
  const answer = String(
    raw.answer
      ?? raw.correctAnswer
      ?? (type === 'choice' ? options[safeCorrectIndex] : '')
      ?? '',
  );

  return {
    id: raw.id ?? makeId('quiz'),
    type,
    question: String(raw.question ?? raw.prompt ?? copy.quizQuestionPlaceholder ?? ''),
    hint: String(raw.hint ?? ''),
    options,
    correctOptionIndex: safeCorrectIndex,
    answer,
  };
}

function normalizeLinkUrl(value) {
  const url = String(value ?? '').trim();

  if (!url) return '';

  try {
    const candidate = /^[a-z][a-z\d+.-]*:/i.test(url) ? url : `https://${url}`;
    const parsedUrl = new URL(candidate);

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) return '';

    return parsedUrl.href;
  } catch {
    return '';
  }
}

function cloneEditorElement(element) {
  return {
    ...element,
    id: makeId(element.type || 'element'),
    x: clamp((element.x ?? 10) + 4, 0, 100 - (element.width ?? 20)),
    y: clamp((element.y ?? 10) + 4, 0, 100 - (element.height ?? 10)),
    style: {
      ...(element.style ?? {}),
    },
    chart: element.chart
      ? {
          ...element.chart,
          labels: [...(element.chart.labels ?? [])],
          values: [...(element.chart.values ?? [])],
        }
      : undefined,
    table: element.table
      ? {
          ...element.table,
          cells: [...(element.table.cells ?? [])],
        }
      : undefined,
    quiz: element.quiz
      ? {
          ...element.quiz,
          options: [...(element.quiz.options ?? [])],
        }
      : undefined,
  };
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
    chart: type === 'chart' ? normalizeChartConfig(raw?.chart, copy) : raw?.chart,
    table: type === 'table' ? normalizeTableConfig(raw?.table) : raw?.table,
    quiz: type === 'quiz' ? normalizeQuizConfig(raw?.quiz, copy) : raw?.quiz,
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
      fontFamily: DEFAULT_TEXT_FONT_FAMILY,
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
      table: normalizeTableConfig(overrides.table),
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
      chart: normalizeChartConfig(overrides.chart, copy),
    };
  }

  if (type === 'quiz') {
    return {
      ...base,
      x: 8,
      y: 8,
      width: 84,
      height: 80,
      text: copy.quizSlideTitle,
      ...overrides,
      quiz: normalizeQuizConfig(overrides.quiz, copy),
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

  if (layoutId === 'bar-chart') {
    return [
      ...title,
      createElement('chart', copy, 2, {
        x: 10,
        y: 34,
        width: 54,
        height: 42,
        chart: normalizeChartConfig({
          labels: ['A', 'B', 'C', 'D'],
          title: copy.chartLabel,
          values: [120, 180, 90, 240],
        }, copy),
      }),
      createElement('text', copy, 3, {
        x: 68,
        y: 38,
        width: 22,
        height: 34,
        text: copy.sampleText,
        style: {
          align: 'left',
          bold: true,
          color: '#111827',
          fontFamily: DEFAULT_TEXT_FONT_FAMILY,
          fontSize: 16,
          italic: false,
          underline: false,
          verticalAlign: 'top',
        },
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

  if (layoutId === 'title-image') {
    return [
      ...title,
      createElement('image', copy, 2, {
        x: 14,
        y: 34,
        width: 72,
        height: 38,
      }),
    ];
  }

  if (layoutId === 'image-left') {
    return [
      ...title,
      createElement('image', copy, 2, {
        x: 10,
        y: 36,
        width: 36,
        height: 30,
      }),
      createElement('text', copy, 3, {
        x: 54,
        y: 38,
        width: 34,
        height: 26,
        text: copy.sampleText,
      }),
    ];
  }

  if (layoutId === 'comparison') {
    return [
      ...title,
      createElement('shape', copy, 2, {
        x: 10,
        y: 36,
        width: 36,
        height: 30,
        text: 'A',
        fill: '#eff6ff',
      }),
      createElement('shape', copy, 3, {
        x: 54,
        y: 36,
        width: 36,
        height: 30,
        text: 'B',
        fill: '#f8fafc',
      }),
    ];
  }

  if (layoutId === 'quote') {
    return [
      title[0],
      createElement('text', copy, 1, {
        x: 16,
        y: 34,
        width: 68,
        height: 26,
        text: `"${copy.sampleText}"`,
        style: {
          align: 'center',
          bold: true,
          color: '#0f172a',
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 28,
          italic: false,
          underline: false,
        },
      }),
      createElement('text', copy, 2, {
        x: 34,
        y: 64,
        width: 32,
        height: 8,
        text: '- RakuSlide',
        style: {
          align: 'center',
          bold: false,
          color: '#475569',
          fontFamily: DEFAULT_TEXT_FONT_FAMILY,
          fontSize: 14,
          italic: false,
          underline: false,
        },
      }),
    ];
  }

  if (layoutId === 'timeline') {
    return [
      ...title,
      createElement('shape', copy, 2, {
        x: 14,
        y: 48,
        width: 72,
        height: 2,
        text: '',
        fill: '#2563eb',
        stroke: '#2563eb',
      }),
      ...[0, 1, 2].map((stepIndex) => createElement('text', copy, stepIndex + 3, {
        x: 10 + stepIndex * 30,
        y: 56,
        width: 20,
        height: 16,
        text: `${stepIndex + 1}. ${copy.sampleText}`,
        style: {
          align: 'center',
          bold: true,
          color: '#111827',
          fontFamily: DEFAULT_TEXT_FONT_FAMILY,
          fontSize: 13,
          italic: false,
          underline: false,
        },
      })),
    ];
  }

  if (layoutId === 'cards') {
    return [
      ...title,
      ...[0, 1, 2].map((cardIndex) => createElement('text', copy, cardIndex + 2, {
        x: 10 + cardIndex * 28,
        y: 38,
        width: 24,
        height: 26,
        text: copy.sampleText,
        style: {
          align: 'center',
          bold: true,
          color: '#111827',
          fontFamily: DEFAULT_TEXT_FONT_FAMILY,
          fontSize: 16,
          italic: false,
          underline: false,
        },
      })),
    ];
  }

  return title;
}

function createAiShape(copy, index, overrides = {}) {
  return createElement('shape', copy, index, {
    text: '',
    stroke: 'transparent',
    ...overrides,
  });
}

function createAiText(copy, index, overrides = {}) {
  const style = overrides.style ?? {};

  return createElement('text', copy, index, {
    ...overrides,
    style: {
      align: 'left',
      bold: false,
      color: '#111827',
      fontFamily: DEFAULT_TEXT_FONT_FAMILY,
      fontSize: 18,
      italic: false,
      underline: false,
      verticalAlign: 'top',
      lineHeight: 1.18,
      ...style,
    },
  });
}

function buildAiDraftSlides(generatedDeck, copy) {
  const deckTitle = generatedDeck.deckTitle || copy.defaultTitle;
  const sourceSlides = generatedDeck.slides?.length
    ? generatedDeck.slides
    : [{ title: deckTitle, bullets: [copy.sampleText], speakerNotes: '' }];

  return sourceSlides.map((slide, index) => {
    const palette = AI_SLIDE_PALETTES[index % AI_SLIDE_PALETTES.length];
    const title = slide.title || `${deckTitle} ${index + 1}`;
    const bullets = (slide.bullets ?? [])
      .map((bullet) => String(bullet ?? '').trim())
      .filter(Boolean);
    const speakerNotes = String(slide.speakerNotes ?? '').trim();
    const hasNotes = Boolean(speakerNotes);
    const bulletText = bullets.length
      ? bullets.map((bullet) => `\u2022 ${bullet}`).join('\n')
      : copy.sampleText;
    const bodyWidth = hasNotes ? 52 : 74;
    const titleFontSize = title.length > 42 ? 25 : 30;
    const bodyFontSize = bullets.length > 4 ? 13 : 15;
    const noteFontSize = speakerNotes.length > 220 ? 11 : 12;

    return {
      id: makeId('ai-slide'),
      position: index + 1,
      title,
      elements: [
        createAiShape(copy, 0, {
          x: 78,
          y: 8,
          width: 14,
          height: 9,
          fill: palette.accentSoft,
        }),
        createAiShape(copy, 1, {
          x: 4,
          y: 8,
          width: 2.4,
          height: 84,
          fill: palette.accent,
          stroke: palette.accent,
        }),
        createAiShape(copy, 2, {
          x: 8,
          y: 30,
          width: bodyWidth,
          height: 56,
          fill: palette.panel,
          stroke: palette.accentSoft,
        }),
        ...(hasNotes ? [
          createAiShape(copy, 3, {
            x: 63,
            y: 30,
            width: 29,
            height: 56,
            fill: palette.note,
            stroke: palette.noteBorder,
          }),
        ] : []),
        createAiText(copy, 4, {
          x: 8,
          y: 8,
          width: 74,
          height: 14,
          text: title,
          style: {
            bold: true,
            color: palette.title,
            fontSize: titleFontSize,
            lineHeight: 1.05,
          },
        }),
        createAiText(copy, 5, {
          x: 8,
          y: 23,
          width: 44,
          height: 5,
          text: `${AI_DRAFT_LABEL} / ${String(index + 1).padStart(2, '0')}`,
          style: {
            bold: true,
            color: palette.accent,
            fontSize: 10,
            lineHeight: 1,
          },
        }),
        createAiShape(copy, 6, {
          x: 8,
          y: 27,
          width: 18,
          height: 1.4,
          fill: palette.accent,
          stroke: palette.accent,
        }),
        createAiText(copy, 7, {
          x: 11,
          y: 34,
          width: bodyWidth - 6,
          height: 6,
          text: AI_TEXT_LABEL,
          style: {
            bold: true,
            color: palette.accent,
            fontSize: 12,
            lineHeight: 1,
          },
        }),
        createAiText(copy, 8, {
          x: 11,
          y: 42,
          width: bodyWidth - 6,
          height: 38,
          text: bulletText,
          style: {
            color: palette.body,
            fontSize: bodyFontSize,
            lineHeight: 1.28,
          },
        }),
        ...(hasNotes ? [
          createAiText(copy, 9, {
            x: 66,
            y: 34,
            width: 23,
            height: 6,
            text: AI_NOTES_LABEL,
            style: {
              bold: true,
              color: palette.accent,
              fontSize: 12,
              lineHeight: 1,
            },
          }),
          createAiText(copy, 10, {
            x: 66,
            y: 42,
            width: 23,
            height: 39,
            text: speakerNotes,
            style: {
              color: palette.body,
              fontSize: noteFontSize,
              lineHeight: 1.22,
            },
          }),
        ] : []),
      ],
    };
  });
}

function buildQuizSlides(questions, copy) {
  return questions.map((question, index) => {
    const quiz = normalizeQuizConfig(question, copy);
    const title = `${copy.quizSlideTitle} ${index + 1}`;

    return {
      id: makeId('quiz-slide'),
      position: index + 1,
      title,
      elements: [
        createElement('quiz', copy, 0, {
          x: 6,
          y: 7,
          width: 88,
          height: 82,
          text: title,
          quiz,
        }),
      ],
    };
  });
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
  const accessMode = template?.share_settings?.accessMode ?? template?.shareSettings?.accessMode;

  if (template?.visibility === 'unlisted') {
    return 'unlisted';
  }

  if (accessMode === 'unlisted' || accessMode === 'public' || accessMode === 'private') {
    return accessMode;
  }

  return template?.is_public || template?.visibility === 'public' ? 'public' : 'private';
}

function normalizeInviteEmail(value) {
  return String(value ?? '').trim().toLowerCase();
}

function normalizeInviteEmails(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return [...new Set(values
    .map(normalizeInviteEmail)
    .filter(Boolean))];
}

function getShareSettingsFromTemplate(template) {
  const nextShareAccess = getShareAccessFromTemplate(template);
  const templateShareSettings = template?.share_settings ?? template?.shareSettings ?? {};

  return {
    ...DEFAULT_SHARE_SETTINGS,
    ...templateShareSettings,
    accessMode: templateShareSettings.accessMode ?? nextShareAccess,
    invitedEmails: normalizeInviteEmails(
      templateShareSettings.invitedEmails ?? templateShareSettings.invited_emails,
    ),
  };
}

function getShareInviteesFromTemplate(template) {
  return getShareSettingsFromTemplate(template).invitedEmails;
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
          <rect x="3.5" y="4" width="17" height="16" rx="1.6" />
          <circle cx="8" cy="9" r="1.6" />
          <path d="M4 17l5.2-5.2 3.6 3.6 3.2-3.8 4 5.4" />
        </svg>
      );
    case 'copy':
      return (
        <svg {...common}>
          <rect x="4" y="5" width="12" height="12" rx="1.4" />
          <rect x="9" y="10" width="12" height="12" rx="1.4" />
        </svg>
      );
    case 'shape':
      return (
        <svg {...common}>
          <rect x="3.5" y="7" width="17" height="11" rx="1.4" />
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
          <rect x="3.5" y="3.5" width="17" height="17" rx="1.5" />
          <path d="M3.5 8h17M3.5 12h17M3.5 16h17" />
          <path d="M8 3.5v17M12 3.5v17M16 3.5v17" />
        </svg>
      );
    case 'chart':
      return (
        <svg {...common}>
          <path d="M4 20h16" />
          <rect x="5" y="11" width="2.8" height="9" rx="0.6" />
          <rect x="10" y="7" width="2.8" height="13" rx="0.6" />
          <rect x="15" y="4" width="2.8" height="16" rx="0.6" />
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
    case 'users':
      return (
        <svg {...common}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
          <circle cx="10" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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

function ChartGraphic({ chart }) {
  const config = normalizeChartConfig(chart);
  const values = config.values;
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values, 1);
  const range = Math.max(maxValue - minValue, 1);
  const yZero = 146 - (((0 - minValue) / range) * 112);
  const slotWidth = 306 / Math.max(values.length, 1);
  const barWidth = Math.min(48, slotWidth * 0.7);

  const points = values.map((value, index) => {
    const x = 28 + (index + 0.5) * slotWidth;
    const yValue = 146 - (((value - minValue) / range) * 112);
    const y = Math.min(yValue, yZero);
    const height = Math.max(Math.abs(yValue - yZero), 1);

    return {
      x,
      y,
      height,
      label: config.labels[index],
      value,
    };
  });

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
      {points.map((point) => (
        <rect
          key={`bar-${point.x}-${point.value}`}
          x={point.x - barWidth / 2}
          y={point.y}
          width={barWidth}
          height={point.height}
          className="slide-editor__chart-bar slide-editor__chart-bar--blue"
        />
      ))}
      {points.map((point) => (
        <text
          key={`value-${point.x}-${point.value}`}
          x={point.x}
          y={point.y - 6}
          textAnchor="middle"
          className="slide-editor__chart-value"
        >
          {point.value}
        </text>
      ))}
      {points.map((point, index) => (
        <text
          key={`label-${point.x}-${point.label}`}
          x={point.x}
          y="170"
          textAnchor="middle"
          className="slide-editor__chart-label"
        >
          {index < 8 ? point.label : ''}
        </text>
      ))}
    </svg>
  );
}

function TableGraphic({
  isEditable = false,
  onCellChange = () => {},
  table,
}) {
  const config = normalizeTableConfig(table);

  return (
    <div
      className="slide-editor__table-graphic"
      style={{ gridTemplateColumns: `repeat(${config.columns}, 1fr)` }}
      aria-hidden={isEditable ? undefined : 'true'}
    >
      {config.cells.map((cell, index) => (
        <span
          key={index}
          contentEditable={isEditable}
          data-editable-table-cell={isEditable ? 'true' : undefined}
          suppressContentEditableWarning
          style={{
            background: index < config.columns ? '#dbeafe' : '#eff6ff',
            borderRight: (index + 1) % config.columns === 0 ? 'none' : '1px solid #bfdbfe',
            borderBottom: index >= config.cells.length - config.columns ? 'none' : '1px solid #bfdbfe',
          }}
          onInput={(event) => onCellChange(index, event.currentTarget.textContent ?? '')}
          onKeyDown={(event) => {
            event.stopPropagation();
          }}
          onPointerDown={(event) => {
            if (isEditable) {
              event.stopPropagation();
            }
          }}
        >
          {cell}
        </span>
      ))}
    </div>
  );
}

function normalizeAnswerValue(value) {
  return String(value ?? '').trim().toLowerCase();
}

function QuizGraphic({ copy, quiz, readOnly }) {
  const config = normalizeQuizConfig(quiz, copy);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);
  const [writtenAnswer, setWrittenAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const isChoice = config.type === 'choice';
  const correctOption = config.options[config.correctOptionIndex] ?? '';
  const isChoiceCorrect = selectedOptionIndex === config.correctOptionIndex;
  const isWrittenCorrect = normalizeAnswerValue(writtenAnswer) === normalizeAnswerValue(config.answer);
  const hasResult = isSubmitted && (isChoice ? selectedOptionIndex !== null : writtenAnswer.trim());
  const isCorrect = isChoice ? isChoiceCorrect : isWrittenCorrect;

  function handleOptionClick(optionIndex, event) {
    event.stopPropagation();
    if (!readOnly) return;

    setSelectedOptionIndex(optionIndex);
    setIsSubmitted(true);
  }

  function handleWrittenSubmit(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!readOnly) return;

    setIsSubmitted(true);
  }

  return (
    <div className="slide-editor__quiz-slide" data-preview-interactive="true">
      <div className="slide-editor__quiz-slide-kicker">{copy.quizSlideTitle}</div>
      <h2>{config.question}</h2>
      {config.hint && <p className="slide-editor__quiz-slide-hint">{config.hint}</p>}

      {isChoice ? (
        <div className="slide-editor__quiz-choice-grid">
          {config.options.map((option, index) => {
            const isSelected = selectedOptionIndex === index;
            const showCorrect = isSubmitted && index === config.correctOptionIndex;
            const showWrong = isSubmitted && isSelected && index !== config.correctOptionIndex;

            return (
              <button
                key={`${option}-${index}`}
                type="button"
                className={[
                  'slide-editor__quiz-choice',
                  isSelected ? 'slide-editor__quiz-choice--selected' : '',
                  showCorrect ? 'slide-editor__quiz-choice--correct' : '',
                  showWrong ? 'slide-editor__quiz-choice--wrong' : '',
                ].filter(Boolean).join(' ')}
                disabled={!readOnly}
                onClick={(event) => handleOptionClick(index, event)}
              >
                <span>{getQuizOptionLetter(index)}</span>
                <strong>{option}</strong>
              </button>
            );
          })}
        </div>
      ) : (
        <form className="slide-editor__quiz-written" onSubmit={handleWrittenSubmit}>
          <textarea
            value={writtenAnswer}
            disabled={!readOnly}
            placeholder={copy.quizAnswerLabel}
            onChange={(event) => setWrittenAnswer(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          />
          <button type="submit" disabled={!readOnly || !writtenAnswer.trim()}>
            {copy.quizCheckAnswer}
          </button>
        </form>
      )}

      {hasResult && (
        <div
          className={`slide-editor__quiz-result${isCorrect ? ' slide-editor__quiz-result--correct' : ' slide-editor__quiz-result--wrong'}`}
          role="status"
        >
          <strong>{isCorrect ? copy.quizCorrectFeedback : copy.quizWrongFeedback}</strong>
          {!isCorrect && (
            <span>
              {copy.quizAnswerLabel}: {isChoice ? correctOption : config.answer}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function SlideElement({
  copy,
  element,
  isSelected,
  onDelete,
  onDragStart,
  onResizeStart,
  onTableCellChange,
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
    fontFamily: element.style?.fontFamily ?? DEFAULT_TEXT_FONT_FAMILY,
    fontSize: `${element.style?.fontSize ?? 18}px`,
    fontStyle: element.style?.italic ? 'italic' : 'normal',
    fontWeight: element.style?.bold ? 800 : 500,
    alignItems: element.style?.verticalAlign === 'top' ? 'flex-start' : 'center',
    justifyContent:
      element.style?.align === 'center'
        ? 'center'
        : element.style?.align === 'right'
          ? 'flex-end'
          : 'flex-start',
    lineHeight: element.style?.lineHeight ?? 1.12,
    textAlign: element.style?.align ?? 'left',
    textDecoration: element.linkUrl || element.style?.underline ? 'underline' : 'none',
    textDecorationColor: element.style?.underlineColor ?? element.style?.color,
  };

  function handleKeyDown(event) {
    if (readOnly) return;

    const isEditingText = event.target instanceof HTMLElement
      && (
        event.target.closest('[data-editable-text="true"]')
        || event.target.closest('[data-editable-shape="true"]')
        || event.target.closest('[data-editable-table-cell="true"]')
      );

    if (isEditingText) return;

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
      {element.type === 'text' && element.linkUrl && readOnly && (
        <a
          className="slide-editor__element-text slide-editor__element-text--link"
          href={element.linkUrl}
          rel="noreferrer"
          target="_blank"
          style={textStyle}
        >
          {element.text}
        </a>
      )}

      {element.type === 'text' && !(element.linkUrl && readOnly) && (
        <div
          ref={textRef}
          className="slide-editor__element-text"
          contentEditable={!readOnly && isSelected}
          data-editable-text={!readOnly && isSelected ? 'true' : undefined}
          suppressContentEditableWarning
          style={textStyle}
          onInput={(event) => onTextChange(element.id, event.currentTarget.textContent ?? '')}
          onKeyDown={(event) => {
            event.stopPropagation();
          }}
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
          contentEditable={!readOnly && isSelected}
          data-editable-shape={!readOnly && isSelected ? 'true' : undefined}
          suppressContentEditableWarning
          style={{
            background: element.fill,
            borderColor: element.stroke,
          }}
          onInput={(event) => onTextChange(element.id, event.currentTarget.textContent ?? '')}
          onKeyDown={(event) => {
            event.stopPropagation();
          }}
          onPointerDown={(event) => {
            if (!readOnly && isSelected) {
              event.stopPropagation();
            }
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
          <ChartGraphic chart={element.chart} />
        </div>
      )}

      {element.type === 'table' && (
        <div className="slide-editor__table">
          <strong>{element.text}</strong>
          <TableGraphic
            isEditable={!readOnly && isSelected}
            table={element.table}
            onCellChange={(cellIndex, cellValue) => onTableCellChange(element.id, cellIndex, cellValue)}
          />
        </div>
      )}

      {element.type === 'quiz' && (
        <QuizGraphic key={element.quiz?.id ?? element.id} copy={copy} quiz={element.quiz} readOnly={readOnly} />
      )}

      {isSelected && !readOnly && (
        <>
          <button
            type="button"
            className="slide-editor__element-delete"
            title={copy.deleteSelection}
            aria-label={copy.deleteSelection}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onDelete();
            }}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            <Icon name="trash" size={13} />
          </button>
          {['nw', 'ne', 'sw', 'se'].map((corner) => (
            <span
              key={corner}
              className={`slide-editor__resize-handle slide-editor__resize-handle--${corner}`}
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onResizeStart(event, element, corner);
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}

function SlideSurface({
  copy,
  elements,
  onCanvasClick,
  onDelete,
  onDragStart,
  onResizeStart,
  surfaceRef,
  onTableCellChange,
  onSelect,
  onTextChange,
  selectedElementId,
  readOnly = false,
}) {
  return (
    <div
      ref={surfaceRef}
      className={`slide-editor__canvas${readOnly ? ' slide-editor__canvas--preview' : ''}`}
      tabIndex={readOnly ? undefined : 0}
      onClick={onCanvasClick}
    >
      {elements.map((element) => (
        <SlideElement
          key={element.id}
          copy={copy}
          element={element}
          isSelected={element.id === selectedElementId}
          onDelete={onDelete}
          onDragStart={onDragStart}
          onResizeStart={onResizeStart}
          onTableCellChange={onTableCellChange}
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
            fontFamily: element.style?.fontFamily ?? DEFAULT_TEXT_FONT_FAMILY,
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
      <div
        className="slide-editor__mini-element slide-editor__mini-element--chart"
        style={elementStyle}
      >
        <strong>{element.text}</strong>
        <ChartGraphic chart={element.chart} />
      </div>
    );
  }

  if (element.type === 'table') {
    return (
      <div
        className="slide-editor__mini-element slide-editor__mini-element--table"
        style={elementStyle}
      >
        <strong>{element.text}</strong>
        <TableGraphic table={element.table} />
      </div>
    );
  }

  if (element.type === 'quiz') {
    const quiz = element.quiz ?? {};

    return (
      <div
        className="slide-editor__mini-element slide-editor__mini-element--quiz"
        style={elementStyle}
      >
        <strong>{quiz.question || element.text}</strong>
        <span />
        <span />
      </div>
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
  currentUserEmail,
  currentUserId,
  onBackHome,
}) {
  const { language, t } = useLanguage();
  const copy = useMemo(() => getEditorCopy(language), [language]);
  const canvasRef = useRef(null);
  const canvasSurfaceRef = useRef(null);
  const imageFileInputRef = useRef(null);
  const textColorInputRef = useRef(null);
  const underlineColorInputRef = useRef(null);
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
  const [aiGeneratedText, setAiGeneratedText] = useState('');
  const [aiError, setAiError] = useState('');
  const [isGeneratingAiDraft, setIsGeneratingAiDraft] = useState(false);
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
  const [previewSlideId, setPreviewSlideId] = useState('');
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareAccess, setShareAccess] = useState(() => getShareAccessFromTemplate(initialDeck?.template));
  const [isShareSettingsOpen, setIsShareSettingsOpen] = useState(false);
  const [shareSettings, setShareSettings] = useState(() => getShareSettingsFromTemplate(initialDeck?.template));
  const [isUpdatingShareSettings, setIsUpdatingShareSettings] = useState(false);
  const [isUpdatingShareAccess, setIsUpdatingShareAccess] = useState(false);
  const [shareInviteEmail, setShareInviteEmail] = useState('');
  const [shareInvitees, setShareInvitees] = useState(() => getShareInviteesFromTemplate(initialDeck?.template));
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
  const [tableDialogData, setTableDialogData] = useState({
    columns: String(DEFAULT_TABLE_COLUMNS),
    rows: String(DEFAULT_TABLE_ROWS),
  });
  const [tableDialogError, setTableDialogError] = useState('');
  const [isChartDialogOpen, setIsChartDialogOpen] = useState(false);
  const [chartDialogData, setChartDialogData] = useState({
    labels: copy.chartLabelsPlaceholder,
    title: copy.chartLabel,
    values: copy.chartValuesPlaceholder,
  });
  const [chartDialogError, setChartDialogError] = useState('');
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkUrlDraft, setLinkUrlDraft] = useState('');
  const [linkDialogError, setLinkDialogError] = useState('');
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [isQuizBuilderOpen, setIsQuizBuilderOpen] = useState(false);
  const [quizForm, setQuizForm] = useState(() => createEmptyQuizForm(copy));
  const [quizEditingIndex, setQuizEditingIndex] = useState(null);
  const [quizBuilderError, setQuizBuilderError] = useState('');
  const [isFinishingQuiz, setIsFinishingQuiz] = useState(false);
  const [dragState, setDragState] = useState(null);
  const [draggedSlideIndex, setDraggedSlideIndex] = useState(null);
  const canLoadDeck = Boolean(!initialDeck && templateId && currentUserId);
  const missingLoadInput = Boolean(!initialDeck && (!templateId || !currentUserId));
  const isLoading = canLoadDeck && !deck && !error;
  const activeEditorSlide = editorSlides.find((slide) => slide.id === activeSlideId)
    ?? editorSlides[0]
    ?? null;
  const previewSlide = editorSlides.find((slide) => slide.id === previewSlideId)
    ?? activeEditorSlide
    ?? editorSlides[0]
    ?? null;
  const previewSlideIndex = Math.max(
    editorSlides.findIndex((slide) => slide.id === previewSlide?.id),
    0,
  );
  const selectedElement = activeEditorSlide?.elements.find(
    (element) => element.id === selectedElementId,
  ) ?? null;
  const isSelectedText = selectedElement?.type === 'text';
  const visibleImageResults = useMemo(
    () => (imageResults.length ? imageResults : buildPlaceholderImageResults('', copy)),
    [copy, imageResults],
  );

  const focusCanvasSurface = useCallback(() => {
    window.requestAnimationFrame(() => {
      canvasSurfaceRef.current?.focus({ preventScroll: true });
    });
  }, []);

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

  const updateTableCell = useCallback((elementId, cellIndex, cellValue) => {
    setEditorSlides((currentSlides) => currentSlides.map((slide) => {
      if (slide.id !== activeSlideId) return slide;

      return {
        ...slide,
        elements: slide.elements.map((element) => {
          if (element.id !== elementId || element.type !== 'table') return element;

          const table = normalizeTableConfig(element.table);
          const cells = [...table.cells];
          cells[cellIndex] = cellValue;

          return {
            ...element,
            table: {
              ...table,
              cells,
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

    getDeckForEditor(templateId, currentUserId, currentUserEmail)
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
          setShareSettings(getShareSettingsFromTemplate(loadedDeck.template));
          setShareInvitees(getShareInviteesFromTemplate(loadedDeck.template));
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
  }, [canLoadDeck, copy, currentUserEmail, currentUserId, t, templateId]);

  useEffect(() => {
    if (!toast) return undefined;

    const timer = window.setTimeout(() => setToast(''), 2200);

    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!isPreviewOpen) return undefined;

    function moveByDirection(direction) {
      setPreviewSlideId((currentId) => {
        const currentIndex = editorSlides.findIndex((slide) => slide.id === currentId);
        const safeIndex = currentIndex < 0 ? previewSlideIndex : currentIndex;
        const nextIndex = clamp(safeIndex + direction, 0, editorSlides.length - 1);

        return editorSlides[nextIndex]?.id ?? currentId;
      });
    }

    function handlePreviewKeyDown(event) {
      const target = event.target;
      const isInteractiveTarget = target instanceof HTMLElement
        && target.closest('button, input, textarea, select, a, [data-preview-interactive="true"]');

      if (isInteractiveTarget) return;

      if (event.key === 'ArrowRight' || event.key === ' ') {
        event.preventDefault();
        moveByDirection(1);
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        moveByDirection(-1);
      }

      if (event.key === 'Escape') {
        setIsPreviewOpen(false);
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }
    }

    function handleFullscreenChange() {
      if (!document.fullscreenElement) {
        setIsPreviewOpen(false);
      }
    }

    window.addEventListener('keydown', handlePreviewKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('keydown', handlePreviewKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [editorSlides, isPreviewOpen, previewSlideIndex]);

  useEffect(() => {
    if (!selectedElement || isPreviewOpen || isShareDialogOpen) {
      return undefined;
    }

    function handleSelectedElementKeyDown(event) {
      if (event.key !== 'Delete' && event.key !== 'Backspace') {
        return;
      }

      const target = event.target;
      const isEditableTarget = target instanceof HTMLElement
        && target.closest(
          'input, textarea, select, button, [contenteditable="true"], [data-editable-text="true"], [data-editable-shape="true"], [data-editable-table-cell="true"]',
        );

      if (isEditableTarget) {
        return;
      }

      event.preventDefault();
      deleteSelectedElement();
    }

    window.addEventListener('keydown', handleSelectedElementKeyDown);

    return () => {
      window.removeEventListener('keydown', handleSelectedElementKeyDown);
    };
  }, [deleteSelectedElement, isPreviewOpen, isShareDialogOpen, selectedElement]);

  useEffect(() => {
    if (!dragState) return undefined;

    function handlePointerMove(event) {
      const rect = canvasRef.current?.getBoundingClientRect();

      if (!rect) return;

      const dx = ((event.clientX - dragState.startClientX) / rect.width) * 100;
      const dy = ((event.clientY - dragState.startClientY) / rect.height) * 100;

      if (dragState.mode === 'resize') {
        const minWidth = 4;
        const minHeight = 4;
        const maxRight = dragState.startX + dragState.startWidth;
        const maxBottom = dragState.startY + dragState.startHeight;
        let nextX = dragState.startX;
        let nextY = dragState.startY;
        let nextWidth = dragState.startWidth;
        let nextHeight = dragState.startHeight;

        if (dragState.corner.includes('e')) {
          nextWidth = clamp(dragState.startWidth + dx, minWidth, 100 - dragState.startX);
        }

        if (dragState.corner.includes('s')) {
          nextHeight = clamp(dragState.startHeight + dy, minHeight, 100 - dragState.startY);
        }

        if (dragState.corner.includes('w')) {
          nextX = clamp(dragState.startX + dx, 0, maxRight - minWidth);
          nextWidth = clamp(maxRight - nextX, minWidth, 100 - nextX);
        }

        if (dragState.corner.includes('n')) {
          nextY = clamp(dragState.startY + dy, 0, maxBottom - minHeight);
          nextHeight = clamp(maxBottom - nextY, minHeight, 100 - nextY);
        }

        updateElement(dragState.elementId, {
          height: Number(nextHeight.toFixed(2)),
          width: Number(nextWidth.toFixed(2)),
          x: Number(nextX.toFixed(2)),
          y: Number(nextY.toFixed(2)),
        });
        return;
      }

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
    focusCanvasSurface();
  }

  function insertImageIntoSelectionOrAdd(imagePatch) {
    if (selectedElement?.type === 'image') {
      updateElement(selectedElement.id, {
        ...imagePatch,
        fill: imagePatch.fill ?? selectedElement.fill ?? '#ffffff',
      });
      setSelectedTool('image');
      setSelectedElementId(selectedElement.id);
      focusCanvasSurface();
      return;
    }

    addElement('image', imagePatch);
  }

  function copySelectedElement() {
    if (!selectedElement || !activeEditorSlide) {
      setToast(copy.noSelection);
      return;
    }

    const duplicatedElement = cloneEditorElement(selectedElement);

    setSelectedTool('copy');
    setSelectedElementId(duplicatedElement.id);
    setEditorSlides((currentSlides) => currentSlides.map((slide) => {
      if (slide.id !== activeEditorSlide.id) return slide;

      return {
        ...slide,
        elements: [...slide.elements, duplicatedElement],
      };
    }));
    setToast(copy.copiedSelection);
  }

  function handleToolbarItemClick(itemId) {
    if (itemId === 'copy') {
      copySelectedElement();
      return;
    }

    if (itemId === 'image') {
      imageFileInputRef.current?.click();
      setSelectedTool('image');
      return;
    }

    if (itemId === 'table') {
      setTableDialogData({
        columns: String(DEFAULT_TABLE_COLUMNS),
        rows: String(DEFAULT_TABLE_ROWS),
      });
      setTableDialogError('');
      setIsTableDialogOpen(true);
      setSelectedTool('table');
      return;
    }

    if (itemId === 'chart') {
      setChartDialogData({
        labels: copy.chartLabelsPlaceholder,
        title: copy.chartLabel,
        values: copy.chartValuesPlaceholder,
      });
      setChartDialogError('');
      setIsChartDialogOpen(true);
      setSelectedTool('chart');
      return;
    }

    addElement(itemId);
  }

  function handleImageFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToast(copy.invalidImageFile);
      event.target.value = '';
      return;
    }

    const reader = new FileReader();

    reader.addEventListener('load', () => {
      insertImageIntoSelectionOrAdd({
        alt: file.name,
        fill: '#ffffff',
        sourceUrl: null,
        src: String(reader.result ?? ''),
        text: file.name,
      });
    });
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  function handleTableDialogSubmit(event) {
    event.preventDefault();

    const rows = Number(tableDialogData.rows);
    const columns = Number(tableDialogData.columns);

    if (
      !Number.isInteger(rows)
      || !Number.isInteger(columns)
      || rows < MIN_TABLE_SIZE
      || rows > MAX_TABLE_SIZE
      || columns < MIN_TABLE_SIZE
      || columns > MAX_TABLE_SIZE
    ) {
      setTableDialogError(copy.tableSizeError);
      return;
    }

    addElement('table', {
      table: normalizeTableConfig({ columns, rows }),
    });
    setIsTableDialogOpen(false);
  }

  function handleChartDialogSubmit(event) {
    event.preventDefault();

    const values = parseNumberList(chartDialogData.values);

    if (!values.length) {
      setChartDialogError(copy.chartValuesError);
      return;
    }

    addElement('chart', {
      chart: normalizeChartConfig({
        labels: parseLabelList(chartDialogData.labels, values.length),
        title: chartDialogData.title.trim() || copy.chartLabel,
        values,
      }, copy),
      text: chartDialogData.title.trim() || copy.chartLabel,
    });
    setIsChartDialogOpen(false);
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
      mode: 'move',
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: element.x,
      startY: element.y,
      width: element.width,
    });
  }

  function handleResizeStart(event, element, corner) {
    setDragState({
      corner,
      elementId: element.id,
      mode: 'resize',
      startClientX: event.clientX,
      startClientY: event.clientY,
      startHeight: element.height,
      startWidth: element.width,
      startX: element.x,
      startY: element.y,
    });
  }

  function updateSelectedTextStyle(stylePatch) {
    if (!selectedElement) return;

    updateElement(selectedElement.id, { style: stylePatch });
  }

  function keepTextCaretOnToolbarMouseDown(event) {
    event.preventDefault();
  }

  function openLinkDialog() {
    if (!isSelectedText) {
      setToast(copy.noSelection);
      return;
    }

    setLinkUrlDraft(selectedElement?.linkUrl ?? '');
    setLinkDialogError('');
    setIsLinkDialogOpen(true);
  }

  function handleLinkSubmit(event) {
    event.preventDefault();

    const normalizedUrl = normalizeLinkUrl(linkUrlDraft);

    if (!normalizedUrl) {
      setLinkDialogError(copy.invalidLink);
      return;
    }

    updateElement(selectedElement.id, { linkUrl: normalizedUrl });
    setIsLinkDialogOpen(false);
  }

  function removeSelectedLink() {
    if (!selectedElement) return;

    updateElement(selectedElement.id, { linkUrl: '' });
    setLinkUrlDraft('');
    setIsLinkDialogOpen(false);
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

  function buildShareSettingsPayload(overrides = {}) {
    return {
      ...shareSettings,
      accessMode: shareAccess,
      invitedEmails: shareInvitees,
      ...overrides,
    };
  }

  async function handleShareSettingChange(settingKey) {
    const previousSettings = shareSettings;
    const nextSettings = buildShareSettingsPayload({
      [settingKey]: !shareSettings[settingKey],
    });
    const deckTemplateId = deck?.template?.id ?? templateId;

    setShareSettings(nextSettings);

    if (!deckTemplateId || !currentUserId) {
      setShareSettings(previousSettings);
      setToast(formatCopy(copy.shareAccessError, { message: t('editor.missingTemplate') }));
      return;
    }

    setIsUpdatingShareSettings(true);

    try {
      const updatedTemplate = await updateTemplateShareSettings({
        settings: nextSettings,
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
                share_settings: nextSettings,
              },
            }
          : currentDeck
      ));
      setToast(
        updatedTemplate.share_settings_persisted === false
          ? copy.shareSettingsLocalOnly
          : copy.shareSettingsUpdated,
      );
    } catch (settingsFailure) {
      setShareSettings(previousSettings);
      setToast(formatCopy(copy.shareAccessError, { message: settingsFailure.message }));
    } finally {
      setIsUpdatingShareSettings(false);
    }
  }

  async function handleShareAccessChange(event) {
    const nextAccess = event.target.value;
    const previousAccess = shareAccess;
    const previousSettings = shareSettings;
    const deckTemplateId = deck?.template?.id ?? templateId;
    const nextSettings = buildShareSettingsPayload({ accessMode: nextAccess });

    setShareAccess(nextAccess);
    setShareSettings(nextSettings);

    if (!deckTemplateId || !currentUserId) {
      setShareAccess(previousAccess);
      setShareSettings(previousSettings);
      setToast(formatCopy(copy.shareAccessError, { message: t('editor.missingTemplate') }));
      return;
    }

    setIsUpdatingShareAccess(true);

    try {
      const updatedTemplate = await updateTemplateShareAccess({
        accessMode: nextAccess,
        settings: nextSettings,
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
                share_settings: nextSettings,
              },
            }
          : currentDeck
      ));
      setToast(copy.shareAccessUpdated);
    } catch (shareFailure) {
      setShareAccess(previousAccess);
      setShareSettings(previousSettings);
      setToast(formatCopy(copy.shareAccessError, { message: shareFailure.message }));
    } finally {
      setIsUpdatingShareAccess(false);
    }
  }

  async function handleAddShareInvite(event) {
    event.preventDefault();

    const email = normalizeInviteEmail(shareInviteEmail);
    const deckTemplateId = deck?.template?.id ?? templateId;

    if (!email) {
      setToast(copy.shareInviteEmpty);
      return;
    }

    const nextInvitees = shareInvitees.includes(email)
      ? shareInvitees
      : [...shareInvitees, email];
    const previousInvitees = shareInvitees;
    const previousSettings = shareSettings;
    const nextSettings = buildShareSettingsPayload({ invitedEmails: nextInvitees });

    setShareInvitees(nextInvitees);
    setShareSettings(nextSettings);

    if (!deckTemplateId || !currentUserId) {
      setShareInvitees(previousInvitees);
      setShareSettings(previousSettings);
      setToast(formatCopy(copy.shareAccessError, { message: t('editor.missingTemplate') }));
      return;
    }

    setIsUpdatingShareSettings(true);

    try {
      const updatedTemplate = await updateTemplateShareSettings({
        settings: nextSettings,
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
                share_settings: nextSettings,
              },
            }
          : currentDeck
      ));
      setShareInviteEmail('');
      setToast(copy.shareInviteAdded);
    } catch (inviteFailure) {
      setShareInvitees(previousInvitees);
      setShareSettings(previousSettings);
      setToast(formatCopy(copy.shareAccessError, { message: inviteFailure.message }));
    } finally {
      setIsUpdatingShareSettings(false);
    }
  }

  function resetQuizForm() {
    setQuizForm(createEmptyQuizForm(copy));
    setQuizEditingIndex(null);
    setQuizBuilderError('');
  }

  function handleQuizClick() {
    resetQuizForm();
    setIsQuizBuilderOpen(true);
  }

  function updateQuizForm(patch) {
    setQuizForm((currentForm) => ({
      ...currentForm,
      ...patch,
    }));
  }

  function updateQuizOption(optionIndex, value) {
    setQuizForm((currentForm) => ({
      ...currentForm,
      options: currentForm.options.map((option, index) => (
        index === optionIndex ? value : option
      )),
    }));
  }

  function addQuizOption() {
    if (quizForm.options.length >= MAX_QUIZ_OPTIONS) {
      setQuizBuilderError(copy.quizOptionLimit);
      return;
    }

    setQuizForm((currentForm) => ({
      ...currentForm,
      options: [
        ...currentForm.options,
        formatCopy(copy.quizOptionPlaceholder, { letter: getQuizOptionLetter(currentForm.options.length) }),
      ],
    }));
  }

  function removeQuizOption(optionIndex) {
    setQuizForm((currentForm) => {
      if (currentForm.options.length <= 2) return currentForm;

      const options = currentForm.options.filter((_, index) => index !== optionIndex);
      const correctOptionIndex = currentForm.correctOptionIndex === optionIndex
        ? 0
        : currentForm.correctOptionIndex > optionIndex
          ? currentForm.correctOptionIndex - 1
          : currentForm.correctOptionIndex;

      return {
        ...currentForm,
        options,
        correctOptionIndex: clamp(correctOptionIndex, 0, options.length - 1),
      };
    });
  }

  function getQuizTypeLabel(type) {
    return type === 'written' ? copy.quizTypeWritten : copy.quizTypeChoice;
  }

  function handleQuizQuestionSubmit(event) {
    event.preventDefault();

    const question = quizForm.question.trim();
    const hint = quizForm.hint.trim();

    if (!question) {
      setQuizBuilderError(copy.quizValidationQuestion);
      return;
    }

    if (quizForm.type === 'choice') {
      const options = quizForm.options.map((option) => option.trim()).filter(Boolean);

      if (options.length < 2) {
        setQuizBuilderError(copy.quizValidationChoice);
        return;
      }

      const selectedOptionValue = quizForm.options[quizForm.correctOptionIndex]?.trim();
      const correctOptionIndex = selectedOptionValue
        ? options.findIndex((option) => option === selectedOptionValue)
        : 0;
      const nextQuestion = {
        id: quizQuestions[quizEditingIndex]?.id ?? makeId('quiz-question'),
        type: 'choice',
        question,
        hint,
        options,
        correctOptionIndex: correctOptionIndex >= 0 ? correctOptionIndex : 0,
        answer: options[correctOptionIndex >= 0 ? correctOptionIndex : 0],
      };

      setQuizQuestions((currentQuestions) => {
        if (quizEditingIndex === null) return [...currentQuestions, nextQuestion];

        return currentQuestions.map((item, index) => (
          index === quizEditingIndex ? nextQuestion : item
        ));
      });
      resetQuizForm();
      return;
    }

    const answer = quizForm.answer.trim();

    if (!answer) {
      setQuizBuilderError(copy.quizValidationAnswer);
      return;
    }

    const nextQuestion = {
      id: quizQuestions[quizEditingIndex]?.id ?? makeId('quiz-question'),
      type: 'written',
      question,
      hint,
      options: [],
      correctOptionIndex: 0,
      answer,
    };

    setQuizQuestions((currentQuestions) => {
      if (quizEditingIndex === null) return [...currentQuestions, nextQuestion];

      return currentQuestions.map((item, index) => (
        index === quizEditingIndex ? nextQuestion : item
      ));
    });
    resetQuizForm();
  }

  function handleEditQuizQuestion(questionIndex) {
    const question = quizQuestions[questionIndex];

    if (!question) return;

    setQuizForm({
      type: question.type,
      question: question.question,
      hint: question.hint ?? '',
      options: question.options?.length ? question.options.slice(0, MAX_QUIZ_OPTIONS) : createDefaultQuizOptions(copy),
      correctOptionIndex: question.correctOptionIndex ?? 0,
      answer: question.answer ?? '',
    });
    setQuizEditingIndex(questionIndex);
    setQuizBuilderError('');
  }

  function handleDeleteQuizQuestion(questionIndex) {
    setQuizQuestions((currentQuestions) => currentQuestions.filter((_, index) => index !== questionIndex));

    if (quizEditingIndex === questionIndex) {
      resetQuizForm();
    } else if (quizEditingIndex !== null && quizEditingIndex > questionIndex) {
      setQuizEditingIndex(quizEditingIndex - 1);
    }
  }

  async function handleFinishQuiz() {
    if (!quizQuestions.length) {
      setQuizBuilderError(copy.quizNoQuestions);
      return;
    }

    const quizSlides = buildQuizSlides(quizQuestions, copy);
    const activeIndex = editorSlides.findIndex((slide) => slide.id === activeSlideId);
    const insertIndex = activeIndex >= 0 ? activeIndex + 1 : editorSlides.length;
    const nextSlides = [
      ...editorSlides.slice(0, insertIndex),
      ...quizSlides,
      ...editorSlides.slice(insertIndex),
    ].map((slide, index) => ({
      ...slide,
      position: index + 1,
    }));
    const firstInsertedSlide = nextSlides[insertIndex] ?? nextSlides[0];
    const deckTemplateId = deck?.template?.id ?? templateId;
    const normalizedTitle = deckTitleDraft.trim()
      || getSlideDisplayTitle(activeEditorSlide, deck?.template?.title ?? copy.defaultTitle);

    setEditorSlides(nextSlides);
    setActiveSlideId(firstInsertedSlide?.id ?? activeSlideId);
    setSelectedElementId('');
    setIsQuizBuilderOpen(false);
    setQuizQuestions([]);
    resetQuizForm();
    setToast(formatCopy(copy.quizInserted, { count: quizSlides.length }));

    if (!deckTemplateId || !currentUserId) return;

    setIsFinishingQuiz(true);

    try {
      const savedDeck = await saveDeckForEditor({
        templateId: deckTemplateId,
        userId: currentUserId,
        title: normalizedTitle,
        slides: nextSlides,
      });
      const nextEditableSlides = buildEditableSlides(savedDeck.slides, savedDeck.template, copy);
      const nextActiveSlide = nextEditableSlides.find((slide) => slide.position === firstInsertedSlide?.position)
        ?? nextEditableSlides[0];

      setDeck(savedDeck);
      setDeckTitleDraft(savedDeck.template?.title ?? normalizedTitle);
      setEditorSlides(nextEditableSlides);
      setActiveSlideId(nextActiveSlide?.id ?? '');
      setSelectedElementId('');
    } catch (saveFailure) {
      setToast(formatCopy(copy.saveError, { message: saveFailure.message }));
    } finally {
      setIsFinishingQuiz(false);
    }
  }

  async function openPreview() {
    setPreviewSlideId(activeEditorSlide?.id ?? editorSlides[0]?.id ?? '');
    setIsPreviewOpen(true);
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Ignore fullscreen error
    }
  }

  function movePreviewSlide(direction) {
    if (!editorSlides.length) return;

    setPreviewSlideId((currentId) => {
      const currentIndex = editorSlides.findIndex((slide) => slide.id === currentId);
      const safeIndex = currentIndex < 0 ? previewSlideIndex : currentIndex;
      const nextIndex = clamp(safeIndex + direction, 0, editorSlides.length - 1);

      return editorSlides[nextIndex]?.id ?? currentId;
    });
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

  function handleSlideDragStart(event, index) {
    setDraggedSlideIndex(index);
    event.dataTransfer.effectAllowed = 'move';
  }

  function handleSlideDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  function handleSlideDrop(event, targetIndex) {
    event.preventDefault();
    if (draggedSlideIndex === null || draggedSlideIndex === targetIndex) return;

    setEditorSlides((currentSlides) => {
      const nextSlides = [...currentSlides];
      const [draggedSlide] = nextSlides.splice(draggedSlideIndex, 1);
      nextSlides.splice(targetIndex, 0, draggedSlide);
      return nextSlides.map((slide, i) => ({ ...slide, position: i + 1 }));
    });
    setDraggedSlideIndex(null);
  }

  function handleSlideDragEnd() {
    setDraggedSlideIndex(null);
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

  async function handleAiGenerateDraft() {
    const prompt = aiPrompt.trim();

    if (!prompt) {
      setAiError(copy.aiGenerateError
        ? formatCopy(copy.aiGenerateError, { message: copy.aiPrompt })
        : copy.aiPrompt);
      return;
    }

    setAiError('');
    setIsGeneratingAiDraft(true);

    try {
      const generatedText = await generateAiTextWithGemini({
        deckTitle: deckTitleDraft,
        prompt,
      });
      setAiGeneratedText(generatedText);
      setToast(copy.aiGenerated ?? 'AI draft generated');
    } catch (generateError) {
      setAiError(formatCopy(
        copy.aiGenerateError ?? 'Could not generate AI draft: {{message}}',
        { message: generateError.message },
      ));
    } finally {
      setIsGeneratingAiDraft(false);
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

    if (!currentUserId) {
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

  if (isQuizBuilderOpen) {
    return (
      <section className="slide-editor slide-editor--quiz-builder" aria-label={copy.quizBuilderTitle}>
        <div className="slide-editor__quiz-page">
          <header className="slide-editor__quiz-page-header">
            <h1>{copy.quizBuilderTitle}</h1>
            <button type="button" onClick={() => setIsQuizBuilderOpen(false)}>
              {copy.quizBack}
            </button>
          </header>

          <div className="slide-editor__quiz-main">
            <form className="slide-editor__quiz-form" onSubmit={handleQuizQuestionSubmit}>
              <div className="slide-editor__quiz-form-grid">
                <label className="slide-editor__quiz-field">
                  <span>{copy.quizTypeLabel}</span>
                  <select
                    value={quizForm.type}
                    onChange={(event) => updateQuizForm({
                      type: event.target.value,
                      correctOptionIndex: 0,
                    })}
                  >
                    {QUIZ_TYPE_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {copy[option.copyKey]}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="slide-editor__quiz-question-cluster">
                  <label className="slide-editor__quiz-field slide-editor__quiz-field--question">
                    <span>{copy.quizQuestionLabel}</span>
                    <textarea
                      value={quizForm.question}
                      maxLength={100}
                      placeholder={copy.quizQuestionPlaceholder}
                      onChange={(event) => updateQuizForm({ question: event.target.value })}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          event.currentTarget.form?.requestSubmit();
                        }
                      }}
                    />
                  </label>
                  <div className="slide-editor__quiz-target-preview" aria-label={copy.quizTargetSlidePreview}>
                    <SlideMiniature slide={activeEditorSlide ?? { elements: [] }} />
                    <span>{copy.quizTargetSlidePreview}</span>
                  </div>
                </div>
              </div>

              <label className="slide-editor__quiz-field">
                <span>{copy.quizHintLabel}</span>
                <input
                  type="text"
                  value={quizForm.hint}
                  placeholder={copy.quizHintPlaceholder}
                  onChange={(event) => updateQuizForm({ hint: event.target.value })}
                />
              </label>

              {quizForm.type === 'choice' ? (
                <div className="slide-editor__quiz-options">
                  {quizForm.options.map((option, index) => (
                    <label key={`${getQuizOptionLetter(index)}-${index}`} className="slide-editor__quiz-option-row">
                      <span>{getQuizOptionLetter(index)}</span>
                      <input
                        type="text"
                        value={option}
                        placeholder={formatCopy(copy.quizOptionPlaceholder, { letter: getQuizOptionLetter(index) })}
                        onChange={(event) => updateQuizOption(index, event.target.value)}
                      />
                      <label className="slide-editor__quiz-correct">
                        <input
                          type="radio"
                          name="quiz-correct-option"
                          checked={quizForm.correctOptionIndex === index}
                          onChange={() => updateQuizForm({ correctOptionIndex: index })}
                        />
                        {copy.quizCorrectLabel}
                      </label>
                      <button
                        type="button"
                        className="slide-editor__quiz-option-delete"
                        disabled={quizForm.options.length <= 2}
                        onClick={() => removeQuizOption(index)}
                        aria-label={copy.quizDeleteQuestion}
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </label>
                  ))}
                </div>
              ) : (
                <label className="slide-editor__quiz-field">
                  <span>{copy.quizAnswerLabel}</span>
                  <textarea
                    value={quizForm.answer}
                    placeholder={copy.quizAnswerLabel}
                    onChange={(event) => updateQuizForm({ answer: event.target.value })}
                  />
                </label>
              )}

              {quizBuilderError && (
                <p className="slide-editor__quiz-builder-error" role="alert">{quizBuilderError}</p>
              )}

              <div className="slide-editor__quiz-form-actions">
                {quizForm.type === 'choice' && (
                  <button
                    type="button"
                    className="slide-editor__secondary-submit"
                    disabled={quizForm.options.length >= MAX_QUIZ_OPTIONS}
                    onClick={addQuizOption}
                  >
                    <Icon name="plus" size={17} />
                    {copy.quizAddOption}
                  </button>
                )}
                <button type="submit" className="slide-editor__save-submit">
                  <Icon name="save" size={18} />
                  {quizEditingIndex === null ? copy.quizSaveQuestion : copy.quizUpdateQuestion}
                </button>
              </div>
            </form>

            <aside className="slide-editor__quiz-summary">
              <h2>{copy.quizOverviewTitle}</h2>
              <strong>{formatCopy(copy.quizQuestionCount, { count: quizQuestions.length })}</strong>
            </aside>
          </div>

          <section className="slide-editor__quiz-question-list">
            <div className="slide-editor__quiz-list-header">
              <h2>{copy.quizQuestionListTitle}</h2>
              <button
                type="button"
                className="slide-editor__save-submit"
                disabled={!quizQuestions.length || isFinishingQuiz}
                onClick={handleFinishQuiz}
              >
                <Icon name="quiz" size={18} />
                {isFinishingQuiz ? copy.quizFinishing : copy.quizFinish}
              </button>
            </div>

            {quizQuestions.length ? (
              <table>
                <thead>
                  <tr>
                    <th>{copy.quizColumnNumber}</th>
                    <th>{copy.quizColumnQuestion}</th>
                    <th>{copy.quizColumnType}</th>
                    <th>{copy.quizColumnAction}</th>
                  </tr>
                </thead>
                <tbody>
                  {quizQuestions.map((question, index) => (
                    <tr key={question.id}>
                      <td>{index + 1}</td>
                      <td>{question.question}</td>
                      <td>{getQuizTypeLabel(question.type)}</td>
                      <td>
                        <button type="button" onClick={() => handleEditQuizQuestion(index)}>
                          {copy.quizEditQuestion}
                        </button>
                        <button type="button" onClick={() => handleDeleteQuizQuestion(index)}>
                          {copy.quizDeleteQuestion}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>{copy.quizNoQuestions}</p>
            )}
          </section>
        </div>
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
                onClick={() => handleToolbarItemClick(item.id)}
              >
                <Icon name={item.icon} size={30} />
              </button>
            ))}
          </div>
          <input
            ref={imageFileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml"
            className="slide-editor__hidden-input"
            aria-label={copy.uploadImageLabel}
            onChange={handleImageFileChange}
          />

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
          <button type="button" onClick={openPreview}>
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
              onMouseDown={keepTextCaretOnToolbarMouseDown}
              onClick={() => textColorInputRef.current?.click()}
            >
              <Icon name="type" size={18} />
            </button>
            <input
              ref={textColorInputRef}
              type="color"
              className="slide-editor__hidden-input"
              value={selectedElement?.style?.color ?? '#111827'}
              onChange={(event) => updateSelectedTextStyle({ color: event.target.value })}
            />

            <select
              aria-label={copy.fontFamily}
              disabled={!isSelectedText}
              value={selectedElement?.style?.fontFamily ?? DEFAULT_TEXT_FONT_FAMILY}
              onChange={(event) => updateSelectedTextStyle({ fontFamily: event.target.value })}
            >
              {TEXT_FONT_FAMILIES.map((font) => (
                <option key={font.value} value={font.value}>{font.label}</option>
              ))}
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
              aria-pressed={Boolean(selectedElement?.style?.bold)}
              onMouseDown={keepTextCaretOnToolbarMouseDown}
              onClick={() => updateSelectedTextStyle({ bold: !selectedElement?.style?.bold })}
            >
              B
            </button>
            <button
              type="button"
              className={`slide-editor__floating-tool${selectedElement?.style?.italic ? ' slide-editor__floating-tool--active' : ''}`}
              disabled={!isSelectedText}
              aria-pressed={Boolean(selectedElement?.style?.italic)}
              onMouseDown={keepTextCaretOnToolbarMouseDown}
              onClick={() => updateSelectedTextStyle({ italic: !selectedElement?.style?.italic })}
            >
              <em>I</em>
            </button>
            <button
              type="button"
              className={`slide-editor__floating-tool${selectedElement?.style?.underline ? ' slide-editor__floating-tool--active' : ''}`}
              disabled={!isSelectedText}
              aria-pressed={Boolean(selectedElement?.style?.underline)}
              onMouseDown={keepTextCaretOnToolbarMouseDown}
              onClick={() => updateSelectedTextStyle({ underline: !selectedElement?.style?.underline })}
            >
              <span className="slide-editor__underline">U</span>
            </button>
            <button
              type="button"
              className="slide-editor__floating-tool"
              title={copy.underlineColorLabel}
              disabled={!isSelectedText}
              onMouseDown={keepTextCaretOnToolbarMouseDown}
              onClick={() => underlineColorInputRef.current?.click()}
            >
              <span className="slide-editor__underline">A</span>
            </button>
            <input
              ref={underlineColorInputRef}
              type="color"
              className="slide-editor__hidden-input"
              value={selectedElement?.style?.underlineColor ?? selectedElement?.style?.color ?? '#111827'}
              onChange={(event) => updateSelectedTextStyle({ underline: true, underlineColor: event.target.value })}
            />
            <button
              type="button"
              className={`slide-editor__floating-tool${selectedElement?.linkUrl ? ' slide-editor__floating-tool--active' : ''}`}
              title={copy.linkLabel}
              disabled={!isSelectedText}
              onMouseDown={keepTextCaretOnToolbarMouseDown}
              onClick={openLinkDialog}
            >
              <Icon name="link" size={18} />
            </button>

            {['left', 'center', 'right'].map((align) => (
              <button
                key={align}
                type="button"
                className={`slide-editor__align-btn slide-editor__align-btn--${align}${selectedElement?.style?.align === align ? ' slide-editor__floating-tool--active' : ''}`}
                disabled={!isSelectedText}
                aria-pressed={selectedElement?.style?.align === align}
                onMouseDown={keepTextCaretOnToolbarMouseDown}
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
              copy={copy}
              elements={activeEditorSlide?.elements ?? []}
              onCanvasClick={() => setSelectedElementId('')}
              onDelete={deleteSelectedElement}
              onDragStart={handleDragStart}
              onResizeStart={handleResizeStart}
              surfaceRef={canvasSurfaceRef}
              onSelect={setSelectedElementId}
              onTableCellChange={updateTableCell}
              onTextChange={(elementId, text) => updateElement(elementId, { text })}
              selectedElementId={selectedElementId}
            />
          </div>

          <div className="slide-editor__thumbnails" aria-label={t('editor.thumbnailAria')}>
            {editorSlides.map((slide, index) => (
              <div
                key={slide.id}
                className={`slide-editor__thumb-wrap${draggedSlideIndex === index ? ' slide-editor__thumb-wrap--dragging' : ''}`}
                draggable
                onDragStart={(event) => handleSlideDragStart(event, index)}
                onDragOver={handleSlideDragOver}
                onDrop={(event) => handleSlideDrop(event, index)}
                onDragEnd={handleSlideDragEnd}
              >
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
                    disabled={isGeneratingAiDraft}
                    onChange={(event) => setAiPrompt(event.target.value)}
                  />
                  <button
                    type="button"
                    disabled={isGeneratingAiDraft}
                    onClick={handleAiGenerateDraft}
                  >
                    {isGeneratingAiDraft ? copy.aiGenerating : copy.generateText}
                  </button>
                </div>
                {aiError && (
                  <p className="slide-editor__ai-error" role="alert">{aiError}</p>
                )}
                {aiGeneratedText && (
                  <div className="slide-editor__ai-result">
                    <ReactMarkdown>{aiGeneratedText}</ReactMarkdown>
                  </div>
                )}
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
                      onClick={() => insertImageIntoSelectionOrAdd({
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
                      <strong>{layout.copyKey ? copy[layout.copyKey] : layout.labels?.[language]}</strong>
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

      {isTableDialogOpen && (
        <div className="slide-editor__modal" role="dialog" aria-modal="true" aria-label={copy.tableDialogTitle}>
          <form className="slide-editor__save-dialog slide-editor__tool-dialog" onSubmit={handleTableDialogSubmit}>
            <div className="slide-editor__modal-header">
              <strong>{copy.tableDialogTitle}</strong>
              <button type="button" onClick={() => setIsTableDialogOpen(false)}>
                {copy.saveCancel}
              </button>
            </div>
            <div className="slide-editor__dialog-grid">
              <label className="slide-editor__save-field">
                <span>{copy.rowLabel}</span>
                <input
                  type="number"
                  min={MIN_TABLE_SIZE}
                  max={MAX_TABLE_SIZE}
                  value={tableDialogData.rows}
                  onChange={(event) => setTableDialogData((current) => ({
                    ...current,
                    rows: event.target.value,
                  }))}
                />
              </label>
              <label className="slide-editor__save-field">
                <span>{copy.columnLabel}</span>
                <input
                  type="number"
                  min={MIN_TABLE_SIZE}
                  max={MAX_TABLE_SIZE}
                  value={tableDialogData.columns}
                  onChange={(event) => setTableDialogData((current) => ({
                    ...current,
                    columns: event.target.value,
                  }))}
                />
              </label>
            </div>
            {tableDialogError && <p className="slide-editor__save-error">{tableDialogError}</p>}
            <button type="submit" className="slide-editor__save-submit">
              <Icon name="table" size={18} />
              {copy.insertTable}
            </button>
          </form>
        </div>
      )}

      {isChartDialogOpen && (
        <div className="slide-editor__modal" role="dialog" aria-modal="true" aria-label={copy.chartDialogTitle}>
          <form className="slide-editor__save-dialog slide-editor__tool-dialog" onSubmit={handleChartDialogSubmit}>
            <div className="slide-editor__modal-header">
              <strong>{copy.chartDialogTitle}</strong>
              <button type="button" onClick={() => setIsChartDialogOpen(false)}>
                {copy.saveCancel}
              </button>
            </div>
            <label className="slide-editor__save-field">
              <span>{copy.chartTitleLabel}</span>
              <input
                type="text"
                value={chartDialogData.title}
                onChange={(event) => setChartDialogData((current) => ({
                  ...current,
                  title: event.target.value,
                }))}
              />
            </label>
            <label className="slide-editor__save-field">
              <span>{copy.chartLabelsLabel}</span>
              <input
                type="text"
                value={chartDialogData.labels}
                placeholder={copy.chartLabelsPlaceholder}
                onChange={(event) => setChartDialogData((current) => ({
                  ...current,
                  labels: event.target.value,
                }))}
              />
            </label>
            <label className="slide-editor__save-field">
              <span>{copy.chartValuesLabel}</span>
              <input
                type="text"
                value={chartDialogData.values}
                placeholder={copy.chartValuesPlaceholder}
                onChange={(event) => setChartDialogData((current) => ({
                  ...current,
                  values: event.target.value,
                }))}
              />
            </label>
            {chartDialogError && <p className="slide-editor__save-error">{chartDialogError}</p>}
            <button type="submit" className="slide-editor__save-submit">
              <Icon name="chart" size={18} />
              {copy.insertChart}
            </button>
          </form>
        </div>
      )}

      {isLinkDialogOpen && (
        <div className="slide-editor__modal" role="dialog" aria-modal="true" aria-label={copy.linkDialogTitle}>
          <form className="slide-editor__save-dialog slide-editor__tool-dialog" onSubmit={handleLinkSubmit}>
            <div className="slide-editor__modal-header">
              <strong>{copy.linkDialogTitle}</strong>
              <button type="button" onClick={() => setIsLinkDialogOpen(false)}>
                {copy.saveCancel}
              </button>
            </div>
            <label className="slide-editor__save-field">
              <span>{copy.linkUrlLabel}</span>
              <input
                type="url"
                value={linkUrlDraft}
                placeholder={copy.linkUrlPlaceholder}
                onChange={(event) => setLinkUrlDraft(event.target.value)}
                autoFocus
              />
            </label>
            {linkDialogError && <p className="slide-editor__save-error">{linkDialogError}</p>}
            <div className="slide-editor__dialog-actions">
              <button type="button" className="slide-editor__secondary-submit" onClick={removeSelectedLink}>
                {copy.removeLink}
              </button>
              <button type="submit" className="slide-editor__save-submit">
                <Icon name="link" size={18} />
                {copy.applyLink}
              </button>
            </div>
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
                aria-expanded={isShareSettingsOpen}
                onClick={() => setIsShareSettingsOpen((isOpen) => !isOpen)}
              >
                <Icon name="settings" size={20} />
                {copy.shareSettings}
              </button>
              <button
                type="button"
                className="slide-editor__share-close"
                onClick={() => setIsShareDialogOpen(false)}
              >
                {copy.closeShare}
              </button>
            </div>

            {isShareSettingsOpen && (
              <section className="slide-editor__share-advanced" aria-label={copy.shareAdvancedTitle}>
                <div>
                  <strong>{copy.shareAdvancedTitle}</strong>
                  <p>{copy.shareAdvancedDescription}</p>
                </div>
                {[
                  ['allowDownload', copy.shareAllowDownload],
                  ['allowCopy', copy.shareAllowCopy],
                  ['allowEdit', copy.shareAllowEdit],
                  ['allowReshare', copy.shareAllowReshare],
                ].map(([settingKey, settingLabel]) => (
                  <label key={settingKey} className="slide-editor__share-toggle">
                    <span>{settingLabel}</span>
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
                  <Icon
                    name={shareAccess === 'public'
                      ? 'link'
                      : shareAccess === 'unlisted'
                        ? 'users'
                        : 'lock'}
                    size={22}
                  />
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
          <div className="slide-editor__modal-content slide-editor__modal-content--preview">
            <div className="slide-editor__modal-header">
              <strong>{copy.previewTitle} {previewSlideIndex + 1}/{editorSlides.length}</strong>
              <button type="button" onClick={() => {
                setIsPreviewOpen(false);
                if (document.fullscreenElement) {
                  document.exitFullscreen().catch(() => {});
                }
              }}>
                {copy.closePreview}
              </button>
            </div>
            <SlideSurface
              copy={copy}
              elements={previewSlide?.elements ?? []}
              onCanvasClick={() => {}}
              onDelete={() => {}}
              onDragStart={() => {}}
              onResizeStart={() => {}}
              onSelect={() => {}}
              onTableCellChange={() => {}}
              onTextChange={() => {}}
              selectedElementId=""
              readOnly
            />
            <div className="slide-editor__preview-controls">
              <button
                type="button"
                onClick={() => movePreviewSlide(-1)}
                disabled={previewSlideIndex <= 0}
              >
                {copy.previewPrevious}
              </button>
              <button
                type="button"
                onClick={() => movePreviewSlide(1)}
                disabled={previewSlideIndex >= editorSlides.length - 1}
              >
                {copy.previewNext}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
