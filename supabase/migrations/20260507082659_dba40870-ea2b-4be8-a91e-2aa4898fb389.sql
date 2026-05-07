ALTER TABLE public.modules DROP CONSTRAINT IF EXISTS modules_position_key;
CREATE UNIQUE INDEX IF NOT EXISTS modules_course_position_key ON public.modules(course_id, position);