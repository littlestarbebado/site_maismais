create table public.chapter_i_events (
  event_id uuid primary key,
  created_at timestamptz not null default now(),
  session_id uuid not null,
  event_type text not null check (
    event_type in (
      'site_open',
      'question_started',
      'question_completed',
      'css_reveal_entered',
      'animation_paused',
      'animation_resumed',
      'animation_skipped',
      'invite_response',
      'reschedule_action'
    )
  ),
  event_data jsonb not null default '{}'::jsonb,
  constraint chapter_i_events_data_is_object check (jsonb_typeof(event_data) = 'object'),
  constraint chapter_i_events_data_matches_type check (
    case event_type
      when 'site_open' then event_data = '{}'::jsonb
      when 'css_reveal_entered' then event_data = '{}'::jsonb
      when 'animation_paused' then event_data = '{}'::jsonb
      when 'animation_resumed' then event_data = '{}'::jsonb
      when 'animation_skipped' then event_data = '{}'::jsonb
      when 'question_started' then
        event_data - 'question_index' = '{}'::jsonb
        and jsonb_typeof(event_data -> 'question_index') = 'number'
        and event_data ->> 'question_index' in ('0', '1', '2', '3')
      when 'question_completed' then
        event_data - array['question_index', 'option_index'] = '{}'::jsonb
        and jsonb_typeof(event_data -> 'question_index') = 'number'
        and event_data ->> 'question_index' in ('0', '1', '2', '3')
        and jsonb_typeof(event_data -> 'option_index') = 'number'
        and event_data ->> 'option_index' in ('0', '1', '2', '3')
      when 'invite_response' then
        event_data - 'response' = '{}'::jsonb
        and event_data ->> 'response' in ('yes', 'no')
      when 'reschedule_action' then
        event_data - 'action' = '{}'::jsonb
        and event_data ->> 'action' in ('date_selected', 'copy_clicked')
      else false
    end
  )
);

create index chapter_i_events_created_at_idx on public.chapter_i_events (created_at desc);
create index chapter_i_events_session_id_idx on public.chapter_i_events (session_id);

alter table public.chapter_i_events enable row level security;

grant usage on schema public to anon, authenticated;
revoke all on public.chapter_i_events from anon, authenticated;
grant insert (event_id, session_id, event_type, event_data)
  on public.chapter_i_events to anon, authenticated;
grant select (event_id, created_at, session_id, event_type, event_data)
  on public.chapter_i_events to authenticated;

create policy "chapter_i_events_insert_minimal_events"
  on public.chapter_i_events
  for insert
  to anon, authenticated
  with check (true);

create policy "chapter_i_events_admin_read"
  on public.chapter_i_events
  for select
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'chapter_i_admin');

create view public.chapter_i_telemetry_funnel
with (security_invoker = true)
as
with per_session as (
  select
    session_id,
    bool_or(event_type = 'question_started' and event_data ->> 'question_index' = '0') as question_1_started,
    bool_or(event_type = 'question_completed' and event_data ->> 'question_index' = '0') as question_1_completed,
    bool_or(event_type = 'question_started' and event_data ->> 'question_index' = '1') as question_2_started,
    bool_or(event_type = 'question_completed' and event_data ->> 'question_index' = '1') as question_2_completed,
    bool_or(event_type = 'question_started' and event_data ->> 'question_index' = '2') as question_3_started,
    bool_or(event_type = 'question_completed' and event_data ->> 'question_index' = '2') as question_3_completed,
    bool_or(event_type = 'question_started' and event_data ->> 'question_index' = '3') as question_4_started,
    bool_or(event_type = 'question_completed' and event_data ->> 'question_index' = '3') as question_4_completed,
    bool_or(event_type = 'css_reveal_entered') as reveal_entered,
    bool_or(event_type = 'invite_response' and event_data ->> 'response' = 'yes') as responded_yes,
    bool_or(event_type = 'invite_response' and event_data ->> 'response' = 'no') as responded_no,
    bool_or(event_type = 'reschedule_action') as rescheduled
  from public.chapter_i_events
  group by session_id
)
select
  (select count(*) from public.chapter_i_events where event_type = 'site_open') as visits,
  count(*) as sessions,
  count(*) filter (where question_1_started) as question_1_started,
  count(*) filter (where question_1_completed) as question_1_completed,
  count(*) filter (where question_2_started) as question_2_started,
  count(*) filter (where question_2_completed) as question_2_completed,
  count(*) filter (where question_3_started) as question_3_started,
  count(*) filter (where question_3_completed) as question_3_completed,
  count(*) filter (where question_4_started) as question_4_started,
  count(*) filter (where question_4_completed) as question_4_completed,
  count(*) filter (where reveal_entered) as reveal_sessions,
  count(*) filter (where responded_yes) as yes_responses,
  count(*) filter (where responded_no) as no_responses,
  count(*) filter (where rescheduled) as reschedule_actions
from per_session;

revoke all on public.chapter_i_telemetry_funnel from anon, authenticated;
grant select on public.chapter_i_telemetry_funnel to authenticated;
