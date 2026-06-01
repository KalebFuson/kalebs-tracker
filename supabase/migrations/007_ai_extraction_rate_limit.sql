-- AI task extraction rate limits (per authenticated user)
-- Counter-table approach: one row per (user, period, window).
-- Called from extractTasksFromText before the OpenAI call.
-- NOTE: This migration documents schema already applied manually via the
-- Supabase SQL Editor during development. The objects already exist in the
-- live database; this file exists for reproducibility, not to be re-applied.

create table if not exists public.ai_rate_limits (
  user_id uuid not null,
  period text not null,
  window_start timestamptz not null,
  request_count int not null default 0,
  primary key (user_id, period, window_start)
);

create or replace function public.check_ai_rate_limit()
returns json
language plpgsql
security definer
set search_path = public
as $function$
declare
  uid uuid := auth.uid();
  max_per_minute int := 10;
  max_per_day int := 100;
  minute_window timestamptz := date_trunc('minute', now());
  day_window timestamptz := date_trunc('day', now());
  minute_count int;
  day_count int;
begin
  if uid is null then
    return json_build_object('allowed', false, 'reason', 'not_authenticated');
  end if;

  delete from ai_rate_limits
    where user_id = uid and window_start < now() - interval '2 days';

  insert into ai_rate_limits(user_id, period, window_start)
    values (uid, 'minute', minute_window) on conflict do nothing;
  insert into ai_rate_limits(user_id, period, window_start)
    values (uid, 'day', day_window) on conflict do nothing;

  select request_count into minute_count from ai_rate_limits
    where user_id = uid and period = 'minute' and window_start = minute_window
    for update;
  select request_count into day_count from ai_rate_limits
    where user_id = uid and period = 'day' and window_start = day_window
    for update;

  if minute_count >= max_per_minute then
    return json_build_object('allowed', false, 'reason', 'minute_limit',
      'retry_after_seconds', 60 - extract(second from now())::int);
  end if;
  if day_count >= max_per_day then
    return json_build_object('allowed', false, 'reason', 'day_limit');
  end if;

  update ai_rate_limits set request_count = request_count + 1
    where user_id = uid and period = 'minute' and window_start = minute_window;
  update ai_rate_limits set request_count = request_count + 1
    where user_id = uid and period = 'day' and window_start = day_window;

  return json_build_object('allowed', true,
    'minute_remaining', max_per_minute - minute_count - 1,
    'day_remaining', max_per_day - day_count - 1);
end;
$function$;

revoke all on function public.check_ai_rate_limit() from public, anon;
grant execute on function public.check_ai_rate_limit() to authenticated;
