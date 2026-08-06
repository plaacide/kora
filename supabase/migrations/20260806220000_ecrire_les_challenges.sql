-- Créer, assigner, cocher. Les trois écritures d'un Challenge, et deux lectures.
--
-- Le socle posé par `socle_des_challenges` n'a AUCUNE politique d'écriture :
-- tout passe ici, par des fonctions qui vérifient les droits et auditent dans
-- la même transaction. Un Challenge assigné est une demande faite à une
-- entreprise, pas une ligne de données.
--
-- Ré-exécutable.

-- ---------------------------------------------------------------------------
-- Créer un Challenge — écrans 11 et 12
-- ---------------------------------------------------------------------------
-- LES DEUX ÉCRANS ABOUTISSENT ICI. L'écran 11 part de zéro et envoie sa propre
-- liste ; l'écran 12 part d'un modèle Sanza, laisse le programme l'amender, et
-- envoie la liste amendée. Dans les deux cas les critères sont COPIÉS dans
-- l'instance : le modèle d'origine n'est jamais modifié, et le corriger plus
-- tard ne touchera aucun Challenge en cours.
--
-- ⚠️ LA RÈGLE DE L'ÉCRAN 12 EST APPLIQUÉE ICI, PAS DANS L'INTERFACE. « Un
-- critère structurel ne peut pas être supprimé d'un modèle Sanza » : si la
-- liste envoyée en oublie un, la création ÉCHOUE. Une règle qui ne vit que
-- dans un bouton désactivé n'est pas une règle — c'est une suggestion.
create or replace function public.create_challenge(
  p_cohort   uuid,
  p_title    text,
  p_criteria jsonb,
  p_category text default null,
  p_due_on   date default null,
  p_template uuid default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_org      uuid;
  v_id       uuid;
  v_manquant text;
  v_nb       int;
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;
  if coalesce(trim(p_title), '') = '' then raise exception 'titre requis'; end if;

  select c.org_id into v_org from public.cohorts c where c.id = p_cohort;
  if v_org is null then raise exception 'cohorte introuvable'; end if;
  if not public.is_org_member(v_org) then raise exception 'droits insuffisants'; end if;

  v_nb := coalesce(jsonb_array_length(p_criteria), 0);
  if v_nb = 0 then raise exception 'aucun critère'; end if;

  -- Le modèle doit être lisible par l'appelant : un modèle Sanza, ou l'un des
  -- siens. Sans ce contrôle, l'identifiant d'un modèle d'un autre programme
  -- suffirait à en copier le contenu.
  if p_template is not null then
    if not exists (
      select 1 from public.challenge_templates t
      where t.id = p_template and (t.org_id is null or public.is_org_member(t.org_id))
    ) then
      raise exception 'modèle introuvable';
    end if;

    -- Les critères structurels d'un modèle SANZA sont obligatoires. Ceux d'un
    -- modèle du programme lui appartiennent : il en fait ce qu'il veut.
    select tc.label into v_manquant
    from public.challenge_template_criteria tc
    join public.challenge_templates t on t.id = tc.template_id
    where tc.template_id = p_template
      and tc.structural
      and t.org_id is null
      and not exists (
        select 1 from jsonb_array_elements(p_criteria) e
        where e ->> 'label' = tc.label
      )
    limit 1;

    if v_manquant is not null then
      raise exception 'critère structurel retiré : %', v_manquant;
    end if;
  end if;

  insert into public.challenges
    (cohort_id, org_id, template_id, title, category, due_on, created_by)
  values (p_cohort, v_org, p_template, trim(p_title), p_category, p_due_on, auth.uid())
  returning id into v_id;

  -- L'ordre du tableau FAIT la position : un critère déplacé dans l'écran doit
  -- se retrouver déplacé dans le Challenge.
  insert into public.challenge_criteria
    (challenge_id, label, source, catalog_key, required, position)
  select v_id,
         e ->> 'label',
         coalesce((e ->> 'source')::public.challenge_source, 'manuel'),
         nullif(e ->> 'catalog_key', ''),
         coalesce((e ->> 'required')::boolean, true),
         (ord - 1)::int
  from jsonb_array_elements(p_criteria) with ordinality as t(e, ord)
  where coalesce(trim(e ->> 'label'), '') <> '';

  perform public.write_audit(
    v_org, 'challenge.created', 'challenge', v_id::text,
    jsonb_build_object('cohorte', p_cohort, 'criteres', v_nb, 'modele', p_template)
  );

  return v_id;
end;
$$;

grant execute on function public.create_challenge(uuid, text, jsonb, text, date, uuid)
  to authenticated;

-- ---------------------------------------------------------------------------
-- Assigner — écran 13
-- ---------------------------------------------------------------------------
-- L'assignation CRÉE les lignes de progression, une par critère et par
-- entreprise. C'est ce qui rend la progression persistée plutôt que dérivée :
-- l'état existe dès le premier jour, à `a_faire`, et ne dépendra jamais d'un
-- canal de lecture qui pourrait s'éteindre.
create or replace function public.assign_challenge(
  p_challenge uuid,
  p_startups  uuid[]
)
returns int
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_org    uuid;
  v_cohort uuid;
  v_ajouts int;
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;

  select c.org_id, c.cohort_id into v_org, v_cohort
  from public.challenges c where c.id = p_challenge;
  if v_org is null then raise exception 'challenge introuvable'; end if;
  if not public.is_org_member(v_org) then raise exception 'droits insuffisants'; end if;

  -- On n'assigne QU'AUX MEMBRES de la cohorte. Le tableau reçu est filtré
  -- plutôt que refusé en bloc : une entreprise sortie entre l'affichage de
  -- l'écran et le clic ne doit pas faire échouer les neuf autres.
  insert into public.challenge_assignments (challenge_id, startup_org_id)
  select p_challenge, m.startup_org_id
  from public.cohort_members m
  where m.cohort_id = v_cohort
    and m.startup_org_id = any (p_startups)
  on conflict do nothing;

  get diagnostics v_ajouts = row_count;

  insert into public.challenge_progress (challenge_id, startup_org_id, criterion_id)
  select a.challenge_id, a.startup_org_id, cr.id
  from public.challenge_assignments a
  join public.challenge_criteria cr on cr.challenge_id = a.challenge_id
  where a.challenge_id = p_challenge
  on conflict do nothing;

  if v_ajouts > 0 then
    perform public.write_audit(
      v_org, 'challenge.assigned', 'challenge', p_challenge::text,
      jsonb_build_object('entreprises', v_ajouts)
    );
  end if;

  return v_ajouts;
end;
$$;

grant execute on function public.assign_challenge(uuid, uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Cocher un critère — écran 42, côté ENTREPRISE
-- ---------------------------------------------------------------------------
-- C'EST L'ENTREPRISE QUI COCHE, jamais le programme. L'écran 11 le dit :
-- « confirmé par l'entreprise ». Un programme qui pourrait cocher à sa place
-- transformerait un suivi en déclaratif.
--
-- Une ligne FIGÉE n'est jamais modifiée : l'entreprise est sortie de la
-- cohorte, sa progression appartient désormais à la mémoire du programme.
create or replace function public.set_challenge_criterion(
  p_challenge uuid,
  p_criterion uuid,
  p_done      boolean
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_startup uuid;
  v_source  public.challenge_source;
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;

  select a.startup_org_id into v_startup
  from public.challenge_assignments a
  where a.challenge_id = p_challenge and public.is_org_member(a.startup_org_id)
  limit 1;

  if v_startup is null then raise exception 'droits insuffisants'; end if;

  select cr.source into v_source
  from public.challenge_criteria cr
  where cr.id = p_criterion and cr.challenge_id = p_challenge;

  if v_source is null then raise exception 'critère introuvable'; end if;

  -- UN CRITÈRE CONNECTÉ NE SE COCHE PAS À LA MAIN. Il se valide tout seul dès
  -- que l'exigence correspondante est satisfaite ; le cocher reviendrait à
  -- déclarer une pièce qu'on n'a pas fournie.
  if v_source = 'connecte' then
    raise exception 'critère connecté : il se valide seul';
  end if;

  update public.challenge_progress
  set status     = case when p_done then 'fait' else 'a_faire' end::public.challenge_progress_status,
      origin     = case when p_done then 'confirme' else null end::public.challenge_progress_origin,
      reached_at = case when p_done then now() else null end
  where challenge_id = p_challenge
    and criterion_id = p_criterion
    and startup_org_id = v_startup
    and frozen_at is null;

  if not found then raise exception 'progression figée ou absente'; end if;

  perform public.write_audit(
    v_startup, 'challenge.criterion_set', 'challenge', p_challenge::text,
    jsonb_build_object('critere', p_criterion, 'fait', p_done)
  );
end;
$$;

grant execute on function public.set_challenge_criterion(uuid, uuid, boolean)
  to authenticated;

-- ---------------------------------------------------------------------------
-- Lire — colonnes ÉNUMÉRÉES
-- ---------------------------------------------------------------------------
-- La liste d'une cohorte, écrans 09 et 09b. Les quatre compteurs de l'écran
-- sont rendus BRUTS : « en retard » et « en cours » se déduisent de l'échéance
-- et du compte, dans le domaine, où la règle se teste sans base.
create or replace function public.cohort_challenges(p_cohort uuid)
returns table (
  id            uuid,
  title         text,
  category      text,
  due_on        date,
  criteres      bigint,
  entreprises   bigint,
  faits_total   bigint,
  terminees     bigint
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select c.id, c.title, c.category, c.due_on,
         (select count(*) from public.challenge_criteria cr where cr.challenge_id = c.id),
         (select count(*) from public.challenge_assignments a where a.challenge_id = c.id),
         (select count(*) from public.challenge_progress p
           where p.challenge_id = c.id and p.status = 'fait'),
         -- Une entreprise est TERMINÉE quand aucun de ses critères requis ne
         -- reste à faire. Compter les critères faits ne suffirait pas : un
         -- critère facultatif non coché ne retient personne.
         (select count(*) from public.challenge_assignments a
           where a.challenge_id = c.id
             and not exists (
               select 1 from public.challenge_progress p
               join public.challenge_criteria cr on cr.id = p.criterion_id
               where p.challenge_id = c.id
                 and p.startup_org_id = a.startup_org_id
                 and cr.required
                 and p.status = 'a_faire'
             ))
  from public.challenges c
  where c.cohort_id = p_cohort
    and c.archived_at is null
    and public.is_org_member(c.org_id)
  order by c.due_on nulls last, c.created_at;
$$;

grant execute on function public.cohort_challenges(uuid) to authenticated;

-- Le détail d'un Challenge, écrans 14 et 15 : une ligne par entreprise.
create or replace function public.challenge_companies(p_challenge uuid)
returns table (
  startup_org  uuid,
  startup_name text,
  requis       bigint,
  faits        bigint,
  fige         boolean
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select a.startup_org_id,
         o.name,
         (select count(*) from public.challenge_criteria cr
           where cr.challenge_id = p_challenge and cr.required),
         (select count(*) from public.challenge_progress p
           join public.challenge_criteria cr on cr.id = p.criterion_id
           where p.challenge_id = p_challenge
             and p.startup_org_id = a.startup_org_id
             and cr.required and p.status = 'fait'),
         exists (
           select 1 from public.challenge_progress p
           where p.challenge_id = p_challenge
             and p.startup_org_id = a.startup_org_id
             and p.frozen_at is not null
         )
  from public.challenge_assignments a
  join public.challenges c on c.id = a.challenge_id
  left join public.organizations o on o.id = a.startup_org_id
  where a.challenge_id = p_challenge
    and public.is_org_member(c.org_id)
  order by o.name;
$$;

grant execute on function public.challenge_companies(uuid) to authenticated;
