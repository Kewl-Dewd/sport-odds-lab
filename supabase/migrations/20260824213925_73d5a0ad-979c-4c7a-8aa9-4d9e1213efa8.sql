create policy "Allow anonymous feedback inserts"
  on public.feedback
  for insert
  to anon, authenticated
  with check (true);

create policy "Service role can read all feedback"
  on public.feedback
  for select
  to service_role
  using (true);