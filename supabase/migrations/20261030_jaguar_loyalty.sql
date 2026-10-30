-- REVIEW REQUIRED: prepared against the table/column names supplied by the owner.
-- Not applied until the existing project's schema, triggers and RLS are inspected.
-- Assumes UUID ids, text statuses/reasons, created_at timestamp defaults,
-- and point_balances.member_id as a unique key.
-- This migration intentionally does not overwrite existing table policies.
begin;

create schema if not exists jaguar_private;
revoke all on schema jaguar_private from public, anon, authenticated;

create table if not exists jaguar_private.point_requests (
  request_id uuid primary key,
  member_id uuid not null references public.members(id),
  points integer not null check (points between 1 and 20),
  created_at timestamptz not null default now()
);

create unique index if not exists jaguar_member_code_ci
  on public.members (upper(member_code));
create unique index if not exists jaguar_member_phone_unique
  on public.members (phone_e164);
create index if not exists jaguar_pending_redemptions
  on public.redemptions (member_id, status);
create index if not exists jaguar_point_activity
  on public.point_transactions (member_id, created_at desc);

create or replace function public.jaguar_health()
returns jsonb language sql security definer set search_path = '' as $$
  select jsonb_build_object('project_ref','mbwkwgeznqrccfcpqbhp','version',1);
$$;

create or replace function public.jaguar_card(p_member uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  if not exists (select 1 from public.members where id=p_member) then
    raise exception 'member_not_found';
  end if;
  if not exists (select 1 from public.members where id=p_member and status='active') then
    raise exception 'member_inactive';
  end if;
  select jsonb_build_object('id',m.id,'member_code',m.member_code,'status',m.status,
    'balance',coalesce(b.balance,0),'lifetime_earned',coalesce(b.lifetime_earned,0),
    'lifetime_redeemed',coalesce(b.lifetime_redeemed,0)) into result
  from public.members m left join public.point_balances b on b.member_id=m.id
  where m.id=p_member;
  return result;
end $$;

create or replace function public.jaguar_member_login(p_code text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare member_uuid uuid;
begin
  if p_code !~ '^[A-Za-z0-9]{6,10}$' then raise exception 'invalid_input'; end if;
  select id into member_uuid from public.members where upper(member_code)=upper(p_code);
  if member_uuid is null then raise exception 'member_not_found'; end if;
  return public.jaguar_card(member_uuid);
end $$;

create or replace function public.jaguar_register(p_code text, p_phone text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare member_uuid uuid;
begin
  if p_code !~ '^[A-Za-z0-9]{6,10}$' or p_phone !~ '^\+66[689][0-9]{8}$' then
    raise exception 'invalid_input';
  end if;
  if exists(select 1 from public.members where upper(member_code)=upper(p_code)) then
    raise exception 'member_code_taken';
  end if;
  if exists(select 1 from public.members where phone_e164=p_phone) then
    raise exception 'phone_taken';
  end if;
  insert into public.members(member_code,phone_e164,status)
    values(upper(p_code),p_phone,'active') returning id into member_uuid;
  insert into public.point_balances(member_id,balance,lifetime_earned,lifetime_redeemed)
    values(member_uuid,0,0,0) on conflict(member_id) do nothing;
  return public.jaguar_card(member_uuid);
end $$;

create or replace function public.jaguar_rewards()
returns jsonb language sql security definer set search_path = '' as $$
  select coalesce(jsonb_agg(to_jsonb(r) order by r.points_cost,r.name),'[]'::jsonb)
  from (select id,name,description,points_cost,is_active from public.rewards
    where is_active=true and points_cost>0) r;
$$;

create or replace function public.jaguar_activity(p_member uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform public.jaguar_card(p_member);
  return (select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at desc),'[]'::jsonb)
    from (select id,delta,reason,created_at from public.point_transactions
      where member_id=p_member order by created_at desc limit 50) t);
end $$;

create or replace function public.jaguar_redemption_json(p_id uuid)
returns jsonb language sql security definer set search_path = '' as $$
  select jsonb_build_object('id',d.id,'member_id',d.member_id,'member_code',m.member_code,
    'reward_id',d.reward_id,'reward_name',r.name,'points_spent',d.points_spent,
    'status',d.status,'created_at',d.created_at)
  from public.redemptions d join public.members m on m.id=d.member_id
    join public.rewards r on r.id=d.reward_id where d.id=p_id;
$$;

create or replace function public.jaguar_redemptions(p_member uuid, p_pending_only boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if p_member is not null then perform public.jaguar_card(p_member); end if;
  return (select coalesce(jsonb_agg(public.jaguar_redemption_json(d.id) order by d.created_at desc),'[]'::jsonb)
    from (select id,created_at from public.redemptions
      where (p_member is null or member_id=p_member)
        and (not p_pending_only or status='pending')
      order by created_at desc limit 100) d);
end $$;

create or replace function public.jaguar_request_redemption(p_member uuid,p_reward uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare cost integer; current_balance integer; redemption_uuid uuid;
begin
  -- Same member lock order as credit and confirm to serialize changes.
  perform 1 from public.members where id=p_member for update;
  perform public.jaguar_card(p_member);
  select balance into current_balance from public.point_balances where member_id=p_member for update;
  select points_cost into cost from public.rewards where id=p_reward and is_active=true for share;
  if cost is null or cost<1 then raise exception 'reward_unavailable'; end if;
  if exists(select 1 from public.redemptions where member_id=p_member and status='pending') then
    raise exception 'redemption_pending';
  end if;
  if coalesce(current_balance,0)<cost then raise exception 'insufficient_points'; end if;
  -- Only request here: staff confirmation performs the deduction.
  insert into public.redemptions(member_id,reward_id,points_spent,status)
    values(p_member,p_reward,cost,'pending') returning id into redemption_uuid;
  return public.jaguar_redemption_json(redemption_uuid);
end $$;

create or replace function public.jaguar_add_points(p_member uuid,p_points integer,p_request uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare prior jaguar_private.point_requests%rowtype;
begin
  if p_points is null or p_points<1 or p_points>20 or p_request is null then
    raise exception 'invalid_input';
  end if;
  perform 1 from public.members where id=p_member for update;
  perform public.jaguar_card(p_member);
  insert into jaguar_private.point_requests(request_id,member_id,points)
    values(p_request,p_member,p_points) on conflict(request_id) do nothing;
  if not found then
    select * into prior from jaguar_private.point_requests where request_id=p_request;
    if prior.member_id<>p_member or prior.points<>p_points then raise exception 'request_id_conflict'; end if;
    return public.jaguar_card(p_member);
  end if;
  insert into public.point_balances(member_id,balance,lifetime_earned,lifetime_redeemed)
    values(p_member,p_points,p_points,0)
    on conflict(member_id) do update set
      balance=public.point_balances.balance+p_points,
      lifetime_earned=public.point_balances.lifetime_earned+p_points;
  insert into public.point_transactions(member_id,delta,reason) values(p_member,p_points,'staff_credit');
  return public.jaguar_card(p_member);
end $$;

create or replace function public.jaguar_confirm_redemption(p_redemption uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare target public.redemptions%rowtype; member_uuid uuid; current_balance integer;
begin
  select member_id into member_uuid from public.redemptions where id=p_redemption;
  if member_uuid is null then raise exception 'redemption_not_found'; end if;
  perform 1 from public.members where id=member_uuid for update;
  perform public.jaguar_card(member_uuid);
  select * into target from public.redemptions where id=p_redemption for update;
  -- Confirmation is idempotent: repeated clicks never deduct twice.
  if target.status='confirmed' then return public.jaguar_redemption_json(p_redemption); end if;
  if target.status<>'pending' then raise exception 'redemption_not_pending'; end if;
  if target.points_spent is null or target.points_spent<1 then raise exception 'invalid_input'; end if;
  select balance into current_balance from public.point_balances where member_id=member_uuid for update;
  if coalesce(current_balance,0)<target.points_spent then raise exception 'insufficient_points'; end if;
  update public.point_balances set balance=balance-target.points_spent,
    lifetime_redeemed=lifetime_redeemed+target.points_spent where member_id=member_uuid;
  update public.redemptions set status='confirmed' where id=p_redemption;
  insert into public.point_transactions(member_id,delta,reason)
    values(member_uuid,-target.points_spent,'reward_redemption');
  return public.jaguar_redemption_json(p_redemption);
end $$;

create or replace function public.jaguar_summary()
returns jsonb language sql security definer set search_path = '' as $$
  select jsonb_build_object(
    'members',(select count(*) from public.members),
    'pending_redemptions',(select count(*) from public.redemptions where status='pending'),
    'points_issued',(select coalesce(sum(lifetime_earned),0) from public.point_balances));
$$;

-- Default PUBLIC execution MUST NOT expose security-definer RPCs to browser keys.
do $$
declare fn record;
begin
  for fn in select p.oid::regprocedure as signature from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in
    ('jaguar_health','jaguar_card','jaguar_member_login','jaguar_register',
     'jaguar_rewards','jaguar_activity','jaguar_redemption_json','jaguar_redemptions',
     'jaguar_request_redemption','jaguar_add_points','jaguar_confirm_redemption','jaguar_summary')
  loop
    execute format('revoke all on function %s from public, anon, authenticated',fn.signature);
    execute format('grant execute on function %s to service_role',fn.signature);
  end loop;
end $$;
commit;
