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
  return new Date(String(value ?? '').replace(/\//g, '-')).getTime() || 0;
}

export function sortTemplates(templates, sortId, locale = 'ja') {
  const items = [...templates];

  switch (sortId) {
    case 'created':
      return items.sort(
        (left, right) => parseDate(right.sortDate ?? right.date) - parseDate(left.sortDate ?? left.date),
      );
    case 'rating':
      return items.sort((left, right) => (right.rating ?? 0) - (left.rating ?? 0));
    case 'views':
      return items.sort((left, right) => (right.viewCount ?? 0) - (left.viewCount ?? 0));
    case 'name':
    default:
      return items.sort((left, right) => left.title.localeCompare(right.title, locale));
  }
}
