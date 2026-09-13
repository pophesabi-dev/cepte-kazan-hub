
-- ============ ROLES ============
create type public.app_role as enum ('USER','MODERATOR','ADMIN','SUPER_ADMIN');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('ADMIN','SUPER_ADMIN'))
$$;

create policy "read own roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key,
  display_name text,
  avatar_url text,
  country text,
  referral_code text not null unique,
  referred_by uuid,
  phone_verified boolean not null default false,
  phone_hash text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','RESTRICTED','SUSPENDED','BANNED')),
  signup_ip_hash text,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "read own profile" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin(auth.uid()));
create policy "update own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.gen_referral_code()
returns text language plpgsql volatile set search_path = public as $$
declare code text; begin
  loop
    code := 'CK' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
    exit when not exists (select 1 from public.profiles where referral_code = code);
  end loop;
  return code;
end; $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url, referral_code)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)),
          new.raw_user_meta_data->>'avatar_url',
          public.gen_referral_code())
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'USER') on conflict do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ SITE SETTINGS ============
create table public.site_settings (
  key text primary key,
  value jsonb not null,
  is_public boolean not null default false,
  updated_at timestamptz not null default now()
);
grant select on public.site_settings to anon, authenticated;
grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;
create policy "public settings readable" on public.site_settings for select to anon, authenticated
  using (is_public or public.is_admin(auth.uid()));

insert into public.site_settings (key, value, is_public) values
  ('demo_mode', 'true'::jsonb, true),
  ('site_name', '"Ceptekazanç"'::jsonb, true),
  ('maintenance_mode', 'false'::jsonb, true),
  ('points_per_unit', '1000'::jsonb, false),
  ('min_withdrawal_points', '10000'::jsonb, true),
  ('referral_bonus_points', '0'::jsonb, false),
  ('vpn_detection', 'false'::jsonb, false),
  ('proxy_detection', 'false'::jsonb, false),
  ('tor_detection', 'false'::jsonb, false),
  ('ads_module_enabled', 'false'::jsonb, true);

-- ============ PROVIDERS ============
create table public.offer_providers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  logo_url text,
  category text not null default 'OFFERWALL' check (category in ('SURVEY','GAME','APP','OFFERWALL','ADS')),
  is_active boolean not null default false,
  points_multiplier numeric(6,3) not null default 1.0,
  min_reward integer not null default 0,
  countries text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.offer_providers to anon, authenticated;
grant all on public.offer_providers to service_role;
alter table public.offer_providers enable row level security;
create policy "active providers readable" on public.offer_providers for select to anon, authenticated
  using (is_active or public.is_admin(auth.uid()));
create policy "admins manage providers" on public.offer_providers for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
grant insert, update, delete on public.offer_providers to authenticated;

-- secrets: never exposed to the API roles
create table public.provider_secrets (
  provider_id uuid primary key references public.offer_providers(id) on delete cascade,
  api_key text,
  api_secret text,
  callback_secret text,
  postback_url text,
  updated_at timestamptz not null default now()
);
grant all on public.provider_secrets to service_role;
alter table public.provider_secrets enable row level security;

-- ============ OFFERS ============
create table public.offers (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references public.offer_providers(id) on delete cascade,
  external_id text,
  title text not null,
  description text,
  requirement text,
  category text not null default 'OFFERWALL' check (category in ('SURVEY','GAME','APP','OFFERWALL','ADS')),
  reward_points integer,
  image_url text,
  url text,
  countries text[] not null default '{}',
  is_active boolean not null default true,
  is_demo boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.offers to anon, authenticated;
grant insert, update, delete on public.offers to authenticated;
grant all on public.offers to service_role;
alter table public.offers enable row level security;
create policy "active offers readable" on public.offers for select to anon, authenticated
  using (is_active or public.is_admin(auth.uid()));
create policy "admins manage offers" on public.offers for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ============ POINTS LEDGER (append-only) ============
create type public.ledger_type as enum
  ('OFFER_COMPLETED','SURVEY_COMPLETED','REFERRAL_BONUS','ADMIN_ADJUSTMENT','WITHDRAWAL','REVERSAL','CHARGEBACK','SIGNUP_BONUS');

create table public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type public.ledger_type not null,
  amount bigint not null,
  status text not null default 'CONFIRMED' check (status in ('PENDING','CONFIRMED','REVERSED')),
  reference text,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index points_ledger_user_idx on public.points_ledger (user_id, created_at desc);
create unique index points_ledger_reference_idx on public.points_ledger (reference) where reference is not null;
grant select on public.points_ledger to authenticated;
grant all on public.points_ledger to service_role;
alter table public.points_ledger enable row level security;
create policy "read own ledger" on public.points_ledger for select to authenticated
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

create or replace function public.block_ledger_mutation()
returns trigger language plpgsql set search_path = public as $$
begin raise exception 'points_ledger is append-only'; end; $$;
create trigger points_ledger_immutable before update or delete on public.points_ledger
  for each row execute function public.block_ledger_mutation();

create or replace function public.get_balance(_user_id uuid)
returns table (total bigint, pending bigint, today bigint, week bigint)
language sql stable security definer set search_path = public as $$
  select
    coalesce(sum(amount) filter (where status = 'CONFIRMED'), 0)::bigint,
    coalesce(sum(amount) filter (where status = 'PENDING'), 0)::bigint,
    coalesce(sum(amount) filter (where status = 'CONFIRMED' and created_at >= date_trunc('day', now())), 0)::bigint,
    coalesce(sum(amount) filter (where status = 'CONFIRMED' and created_at >= now() - interval '7 days'), 0)::bigint
  from public.points_ledger where user_id = _user_id
$$;

-- ============ COMPLETIONS / POSTBACKS ============
create table public.offer_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  provider_id uuid references public.offer_providers(id) on delete set null,
  offer_id uuid references public.offers(id) on delete set null,
  external_transaction_id text not null,
  points bigint not null default 0,
  status text not null default 'PENDING' check (status in ('PENDING','CONFIRMED','REVERSED','REJECTED')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (provider_id, external_transaction_id)
);
grant select on public.offer_completions to authenticated;
grant all on public.offer_completions to service_role;
alter table public.offer_completions enable row level security;
create policy "read own completions" on public.offer_completions for select to authenticated
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

create table public.postbacks (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references public.offer_providers(id) on delete set null,
  provider_slug text,
  external_transaction_id text,
  nonce text,
  signature_valid boolean not null default false,
  accepted boolean not null default false,
  reason text,
  ip_hash text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create unique index postbacks_nonce_idx on public.postbacks (provider_slug, nonce) where nonce is not null;
grant select on public.postbacks to authenticated;
grant all on public.postbacks to service_role;
alter table public.postbacks enable row level security;
create policy "admins read postbacks" on public.postbacks for select to authenticated
  using (public.is_admin(auth.uid()));

-- ============ REFERRALS ============
create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null,
  referred_id uuid not null unique,
  status text not null default 'PENDING' check (status in ('PENDING','ACTIVE','REWARDED','BLOCKED')),
  bonus_points bigint not null default 0,
  risk_flag text,
  created_at timestamptz not null default now()
);
grant select on public.referrals to authenticated;
grant all on public.referrals to service_role;
alter table public.referrals enable row level security;
create policy "read own referrals" on public.referrals for select to authenticated
  using (referrer_id = auth.uid() or referred_id = auth.uid() or public.is_admin(auth.uid()));

-- ============ WITHDRAWALS ============
create table public.withdrawal_methods (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  logo_url text,
  is_active boolean not null default false,
  min_points integer not null default 10000,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.withdrawal_methods to anon, authenticated;
grant insert, update, delete on public.withdrawal_methods to authenticated;
grant all on public.withdrawal_methods to service_role;
alter table public.withdrawal_methods enable row level security;
create policy "methods readable" on public.withdrawal_methods for select to anon, authenticated using (true);
create policy "admins manage methods" on public.withdrawal_methods for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create table public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  method_id uuid references public.withdrawal_methods(id) on delete set null,
  points bigint not null check (points > 0),
  status text not null default 'PENDING' check (status in ('PENDING','REVIEW','APPROVED','REJECTED','PAID')),
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.withdrawals to authenticated;
grant all on public.withdrawals to service_role;
alter table public.withdrawals enable row level security;
create policy "read own withdrawals" on public.withdrawals for select to authenticated
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

-- ============ PHONE VERIFICATION ============
create table public.phone_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  phone_hash text not null,
  code_hash text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
grant all on public.phone_verifications to service_role;
alter table public.phone_verifications enable row level security;

-- ============ RISK ============
create table public.risk_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  type text not null,
  severity text not null default 'LOW' check (severity in ('LOW','MEDIUM','HIGH')),
  signals jsonb not null default '{}'::jsonb,
  ip_hash text,
  created_at timestamptz not null default now()
);
grant select on public.risk_events to authenticated;
grant all on public.risk_events to service_role;
alter table public.risk_events enable row level security;
create policy "admins read risk events" on public.risk_events for select to authenticated
  using (public.is_admin(auth.uid()));

create table public.risk_scores (
  user_id uuid primary key,
  score integer not null default 0,
  level text not null default 'LOW' check (level in ('LOW','MEDIUM','HIGH')),
  reasons jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
grant select on public.risk_scores to authenticated;
grant all on public.risk_scores to service_role;
alter table public.risk_scores enable row level security;
create policy "read own risk score" on public.risk_scores for select to authenticated
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

-- ============ NOTIFICATIONS ============
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  body text,
  kind text not null default 'INFO',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "read own notifications" on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy "update own notifications" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============ AUDIT / LOGIN ATTEMPTS ============
create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid,
  action text not null,
  target_user_id uuid,
  target_table text,
  target_id text,
  old_value jsonb,
  new_value jsonb,
  ip_hash text,
  created_at timestamptz not null default now()
);
grant select on public.admin_audit_logs to authenticated;
grant all on public.admin_audit_logs to service_role;
alter table public.admin_audit_logs enable row level security;
create policy "admins read audit" on public.admin_audit_logs for select to authenticated
  using (public.is_admin(auth.uid()));
create or replace function public.block_audit_mutation()
returns trigger language plpgsql set search_path = public as $$
begin raise exception 'audit log is append-only'; end; $$;
create trigger admin_audit_immutable before update or delete on public.admin_audit_logs
  for each row execute function public.block_audit_mutation();

create table public.login_attempts (
  id uuid primary key default gen_random_uuid(),
  identifier_hash text not null,
  ip_hash text,
  success boolean not null default false,
  created_at timestamptz not null default now()
);
create index login_attempts_idx on public.login_attempts (identifier_hash, created_at desc);
grant all on public.login_attempts to service_role;
alter table public.login_attempts enable row level security;

create table public.rate_limits (
  bucket text not null,
  identity text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (bucket, identity, window_start)
);
grant all on public.rate_limits to service_role;
alter table public.rate_limits enable row level security;
