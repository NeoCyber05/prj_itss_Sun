import { supabase, supabaseAnonKey, supabaseUrl } from '../supabaseClient';

const DEFAULT_COPY = {
  ja: {
    deckTitle: '新しいスライド',
    slideTitle: 'タイトルなし',
  },
  vi: {
    deckTitle: 'Slide mới',
    slideTitle: 'Chưa có tiêu đề',
  },
};

const RECENT_TEMPLATE_STORAGE_PREFIX = 'rakuslide:recent-templates';
const DEFAULT_SHARE_SETTINGS = {
  accessMode: 'private',
  allowDownload: false,
  allowCopy: true,
  allowEdit: false,
  allowReshare: false,
  invitedEmails: [],
};

function getCopy(language) {
  return DEFAULT_COPY[language] ?? DEFAULT_COPY.ja;
}

function requireValue(value, message) {
  if (!value) {
    throw new Error(message);
  }

  return value;
}

function normalizeAccessMode(value, fallback = DEFAULT_SHARE_SETTINGS.accessMode) {
  const normalizedValue = String(value ?? '').trim().toLowerCase();

  if (normalizedValue === 'link') {
    return 'public';
  }

  if (normalizedValue === 'public' || normalizedValue === 'private' || normalizedValue === 'unlisted') {
    return normalizedValue;
  }

  return fallback;
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

function getShareAccessFromRow(row) {
  const shareSettings = row?.share_settings ?? row?.shareSettings ?? {};

  if (row?.visibility) {
    return normalizeAccessMode(row.visibility);
  }

  if (shareSettings?.accessMode) {
    return normalizeAccessMode(shareSettings.accessMode);
  }

  return row?.is_public ? 'public' : 'private';
}

function normalizeShareSettings(settings, fallbackAccessMode = DEFAULT_SHARE_SETTINGS.accessMode) {
  const normalizedSettings = settings ?? {};

  return {
    ...DEFAULT_SHARE_SETTINGS,
    allowDownload: Boolean(normalizedSettings.allowDownload ?? DEFAULT_SHARE_SETTINGS.allowDownload),
    allowCopy: Boolean(normalizedSettings.allowCopy ?? DEFAULT_SHARE_SETTINGS.allowCopy),
    allowEdit: Boolean(normalizedSettings.allowEdit ?? DEFAULT_SHARE_SETTINGS.allowEdit),
    allowReshare: Boolean(normalizedSettings.allowReshare ?? DEFAULT_SHARE_SETTINGS.allowReshare),
    accessMode: normalizeAccessMode(normalizedSettings.accessMode, fallbackAccessMode),
    invitedEmails: normalizeInviteEmails(
      normalizedSettings.invitedEmails ?? normalizedSettings.invited_emails,
    ),
  };
}

function canAccessTemplate(template, { userEmail, userId } = {}) {
  if (!template) {
    return false;
  }

  if (userId && template.owner_id === userId) {
    return true;
  }

  if (template.visibility === 'public' || template.is_public) {
    return true;
  }

  if (template.visibility !== 'unlisted') {
    return false;
  }

  const normalizedUserEmail = normalizeInviteEmail(userEmail);

  if (!normalizedUserEmail) {
    return false;
  }

  return template.share_settings.invitedEmails.includes(normalizedUserEmail);
}

function dedupeTemplatesById(templateRows) {
  const templateById = new Map();

  for (const template of templateRows) {
    if (!template?.id) continue;
    templateById.set(template.id, template);
  }

  return Array.from(templateById.values());
}

async function resolveAccessIdentity(userId, userEmail) {
  if (userId && userEmail) {
    return { userEmail, userId };
  }

  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    return { userEmail, userId };
  }

  return {
    userId: userId ?? data.user.id,
    userEmail: userEmail || data.user.email || '',
  };
}

function normalizeTemplate(row) {
  const visibility = getShareAccessFromRow(row);
  const shareSettings = normalizeShareSettings(
    row.share_settings ?? row.shareSettings,
    visibility,
  );

  return {
    ...row,
    slide_count: row.slide_count ?? row.page_count ?? 1,
    visibility,
    share_settings: shareSettings,
    invited_count: shareSettings.invitedEmails.length,
    status: row.status ?? 'draft',
  };
}

function normalizeSlide(row) {
  return {
    ...row,
    template_id: row.template_id ?? row.presentation_id,
    position: row.position ?? row.page_order ?? 1,
    layout: row.layout ?? 'blank',
    content: row.content ?? row.content_json ?? { elements: [] },
  };
}

function normalizeDeck(template, slides) {
  return {
    template: normalizeTemplate(template),
    slides: (slides ?? []).map(normalizeSlide),
  };
}

function makeLocalDraftId(prefix) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getTemplateTimeValue(template) {
  return new Date(template.updated_at ?? template.created_at ?? 0).getTime();
}

function getRecentTemplateTimeValue(template) {
  return new Date(template.last_opened_at ?? template.updated_at ?? template.created_at ?? 0).getTime();
}

function isPersistedUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(String(value ?? ''));
}

function isMissingLastOpenedAtError(error) {
  return isMissingColumnError(error, 'last_opened_at');
}

function isMissingShareSettingsError(error) {
  return isMissingColumnError(error, 'share_settings');
}

function isMissingVisibilityError(error) {
  return isMissingColumnError(error, 'visibility');
}

function isMissingColumnError(error, columnName) {
  const message = String(error?.message ?? '');

  if (!error || !message.includes(columnName)) {
    return false;
  }

  // Bắt lỗi PostgreSQL column not found (42703)
  if (error.code === '42703') return true;

  // Bắt lỗi PostgREST schema cache (PGRST204) hoặc message mô tả schema cache
  if (error.code === 'PGRST204') return true;

  // Bắt lỗi dạng: "Could not find the 'column' column of 'table' in the schema cache"
  if (message.includes('schema cache')) return true;

  return false;
}

function isSupabaseFetchFailure(error) {
  const message = String(error?.message ?? '');
  const details = String(error?.details ?? '');

  return error?.name === 'TypeError'
    || message.includes('Failed to fetch')
    || details.includes('Failed to fetch');
}

function makeSupabaseRestError(response, body) {
  return {
    code: body?.code ?? String(response.status),
    details: body?.details ?? null,
    hint: body?.hint ?? null,
    message: body?.message ?? `Supabase request failed with status ${response.status}.`,
    status: response.status,
  };
}

async function getSupabaseRestHeaders() {
  let accessToken;

  try {
    const { data } = await supabase.auth.getSession();
    accessToken = data?.session?.access_token ?? '';
  } catch {
    accessToken = '';
  }

  return {
    apikey: supabaseAnonKey,
    authorization: `Bearer ${accessToken || supabaseAnonKey}`,
  };
}

async function fetchSupabaseRows(tableName, configureSearchParams) {
  try {
    const url = new URL(`${supabaseUrl.replace(/\/+$/, '')}/rest/v1/${tableName}`);
    configureSearchParams(url.searchParams);

    const response = await fetch(url.toString(), {
      headers: await getSupabaseRestHeaders(),
    });
    const rawBody = await response.text();
    const body = rawBody ? JSON.parse(rawBody) : null;

    if (!response.ok) {
      return {
        data: null,
        error: makeSupabaseRestError(response, body),
      };
    }

    return {
      data: Array.isArray(body) ? body : [],
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: '',
        details: error?.stack ?? null,
        hint: null,
        message: `${error?.name ?? 'Error'}: ${error?.message ?? 'Failed to fetch'}`,
        name: error?.name,
      },
    };
  }
}

async function runReadQueryWithRestFallback(query, fetchFallbackRows) {
  const response = await query;

  if (!response.error || !isSupabaseFetchFailure(response.error)) {
    return response;
  }

  return fetchFallbackRows();
}

async function fetchOwnedTemplates(userId) {
  return runReadQueryWithRestFallback(
    supabase
      .from('templates')
      .select('*')
      .eq('owner_id', userId),
    () => fetchSupabaseRows('templates', (params) => {
      params.set('select', '*');
      params.set('owner_id', `eq.${userId}`);
    }),
  );
}

async function fetchOwnedTemplatesByIds(userId, templateIds) {
  return runReadQueryWithRestFallback(
    supabase
      .from('templates')
      .select('*')
      .eq('owner_id', userId)
      .in('id', templateIds),
    () => fetchSupabaseRows('templates', (params) => {
      params.set('select', '*');
      params.set('owner_id', `eq.${userId}`);
      params.set('id', `in.(${templateIds.join(',')})`);
    }),
  );
}

async function fetchRecentlyOpenedTemplates(userId, limit) {
  return runReadQueryWithRestFallback(
    supabase
      .from('templates')
      .select('*')
      .eq('owner_id', userId)
      .not('last_opened_at', 'is', null)
      .order('last_opened_at', { ascending: false })
      .limit(limit),
    () => fetchSupabaseRows('templates', (params) => {
      params.set('select', '*');
      params.set('owner_id', `eq.${userId}`);
      params.set('last_opened_at', 'not.is.null');
      params.set('order', 'last_opened_at.desc');
      params.set('limit', String(limit));
    }),
  );
}

async function fetchTemplateById(templateId) {
  return runReadQueryWithRestFallback(
    supabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .maybeSingle(),
    async () => {
      const { data, error } = await fetchSupabaseRows('templates', (params) => {
        params.set('select', '*');
        params.set('id', `eq.${templateId}`);
        params.set('limit', '1');
      });

      return {
        data: data?.[0] ?? null,
        error,
      };
    },
  );
}

async function fetchSlidePagesByTemplateIds(templateIds) {
  return runReadQueryWithRestFallback(
    supabase
      .from('slide_pages')
      .select('id,presentation_id,page_order,title,content_json,thumbnail_url')
      .in('presentation_id', templateIds)
      .order('page_order', { ascending: true }),
    () => fetchSupabaseRows('slide_pages', (params) => {
      params.set('select', 'id,presentation_id,page_order,title,content_json,thumbnail_url');
      params.set('presentation_id', `in.(${templateIds.join(',')})`);
      params.set('order', 'page_order.asc');
    }),
  );
}

async function fetchSlidePagesForTemplate(templateId) {
  return runReadQueryWithRestFallback(
    supabase
      .from('slide_pages')
      .select('*')
      .eq('presentation_id', templateId)
      .order('page_order', { ascending: true }),
    () => fetchSupabaseRows('slide_pages', (params) => {
      params.set('select', '*');
      params.set('presentation_id', `eq.${templateId}`);
      params.set('order', 'page_order.asc');
    }),
  );
}

async function fetchInvitedTemplates(userEmail, limit, orderColumn = 'updated_at') {
  const normalizedUserEmail = normalizeInviteEmail(userEmail);

  if (!normalizedUserEmail) {
    return { data: [], error: null };
  }

  return runReadQueryWithRestFallback(
    buildInvitedTemplatesQuery(normalizedUserEmail, limit, orderColumn),
    () => fetchSupabaseRows('templates', (params) => {
      params.set('select', '*');
      params.set('share_settings', `cs.${JSON.stringify({ invitedEmails: [normalizedUserEmail] })}`);
      params.set('limit', String(limit));

      if (orderColumn) {
        params.set('order', `${orderColumn}.desc`);
      }
    }),
  );
}

function isMissingSortColumnError(error) {
  return isMissingColumnError(error, 'updated_at')
    || isMissingColumnError(error, 'created_at');
}

function getRecentTemplateStorageKey(userId) {
  return `${RECENT_TEMPLATE_STORAGE_PREFIX}:${userId}`;
}

function readLocalRecentTemplateAccess(userId) {
  if (typeof window === 'undefined' || !userId) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(getRecentTemplateStorageKey(userId));
    const parsedValue = JSON.parse(rawValue || '[]');

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .filter((item) => isPersistedUuid(item?.templateId) && item.openedAt)
      .sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
  } catch {
    return [];
  }
}

function writeLocalRecentTemplateAccess({ templateId, userId, openedAt }) {
  if (typeof window === 'undefined' || !isPersistedUuid(templateId) || !userId) {
    return;
  }

  try {
    const nextRecentAccess = [
      { templateId, openedAt },
      ...readLocalRecentTemplateAccess(userId).filter((item) => item.templateId !== templateId),
    ].slice(0, 20);

    window.localStorage.setItem(
      getRecentTemplateStorageKey(userId),
      JSON.stringify(nextRecentAccess),
    );
  } catch {
    // localStorage can be unavailable in private browsing or restricted environments.
  }
}

async function getSlideSummaryByTemplateId(templateIds) {
  const slideCountByTemplateId = new Map();
  const firstSlideByTemplateId = new Map();

  if (!templateIds.length) {
    return {
      firstSlideByTemplateId,
      slideCountByTemplateId,
    };
  }

  const { data: slides, error: slidesError } = await fetchSlidePagesByTemplateIds(templateIds);

  if (slidesError) {
    throw slidesError;
  }

  for (const slide of slides ?? []) {
    const templateId = slide.presentation_id;

    slideCountByTemplateId.set(
      templateId,
      (slideCountByTemplateId.get(templateId) ?? 0) + 1,
    );

    if (!firstSlideByTemplateId.has(templateId)) {
      firstSlideByTemplateId.set(templateId, normalizeSlide(slide));
    }
  }

  return {
    firstSlideByTemplateId,
    slideCountByTemplateId,
  };
}

async function attachSlideSummaries(templateRows) {
  const templateIds = templateRows.map((template) => template.id).filter(Boolean);
  const { firstSlideByTemplateId, slideCountByTemplateId } = await getSlideSummaryByTemplateId(templateIds);

  return templateRows.map((template) => {
    const normalizedTemplate = normalizeTemplate(template);

    return {
      ...normalizedTemplate,
      first_slide: firstSlideByTemplateId.get(template.id) ?? normalizedTemplate.first_slide ?? null,
      slide_count: slideCountByTemplateId.get(template.id)
        ?? normalizedTemplate.slide_count
        ?? 0,
    };
  });
}

async function attachSlideSummariesForSavedTemplates(templateRows) {
  try {
    return await attachSlideSummaries(templateRows);
  } catch (error) {
    if (!isSupabaseFetchFailure(error)) {
      throw error;
    }

    console.warn(
      'Failed to load saved slide preview details from Supabase; showing saved slides without previews:',
      error,
    );

    return templateRows.map(normalizeTemplate);
  }
}

async function listLocalRecentTemplates(userId, recentAccess) {
  const recentTemplateIds = recentAccess.map((item) => item.templateId);

  if (!recentTemplateIds.length) {
    return [];
  }

  const openedAtByTemplateId = new Map(
    recentAccess.map((item) => [item.templateId, item.openedAt]),
  );

  const { data: templates, error: templateError } = await fetchOwnedTemplatesByIds(
    userId,
    recentTemplateIds,
  );

  if (templateError) {
    throw templateError;
  }

  const templatesWithCounts = await attachSlideSummaries(templates ?? []);

  return templatesWithCounts.map((template) => ({
    ...template,
    last_opened_at: template.last_opened_at ?? openedAtByTemplateId.get(template.id),
  }));
}

function buildSearchableTemplatesQuery(userId, limit, useVisibilityColumn, orderColumn = 'updated_at') {
  let query = supabase
    .from('templates')
    .select('*');

  if (userId) {
    query = useVisibilityColumn
      ? query.or(`owner_id.eq.${userId},visibility.eq.public`)
      : query.or(`owner_id.eq.${userId},is_public.eq.true`);
  } else {
    query = useVisibilityColumn
      ? query.eq('visibility', 'public')
      : query.eq('is_public', true);
  }

  if (orderColumn) {
    query = query.order(orderColumn, { ascending: false });
  }

  return query.limit(limit);
}

async function runSearchableTemplatesQuery(userId, limit) {
  let lastError = null;

  for (const useVisibilityColumn of [true, false]) {
    for (const orderColumn of ['updated_at', 'created_at', '']) {
      const response = await buildSearchableTemplatesQuery(
        userId,
        limit,
        useVisibilityColumn,
        orderColumn,
      );

      if (!response.error) {
        return response;
      }

      lastError = response.error;

      if (isMissingVisibilityError(response.error)) {
        break;
      }

      if (!isMissingSortColumnError(response.error)) {
        return response;
      }
    }
  }

  return { data: null, error: lastError };
}

function buildInvitedTemplatesQuery(userEmail, limit, orderColumn = 'updated_at') {
  const normalizedUserEmail = normalizeInviteEmail(userEmail);

  if (!normalizedUserEmail) {
    return null;
  }

  let query = supabase
    .from('templates')
    .select('*')
    .contains('share_settings', { invitedEmails: [normalizedUserEmail] });

  if (orderColumn) {
    query = query.order(orderColumn, { ascending: false });
  }

  return query.limit(limit);
}

async function runInvitedTemplatesQuery(userEmail, limit) {
  let lastError = null;

  for (const orderColumn of ['updated_at', 'created_at', '']) {
    const response = await fetchInvitedTemplates(userEmail, limit, orderColumn);

    if (!response.error) {
      return response;
    }

    lastError = response.error;

    if (isMissingShareSettingsError(response.error)) {
      return response;
    }

    if (!isMissingSortColumnError(response.error)) {
      return response;
    }
  }

  return { data: null, error: lastError };
}

export async function listSearchableTemplates(userId, userEmail, limit = 120) {
  const accessIdentity = await resolveAccessIdentity(userId, userEmail);
  const normalizedLimit = Number.isFinite(limit)
    ? Math.max(1, Math.floor(limit))
    : 120;

  let { data: templates, error: templateError } = await runSearchableTemplatesQuery(
    accessIdentity.userId,
    normalizedLimit,
  );

  if (templateError) {
    throw templateError;
  }

  let invitedTemplates = [];

  if (accessIdentity.userEmail) {
    const { data: invitedData, error: invitedError } = await runInvitedTemplatesQuery(
      accessIdentity.userEmail,
      normalizedLimit,
    );

    if (invitedError && !isMissingShareSettingsError(invitedError)) {
      throw invitedError;
    }

    invitedTemplates = invitedError ? [] : invitedData ?? [];
  }

  const templatesWithCounts = await attachSlideSummaries(
    dedupeTemplatesById([...(templates ?? []), ...invitedTemplates]),
  );

  return templatesWithCounts
    .map(normalizeTemplate)
    .filter((template) => canAccessTemplate(template, accessIdentity))
    .sort((left, right) => getTemplateTimeValue(right) - getTemplateTimeValue(left));
}

export async function createBlankDeck({ userId, language }) {
  requireValue(userId, 'A signed-in user is required to create a slide.');

  const copy = getCopy(language);

  return normalizeDeck(
    {
      id: '',
      owner_id: userId,
      title: copy.deckTitle,
      description: null,
      thumbnail_url: null,
      is_public: false,
      visibility: 'private',
      share_settings: DEFAULT_SHARE_SETTINGS,
      status: 'draft',
    },
    [{
      id: makeLocalDraftId('local-slide'),
      presentation_id: '',
      page_order: 1,
      title: copy.slideTitle,
      content_json: { elements: [] },
      thumbnail_url: null,
    }],
  );
}

function normalizeTemplateDetailSlide(slide, index, fallbackTitle) {
  const content = slide?.content_json
    ?? slide?.content
    ?? { elements: slide?.elements ?? [] };

  return {
    title: slide?.title || `${fallbackTitle} ${index + 1}`,
    content,
    thumbnail_url: slide?.thumbnail_url ?? slide?.image ?? null,
  };
}

export async function createDeckFromTemplateDetail({ userId, language, template }) {
  requireValue(userId, 'A signed-in user is required to save this template.');
  requireValue(template, 'A template is required.');

  const copy = getCopy(language);
  const title = template.title?.trim() || copy.deckTitle;
  const description = template.description ?? null;
  const thumbnailUrl = template.thumbnail_url ?? template.image ?? null;
  const sourceSlides = template.slides?.length
    ? template.slides
    : [{
      title,
      thumbnail_url: thumbnailUrl,
      content: { elements: [] },
    }];

  const { data: savedTemplate, error: templateError } = await supabase
    .from('templates')
    .insert({
      owner_id: userId,
      title,
      description,
      thumbnail_url: thumbnailUrl,
      is_public: false,
    })
    .select('*')
    .single();

  if (templateError) {
    throw templateError;
  }

  try {
    const { error: presentationError } = await supabase
      .from('presentations')
      .insert({
        id: savedTemplate.id,
        owner_id: userId,
        title,
        description,
        thumbnail_url: thumbnailUrl,
        is_public: false,
      });

    if (presentationError) {
      throw presentationError;
    }

    const savedSlides = [];

    for (const [index, sourceSlide] of sourceSlides.entries()) {
      const normalizedSlide = normalizeTemplateDetailSlide(sourceSlide, index, title);
      const { data: savedSlide, error: slideError } = await supabase
        .from('slide_pages')
        .insert({
          presentation_id: savedTemplate.id,
          page_order: index + 1,
          title: normalizedSlide.title,
          content_json: normalizedSlide.content,
          thumbnail_url: normalizedSlide.thumbnail_url,
        })
        .select('*')
        .single();

      if (slideError) {
        throw slideError;
      }

      savedSlides.push(savedSlide);
    }

    return normalizeDeck(savedTemplate, savedSlides);
  } catch (error) {
    await supabase.from('slide_pages').delete().eq('presentation_id', savedTemplate.id);
    await supabase.from('presentations').delete().eq('id', savedTemplate.id);
    await supabase.from('templates').delete().eq('id', savedTemplate.id);
    throw error;
  }
}

export async function getDeckForEditor(templateId, userId, userEmail = '') {
  requireValue(templateId, 'A template id is required to load the editor.');
  requireValue(userId, 'A signed-in user is required to load this slide.');

  const { data: template, error: templateError } = await fetchTemplateById(templateId);

  if (templateError) {
    throw templateError;
  }

  if (!template) {
    throw new Error('Slide draft was not found.');
  }

  const normalizedTemplate = normalizeTemplate(template);

  if (!canAccessTemplate(normalizedTemplate, { userEmail, userId })) {
    throw new Error('Slide draft was not found.');
  }

  const { data: slides, error: slidesError } = await fetchSlidePagesForTemplate(templateId);

  if (slidesError) {
    throw slidesError;
  }

  return normalizeDeck(normalizedTemplate, slides ?? []);
}

export async function listSavedTemplates(userId, userEmail = '') {
  requireValue(userId, 'A signed-in user is required to load saved slides.');

  const { data: ownedTemplates, error: templateError } = await fetchOwnedTemplates(userId);

  if (templateError) {
    throw templateError;
  }

  let invitedTemplates = [];

  if (userEmail) {
    const invitedQuery = buildInvitedTemplatesQuery(userEmail, 200);

    if (invitedQuery) {
      const { data: invitedData, error: invitedError } = await invitedQuery;

      if (invitedError && !isMissingShareSettingsError(invitedError)) {
        throw invitedError;
      }

      invitedTemplates = invitedError ? [] : invitedData ?? [];
    }
  }

  const templatesWithCounts = await attachSlideSummariesForSavedTemplates(
    dedupeTemplatesById([...(ownedTemplates ?? []), ...invitedTemplates]),
  );

  return templatesWithCounts
    .map((template) => ({
      ...normalizeTemplate(template),
      is_shared_with_me: Boolean(template.owner_id && template.owner_id !== userId),
    }))
    .filter((template) => canAccessTemplate(template, { userEmail, userId }))
    .sort((a, b) => getTemplateTimeValue(b) - getTemplateTimeValue(a));
}

export async function listRecentlyOpenedTemplates(userId, limit = 4) {
  requireValue(userId, 'A signed-in user is required to load recent slides.');

  const localRecentAccess = readLocalRecentTemplateAccess(userId).slice(0, Math.max(limit, 20));
  const { data: templates, error: templateError } = await fetchRecentlyOpenedTemplates(userId, limit);

  if (templateError) {
    if (!isMissingLastOpenedAtError(templateError)) {
      throw templateError;
    }
  }

  const [remoteTemplates, localTemplates] = await Promise.all([
    templateError ? [] : attachSlideSummaries(templates ?? []),
    listLocalRecentTemplates(userId, localRecentAccess),
  ]);

  const templateById = new Map();

  for (const template of localTemplates) {
    templateById.set(template.id, template);
  }

  for (const template of remoteTemplates) {
    const localTemplate = templateById.get(template.id);
    templateById.set(template.id, {
      ...localTemplate,
      ...template,
      last_opened_at: template.last_opened_at ?? localTemplate?.last_opened_at,
    });
  }

  return Array.from(templateById.values())
    .sort((a, b) => getRecentTemplateTimeValue(b) - getRecentTemplateTimeValue(a))
    .slice(0, limit);
}

export async function recordTemplateOpened({ templateId, userId }) {
  requireValue(templateId, 'A template id is required to record recent slide access.');
  requireValue(userId, 'A signed-in user is required to record recent slide access.');

  const openedAt = new Date().toISOString();
  writeLocalRecentTemplateAccess({ templateId, userId, openedAt });

  const { error: templateError } = await supabase
    .from('templates')
    .update({ last_opened_at: openedAt })
    .eq('id', templateId)
    .eq('owner_id', userId);

  if (templateError) {
    if (isMissingLastOpenedAtError(templateError)) {
      return null;
    }

    throw templateError;
  }

  const { error: presentationError } = await supabase
    .from('presentations')
    .update({ last_opened_at: openedAt })
    .eq('id', templateId)
    .eq('owner_id', userId);

  if (presentationError && !isMissingLastOpenedAtError(presentationError)) {
    throw presentationError;
  }

  return openedAt;
}

export async function deleteSavedTemplate(templateId, userId) {
  requireValue(templateId, 'A template id is required to delete a saved slide.');
  requireValue(userId, 'A signed-in user is required to delete a saved slide.');

  const { error: slideDeleteError } = await supabase
    .from('slide_pages')
    .delete()
    .eq('presentation_id', templateId);

  if (slideDeleteError) {
    throw slideDeleteError;
  }

  const { error: presentationDeleteError } = await supabase
    .from('presentations')
    .delete()
    .eq('id', templateId)
    .eq('owner_id', userId);

  if (presentationDeleteError) {
    throw presentationDeleteError;
  }

  const { error: templateDeleteError } = await supabase
    .from('templates')
    .delete()
    .eq('id', templateId)
    .eq('owner_id', userId);

  if (templateDeleteError) {
    throw templateDeleteError;
  }
}

export async function updateTemplateShareAccess({
  templateId,
  userId,
  accessMode,
  settings,
}) {
  requireValue(templateId, 'A template id is required to update sharing.');
  requireValue(userId, 'A signed-in user is required to update sharing.');

  const normalizedAccessMode = accessMode === 'link' ? 'public' : accessMode;
  const isPublic = normalizedAccessMode === 'public';
  const visibility = normalizedAccessMode === 'unlisted'
    ? 'unlisted'
    : isPublic
      ? 'public'
      : 'private';
  const normalizedSettings = normalizeShareSettings(settings, visibility);
  const nextShareSettings = {
    ...normalizedSettings,
    accessMode: visibility,
  };

  const { data: template, error: templateError } = await supabase
    .from('templates')
    .update({ is_public: isPublic, share_settings: nextShareSettings, visibility })
    .eq('id', templateId)
    .eq('owner_id', userId)
    .select('*')
    .single();

  if (
    templateError
    && !isMissingVisibilityError(templateError)
    && !isMissingShareSettingsError(templateError)
  ) {
    throw templateError;
  }

  let updatedTemplate = template;

  if (templateError) {
    const fallbackTemplatePayload = { is_public: isPublic };

    if (!isMissingVisibilityError(templateError)) {
      fallbackTemplatePayload.visibility = visibility;
    }

    if (!isMissingShareSettingsError(templateError)) {
      fallbackTemplatePayload.share_settings = nextShareSettings;
    }

    const { data: fallbackTemplate, error: fallbackTemplateError } = await supabase
      .from('templates')
      .update(fallbackTemplatePayload)
      .eq('id', templateId)
      .eq('owner_id', userId)
      .select('*')
      .single();

    if (fallbackTemplateError) {
      throw fallbackTemplateError;
    }

    updatedTemplate = {
      ...fallbackTemplate,
      visibility,
    };
  }

  const { error: presentationError } = await supabase
    .from('presentations')
    .update({ is_public: isPublic, share_settings: nextShareSettings, visibility })
    .eq('id', templateId)
    .eq('owner_id', userId);

  if (
    presentationError
    && !isMissingVisibilityError(presentationError)
    && !isMissingShareSettingsError(presentationError)
  ) {
    throw presentationError;
  }

  if (presentationError) {
    const fallbackPresentationPayload = { is_public: isPublic };

    if (!isMissingVisibilityError(presentationError)) {
      fallbackPresentationPayload.visibility = visibility;
    }

    if (!isMissingShareSettingsError(presentationError)) {
      fallbackPresentationPayload.share_settings = nextShareSettings;
    }

    const { error: fallbackPresentationError } = await supabase
      .from('presentations')
      .update(fallbackPresentationPayload)
      .eq('id', templateId)
      .eq('owner_id', userId);

    if (fallbackPresentationError) {
      throw fallbackPresentationError;
    }
  }

  return normalizeTemplate({
    ...updatedTemplate,
    share_settings: nextShareSettings,
    visibility,
  });
}

export async function updateTemplateShareSettings({
  templateId,
  userId,
  settings,
}) {
  requireValue(templateId, 'A template id is required to update sharing settings.');
  requireValue(userId, 'A signed-in user is required to update sharing settings.');

  const normalizedSettings = normalizeShareSettings(settings);

  const { data: template, error: templateError } = await supabase
    .from('templates')
    .update({ share_settings: normalizedSettings })
    .eq('id', templateId)
    .eq('owner_id', userId)
    .select('*')
    .single();

  if (templateError) {
    if (!isMissingShareSettingsError(templateError)) {
      throw templateError;
    }

    return {
      share_settings: normalizedSettings,
      share_settings_persisted: false,
    };
  }

  const { error: presentationError } = await supabase
    .from('presentations')
    .update({ share_settings: normalizedSettings })
    .eq('id', templateId)
    .eq('owner_id', userId);

  if (presentationError && !isMissingShareSettingsError(presentationError)) {
    throw presentationError;
  }

  return {
    ...normalizeTemplate(template),
    share_settings_persisted: !presentationError,
  };
}

export async function saveDeckForEditor({
  templateId,
  userId,
  title,
  slides,
}) {
  requireValue(userId, 'A signed-in user is required to save this slide.');
  requireValue(title, 'A slide name is required.');

  const normalizedTemplateId = isPersistedUuid(templateId) ? templateId : '';
  const isCreatingTemplate = !normalizedTemplateId;
  let resolvedTemplateId = normalizedTemplateId;
  let template;

  if (!resolvedTemplateId) {
    const { data: createdTemplate, error: templateInsertError } = await supabase
      .from('templates')
      .insert({
        owner_id: userId,
        title,
        description: null,
        thumbnail_url: null,
        is_public: false,
      })
      .select('*')
      .single();

    if (templateInsertError) {
      throw templateInsertError;
    }

    resolvedTemplateId = createdTemplate.id;
    template = createdTemplate;

    try {
      const { error: presentationInsertError } = await supabase
        .from('presentations')
        .insert({
          id: resolvedTemplateId,
          owner_id: userId,
          title,
          description: null,
          thumbnail_url: null,
          is_public: false,
        });

      if (presentationInsertError) {
        throw presentationInsertError;
      }
    } catch (error) {
      await supabase.from('presentations').delete().eq('id', resolvedTemplateId);
      await supabase.from('templates').delete().eq('id', resolvedTemplateId);
      throw error;
    }
  } else {
    const { data: updatedTemplate, error: templateError } = await supabase
      .from('templates')
      .update({ title })
      .eq('id', resolvedTemplateId)
      .eq('owner_id', userId)
      .select('*')
      .single();

    if (templateError) {
      throw templateError;
    }

    template = updatedTemplate;

    const { error: presentationError } = await supabase
      .from('presentations')
      .update({ title })
      .eq('id', resolvedTemplateId)
      .eq('owner_id', userId);

    if (presentationError) {
      throw presentationError;
    }
  }

  if (normalizedTemplateId) {
    const persistedSlideIds = (slides ?? [])
      .map((slide) => slide.id)
      .filter(isPersistedUuid);
    const { data: existingSlides, error: existingSlidesError } = await supabase
      .from('slide_pages')
      .select('id')
      .eq('presentation_id', resolvedTemplateId);

    if (existingSlidesError) {
      throw existingSlidesError;
    }

    const deletedSlideIds = (existingSlides ?? [])
      .map((slide) => slide.id)
      .filter((slideId) => !persistedSlideIds.includes(slideId));

    for (const slideId of deletedSlideIds) {
      const { error: deleteSlideError } = await supabase
        .from('slide_pages')
        .delete()
        .eq('id', slideId)
        .eq('presentation_id', resolvedTemplateId);

      if (deleteSlideError) {
        throw deleteSlideError;
      }
    }
  }

  const savedSlides = [];
  const slideCount = (slides ?? []).length;

  try {
    const { error: overflowDeleteError } = await supabase
      .from('slide_pages')
      .delete()
      .eq('presentation_id', resolvedTemplateId)
      .gt('page_order', slideCount);

    if (overflowDeleteError) {
      throw overflowDeleteError;
    }

    for (const [index, slide] of (slides ?? []).entries()) {
      const payload = {
        presentation_id: resolvedTemplateId,
        page_order: index + 1,
        title: slide.title || `${title} ${index + 1}`,
        content_json: { elements: slide.elements ?? [] },
        thumbnail_url: slide.thumbnail_url ?? null,
      };

      const { data: savedSlide, error: slideError } = await supabase
        .from('slide_pages')
        .upsert(payload, { onConflict: 'presentation_id,page_order' })
        .select('*')
        .single();

      if (slideError) {
        throw slideError;
      }

      savedSlides.push(savedSlide);
    }

    return normalizeDeck(template, savedSlides);
  } catch (error) {
    if (isCreatingTemplate) {
      await supabase.from('slide_pages').delete().eq('presentation_id', resolvedTemplateId);
      await supabase.from('presentations').delete().eq('id', resolvedTemplateId);
      await supabase.from('templates').delete().eq('id', resolvedTemplateId);
    }

    throw error;
  }
}

export async function updateTemplateRating(templateId, ratingValue) {
  requireValue(templateId, 'A template id is required to submit a rating.');
  requireValue(ratingValue, 'A rating value is required.');

  const normalizedRating = Number(ratingValue);

  if (!Number.isFinite(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
    throw new Error('Rating must be a number between 1 and 5.');
  }

  const { data: currentTemplate, error: fetchError } = await supabase
    .from('templates')
    .select('rating_average,rating_count')
    .eq('id', templateId)
    .maybeSingle();

  if (fetchError) {
    if (isMissingColumnError(fetchError, 'rating_average') || isMissingColumnError(fetchError, 'rating_count')) {
      throw new Error('Database schema is missing templates.rating_average or templates.rating_count. Run backend/database/schema.sql and reload the Supabase schema cache.');
    }

    throw fetchError;
  }

  const currentAverage = Number(currentTemplate?.rating_average ?? 0);
  const currentCount = Math.max(0, Number(currentTemplate?.rating_count ?? 0));
  const nextCount = currentCount + 1;
  const nextAverage = Number((((currentAverage || 0) * currentCount + normalizedRating) / nextCount).toFixed(1));

  const { data, error } = await supabase
    .from('templates')
    .update({
      rating_average: nextAverage,
      rating_count: nextCount,
    })
    .eq('id', templateId)
    .select('*')
    .maybeSingle();

  if (error) {
    if (isMissingColumnError(error, 'rating_average') || isMissingColumnError(error, 'rating_count')) {
      throw new Error('Database schema is missing templates.rating_average or templates.rating_count. Run backend/database/schema.sql and reload the Supabase schema cache.');
    }

    throw error;
  }

  return data;
}
