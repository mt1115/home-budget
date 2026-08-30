-- Development only: allow browser clients using the publishable key to read mock/shared data.
-- Do not use this as the final husband/wife-only security model.
-- Final production should use Supabase Auth + household based RLS policies.

grant usage on schema public to anon, authenticated;
grant select on households to anon, authenticated;
grant select on profiles to anon, authenticated;
grant select on settings to anon, authenticated;
grant select on categories to anon, authenticated;
grant select on items to anon, authenticated;
grant select on tags to anon, authenticated;
grant select on item_tags to anon, authenticated;

drop policy if exists "dev read households" on households;
drop policy if exists "dev read profiles" on profiles;
drop policy if exists "dev read settings" on settings;
drop policy if exists "dev read categories" on categories;
drop policy if exists "dev read items" on items;
drop policy if exists "dev read tags" on tags;
drop policy if exists "dev read item tags" on item_tags;

create policy "dev read households" on households for select to anon, authenticated using (true);
create policy "dev read profiles" on profiles for select to anon, authenticated using (true);
create policy "dev read settings" on settings for select to anon, authenticated using (true);
create policy "dev read categories" on categories for select to anon, authenticated using (true);
create policy "dev read items" on items for select to anon, authenticated using (true);
create policy "dev read tags" on tags for select to anon, authenticated using (true);
create policy "dev read item tags" on item_tags for select to anon, authenticated using (true);
