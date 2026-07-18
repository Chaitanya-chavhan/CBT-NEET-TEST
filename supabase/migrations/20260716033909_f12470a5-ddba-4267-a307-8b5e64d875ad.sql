
-- Drop old auth-based schema
DROP TABLE IF EXISTS public.answers CASCADE;
DROP TABLE IF EXISTS public.attempts CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.sections CASCADE;
DROP TABLE IF EXISTS public.tests CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;

-- Test Series
CREATE TABLE public.test_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  thumbnail_url text,
  starts_on date,
  ends_on date,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.test_series TO anon, authenticated;
GRANT ALL ON public.test_series TO service_role;
ALTER TABLE public.test_series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published series" ON public.test_series FOR SELECT USING (published = true);

-- Tests
CREATE TABLE public.tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id uuid REFERENCES public.test_series(id) ON DELETE CASCADE,
  title text NOT NULL,
  thumbnail_url text,
  duration_min integer NOT NULL DEFAULT 180,
  plus_marks numeric NOT NULL DEFAULT 4,
  minus_marks numeric NOT NULL DEFAULT 1,
  scheduled_at timestamptz,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tests TO anon, authenticated;
GRANT ALL ON public.tests TO service_role;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published tests" ON public.tests FOR SELECT USING (published = true);
CREATE INDEX ON public.tests(series_id);

-- Questions
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  correct_option text NOT NULL CHECK (correct_option IN ('A','B','C','D')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.questions TO anon, authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read questions" ON public.questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.tests t WHERE t.id = questions.test_id AND t.published = true)
);
CREATE INDEX ON public.questions(test_id);
