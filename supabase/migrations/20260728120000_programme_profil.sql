-- Profil du programme + onboarding qui enregistre à CHAQUE étape.
--
-- Le fondateur remplit une fiche `startups` (per-user) avant même de créer son
-- organisation ; le programme, lui, EST une organisation. Pour respecter la
-- règle §0.4 (« chaque étape enregistre à la validation — un abandon ne perd
-- rien »), on crée l'organisation dès l'étape 03, puis on l'enrichit : cohorte
-- à l'étape 04, invitations à l'étape 05.
--
-- Le prix à payer : distinguer « organisation créée » de « onboarding fini »,
-- sinon le dispatcher enverrait au tableau de bord dès l'étape 03. D'où le
-- drapeau `program_onboarding_done`. Il vaut `true` par défaut, donc les
-- organisations existantes (fondateurs, investisseurs) sont « finies » sans
-- migration de données — seule une nouvelle organisation programme naît à
-- `false` et déclenche la reprise.

alter table public.organizations
  add column if not exists program_type   text,   -- 'accelerateur' | 'incubateur' | 'studio' | 'public'
  add column if not exists country         text,
  add column if not exists website         text,
  add column if not exists annual_volume   int,
  add column if not exists program_onboarding_done boolean not null default true;

-- ---------------------------------------------------------------------------
-- Étape 03 — créer/mettre à jour le programme, sans finir l'onboarding
-- ---------------------------------------------------------------------------

/**
 * Idempotente : premier appel crée l'organisation programme (+ membership
 * owner, + drapeau à false) ; les suivants la mettent à jour. On peut donc
 * revenir sur l'étape 03 sans dupliquer d'organisation.
 */
create or replace function public.save_programme(
  p_name    text,
  p_type    text default null,
  p_country text default null,
  p_website text default null,
  p_volume  int  default null
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_org  uuid;
  v_slug text;
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;
  if coalesce(trim(p_name), '') = '' then raise exception 'nom requis'; end if;

  select m.org_id into v_org
  from public.memberships m
  where m.user_id = auth.uid() and m.role in ('owner', 'admin')
  order by m.created_at
  limit 1;

  if v_org is null then
    -- Création : organisation programme + membership owner + audit.
    -- Le persona vit sur `profiles.account_type`, PAS sur `organizations` :
    -- on reflète les colonnes réelles (slug unique + devise), comme
    -- `create_organization`.
    v_slug := public.slugify(trim(p_name));
    if v_slug = '' then v_slug := 'org'; end if;
    v_slug := v_slug || '-' || substr(gen_random_uuid()::text, 1, 6);

    insert into public.organizations (name, slug, default_currency, program_onboarding_done)
    values (trim(p_name), v_slug, 'XOF', false)
    returning id into v_org;

    insert into public.memberships (org_id, user_id, role)
    values (v_org, auth.uid(), 'owner');

    perform public.write_audit(
      v_org, 'org.created', 'organization', v_org::text,
      jsonb_build_object('name', trim(p_name), 'persona', 'sae')
    );
  end if;

  update public.organizations
  set name = trim(p_name),
      program_type = coalesce(p_type, program_type),
      country = coalesce(p_country, country),
      website = coalesce(p_website, website),
      annual_volume = coalesce(p_volume, annual_volume)
  where id = v_org;

  -- Le profil de l'appelant porte aussi le persona (le dispatcher le lit).
  update public.profiles set account_type = 'sae' where id = auth.uid();

  return v_org;
end;
$$;

grant execute on function
  public.save_programme(text, text, text, text, int) to authenticated;

-- ---------------------------------------------------------------------------
-- Étape 06 — bienvenue : marquer l'onboarding fini
-- ---------------------------------------------------------------------------

create or replace function public.finish_programme_onboarding()
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_org uuid;
begin
  select m.org_id into v_org
  from public.memberships m
  where m.user_id = auth.uid() and m.role in ('owner', 'admin')
  order by m.created_at
  limit 1;

  if v_org is null then raise exception 'accès refusé'; end if;

  update public.organizations set program_onboarding_done = true where id = v_org;
end;
$$;

grant execute on function public.finish_programme_onboarding() to authenticated;
