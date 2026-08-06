-- Les questions et suggestions se rattachent à une COHORTE.
--
-- `program_threads` existe depuis le 28 juillet et porte déjà l'essentiel :
-- le type (question / suggestion), le corps, le statut, la réponse. Il lui
-- manquait le seul lien dont l'écran 08 a besoin — la cohorte. Sans lui, le
-- fil d'une cohorte serait le fil de TOUTES : un programme qui en accompagne
-- trois verrait les trois mélangées, sans moyen de les séparer.
--
-- La colonne est NULLABLE et `on delete set null` : une cohorte qui se termine
-- ne doit pas emporter les échanges qu'elle a portés. La question posée reste
-- lisible, elle perd seulement son classeur.
--
-- L'ÉCRITURE PASSE PAR UNE RPC, comme tout le reste. La politique d'insertion
-- existante autorise le client à écrire en direct ; on ne s'en sert pas, parce
-- qu'elle ne vérifie qu'une chose — l'appartenance au programme — et laisse
-- passer deux erreurs qu'un écran ne rattrape pas : écrire dans la cohorte
-- d'un autre, et écrire à une entreprise qui n'en fait pas partie.
--
-- Ré-exécutable.

alter table public.program_threads
  add column if not exists cohort_id uuid references public.cohorts(id) on delete set null;

-- Le fil se lit toujours dans le même sens : une cohorte, du plus récent au
-- plus ancien.
create index if not exists program_threads_cohort_idx
  on public.program_threads (cohort_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Ouvrir un fil
-- ---------------------------------------------------------------------------
create or replace function public.create_program_thread(
  p_cohort  uuid,
  p_startup uuid,
  p_type    text,
  p_body    text
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_org  uuid;
  v_id   uuid;
  v_type public.program_thread_type;
begin
  if auth.uid() is null then
    raise exception 'non authentifié';
  end if;

  if coalesce(trim(p_body), '') = '' then
    raise exception 'message vide';
  end if;

  -- Un type inconnu est REFUSÉ, jamais rabattu sur une valeur par défaut :
  -- une suggestion transformée en question attendrait une réponse que
  -- l'entreprise ne doit rien à personne.
  if p_type not in ('question', 'suggestion') then
    raise exception 'type inconnu';
  end if;
  v_type := p_type::public.program_thread_type;

  select c.org_id into v_org from public.cohorts c where c.id = p_cohort;
  if v_org is null then
    raise exception 'cohorte introuvable';
  end if;

  if not public.is_org_member(v_org) then
    raise exception 'droits insuffisants';
  end if;

  -- L'ENTREPRISE DOIT ÊTRE DANS CETTE COHORTE. C'est ce que la politique
  -- d'insertion ne sait pas dire : sans cette vérification, un programme
  -- pourrait écrire à n'importe quelle organisation dont il connaît
  -- l'identifiant.
  if not exists (
    select 1 from public.cohort_members m
    where m.cohort_id = p_cohort and m.startup_org_id = p_startup
  ) then
    raise exception 'entreprise hors cohorte';
  end if;

  insert into public.program_threads
    (program_org_id, startup_org_id, cohort_id, type, body, status, author)
  values (v_org, p_startup, p_cohort, v_type, trim(p_body), 'open', auth.uid())
  returning id into v_id;

  perform public.write_audit(
    v_org, 'programme.thread_created', 'cohort', p_cohort::text,
    jsonb_build_object('type', p_type, 'entreprise', p_startup)
  );

  return v_id;
end;
$$;

grant execute on function public.create_program_thread(uuid, uuid, text, text)
  to authenticated;

-- ---------------------------------------------------------------------------
-- Lire le fil d'une cohorte — colonnes ÉNUMÉRÉES
-- ---------------------------------------------------------------------------
-- Même patron que `sae_portfolio()` : ce qui n'est pas nommé ne sort pas. On
-- rend le nom de l'entreprise, pas son identifiant de contact ni quoi que ce
-- soit de son dossier.
create or replace function public.cohort_threads(p_cohort uuid)
returns table (
  id            uuid,
  startup_org   uuid,
  startup_name  text,
  type          text,
  body          text,
  status        text,
  answered_body text,
  answered_at   timestamptz,
  created_at    timestamptz
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select t.id, t.startup_org_id, o.name, t.type::text, t.body, t.status::text,
         t.answered_body, t.answered_at, t.created_at
  from public.program_threads t
  join public.cohorts c on c.id = t.cohort_id
  left join public.organizations o on o.id = t.startup_org_id
  where t.cohort_id = p_cohort
    and public.is_org_member(c.org_id)
  order by t.created_at desc;
$$;

grant execute on function public.cohort_threads(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- À qui le programme peut écrire dans une cohorte
-- ---------------------------------------------------------------------------
-- La lecture directe `cohort_members ⋈ organizations` RENVOIE ZÉRO LIGNE, et
-- c'est la RLS qui a raison : un programme n'a pas le droit de lire la fiche
-- d'une organisation dont il n'est pas membre. Avec un `!inner`, PostgREST
-- écarte alors silencieusement chaque ligne dont l'organisation est invisible
-- — le formulaire annonçait « aucune entreprise » pendant que la navigation en
-- comptait deux. Rien dans les journaux, aucune erreur : juste une liste vide.
--
-- Une fonction à colonnes énumérées, comme partout ailleurs : elle rend le NOM
-- et rien d'autre.
create or replace function public.cohort_companies(p_cohort uuid)
returns table (org uuid, name text)
language sql
stable
security definer
set search_path to 'public'
as $$
  select m.startup_org_id, o.name
  from public.cohort_members m
  join public.cohorts c on c.id = m.cohort_id
  left join public.organizations o on o.id = m.startup_org_id
  where m.cohort_id = p_cohort
    and public.is_org_member(c.org_id)
  order by o.name;
$$;

grant execute on function public.cohort_companies(uuid) to authenticated;
