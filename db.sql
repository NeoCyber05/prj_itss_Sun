CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

SET search_path = public, extensions;

-- RakuSlide demo schema for Supabase.
-- Supabase Auth stores account/login data in auth.users.
-- This file only stores simple app data, but keeps all core demo features:
-- profile, template search/save/review, presentation editing, quiz page,
-- and sharing by link or by user.

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT UNIQUE,
    phone_number TEXT,
    avatar_url TEXT
);

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE
);

-- A template is one reusable pre-made slide/page.
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    page_type TEXT NOT NULL DEFAULT 'content'
        CHECK (page_type IN ('content', 'quiz')),
    layout_type TEXT NOT NULL DEFAULT 'standard',
    content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    thumbnail_url TEXT,
    is_public BOOLEAN NOT NULL DEFAULT TRUE
);

-- A presentation is the user's real slide deck.
CREATE TABLE IF NOT EXISTS public.presentations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    is_public BOOLEAN NOT NULL DEFAULT FALSE
);

-- Each presentation contains many pages.
-- Quiz is just a page with page_type = 'quiz' and quiz data inside content_json.
-- AI text and inserted images are also stored inside content_json after applied.
CREATE TABLE IF NOT EXISTS public.slide_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presentation_id UUID NOT NULL REFERENCES public.presentations(id) ON DELETE CASCADE,
    source_template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
    page_order INT NOT NULL CHECK (page_order > 0),
    title TEXT,
    page_type TEXT NOT NULL DEFAULT 'content'
        CHECK (page_type IN ('content', 'quiz')),
    layout_type TEXT NOT NULL DEFAULT 'standard',
    content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    thumbnail_url TEXT,
    UNIQUE (presentation_id, page_order)
);

CREATE TABLE IF NOT EXISTS public.saved_templates (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, template_id)
);

-- One share table is enough for demo.
-- Use either presentation_id or template_id depending on what is shared.
CREATE TABLE IF NOT EXISTS public.shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presentation_id UUID REFERENCES public.presentations(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.templates(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    share_token TEXT UNIQUE,
    permission TEXT NOT NULL DEFAULT 'viewer'
        CHECK (permission IN ('viewer', 'editor')),
    CHECK (
        (presentation_id IS NOT NULL AND template_id IS NULL)
        OR
        (presentation_id IS NULL AND template_id IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS public.template_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT CHECK (comment IS NULL OR char_length(comment) <= 500),
    UNIQUE (template_id, user_id)
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE INDEX IF NOT EXISTS idx_templates_category_id ON public.templates(category_id);
CREATE INDEX IF NOT EXISTS idx_templates_is_public ON public.templates(is_public);
CREATE INDEX IF NOT EXISTS idx_presentations_owner_id ON public.presentations(owner_id);
CREATE INDEX IF NOT EXISTS idx_slide_pages_presentation_order
    ON public.slide_pages(presentation_id, page_order);
CREATE INDEX IF NOT EXISTS idx_shares_presentation_id ON public.shares(presentation_id);
CREATE INDEX IF NOT EXISTS idx_shares_template_id ON public.shares(template_id);
