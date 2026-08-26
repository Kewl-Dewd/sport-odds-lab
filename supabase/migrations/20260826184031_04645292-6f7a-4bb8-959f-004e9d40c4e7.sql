CREATE POLICY "Class members can view bets in their class"
ON public.bets
FOR SELECT
TO authenticated
USING (class_id IS NOT NULL AND public.is_class_member(class_id));