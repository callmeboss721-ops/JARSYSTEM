export const ownerReportTotalsSql = `with local_day as (
  select (now() at time zone 'Asia/Bangkok')::date as day
), totals as (
  select coalesce(sum(s.amount_baht),0)::bigint as today_sales,
    count(s.id)::integer as today_visits from jaguar_sales s,local_day d
  where (s.created_at at time zone 'Asia/Bangkok')::date=d.day and not exists(
    select 1 from jaguar_members m where m.id=s.member_id and m.is_demo)
), all_sales as (
  select coalesce(sum(s.amount_baht),0)::bigint as total_sales,
    count(s.id)::integer as total_visits from jaguar_sales s
    join jaguar_members m on m.id=s.member_id where not m.is_demo
), redeemed as (
  select count(*) filter (where r.points_spent=10 and
      (r.created_at at time zone 'Asia/Bangkok')::date=local_day.day)::integer as today_redemptions,
    count(*)::integer as redemptions
  from (
    select d.created_at,d.points_spent from jaguar_redemptions d
      join jaguar_members m on m.id=d.member_id where d.status='confirmed' and not m.is_demo
    union all
    select t.created_at,10::integer as points_spent from jaguar_cannabis_transactions t
      join jaguar_members m on m.id=t.member_id where t.delta=-10 and t.grams_purchased=0 and not m.is_demo
  ) r,local_day
), member_counts as (
  select count(*) filter (where m.status='active' and not m.is_demo)::integer as members,
    (select count(distinct s.member_id)::integer from jaguar_sales s
      join jaguar_members buyer on buyer.id=s.member_id
      where buyer.status='active' and not buyer.is_demo) as kratom_members,
    (select count(distinct t.member_id)::integer from jaguar_cannabis_transactions t
      join jaguar_members buyer on buyer.id=t.member_id
      where buyer.status='active' and not buyer.is_demo and t.grams_purchased>0) as cannabis_members
  from jaguar_members m
  join jaguar_point_balances b on b.member_id=m.id
  left join jaguar_cannabis_balances c on c.member_id=m.id
), point_totals as (
  select coalesce(sum(t.delta),0)::integer as today_points_issued
  from (
    select member_id,delta,created_at from jaguar_point_transactions where delta>0
    union all
    select member_id,delta,created_at from jaguar_cannabis_transactions where delta>0
  ) t
  join jaguar_members m on m.id=t.member_id
  cross join local_day
  where not m.is_demo and (t.created_at at time zone 'Asia/Bangkok')::date=local_day.day
)
  select totals.today_sales,totals.today_visits,all_sales.total_sales,all_sales.total_visits,
    redeemed.today_redemptions,redeemed.redemptions,member_counts.members,
    member_counts.kratom_members,member_counts.cannabis_members,point_totals.today_points_issued
  from totals,all_sales,redeemed,member_counts,point_totals`;

export const ownerReportByFormulaSql = `with local_day as (
  select (now() at time zone 'Asia/Bangkok')::date as day
)
  select s.formula,count(*)::integer as sales_count,
  count(s.id) filter (where (s.created_at at time zone 'Asia/Bangkok')::date=local_day.day)::integer as today_sales_count,
  coalesce(sum(s.bottle_count),0)::integer as bottles_sold,
  coalesce(sum(s.bottle_count) filter (where (s.created_at at time zone 'Asia/Bangkok')::date=local_day.day),0)::integer as today_bottles_sold,
  coalesce(sum(s.points_awarded),0)::integer as points_awarded,
  coalesce(sum(s.points_awarded) filter (where (s.created_at at time zone 'Asia/Bangkok')::date=local_day.day),0)::integer as today_points_awarded,
  coalesce(sum(s.amount_baht),0)::bigint as amount_baht,
  coalesce(sum(s.amount_baht) filter (where (s.created_at at time zone 'Asia/Bangkok')::date=local_day.day),0)::bigint as today_amount_baht
  from jaguar_sales s
  join jaguar_members m on m.id=s.member_id,local_day
  where not m.is_demo
  group by s.formula,local_day.day
  order by case s.formula when 'red' then 1 when 'silver' then 2 else 3 end`;

export const ownerAuditLogSql = `with activity as (
  select s.id,'sale'::text as event_type,m.member_code,
    coalesce(nullif(m.nickname,''),m.display_name,m.member_code) as member_label,
    ('ซื้อ ' || s.bottle_count || ' ขวด · ฿' || s.amount_baht ||
      case when s.points_awarded>0 then ' · +' || s.points_awarded || ' แต้ม' else '' end)::text as description,
    s.points_awarded::integer as points_delta,'completed'::text as status,s.created_at
  from jaguar_sales s join jaguar_members m on m.id=s.member_id where not m.is_demo
  union all
  select t.id,
    case when t.delta<0 and t.grams_purchased=0 then 'redemption'::text else 'cannabis'::text end,
    m.member_code,coalesce(nullif(m.nickname,''),m.display_name,m.member_code),
    (case when t.delta<0 and t.grams_purchased=0
      then 'แลกฟรี 1 กรัม · ใช้ ' || (-t.delta) || ' แต้ม'
      else 'ซื้อ ' || t.grams_purchased || ' กรัม · ' || t.reason end)::text,
    t.delta::integer,case when t.delta<0 then 'redeemed'::text else 'completed'::text end,t.created_at
  from jaguar_cannabis_transactions t join jaguar_members m on m.id=t.member_id where not m.is_demo
  union all
  select d.id,'redemption'::text,m.member_code,
    coalesce(nullif(m.nickname,''),m.display_name,m.member_code),
    (r.name || ' · แลก ' || d.points_spent || ' แต้ม')::text,
    (-d.points_spent)::integer,d.status::text,d.created_at
  from jaguar_redemptions d join jaguar_members m on m.id=d.member_id
    join jaguar_rewards r on r.id=d.reward_id where not m.is_demo
  union all
  select p.id,'points'::text,m.member_code,
    coalesce(nullif(m.nickname,''),m.display_name,m.member_code),
    ('เพิ่มแต้ม ' || p.delta)::text,p.delta::integer,'completed'::text,p.created_at
  from jaguar_point_transactions p join jaguar_members m on m.id=p.member_id
    where p.reason='staff_credit' and not m.is_demo
  union all
  select c.id,'correction'::text,m.member_code,
    coalesce(nullif(m.nickname,''),m.display_name,m.member_code),
    ('แก้ไขรายการ · ' || c.reason)::text,0::integer,'corrected'::text,c.created_at
  from jaguar_transaction_corrections c
    join jaguar_members m on m.id=c.member_id
    where c.member_id is not null and not m.is_demo
)
select id::text,event_type,member_code,member_label,description,points_delta,status,created_at::text as created_at
from activity order by created_at desc,id desc limit 25`;
