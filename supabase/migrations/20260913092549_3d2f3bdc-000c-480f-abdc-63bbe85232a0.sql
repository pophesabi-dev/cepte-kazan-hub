
drop policy "public settings readable" on public.site_settings;
create policy "anon reads public settings" on public.site_settings for select to anon using (is_public);
create policy "auth reads settings" on public.site_settings for select to authenticated using (is_public or public.is_admin(auth.uid()));

drop policy "active providers readable" on public.offer_providers;
create policy "anon reads active providers" on public.offer_providers for select to anon using (is_active);
create policy "auth reads providers" on public.offer_providers for select to authenticated using (is_active or public.is_admin(auth.uid()));

drop policy "active offers readable" on public.offers;
create policy "anon reads active offers" on public.offers for select to anon using (is_active);
create policy "auth reads offers" on public.offers for select to authenticated using (is_active or public.is_admin(auth.uid()));

revoke execute on function public.is_admin(uuid) from anon, public;
revoke execute on function public.has_role(uuid, public.app_role) from anon, public;
