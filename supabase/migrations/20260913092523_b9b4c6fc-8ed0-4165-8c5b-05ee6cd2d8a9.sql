
revoke execute on function public.gen_referral_code() from anon, authenticated, public;
revoke execute on function public.handle_new_user() from anon, authenticated, public;
drop function if exists public.get_balance(uuid);

create or replace function public.my_balance()
returns table (total bigint, pending bigint, today bigint, week bigint)
language sql stable security invoker set search_path = public as $$
  select
    coalesce(sum(amount) filter (where status = 'CONFIRMED'), 0)::bigint,
    coalesce(sum(amount) filter (where status = 'PENDING'), 0)::bigint,
    coalesce(sum(amount) filter (where status = 'CONFIRMED' and created_at >= date_trunc('day', now())), 0)::bigint,
    coalesce(sum(amount) filter (where status = 'CONFIRMED' and created_at >= now() - interval '7 days'), 0)::bigint
  from public.points_ledger where user_id = auth.uid()
$$;
revoke execute on function public.my_balance() from anon;

create policy "no client access" on public.provider_secrets for all to authenticated using (false) with check (false);
create policy "no client access" on public.phone_verifications for all to authenticated using (false) with check (false);
create policy "no client access" on public.login_attempts for all to authenticated using (false) with check (false);
create policy "no client access" on public.rate_limits for all to authenticated using (false) with check (false);
