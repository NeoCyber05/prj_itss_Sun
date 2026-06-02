function normalizeSearchText(value) {
  return String(value ?? '').trim().toLowerCase();
}

function getSearchableValues(item) {
  return [
    item.title,
    item.author,
    item.description,
    item.topic,
    item.subject,
    item.category,
    item.firstSlide?.title,
    ...(item.tags ?? []),
  ];
}

export function filterTemplates(templates, query) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return templates;
  }

  return templates.filter((item) =>
    getSearchableValues(item).some((value) =>
      normalizeSearchText(value).includes(normalizedQuery),
    ),
  );
}

function parseDate(value) {
  const num = Number(value);
  if (Number.isFinite(num) && num > 0) {
    return num;
  }

  const time = new Date(String(value ?? '').replace(/\//g, '-')).getTime();
  return Number.isFinite(time) ? time : 0;
}

export function getDefaultSortDirection(sortId) {
  switch (sortId) {
    case 'name':
      return 'asc';
    case 'created':
    case 'rating':
    case 'views':
    default:
      return 'desc';
  }
}

function normalizeSortConfig(sortConfig) {
  if (typeof sortConfig === 'string') {
    return {
      id: sortConfig,
      direction: getDefaultSortDirection(sortConfig),
    };
  }

  const id = sortConfig?.id ?? 'name';
  const direction = sortConfig?.direction === 'asc' ? 'asc' : 'desc';

  return { id, direction };
}

function compareNumbers(left, right, direction) {
  const delta = (left ?? 0) - (right ?? 0);
  return direction === 'asc' ? delta : -delta;
}

function compareStrings(left, right, locale, direction) {
  const result = String(left ?? '').localeCompare(String(right ?? ''), locale);
  return direction === 'asc' ? result : -result;
}

export function sortTemplates(templates, sortConfig, locale = 'ja') {
  const items = templates.map((item) => ({ ...item }));
  const { id, direction } = normalizeSortConfig(sortConfig);
  const compareTitle = (left, right, nextDirection = 'asc') =>
    compareStrings(left.title, right.title, locale, nextDirection);

  switch (id) {
    case 'created':
      items.sort((left, right) =>
        compareNumbers(
          parseDate(left.sortDate ?? left.date),
          parseDate(right.sortDate ?? right.date),
          direction,
        ) || compareTitle(left, right),
      );
      break;
    case 'rating':
      items.sort((left, right) =>
        compareNumbers(left.rating ?? 0, right.rating ?? 0, direction)
        || compareTitle(left, right),
      );
      break;
    case 'views':
      items.sort((left, right) =>
        compareNumbers(left.viewCount ?? 0, right.viewCount ?? 0, direction)
        || compareTitle(left, right),
      );
      break;
    case 'name':
    default:
      items.sort((left, right) =>
        compareTitle(left, right, direction)
        || compareNumbers(
          parseDate(left.sortDate ?? left.date),
          parseDate(right.sortDate ?? right.date),
          'desc',
        ),
      );
      break;
  }

  return items;
}
