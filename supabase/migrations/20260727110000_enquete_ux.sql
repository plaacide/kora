-- Enquête produit in-app — §1 du handoff ENQUETE-UX-IN-APP.
--
-- Quatre questions posées après 30 minutes d'usage cumulé. Le fondateur peut
-- sortir à chaque écran ; chaque écran validé est écrit séparément, pour qu'un
-- abandon en cours de route laisse quand même les réponses déjà données.

create table if not exists public.survey_responses (
  id             bigint generated always as identity primary key,
  org_id         uuid not null references public.organizations(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,

  -- Réponses. TOUTES nullables : aucune question n'est obligatoire, et une
  -- colonne `not null` ici transformerait une sortie en échec d'écriture.
  mood           text check (mood in ('fluide', 'correct', 'bloque')),
  frictions      text[] not null default '{}',
  price_fair     text,
  price_too_high text,
  comment        text,

  -- Contexte au moment de la réponse : sans lui, « je bloque » ne se
  -- distingue pas d'un dossier vide d'un dossier complet, et la réponse ne
  -- s'exploite pas.
  readiness      int,
  docs_count     int,
  usage_minutes  int,

  completed      boolean not null default false,
  created_at     timestamptz not null default now()
);

create index if not exists survey_responses_user_idx
  on public.survey_responses (user_id, created_at desc);

alter table public.survey_responses enable row level security;

-- AUCUNE policy de SELECT, volontairement : c'est la convention déjà retenue
-- pour `investor_waitlist` et `sae_demo_requests`. La table est fermée aux
-- clients ; l'équipe Sanza la lit en `service_role`. Le dépôt n'a pas de
-- notion de « personnel interne » côté base — en inventer une ici serait un
-- modèle de droits décidé au passage, ce qui n'est pas le sujet de ce handoff.

-- Suivi de l'invitation, sur le profil : trois colonnes valent mieux qu'une
-- table pour une donnée 1-1 qu'on lit à chaque chargement d'écran.
alter table public.profiles
  add column if not exists survey_last_prompt_at    timestamptz,
  add column if not exists survey_dismissed_forever boolean not null default false,
  add column if not exists survey_completed_at      timestamptz,
  -- Compteur d'usage. En SECONDES : à 60 s par ping, arrondir en minutes à
  -- chaque appel perdrait toutes les fractions et le seuil de 30 min ne
  -- serait jamais atteint.
  add column if not exists usage_seconds            int not null default 0,
  add column if not exists usage_last_ping_at       timestamptz;

comment on column public.profiles.usage_seconds is
  'Temps d''usage ACTIF cumulé. Persistant : un rechargement de page ne remet pas à zéro.';

/**
 * Ping d'usage. Ajoute le temps écoulé depuis le ping précédent, PLAFONNÉ à
 * deux minutes.
 *
 * Le plafond est ce qui distingue « usage » de « onglet ouvert » : sans lui,
 * un fondateur qui laisse Sanza ouvert une nuit atteindrait le seuil sans
 * avoir rien fait, et l'enquête tomberait sur quelqu'un qui n'a pas d'avis.
 * Avec lui, une absence de plus de deux minutes ne compte pas — le compteur
 * repart au ping suivant sans rattraper le vide.
 */
create or replace function public.record_usage_ping()
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_delta int;
  v_total int;
begin
  if auth.uid() is null then return 0; end if;

  select least(
           extract(epoch from (now() - coalesce(usage_last_ping_at, now())))::int,
           120
         )
  into v_delta
  from public.profiles where id = auth.uid();

  update public.profiles
  set usage_seconds = usage_seconds + coalesce(v_delta, 0),
      usage_last_ping_at = now()
  where id = auth.uid()
  returning usage_seconds into v_total;

  return coalesce(v_total, 0) / 60;
end;
$$;

/**
 * Ouvre une réponse. Appelée UNIQUEMENT au clic sur « D'accord » de l'écran 0
 * — afficher le carton n'est pas un consentement, et rien ne doit exister en
 * base avant ce clic (§0.6).
 */
create or replace function public.survey_start(
  p_readiness int default null,
  p_docs int default null,
  p_minutes int default null
)
returns bigint
language plpgsql security definer set search_path = public as $$
declare
  v_org uuid;
  v_id  bigint;
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;

  select m.org_id into v_org
  from public.memberships m where m.user_id = auth.uid()
  order by m.created_at limit 1;
  if v_org is null then raise exception 'aucune organisation'; end if;

  insert into public.survey_responses (org_id, user_id, readiness, docs_count, usage_minutes)
  values (v_org, auth.uid(), p_readiness, p_docs, p_minutes)
  returning id into v_id;

  return v_id;
end;
$$;

/**
 * Enregistre un écran. Un appel PAR ÉCRAN validé, pas un seul à la fin.
 *
 * `coalesce` partout : un écran passé sans répondre n'efface pas ce qui a été
 * dit avant. Pour vider volontairement une liste de frictions, on envoie un
 * tableau vide — distinct de `null`, qui signifie « ne touche pas ».
 */
create or replace function public.survey_answer(
  p_id bigint,
  p_mood text default null,
  p_frictions text[] default null,
  p_price_fair text default null,
  p_price_too_high text default null,
  p_comment text default null
)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;

  update public.survey_responses s
  set mood           = coalesce(p_mood, s.mood),
      frictions      = coalesce(p_frictions, s.frictions),
      price_fair     = coalesce(p_price_fair, s.price_fair),
      price_too_high = coalesce(p_price_too_high, s.price_too_high),
      comment        = coalesce(p_comment, s.comment)
  -- La condition sur `user_id` EST le contrôle d'accès : une fonction
  -- `security definer` contourne la RLS, elle doit donc porter sa propre
  -- garde. Sans elle, n'importe qui écrirait dans la réponse d'un autre en
  -- devinant un identifiant séquentiel.
  where s.id = p_id and s.user_id = auth.uid();
end;
$$;

/** Clôt la réponse et marque le profil : on ne redemandera plus. */
create or replace function public.survey_complete(p_id bigint)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;

  update public.survey_responses
  set completed = true
  where id = p_id and user_id = auth.uid();

  update public.profiles
  set survey_completed_at = now()
  where id = auth.uid();
end;
$$;

/** « Plus tard » / croix / Échap : on repose la question dans sept jours. */
create or replace function public.survey_postpone()
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  update public.profiles set survey_last_prompt_at = now() where id = auth.uid();
end;
$$;

/** « Ne plus me demander » : définitif, y compris après reconnexion. */
create or replace function public.survey_never_again()
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  update public.profiles set survey_dismissed_forever = true where id = auth.uid();
end;
$$;

grant execute on function public.record_usage_ping() to authenticated;
grant execute on function public.survey_start(int, int, int) to authenticated;
grant execute on function public.survey_answer(bigint, text, text[], text, text, text) to authenticated;
grant execute on function public.survey_complete(bigint) to authenticated;
grant execute on function public.survey_postpone() to authenticated;
grant execute on function public.survey_never_again() to authenticated;
