-- L'identité publique et la marque d'une Dealroom — écrans 20 et 21.
--
-- CE QUE CE MANQUE A RÉVÉLÉ. En préparant une page de démonstration, un
-- `update public.dealrooms set public_title = …` lancé sous le rôle
-- `authenticated` n'a RIEN écrit — et n'a rien dit. Le socle ne pose aucune
-- politique d'écriture, volontairement ; sans RPC, la table est donc en
-- lecture seule pour tout le monde, et l'écran affichait un titre sans
-- sous-titre sans que rien ne signale pourquoi.
--
-- C'est le comportement voulu — mieux vaut une écriture refusée qu'une
-- écriture non auditée — mais il rendait ces deux fonctions nécessaires plus
-- tôt que prévu.
--
-- Ré-exécutable.

-- ---------------------------------------------------------------------------
-- L'identité publique — écran 20
-- ---------------------------------------------------------------------------
-- Le nom INTERNE et le titre PUBLIC sont deux choses. « Sélection Women-led »
-- peut s'appeler « Demo Day 2026 » devant les investisseurs, et le programme
-- doit pouvoir retrouver la sienne dans sa liste. C'est pourquoi la table
-- porte les deux depuis le socle.
create or replace function public.set_dealroom_identity(
  p_dealroom  uuid,
  p_titre     text default null,
  p_sous_titre text default null,
  p_description text default null,
  p_contact   text default null,
  p_nom_interne text default null
)
returns void
language plpgsql security definer set search_path to 'public'
as $$
declare v_org uuid;
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;
  v_org := public.dealroom_org(p_dealroom);
  if v_org is null then raise exception 'dealroom introuvable'; end if;
  if not public.is_org_member(v_org) then raise exception 'droits insuffisants'; end if;

  -- `coalesce` sur chaque champ : un appel qui ne porte qu'un champ ne doit
  -- pas effacer les autres. Pour vider un champ, on envoie une chaîne vide,
  -- que `nullif` transforme en NULL — un `null` seul veut dire « ne touche
  -- pas », et les deux intentions doivent pouvoir s'exprimer.
  update public.dealrooms
  set internal_name = coalesce(nullif(trim(p_nom_interne), ''), internal_name),
      public_title  = case when p_titre is null then public_title
                           else nullif(trim(p_titre), '') end,
      subtitle      = case when p_sous_titre is null then subtitle
                           else nullif(trim(p_sous_titre), '') end,
      description   = case when p_description is null then description
                           else nullif(trim(p_description), '') end,
      contact_email = case when p_contact is null then contact_email
                           else nullif(trim(p_contact), '') end
  where id = p_dealroom;

  perform public.write_audit(
    v_org, 'dealroom.identity_set', 'dealroom', p_dealroom::text,
    jsonb_strip_nulls(jsonb_build_object('titre', p_titre, 'contact', p_contact))
  );
end;
$$;

grant execute on function public.set_dealroom_identity(uuid, text, text, text, text, text)
  to authenticated;

-- ---------------------------------------------------------------------------
-- La marque — écran 21
-- ---------------------------------------------------------------------------
-- `logo` et `banniere` sont des CLÉS du bucket `branding`, public — le même
-- régime que le logo d'un programme, et pour la même raison : la page qu'elles
-- décorent est ouverte. Le dépôt se fait côté serveur, comme pour le logo ;
-- cette fonction n'enregistre que la clé.
create or replace function public.set_dealroom_branding(
  p_dealroom uuid,
  p_logo     text default null,
  p_banniere text default null,
  p_accent   text default null,
  p_partenaires text[] default null,
  p_powered_by boolean default null
)
returns void
language plpgsql security definer set search_path to 'public'
as $$
declare v_org uuid;
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;
  v_org := public.dealroom_org(p_dealroom);
  if v_org is null then raise exception 'dealroom introuvable'; end if;
  if not public.is_org_member(v_org) then raise exception 'droits insuffisants'; end if;

  -- L'ACCENT EST VALIDÉ, parce qu'il part dans une propriété CSS. Une valeur
  -- libre y serait injectée telle quelle dans un attribut `style` — on
  -- n'accepte donc qu'un code hexadécimal.
  if p_accent is not null and trim(p_accent) <> ''
     and trim(p_accent) !~ '^#[0-9a-fA-F]{6}$' then
    raise exception 'accent invalide';
  end if;

  insert into public.dealroom_branding (dealroom_id) values (p_dealroom)
  on conflict do nothing;

  update public.dealroom_branding
  set logo   = case when p_logo is null then logo else nullif(trim(p_logo), '') end,
      banner = case when p_banniere is null then banner else nullif(trim(p_banniere), '') end,
      accent = case when p_accent is null then accent else nullif(trim(p_accent), '') end,
      partners = coalesce(p_partenaires, partners),
      powered_by_sanza = coalesce(p_powered_by, powered_by_sanza)
  where dealroom_id = p_dealroom;

  perform public.write_audit(
    v_org, 'dealroom.branding_set', 'dealroom', p_dealroom::text,
    jsonb_strip_nulls(jsonb_build_object('accent', p_accent, 'partenaires', to_jsonb(p_partenaires)))
  );
end;
$$;

grant execute on function public.set_dealroom_branding(uuid, text, text, text, text[], boolean)
  to authenticated;
