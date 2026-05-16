import './SlidePreviewThumbnail.css';

const DEFAULT_FONT_FAMILY = 'Inter, Arial, sans-serif';
const DEFAULT_TABLE_ROWS = 3;
const DEFAULT_TABLE_COLUMNS = 4;
const DEFAULT_CHART_VALUES = [120, 180, 150, 240];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function toFiniteNumber(value, fallback) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
}

function getSlideElements(slide) {
  const content = slide?.content ?? slide?.content_json ?? {};

  if (Array.isArray(content.elements)) return content.elements;
  if (Array.isArray(slide?.elements)) return slide.elements;

  return [];
}

function getElementFrame(element) {
  const x = toFiniteNumber(element?.x ?? element?.left, 8);
  const y = toFiniteNumber(element?.y ?? element?.top, 8);
  const width = toFiniteNumber(element?.width, 36);
  const height = toFiniteNumber(element?.height, 14);

  return {
    left: `${clamp(x, 0, 100)}%`,
    top: `${clamp(y, 0, 100)}%`,
    width: `${clamp(width, 1, 100)}%`,
    height: `${clamp(height, 1, 100)}%`,
  };
}

function getTextAlignItems(element) {
  return element?.style?.verticalAlign === 'top' ? 'flex-start' : 'center';
}

function getTextJustifyContent(element) {
  if (element?.style?.align === 'center') return 'center';
  if (element?.style?.align === 'right') return 'flex-end';
  return 'flex-start';
}

function getPreviewTextStyle(element) {
  const fontSize = toFiniteNumber(element?.style?.fontSize, 18);

  return {
    alignItems: getTextAlignItems(element),
    color: element?.style?.color ?? '#111827',
    fontFamily: element?.style?.fontFamily ?? DEFAULT_FONT_FAMILY,
    fontSize: `${clamp(fontSize * 0.42, 6, 22)}px`,
    fontStyle: element?.style?.italic ? 'italic' : 'normal',
    fontWeight: element?.style?.bold ? 850 : 600,
    justifyContent: getTextJustifyContent(element),
    lineHeight: element?.style?.lineHeight ?? 1.12,
    textAlign: element?.style?.align ?? 'left',
    textDecoration: element?.style?.underline || element?.linkUrl ? 'underline' : 'none',
    textDecorationColor: element?.style?.underlineColor ?? element?.style?.color,
  };
}

function normalizeTable(table = {}) {
  const rows = Math.trunc(clamp(toFiniteNumber(table.rows, DEFAULT_TABLE_ROWS), 1, 20));
  const columns = Math.trunc(clamp(toFiniteNumber(table.columns ?? table.cols, DEFAULT_TABLE_COLUMNS), 1, 20));
  const cells = Array.isArray(table.cells) ? table.cells : [];

  return {
    rows,
    columns,
    cells: Array.from({ length: rows * columns }, (_, index) => String(cells[index] ?? '')),
  };
}

function normalizeChart(chart = {}) {
  const values = Array.isArray(chart.values)
    ? chart.values.map(Number).filter((item) => Number.isFinite(item))
    : DEFAULT_CHART_VALUES;
  const safeValues = values.length ? values : DEFAULT_CHART_VALUES;
  const labels = Array.isArray(chart.labels) ? chart.labels : [];

  return {
    labels: safeValues.map((_, index) => String(labels[index] ?? `C${index + 1}`)),
    values: safeValues,
  };
}

function TablePreview({ table }) {
  const config = normalizeTable(table);

  return (
    <div
      className="slide-preview-thumbnail__table-grid"
      style={{ gridTemplateColumns: `repeat(${config.columns}, 1fr)` }}
    >
      {config.cells.map((cell, index) => (
        <span
          key={`${cell}-${index}`}
          style={{
            background: index < config.columns ? '#dbeafe' : '#eff6ff',
            borderBottom: index >= config.cells.length - config.columns ? 'none' : '1px solid #bfdbfe',
            borderRight: (index + 1) % config.columns === 0 ? 'none' : '1px solid #bfdbfe',
          }}
        >
          {cell}
        </span>
      ))}
    </div>
  );
}

function ChartPreview({ chart }) {
  const config = normalizeChart(chart);
  const maxValue = Math.max(...config.values, 1);

  return (
    <div className="slide-preview-thumbnail__chart-bars">
      {config.values.map((value, index) => (
        <span key={`${config.labels[index]}-${index}`} className="slide-preview-thumbnail__chart-item">
          <i style={{ height: `${clamp((value / maxValue) * 100, 8, 100)}%` }} />
          <b>{config.labels[index]}</b>
        </span>
      ))}
    </div>
  );
}

function PreviewElement({ element }) {
  const type = element?.type ?? 'text';
  const frameStyle = getElementFrame(element);

  if (type === 'text') {
    return (
      <div
        className="slide-preview-thumbnail__element slide-preview-thumbnail__element--text"
        style={{
          ...frameStyle,
          ...getPreviewTextStyle(element),
        }}
      >
        {element.text}
      </div>
    );
  }

  if (type === 'image') {
    return (
      <div
        className="slide-preview-thumbnail__element slide-preview-thumbnail__element--image"
        style={{
          ...frameStyle,
          backgroundColor: element.fill ?? '#e0f2fe',
        }}
      >
        {element.src ? <img src={element.src} alt="" draggable="false" /> : <span />}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="slide-preview-thumbnail__element slide-preview-thumbnail__element--table" style={frameStyle}>
        {element.text && <strong>{element.text}</strong>}
        <TablePreview table={element.table} />
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className="slide-preview-thumbnail__element slide-preview-thumbnail__element--chart" style={frameStyle}>
        {element.text && <strong>{element.text}</strong>}
        <ChartPreview chart={element.chart} />
      </div>
    );
  }

  return (
    <div
      className={`slide-preview-thumbnail__element slide-preview-thumbnail__element--${type}`}
      style={{
        ...frameStyle,
        background: element.fill ?? 'transparent',
        borderColor: element.stroke ?? '#2563eb',
      }}
    >
      {element.text}
    </div>
  );
}

export default function SlidePreviewThumbnail({ slide, title }) {
  const elements = getSlideElements(slide);
  const previewTitle = slide?.title || title;

  return (
    <div className="slide-preview-thumbnail" aria-hidden="true">
      <div className="slide-preview-thumbnail__surface">
        {elements.length ? (
          elements.map((element, index) => (
            <PreviewElement key={element.id ?? `${element.type}-${index}`} element={element} />
          ))
        ) : (
          <div className="slide-preview-thumbnail__empty">
            <span />
            <strong>{previewTitle}</strong>
          </div>
        )}
      </div>
    </div>
  );
}
