-- Kora — Q&A de due diligence. Ré-exécutable.
--
-- Workflow du prototype : brouillon → revue interne → publiée.
-- Il existe pour une raison : une réponse à un investisseur engage la société.
-- Tant qu'elle n'est pas publiée, l'invité ne la voit pas.

drop function if exists public.publish_answer(uuid) cascade;
drop function if exists public.save_answer(uuid, text) cascade;
drop function if exists public.set_answer_status(uuid, text) cascade;
drop function if exists public.ask_question(uuid, text, uuid) cascade;
drop table if exists public.qa_questions cascade;
drop type if exists public.answer_status cascade;

create type public.answer_status as enum ('draft', 'internal_review', 'published');

create table public.qa_questions (
  id            uuid primary key default gen_random_uuid(),
  deal_id       uuid not null references public.deals(id) on delete cascade,
  asked_by      uuid references public.profiles(id) on delete set null,
  body          text not null,
  -- Contexte facultatif : la question porte souvent sur un document précis.
  document_id   uuid references public.documents(id) on delete set null,
  answer_body   text,
  answer_status public.answer_status not null default 'draft',
  answered_by   uuid references public.profiles(id) on delete set null,
  published_at  timestamptz,
  created_at    timestamptz not null default now()
);
create index qa_deal_idx on public.qa_questions (deal_id, answer_status);
create index qa_asker_idx on public.qa_questions (asked_by);

/** Poser une question : tout membre du deal, invités compris. */
create or replace function public.ask_question(
  p_deal uuid,
  p_body text,
  p_document uuid default null
)
returns public.qa_questions
language plpgsql security definer set search_path = public as $$
declare
  v_org uuid;
  v_q   public.qa_questions;
begin
  select d.org_id into v_org from public.deals d where d.id = p_deal;
  if v_org is null or not public.is_org_member(v_org) then
    raise exception 'accès refusé';
  end if;
  if length(trim(p_body)) < 5 then
    raise exception 'question trop courte';
  end if;

  insert into public.qa_questions (deal_id, asked_by, body, document_id)
  values (p_deal, auth.uid(), trim(p_body), p_document)
  returning * into v_q;

  perform public.write_audit(
    v_org, 'qa.question_asked', 'question', v_q.id::text,
    jsonb_build_object('body', left(trim(p_body), 120)), p_deal
  );

  return v_q;
end;
$$;

/** Rédiger/modifier la réponse. Réservé à l'équipe interne. */
create or replace function public.save_answer(p_question uuid, p_body text)
returns public.qa_questions
language plpgsql security definer set search_path = public as $$
declare
  v_deal uuid;
  v_org  uuid;
  v_q    public.qa_questions;
begin
  select deal_id into v_deal from public.qa_questions where id = p_question;
  if v_deal is null then raise exception 'question introuvable'; end if;
  v_org := public.deal_org_for_write(v_deal);

  update public.qa_questions
  set answer_body = p_body, answered_by = auth.uid()
  where id = p_question
  returning * into v_q;

  perform public.write_audit(
    v_org, 'qa.answer_saved', 'question', p_question::text,
    jsonb_build_object('status', v_q.answer_status), v_deal
  );

  return v_q;
end;
$$;

/**
 * Fait avancer la réponse dans le workflow.
 *
 * Publier sans réponse est refusé : une question marquée « publiée » mais
 * vide ferait croire à l'investisseur qu'on lui a répondu.
 */
create or replace function public.set_answer_status(p_question uuid, p_status text)
returns public.qa_questions
language plpgsql security definer set search_path = public as $$
declare
  v_deal uuid;
  v_org  uuid;
  v_body text;
  v_q    public.qa_questions;
begin
  select deal_id, answer_body into v_deal, v_body
  from public.qa_questions where id = p_question;
  if v_deal is null then raise exception 'question introuvable'; end if;
  v_org := public.deal_org_for_write(v_deal);

  if p_status = 'published' and coalesce(trim(v_body), '') = '' then
    raise exception 'impossible de publier une réponse vide';
  end if;

  update public.qa_questions
  set answer_status = p_status::public.answer_status,
      published_at = case when p_status = 'published' then now() else null end
  where id = p_question
  returning * into v_q;

  perform public.write_audit(
    v_org,
    case when p_status = 'published' then 'qa.answer_published' else 'qa.status_changed' end,
    'question', p_question::text,
    jsonb_build_object('status', p_status), v_deal
  );

  return v_q;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS — le cœur du workflow
-- ---------------------------------------------------------------------------
alter table public.qa_questions enable row level security;

/**
 * L'équipe interne voit tout (y compris les brouillons).
 * L'invité ne voit QUE ses propres questions, et seulement si la réponse est
 * publiée — un brouillon ne doit jamais lui parvenir.
 */
create policy qa_select on public.qa_questions
  for select using (
    exists (
      select 1 from public.deals d
      where d.id = qa_questions.deal_id and public.is_org_internal(d.org_id)
    )
    or (asked_by = auth.uid())
  );

grant select on public.qa_questions to authenticated;
grant execute on function public.ask_question(uuid, text, uuid) to authenticated;
grant execute on function public.save_answer(uuid, text) to authenticated;
grant execute on function public.set_answer_status(uuid, text) to authenticated;

/**
 * Vue de l'invité : masque le corps des réponses non publiées.
 *
 * La RLS laisse l'auteur voir SA ligne (il doit relire sa question), mais la
 * réponse en brouillon ne doit pas transiter. On la masque ici plutôt que de
 * compter sur le client pour ne pas l'afficher.
 */
create or replace function public.qa_for_deal(p_deal uuid)
returns table (
  id            uuid,
  body          text,
  asker         text,
  document_id   uuid,
  answer_body   text,
  answer_status public.answer_status,
  answerer      text,
  created_at    timestamptz,
  published_at  timestamptz,
  is_mine       boolean
)
language sql stable security definer set search_path = public as $$
  select q.id,
         q.body,
         coalesce(nullif(pa.full_name, ''), split_part(pa.email, '@', 1)),
         q.document_id,
         case
           when public.is_org_internal(d.org_id) then q.answer_body
           when q.answer_status = 'published' then q.answer_body
           else null
         end,
         q.answer_status,
         coalesce(nullif(pb.full_name, ''), split_part(pb.email, '@', 1)),
         q.created_at,
         q.published_at,
         (q.asked_by = auth.uid())
  from public.qa_questions q
  join public.deals d on d.id = q.deal_id
  left join public.profiles pa on pa.id = q.asked_by
  left join public.profiles pb on pb.id = q.answered_by
  where q.deal_id = p_deal
    and (public.is_org_internal(d.org_id) or q.asked_by = auth.uid())
  order by q.created_at desc;
$$;

grant execute on function public.qa_for_deal(uuid) to authenticated;
