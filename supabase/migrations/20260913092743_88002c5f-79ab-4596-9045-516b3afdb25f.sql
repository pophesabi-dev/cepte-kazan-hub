
create or replace function public.bump_rate_limit(p_bucket text, p_identity text, p_window_seconds integer)
returns integer language plpgsql security definer set search_path = public as $$
declare w timestamptz; c integer; begin
  w := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into public.rate_limits (bucket, identity, window_start, count)
  values (p_bucket, p_identity, w, 1)
  on conflict (bucket, identity, window_start) do update set count = public.rate_limits.count + 1
  returning count into c;
  return c;
end; $$;

create or replace function public.award_offer_points(
  p_user uuid, p_provider uuid, p_offer uuid, p_tx text, p_points bigint,
  p_type public.ledger_type, p_meta jsonb default '{}'::jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare v_ref text; v_mult numeric; v_final bigint; begin
  if p_points <= 0 then return 'INVALID_AMOUNT'; end if;
  select coalesce(points_multiplier, 1) into v_mult from public.offer_providers where id = p_provider;
  v_final := floor(p_points * coalesce(v_mult, 1))::bigint;
  v_ref := coalesce(p_provider::text, 'internal') || ':' || p_tx;

  begin
    insert into public.offer_completions (user_id, provider_id, offer_id, external_transaction_id, points, status, metadata)
    values (p_user, p_provider, p_offer, p_tx, v_final, 'CONFIRMED', p_meta);
  exception when unique_violation then
    return 'DUPLICATE';
  end;

  begin
    insert into public.points_ledger (user_id, type, amount, status, reference, description, metadata)
    values (p_user, p_type, v_final, 'CONFIRMED', v_ref, 'Görev ödülü', p_meta);
  exception when unique_violation then
    return 'DUPLICATE';
  end;

  insert into public.notifications (user_id, title, body, kind)
  values (p_user, 'Görev ödülün hesabına eklendi', v_final || ' puan kazandın.', 'POINTS');
  return 'OK';
end; $$;

create or replace function public.create_withdrawal(p_user uuid, p_method uuid, p_points bigint)
returns json language plpgsql security definer set search_path = public as $$
declare v_balance bigint; v_min integer; v_active boolean; v_phone boolean; v_status text;
        v_level text; v_id uuid; begin
  if p_points is null or p_points <= 0 then return json_build_object('ok', false, 'error', 'INVALID_AMOUNT'); end if;

  select is_active, min_points into v_active, v_min from public.withdrawal_methods where id = p_method;
  if v_active is null then return json_build_object('ok', false, 'error', 'METHOD_NOT_FOUND'); end if;
  if not v_active then return json_build_object('ok', false, 'error', 'METHOD_INACTIVE'); end if;

  select phone_verified, status into v_phone, v_status from public.profiles where id = p_user for update;
  if v_status is distinct from 'ACTIVE' then return json_build_object('ok', false, 'error', 'ACCOUNT_RESTRICTED'); end if;
  if not coalesce(v_phone, false) then return json_build_object('ok', false, 'error', 'PHONE_NOT_VERIFIED'); end if;
  if p_points < v_min then return json_build_object('ok', false, 'error', 'BELOW_MINIMUM'); end if;

  select coalesce(sum(amount), 0) into v_balance from public.points_ledger
    where user_id = p_user and status in ('CONFIRMED','PENDING');
  if v_balance < p_points then return json_build_object('ok', false, 'error', 'INSUFFICIENT_BALANCE'); end if;

  select level into v_level from public.risk_scores where user_id = p_user;

  insert into public.withdrawals (user_id, method_id, points, status)
  values (p_user, p_method, p_points, case when coalesce(v_level,'LOW') = 'HIGH' then 'REVIEW' else 'PENDING' end)
  returning id into v_id;

  insert into public.points_ledger (user_id, type, amount, status, reference, description)
  values (p_user, 'WITHDRAWAL', -p_points, 'PENDING', 'wd:' || v_id::text, 'Çekim talebi');

  insert into public.notifications (user_id, title, body, kind)
  values (p_user, 'Çekim talebin alındı', 'Talebin incelemeye alındı.', 'WITHDRAWAL');

  return json_build_object('ok', true, 'id', v_id);
end; $$;

create or replace function public.admin_adjust_points(
  p_admin uuid, p_user uuid, p_amount bigint, p_reason text)
returns json language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(p_admin) then return json_build_object('ok', false, 'error', 'FORBIDDEN'); end if;
  if p_amount = 0 then return json_build_object('ok', false, 'error', 'INVALID_AMOUNT'); end if;
  insert into public.points_ledger (user_id, type, amount, status, description, created_by)
  values (p_user, 'ADMIN_ADJUSTMENT', p_amount, 'CONFIRMED', coalesce(p_reason,'Manuel düzeltme'), p_admin);
  return json_build_object('ok', true);
end; $$;

revoke execute on function public.bump_rate_limit(text,text,integer) from anon, authenticated, public;
revoke execute on function public.award_offer_points(uuid,uuid,uuid,text,bigint,public.ledger_type,jsonb) from anon, authenticated, public;
revoke execute on function public.create_withdrawal(uuid,uuid,bigint) from anon, authenticated, public;
revoke execute on function public.admin_adjust_points(uuid,uuid,bigint,text) from anon, authenticated, public;
