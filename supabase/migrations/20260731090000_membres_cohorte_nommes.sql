-- Le programme doit pouvoir NOMMER les entreprises de sa cohorte.
--
-- LE BLOCAGE, vu à l'écran. Le détail d'une cohorte affichait « — » à la place
-- du nom de l'entreprise qui venait de la rejoindre. Le nom existe pourtant en
-- base (« Medom Health ») : c'est la lecture qui échouait.
--
-- La page joignait `organizations` depuis `cohort_members`. Or la politique de
-- `organizations` est :
--
--     for select using (public.is_org_member(id))
--
-- Le programme n'est PAS membre de l'organisation de la startup — c'est même
-- tout le principe de la §0.1. La jointure imbriquée renvoyait donc null, et
-- l'écran retombait sur son libellé de repli.
--
-- Quatrième occurrence de la même mécanique cette semaine : une table fermée
-- par RLS, lue par quelqu'un que la RLS exclut, et un résultat vide qui se lit
-- comme une donnée absente plutôt que comme un refus. `sae_portfolio()`
-- contournait déjà le problème pour le portefeuille — cette page-là avait été
-- écrite avec une jointure directe.
--
-- CE QUI SORT D'ICI : un identifiant et un NOM. Rien d'autre. Pas de slug, pas
-- de branding, pas de date de création — la fonction énumère ses colonnes,
-- donc ce qui n'y figure pas ne peut pas fuiter par inadvertance.

create or replace function public.cohort_members_named(p_cohort uuid)
returns table (
  startup_org_id uuid,
  name           text
)
language sql stable security definer set search_path = public as $$
  select cm.startup_org_id, o.name
  from public.cohort_members cm
  join public.organizations o on o.id = cm.startup_org_id
  join public.cohorts c on c.id = cm.cohort_id
  where cm.cohort_id = p_cohort
    -- L'appelant doit être le programme propriétaire de la cohorte. La garde
    -- est DANS la fonction : `security definer` désactive la RLS, c'est donc
    -- ici et nulle part ailleurs qu'elle se réinstalle.
    and public.is_org_member(c.org_id)
  order by o.name;
$$;

grant execute on function public.cohort_members_named(uuid) to authenticated;

-- ── LE MÊME TROU, AILLEURS ─────────────────────────────────────────────────
-- `/demandes` et `/dealroom` lisent eux aussi le nom d'organisations de
-- startups (`from("organizations").select("id, name").in("id", …)`). Même
-- politique, même résultat vide, même « — » à l'écran — simplement pas encore
-- visible, faute de données sur ces écrans.
--
-- Une fonction commune plutôt que deux : le lien légitime entre un programme et
-- une entreprise est TOUJOURS le même — elle est membre d'une de ses cohortes.
-- L'écrire une fois, c'est n'avoir qu'un endroit à relire le jour où ce lien
-- change.

create or replace function public.related_org_names(p_ids uuid[])
returns table (
  id   uuid,
  name text
)
language sql stable security definer set search_path = public as $$
  select o.id, o.name
  from public.organizations o
  where o.id = any(coalesce(p_ids, '{}'))
    and (
      -- La sienne.
      public.is_org_member(o.id)
      -- Ou une entreprise d'une de ses cohortes. Rien d'autre : un programme
      -- ne nomme pas une organisation qu'il n'accompagne pas.
      or exists (
        select 1
        from public.cohort_members cm
        join public.cohorts c on c.id = cm.cohort_id
        where cm.startup_org_id = o.id
          and public.is_org_member(c.org_id)
      )
    );
$$;

grant execute on function public.related_org_names(uuid[]) to authenticated;
