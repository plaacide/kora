-- Créer, garnir, consentir, publier, partager. Et la lecture PUBLIQUE.
--
-- LA RÈGLE DE L'ÉCRAN 22 VIT ICI, et c'est le seul point d'
-- INCOHERENCES-MAQUETTES qui survivait au branchement : « une entreprise sans
-- accord peut préparer la Dealroom, mais ne sera pas publiée ». Elle est
-- appliquée DEUX FOIS, à dessein — au moment de publier, et au moment de lire.
-- Publier vérifie, mais une entreprise peut retirer son accord APRÈS la
-- publication : la lecture publique doit alors cesser de la montrer, sans
-- attendre que le programme republie.
--
-- Ré-exécutable.

-- ---------------------------------------------------------------------------
-- Créer
-- ---------------------------------------------------------------------------
create or replace function public.create_dealroom(
  p_name    text,
  p_cohorts uuid[] default null
)
returns uuid
language plpgsql security definer set search_path to 'public'
as $$
declare v_org uuid; v_id uuid;
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;
  if coalesce(trim(p_name), '') = '' then raise exception 'nom requis'; end if;

  select m.org_id into v_org from public.memberships m
  where m.user_id = auth.uid() and m.role in ('owner', 'admin')
  order by m.created_at limit 1;
  if v_org is null then raise exception 'droits insuffisants'; end if;

  insert into public.dealrooms (org_id, internal_name, public_title, created_by)
  values (v_org, trim(p_name), trim(p_name), auth.uid())
  returning id into v_id;

  -- La ligne de branding naît avec la Dealroom : un écran qui doit gérer son
  -- absence gère un cas de plus pour rien.
  insert into public.dealroom_branding (dealroom_id) values (v_id)
  on conflict do nothing;

  -- On ne rattache QUE des cohortes du programme. Un identifiant venu
  -- d'ailleurs est ignoré, pas refusé : le reste de la création n'y est pour
  -- rien.
  if p_cohorts is not null then
    insert into public.dealroom_cohorts (dealroom_id, cohort_id)
    select v_id, c.id from public.cohorts c
    where c.id = any (p_cohorts) and c.org_id = v_org
    on conflict do nothing;
  end if;

  perform public.write_audit(
    v_org, 'dealroom.created', 'dealroom', v_id::text,
    jsonb_build_object('nom', trim(p_name))
  );
  return v_id;
end;
$$;

grant execute on function public.create_dealroom(text, uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Garnir — et créer l'accord EN ATTENTE du même geste
-- ---------------------------------------------------------------------------
-- Ajouter une entreprise crée sa ligne d'accord à « attente ». C'est ce qui
-- rend l'écran 26 lisible sans calcul : une entreprise sans ligne n'est pas
-- dans la Dealroom, une ligne « attente » est une demande en cours.
create or replace function public.set_dealroom_entries(
  p_dealroom uuid,
  p_startups uuid[]
)
returns int
language plpgsql security definer set search_path to 'public'
as $$
declare v_org uuid; v_n int;
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;
  v_org := public.dealroom_org(p_dealroom);
  if v_org is null then raise exception 'dealroom introuvable'; end if;
  if not public.is_org_member(v_org) then raise exception 'droits insuffisants'; end if;

  -- UNIQUEMENT des entreprises des cohortes rattachées. C'est la seule
  -- garantie que le programme accompagne réellement celles qu'il publie.
  insert into public.dealroom_entries (dealroom_id, startup_org_id)
  select p_dealroom, m.startup_org_id
  from public.dealroom_cohorts dc
  join public.cohort_members m on m.cohort_id = dc.cohort_id
  where dc.dealroom_id = p_dealroom
    and m.startup_org_id = any (p_startups)
  on conflict do nothing;

  get diagnostics v_n = row_count;

  insert into public.dealroom_consents (dealroom_id, startup_org_id)
  select e.dealroom_id, e.startup_org_id
  from public.dealroom_entries e
  where e.dealroom_id = p_dealroom
  on conflict do nothing;

  if v_n > 0 then
    perform public.write_audit(
      v_org, 'dealroom.entries_added', 'dealroom', p_dealroom::text,
      jsonb_build_object('entreprises', v_n)
    );
  end if;
  return v_n;
end;
$$;

grant execute on function public.set_dealroom_entries(uuid, uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- L'accord — donné par L'ENTREPRISE, jamais par le programme
-- ---------------------------------------------------------------------------
-- Un programme qui pourrait consentir à sa propre place ferait de l'accord une
-- formalité. La fonction ne trouve l'entreprise que par l'appartenance de
-- l'appelant.
create or replace function public.set_dealroom_consent(
  p_dealroom uuid,
  p_status   text
)
returns void
language plpgsql security definer set search_path to 'public'
as $$
declare v_startup uuid; v_statut public.dealroom_consent;
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;
  if p_status not in ('accorde', 'refuse', 'retire') then
    raise exception 'statut inconnu';
  end if;
  v_statut := p_status::public.dealroom_consent;

  select c.startup_org_id into v_startup
  from public.dealroom_consents c
  where c.dealroom_id = p_dealroom and public.is_org_member(c.startup_org_id)
  limit 1;
  if v_startup is null then raise exception 'droits insuffisants'; end if;

  update public.dealroom_consents
  set status     = v_statut,
      -- `granted_at` n'est JAMAIS effacé : on doit pouvoir dire qu'un accord
      -- a existé puis a été retiré. L'effacer ferait mentir l'historique par
      -- omission.
      granted_at = case when v_statut = 'accorde' then now() else granted_at end,
      revoked_at = case when v_statut in ('refuse', 'retire') then now() else null end
  where dealroom_id = p_dealroom and startup_org_id = v_startup;

  perform public.write_audit(
    v_startup, 'dealroom.consent_set', 'dealroom', p_dealroom::text,
    jsonb_build_object('statut', p_status)
  );
end;
$$;

grant execute on function public.set_dealroom_consent(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Publier — la règle de l'écran 22
-- ---------------------------------------------------------------------------
create or replace function public.publish_dealroom(p_dealroom uuid)
returns int
language plpgsql security definer set search_path to 'public'
as $$
declare v_org uuid; v_sans int; v_publiees int;
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;
  v_org := public.dealroom_org(p_dealroom);
  if v_org is null then raise exception 'dealroom introuvable'; end if;
  if not public.is_org_member(v_org) then raise exception 'droits insuffisants'; end if;

  select count(*) into v_sans
  from public.dealroom_entries e
  left join public.dealroom_consents c
    on c.dealroom_id = e.dealroom_id and c.startup_org_id = e.startup_org_id
  where e.dealroom_id = p_dealroom
    and coalesce(c.status, 'attente') <> 'accorde';

  -- On REFUSE plutôt que de publier partiellement. Publier « ce qui peut
  -- l'être » donnerait une Dealroom incomplète sans que personne ne l'ait
  -- décidé — et le programme croirait avoir publié douze entreprises.
  if v_sans > 0 then
    raise exception 'accords manquants : % entreprise(s)', v_sans;
  end if;

  update public.dealroom_entries
  set published_at = coalesce(published_at, now()), unpublished_at = null
  where dealroom_id = p_dealroom;
  get diagnostics v_publiees = row_count;

  update public.dealrooms
  set status = 'publiee', published_at = coalesce(published_at, now())
  where id = p_dealroom;

  perform public.write_audit(
    v_org, 'dealroom.published', 'dealroom', p_dealroom::text,
    jsonb_build_object('entreprises', v_publiees)
  );
  return v_publiees;
end;
$$;

grant execute on function public.publish_dealroom(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Les liens — émettre et révoquer
-- ---------------------------------------------------------------------------
create or replace function public.create_dealroom_link(
  p_dealroom uuid,
  p_label    text default null
)
returns text
language plpgsql security definer set search_path to 'public'
as $$
declare v_org uuid; v_token text;
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;
  v_org := public.dealroom_org(p_dealroom);
  if v_org is null then raise exception 'dealroom introuvable'; end if;
  if not public.is_org_member(v_org) then raise exception 'droits insuffisants'; end if;

  insert into public.dealroom_links (dealroom_id, label, created_by)
  values (p_dealroom, nullif(trim(p_label), ''), auth.uid())
  returning token into v_token;

  perform public.write_audit(
    v_org, 'dealroom.link_created', 'dealroom', p_dealroom::text,
    jsonb_build_object('libelle', p_label)
  );
  return v_token;
end;
$$;

grant execute on function public.create_dealroom_link(uuid, text) to authenticated;

create or replace function public.revoke_dealroom_link(p_link uuid)
returns void
language plpgsql security definer set search_path to 'public'
as $$
declare v_org uuid; v_dealroom uuid;
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;
  select l.dealroom_id into v_dealroom from public.dealroom_links l where l.id = p_link;
  if v_dealroom is null then raise exception 'lien introuvable'; end if;
  v_org := public.dealroom_org(v_dealroom);
  if not public.is_org_member(v_org) then raise exception 'droits insuffisants'; end if;

  update public.dealroom_links set revoked_at = now()
  where id = p_link and revoked_at is null;

  perform public.write_audit(
    v_org, 'dealroom.link_revoked', 'dealroom', v_dealroom::text,
    jsonb_build_object('lien', p_link)
  );
end;
$$;

grant execute on function public.revoke_dealroom_link(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- LA LECTURE PUBLIQUE — sans compte, par le jeton du lien
-- ---------------------------------------------------------------------------
-- C'est la conséquence directe de l'arbitrage d'ADR-005 : la page s'ouvre sans
-- authentification, donc la RLS ne peut RIEN décider — il n'y a pas d'appelant
-- à interroger. Le jeton porte seul l'autorisation, et il est vérifié ici.
--
-- ⚠️ CETTE FONCTION EST LA FRONTIÈRE. Tout ce qu'elle rend est public. Elle
-- énumère donc, et ne rend une entreprise QUE si trois conditions tiennent : la
-- Dealroom est publiée, le lien est vivant, et l'accord est ACCORDÉ. Le
-- troisième point est ce qui permet à une entreprise de se retirer après
-- publication sans attendre le bon vouloir du programme.
--
-- Aucun nom de pièce, aucun identifiant de document : une Dealroom montre des
-- FICHES, la data room contient des PIÈCES et se demande séparément.
create or replace function public.dealroom_public(p_token text)
returns table (
  titre        text,
  sous_titre   text,
  description  text,
  contact      text,
  logo         text,
  banniere     text,
  accent       text,
  partenaires  text[],
  powered_by   boolean,
  entreprise   text,
  secteur      text,
  pays         text,
  stade        text,
  montant      numeric,
  devise       text
)
language sql stable security definer set search_path to 'public'
as $$
  select d.public_title, d.subtitle, d.description, d.contact_email,
         b.logo, b.banner, b.accent, b.partners, b.powered_by_sanza,
         o.name, s.sector, s.country,
         de.stage::text, de.amount, de.currency
  from public.dealroom_links l
  join public.dealrooms d on d.id = l.dealroom_id
  left join public.dealroom_branding b on b.dealroom_id = d.id
  left join public.dealroom_entries e
    on e.dealroom_id = d.id
   and e.published_at is not null
   and e.unpublished_at is null
   -- L'ACCORD EST REVÉRIFIÉ À CHAQUE LECTURE. Publier l'a exigé ; le retirer
   -- doit suffire à disparaître.
   and exists (
     select 1 from public.dealroom_consents c
     where c.dealroom_id = e.dealroom_id
       and c.startup_org_id = e.startup_org_id
       and c.status = 'accorde'
   )
  left join public.organizations o on o.id = e.startup_org_id
  left join lateral (
    select st.sector, st.country from public.startups st
    where st.org_id = e.startup_org_id
    order by st.updated_at desc nulls last, st.id limit 1
  ) s on true
  left join public.deals de on de.id = e.deal_id
  where l.token = p_token
    and l.revoked_at is null
    and d.status = 'publiee'
    and d.archived_at is null;
$$;

-- `anon` EST INDISPENSABLE ICI, et c'est le seul endroit du produit où on
-- l'accorde sur une donnée d'entreprise. C'est le prix de l'arbitrage : une
-- page sans compte est servie à un rôle sans identité.
grant execute on function public.dealroom_public(text) to anon, authenticated;
