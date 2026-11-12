DROP POLICY IF EXISTS "Allow anonymous feedback inserts" ON public.feedback;
CREATE POLICY "Validated feedback inserts"
ON public.feedback
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (user_id IS NULL OR user_id = auth.uid())
  AND char_length(btrim(message)) BETWEEN 1 AND 5000
  AND char_length(category) BETWEEN 1 AND 50
);