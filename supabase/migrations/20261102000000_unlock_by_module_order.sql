-- A module unlocks when the module before it (by position order) is complete.
-- Before: it looked for exactly position - 1, so a gap left by deleting a module
-- (positions 1, 3, ...) kept the next lesson locked forever, while the course page
-- (which uses list order) showed it as unlocked.
CREATE OR REPLACE FUNCTION public.is_module_unlocked(_user_id UUID, _module_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _pos    INT;
  _course UUID;
  _prev   UUID;
BEGIN
  SELECT position, course_id INTO _pos, _course
  FROM public.modules WHERE id = _module_id;

  IF _pos IS NULL THEN RETURN false; END IF;

  SELECT id INTO _prev
  FROM public.modules
  WHERE course_id = _course
    AND (position < _pos OR (position = _pos AND id < _module_id))
  ORDER BY position DESC, id DESC
  LIMIT 1;

  IF _prev IS NULL THEN RETURN true; END IF;  -- first module

  RETURN EXISTS (
    SELECT 1 FROM public.module_progress
    WHERE user_id = _user_id AND module_id = _prev AND completed
  );
END;
$$;
