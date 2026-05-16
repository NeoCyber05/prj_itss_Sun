import { supabase } from '../supabaseClient';

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

function getCopy(language) {
  return DEFAULT_COPY[language] ?? DEFAULT_COPY.ja;
}

function requireValue(value, message) {
  if (!value) {
    throw new Error(message);
  }

  return value;
}

function normalizeTemplate(row) {
  return {
    ...row,
    slide_count: row.slide_count ?? row.page_count ?? 1,
    visibility: row.visibility ?? (row.is_public ? 'public' : 'private'),
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
  const message = String(error?.message ?? '');

  return error?.code === '42703'
    || error?.code === 'PGRST204'
    || message.includes('last_opened_at');
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

  const { data: slides, error: slidesError } = await supabase
    .from('slide_pages')
    .select('id,presentation_id,page_order,title,content_json,thumbnail_url')
    .in('presentation_id', templateIds)
    .order('page_order', { ascending: true });

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

async function listLocalRecentTemplates(userId, recentAccess) {
  const recentTemplateIds = recentAccess.map((item) => item.templateId);

  if (!recentTemplateIds.length) {
    return [];
  }

  const openedAtByTemplateId = new Map(
    recentAccess.map((item) => [item.templateId, item.openedAt]),
  );

  const { data: templates, error: templateError } = await supabase
    .from('templates')
    .select('*')
    .eq('owner_id', userId)
    .in('id', recentTemplateIds);

  if (templateError) {
    throw templateError;
  }

  const templatesWithCounts = await attachSlideSummaries(templates ?? []);

  return templatesWithCounts.map((template) => ({
    ...template,
    last_opened_at: template.last_opened_at ?? openedAtByTemplateId.get(template.id),
  }));
}

export async function createBlankDeck({ userId, language }) {
  requireValue(userId, 'A signed-in user is required to create a slide.');

  const copy = getCopy(language);

  const { data: template, error: templateError } = await supabase
    .from('templates')
    .insert({
      owner_id: userId,
      title: copy.deckTitle,
      description: null,
      thumbnail_url: null,
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
        id: template.id,
        owner_id: userId,
        title: copy.deckTitle,
        description: null,
        thumbnail_url: null,
        is_public: false,
      });

    if (presentationError) {
      throw presentationError;
    }

    const { data: slide, error: slideError } = await supabase
      .from('slide_pages')
      .insert({
        presentation_id: template.id,
        page_order: 1,
        title: copy.slideTitle,
        content_json: { elements: [] },
        thumbnail_url: null,
      })
      .select('*')
      .single();

    if (slideError) {
      throw slideError;
    }

    return normalizeDeck(template, [slide]);
  } catch (error) {
    await supabase.from('slide_pages').delete().eq('presentation_id', template.id);
    await supabase.from('presentations').delete().eq('id', template.id);
    await supabase.from('templates').delete().eq('id', template.id);
    throw error;
  }
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

export async function getDeckForEditor(templateId, userId) {
  requireValue(templateId, 'A template id is required to load the editor.');
  requireValue(userId, 'A signed-in user is required to load this slide.');

  const { data: template, error: templateError } = await supabase
    .from('templates')
    .select('*')
    .eq('id', templateId)
    .or(`owner_id.eq.${userId},is_public.eq.true`)
    .maybeSingle();

  if (templateError) {
    throw templateError;
  }

  if (!template) {
    throw new Error('Slide draft was not found.');
  }

  const { data: slides, error: slidesError } = await supabase
    .from('slide_pages')
    .select('*')
    .eq('presentation_id', templateId)
    .order('page_order', { ascending: true });

  if (slidesError) {
    throw slidesError;
  }

  return normalizeDeck(template, slides ?? []);
}

export async function listSavedTemplates(userId) {
  requireValue(userId, 'A signed-in user is required to load saved slides.');

  const { data: templates, error: templateError } = await supabase
    .from('templates')
    .select('*')
    .eq('owner_id', userId);

  if (templateError) {
    throw templateError;
  }

  const templatesWithCounts = await attachSlideSummaries(templates ?? []);

  return templatesWithCounts
    .sort((a, b) => getTemplateTimeValue(b) - getTemplateTimeValue(a));
}

export async function listRecentlyOpenedTemplates(userId, limit = 4) {
  requireValue(userId, 'A signed-in user is required to load recent slides.');

  const localRecentAccess = readLocalRecentTemplateAccess(userId).slice(0, Math.max(limit, 20));
  const { data: templates, error: templateError } = await supabase
    .from('templates')
    .select('*')
    .eq('owner_id', userId)
    .not('last_opened_at', 'is', null)
    .order('last_opened_at', { ascending: false })
    .limit(limit);

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
}) {
  requireValue(templateId, 'A template id is required to update sharing.');
  requireValue(userId, 'A signed-in user is required to update sharing.');

  const isPublic = accessMode === 'link' || accessMode === 'public';

  const { data: template, error: templateError } = await supabase
    .from('templates')
    .update({ is_public: isPublic })
    .eq('id', templateId)
    .eq('owner_id', userId)
    .select('*')
    .single();

  if (templateError) {
    throw templateError;
  }

  const { error: presentationError } = await supabase
    .from('presentations')
    .update({ is_public: isPublic })
    .eq('id', templateId)
    .eq('owner_id', userId);

  if (presentationError) {
    throw presentationError;
  }

  return normalizeTemplate(template);
}

export async function saveDeckForEditor({
  templateId,
  userId,
  title,
  slides,
}) {
  requireValue(templateId, 'A template id is required to save the slide.');
  requireValue(userId, 'A signed-in user is required to save this slide.');
  requireValue(title, 'A slide name is required.');

  const { data: template, error: templateError } = await supabase
    .from('templates')
    .update({ title })
    .eq('id', templateId)
    .eq('owner_id', userId)
    .select('*')
    .single();

  if (templateError) {
    throw templateError;
  }

  const { error: presentationError } = await supabase
    .from('presentations')
    .update({ title })
    .eq('id', templateId)
    .eq('owner_id', userId);

  if (presentationError) {
    throw presentationError;
  }

  const persistedSlideIds = (slides ?? [])
    .map((slide) => slide.id)
    .filter(isPersistedUuid);
  const { data: existingSlides, error: existingSlidesError } = await supabase
    .from('slide_pages')
    .select('id')
    .eq('presentation_id', templateId);

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
      .eq('presentation_id', templateId);

    if (deleteSlideError) {
      throw deleteSlideError;
    }
  }

  const savedSlides = [];

  for (const [index, slide] of (slides ?? []).entries()) {
    const payload = {
      presentation_id: templateId,
      page_order: index + 1,
      title: slide.title || `${title} ${index + 1}`,
      content_json: { elements: slide.elements ?? [] },
      thumbnail_url: slide.thumbnail_url ?? null,
    };

    if (isPersistedUuid(slide.id)) {
      const { data: savedSlide, error: slideError } = await supabase
        .from('slide_pages')
        .update(payload)
        .eq('id', slide.id)
        .eq('presentation_id', templateId)
        .select('*')
        .single();

      if (slideError) {
        throw slideError;
      }

      savedSlides.push(savedSlide);
    } else {
      const { data: savedSlide, error: slideError } = await supabase
        .from('slide_pages')
        .insert(payload)
        .select('*')
        .single();

      if (slideError) {
        throw slideError;
      }

      savedSlides.push(savedSlide);
    }
  }

  return normalizeDeck(template, savedSlides);
}
