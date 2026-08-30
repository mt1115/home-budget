-- Temporary write policies for the login-protected prototype.
-- Run this after schema.sql / seed.sql when you want the app to save data from the browser.
-- Tighten these policies before using the app beyond the household-only prototype.

grant insert, update, delete on settings to authenticated;
grant insert, update, delete on categories to authenticated;
grant insert, update, delete on items to authenticated;
grant insert, update, delete on tags to authenticated;
grant insert, update, delete on item_tags to authenticated;

drop policy if exists "dev write settings" on settings;
drop policy if exists "dev write categories" on categories;
drop policy if exists "dev write items" on items;
drop policy if exists "dev write tags" on tags;
drop policy if exists "dev write item tags" on item_tags;

create policy "dev write settings" on settings for all to authenticated using (true) with check (true);
create policy "dev write categories" on categories for all to authenticated using (true) with check (true);
create policy "dev write items" on items for all to authenticated using (true) with check (true);
create policy "dev write tags" on tags for all to authenticated using (true) with check (true);
create policy "dev write item tags" on item_tags for all to authenticated using (true) with check (true);
