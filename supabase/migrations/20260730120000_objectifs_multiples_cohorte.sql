-- Une cohorte peut poursuivre PLUSIEURS objectifs, y compris des siens.
--
-- `cohorts.goal` était un texte unique parmi quatre valeurs figées. C'est faux
-- dans la vie : une promotion prépare à lever ET met en conformité, et un
-- programme sectoriel poursuit des objectifs que nous n'avons pas prévus —
-- « accès aux marchés publics », « transition énergétique ». Enfermer cela dans
-- quatre cases oblige à mentir dès la première cohorte.
--
-- POURQUOI UN `text[]` ET PAS UNE TABLE. Un objectif n'a ni cycle de vie, ni
-- droits, ni relations : c'est une étiquette. Une table de liaison ajouterait
-- deux jointures à chaque lecture pour ne rien porter de plus. Le jour où un
-- objectif devra être partagé entre cohortes ou piloté, on normalisera.
--
-- `goal` est CONSERVÉE et tenue à jour avec le premier objectif. Elle ne sert
-- plus à l'application, mais la supprimer casserait toute lecture existante
-- pour un gain nul.

alter table public.cohorts
  add column if not exists goals text[] not null default '{}';

comment on column public.cohorts.goals is
  'Objectifs de la cohorte. Les valeurs connues (leve, dette, conformite, '
  'croissance) sont traduites à l''affichage ; toute autre valeur est un '
  'objectif libre saisi par le programme et s''affiche tel quel.';

comment on column public.cohorts.goal is
  'HÉRITÉ — premier élément de `goals`, tenu à jour par create_cohort. '
  'Ne pas lire : utiliser `goals`.';

-- Reprise des cohortes existantes : sans elle, celles créées avant aujourd'hui
-- afficheraient « aucun objectif » alors qu'elles en ont un.
update public.cohorts
set goals = array[goal]
where goal is not null and goal <> '' and goals = '{}';

-- ═══════════════════════════════════════════════════════════════════════════
-- `create_cohort` — DROP puis recréation.
--
-- Ajouter un paramètre par `create or replace` ne remplace pas la fonction :
-- il en crée une SECONDE, surchargée. Les deux coexisteraient, et PostgREST
-- choisirait selon les noms d'arguments transmis — un piège qui se déclenche
-- le jour où quelqu'un oublie un argument. On supprime donc l'ancienne
-- signature, et on réémet le `grant` que le DROP fait perdre (cf. AGENTS.md).
-- ═══════════════════════════════════════════════════════════════════════════
drop function if exists public.create_cohort(text, int, date, date, text);

create or replace function public.create_cohort(
  p_name      text,
  p_seats     int     default null,
  p_starts_on date    default null,
  p_ends_on   date    default null,
  p_goals     text[]  default null
)
returns public.cohorts
language plpgsql security definer set search_path = public as $$
declare
  v_org    uuid;
  v_limit  int;
  v_goals  text[];
  v_cohort public.cohorts;
begin
  select m.org_id into v_org
  from public.memberships m
  where m.user_id = auth.uid() and m.role in ('owner', 'admin')
  order by m.created_at
  limit 1;

  if v_org is null then raise exception 'accès refusé'; end if;
  if not public.org_active(v_org) then raise exception 'abonnement expiré'; end if;
  if coalesce(trim(p_name), '') = '' then raise exception 'nom requis'; end if;

  -- Nettoyage des objectifs : vides retirés, espaces rognés, doublons écartés.
  -- Fait ICI et pas dans l'écran : la saisie libre arrive telle quelle, et deux
  -- cohortes ne doivent pas porter « Conformité » et « conformité  » comme s'il
  -- s'agissait de deux choses.
  select coalesce(array_agg(distinct g), '{}')
    into v_goals
  from unnest(coalesce(p_goals, '{}')) as g
  where trim(g) <> '';

  -- Plafond : au-delà, ce n'est plus un objectif, c'est une description. Un
  -- écran qui affiche douze étiquettes n'en fait lire aucune.
  if array_length(v_goals, 1) > 6 then
    raise exception 'six objectifs au maximum';
  end if;

  select cohort_limit into v_limit from public.organizations where id = v_org;

  insert into public.cohorts (org_id, name, seats, starts_on, ends_on, goals, goal)
  values (
    v_org, trim(p_name),
    greatest(coalesce(p_seats, v_limit, 10), 1),
    p_starts_on, p_ends_on,
    v_goals,
    -- Colonne héritée, tenue à jour pour ne rien casser en aval.
    v_goals[1]
  )
  returning * into v_cohort;

  perform public.write_audit(
    v_org, 'cohort.created', 'cohort', v_cohort.id::text,
    jsonb_build_object('name', v_cohort.name, 'goals', v_goals)
  );

  return v_cohort;
end;
$$;

grant execute on function public.create_cohort(text, int, date, date, text[]) to authenticated;
