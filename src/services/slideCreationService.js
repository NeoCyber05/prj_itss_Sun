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

function isPersistedUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(String(value ?? ''));
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

export async function getDeckForEditor(templateId, userId) {
  requireValue(templateId, 'A template id is required to load the editor.');
  requireValue(userId, 'A signed-in user is required to load this slide.');

  const { data: template, error: templateError } = await supabase
    .from('templates')
    .select('*')
    .eq('id', templateId)
    .eq('owner_id', userId)
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
