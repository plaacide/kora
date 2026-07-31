-- Les mises à jour aux investisseurs — écrans 46 à 50.
--
-- Rien n'existait. `raises.indicateurs` est la VITRINE : ce qu'un visiteur voit
-- avant d'ouvrir la data room, une donnée vivante qu'on écrase. Une mise à jour
-- est l'inverse : un instantané daté, adressé à quelqu'un de précis, qui ne
-- change plus une fois publié. Les confondre reviendrait à réécrire le passé.
--
-- Trois règles portées par le schéma, pas par l'écran :
--
--   1. UNE AUDIENCE NE VOIT JAMAIS LES AUTRES DESTINATAIRES. Le destinataire
--      est une ligne à part, lisible seulement par lui — pas un tableau sur la
--      mise à jour, que la RLS ne saurait filtrer champ par champ.
--   2. PUBLIÉE = FIGÉE. Corriger ne modifie pas : cela crée une V2 qui pointe
--      vers la V1. Un investisseur qui a lu une version doit pouvoir la
--      retrouver telle qu'il l'a lue.
--   3. LA CONSULTATION EST UN SIGNAL DE LECTURE. Ni une approbation du
--      contenu, ni une intention de financer. Elle se compte, elle ne
--      s'interprète pas.
--
-- Ré-exécutable.

do $$ begin
  -- L'instrument de l'opération présentée : il décide des indicateurs qui ont
  -- un sens. On ne parle pas de DSCR à un fonds equity.
  create type public.update_instrument as enum ('capital', 'dette', 'dfi');
exception when duplicate_object then null; end $$;

do $$ begin
  -- Qui reçoit : le même chiffre n'intéresse pas un VC et une banque.
  create type public.update_funder as enum ('vc', 'banque', 'dfi');
exception when duplicate_object then null; end $$;

create table if not exists public.raise_updates (
  id       uuid primary key default gen_random_uuid(),
  deal_id  uuid not null references public.deals(id) on delete cascade,
  org_id   uuid not null references public.organizations(id) on delete cascade,

  -- L'audience, en deux axes — c'est elle qui suggère les indicateurs.
  instrument public.update_instrument not null,
  financeur  public.update_funder not null,

  -- « T3 2026 », « juillet 2026 » : la période couverte, saisie librement
  -- parce qu'un trimestre comptable ne tombe pas partout au même endroit.
  periode text not null,

  -- Le résumé du dirigeant, puis la demande éventuelle (« introduction auprès
  -- du guichet énergie de la BOAD »). Séparés : l'un raconte, l'autre appelle
  -- une réponse, et seul le second se relance.
  resume  text,
  demande text,

  -- Les indicateurs retenus, figés avec la mise à jour. Un tableau JSONB :
  -- [{ "cle", "libelle", "definition", "periode", "valeur", "precision",
  --    "verification": "declare" | "verifie" }]
  --
  -- En JSONB et non en table : une fois publiés ils ne bougent plus, et rien
  -- ne les requête individuellement. Les normaliser coûterait une jointure par
  -- ligne pour un gain nul.
  indicateurs jsonb not null default '[]'::jsonb,

  -- La pièce jointe se choisit dans la data room : joindre un fichier qui n'y
  -- est pas créerait une seconde vérité sur le même document.
  document_id uuid references public.documents(id) on delete set null,

  statut text not null default 'brouillon'
    check (statut in ('brouillon', 'publiee')),

  -- V1, V2… Une correction ne remplace pas : elle succède.
  version   int not null default 1,
  corrige   uuid references public.raise_updates(id) on delete set null,

  published_at timestamptz,
  published_by uuid references auth.users(id) on delete set null,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists raise_updates_deal_idx
  on public.raise_updates (deal_id, statut, published_at desc);

create table if not exists public.raise_update_recipients (
  id        uuid primary key default gen_random_uuid(),
  update_id uuid not null references public.raise_updates(id) on delete cascade,
  -- Le destinataire est une relation du pipeline : on n'écrit pas à une
  -- adresse dans le vide, on écrit à quelqu'un qu'on suit.
  investor_id uuid not null
    references public.raise_investors(id) on delete cascade,
  -- Rempli à la publication si l'adresse correspond à un compte. Sans lui, le
  -- destinataire ne verra rien DANS l'application — c'est la vérité, et mieux
  -- vaut qu'elle soit visible que masquée par une ligne qui ne mène nulle part.
  user_id   uuid references auth.users(id) on delete set null,
  vues      int not null default 0,
  derniere_vue timestamptz,
  created_at   timestamptz not null default now(),
  unique (update_id, investor_id)
);

create index if not exists raise_update_recipients_user_idx
  on public.raise_update_recipients (user_id);

alter table public.raise_updates enable row level security;
alter table public.raise_update_recipients enable row level security;

/**
 * Les deux prédicats passent par des fonctions, et ce n'est pas du style.
 *
 * Écrites en ligne, les politiques se citaient l'une l'autre : celle des mises
 * à jour interrogeait les destinataires, celle des destinataires interrogeait
 * les mises à jour. PostgreSQL n'y voit pas une jolie symétrie mais une
 * boucle — `42P17, infinite recursion detected` — et la lecture entière échoue.
 *
 * `security definer` contourne la RLS de la table lue, ce qui rompt le cycle.
 * Chaque fonction ne rend qu'un booléen ou un identifiant sur la ligne
 * demandée : elle n'expose rien de plus que ce que la politique décidait déjà.
 */
create or replace function public.is_update_recipient(p_update uuid)
returns boolean
language sql stable security definer set search_path = public as $fn$
  select exists (
    select 1 from public.raise_update_recipients r
    where r.update_id = p_update and r.user_id = auth.uid()
  );
$fn$;

grant execute on function public.is_update_recipient(uuid) to authenticated;

create or replace function public.update_org(p_update uuid)
returns uuid
language sql stable security definer set search_path = public as $fn$
  select org_id from public.raise_updates where id = p_update;
$fn$;

grant execute on function public.update_org(uuid) to authenticated;

/**
 * Un brouillon n'existe pas pour son futur destinataire.
 *
 * Sans cette condition, il ne lisait pas le contenu — la politique des mises à
 * jour l'en empêchait — mais sa PROPRE ligne de destinataire restait visible :
 * de quoi apprendre qu'une mise à jour non publiée le concerne, et quand elle a
 * été préparée. Un brouillon est un travail en cours, pas une annonce.
 */
create or replace function public.update_is_published(p_update uuid)
returns boolean
language sql stable security definer set search_path = public as $fn$
  select exists (
    select 1 from public.raise_updates
    where id = p_update and statut = 'publiee'
  );
$fn$;

grant execute on function public.update_is_published(uuid) to authenticated;

drop policy if exists raise_updates_select on public.raise_updates;
create policy raise_updates_select on public.raise_updates
  for select using (
    public.is_org_internal(org_id)
    -- Le destinataire ne voit que ce qui est PUBLIÉ, et seulement ce qui lui
    -- est adressé. Un brouillon n'existe pas pour lui.
    or (statut = 'publiee' and public.is_update_recipient(id))
  );

drop policy if exists raise_update_recipients_select on public.raise_update_recipients;
create policy raise_update_recipients_select on public.raise_update_recipients
  for select using (
    -- La règle « une audience ne voit jamais les autres destinataires » tient
    -- ici, et nulle part ailleurs : le destinataire ne lit que sa propre ligne,
    -- et seulement une fois la mise à jour publiée.
    (user_id = auth.uid() and public.update_is_published(update_id))
    or public.is_org_internal(public.update_org(update_id))
  );

revoke insert, update, delete on public.raise_updates from authenticated;
revoke insert, update, delete on public.raise_update_recipients from authenticated;


-- ---------------------------------------------------------------------------
-- Écrire un brouillon — étapes 1 à 3 de l'assistant (écrans 47, 48, commentaire)
-- ---------------------------------------------------------------------------
/**
 * Crée ou met à jour un BROUILLON.
 *
 * Le même appel sert aux trois étapes : l'assistant enregistre à chaque
 * passage, pour qu'une fermeture d'onglet à l'étape 3 ne perde pas les deux
 * premières.
 *
 * Une mise à jour publiée est refusée ici — c'est la règle 2, et elle doit
 * tenir dans la base, pas dans le bouton qu'on a pensé à désactiver.
 */
create or replace function public.save_raise_update(
  p_deal uuid,
  p_id uuid default null,
  p_instrument text default null,
  p_financeur text default null,
  p_periode text default null,
  p_resume text default null,
  p_demande text default null,
  p_indicateurs jsonb default null,
  p_document uuid default null,
  p_destinataires uuid[] default null
)
returns public.raise_updates
language plpgsql security definer set search_path = public as $$
declare
  v_org uuid := public.deal_org_for_write(p_deal);
  v_row public.raise_updates;
begin
  if p_id is null then
    insert into public.raise_updates (
      deal_id, org_id, instrument, financeur, periode, resume, demande,
      indicateurs, document_id, created_by
    )
    values (
      p_deal, v_org,
      coalesce(p_instrument, 'capital')::public.update_instrument,
      coalesce(p_financeur, 'vc')::public.update_funder,
      coalesce(nullif(trim(p_periode), ''), 'Période à préciser'),
      p_resume, p_demande, coalesce(p_indicateurs, '[]'::jsonb),
      p_document, auth.uid()
    )
    returning * into v_row;
  else
    update public.raise_updates set
      instrument  = coalesce(p_instrument::public.update_instrument, instrument),
      financeur   = coalesce(p_financeur::public.update_funder, financeur),
      periode     = coalesce(nullif(trim(p_periode), ''), periode),
      resume      = coalesce(p_resume, resume),
      demande     = coalesce(p_demande, demande),
      indicateurs = coalesce(p_indicateurs, indicateurs),
      document_id = coalesce(p_document, document_id),
      updated_at  = now()
    where id = p_id and deal_id = p_deal and statut = 'brouillon'
    returning * into v_row;

    if v_row.id is null then
      raise exception 'brouillon introuvable ou déjà publié';
    end if;
  end if;

  -- Les destinataires se remplacent en bloc : l'assistant présente une liste
  -- cochée, pas un ajout successif. `null` veut dire « on ne touche pas ».
  --
  -- Le rapprochement avec un compte existant se fait DÈS ICI, et pas seulement
  -- à la publication : l'étape de vérification annonce qui recevra vraiment la
  -- mise à jour, et cet avertissement doit être vrai avant de publier, pas
  -- après. La publication le refait, au cas où le compte serait créé entre
  -- temps.
  if p_destinataires is not null then
    delete from public.raise_update_recipients where update_id = v_row.id;

    insert into public.raise_update_recipients (update_id, investor_id, user_id)
    select v_row.id, i.id,
      (select p.id from public.profiles p
       where lower(p.email) = lower(i.email) limit 1)
    from public.raise_investors i
    where i.id = any(p_destinataires) and i.deal_id = p_deal;
  end if;

  return v_row;
end;
$$;

grant execute on function public.save_raise_update(
  uuid, uuid, text, text, text, text, text, jsonb, uuid, uuid[]
) to authenticated;


-- ---------------------------------------------------------------------------
-- Publier — écran 49
-- ---------------------------------------------------------------------------
/**
 * Fige la mise à jour et l'ouvre à ses destinataires.
 *
 * C'est ici qu'on relie chaque destinataire à un COMPTE, en rapprochant
 * l'adresse portée par le pipeline des profils existants. Le rapprochement se
 * fait à la publication et pas avant : entre le brouillon et l'envoi,
 * l'investisseur a pu créer son compte.
 *
 * Publier sans destinataire est refusé — une mise à jour que personne ne
 * reçoit n'est pas publiée, c'est une note.
 */
create or replace function public.publish_raise_update(p_id uuid)
returns public.raise_updates
language plpgsql security definer set search_path = public as $$
declare
  v_deal  uuid;
  v_org   uuid;
  v_row   public.raise_updates;
  v_count int;
begin
  select deal_id into v_deal from public.raise_updates where id = p_id;
  if v_deal is null then raise exception 'mise à jour introuvable'; end if;
  v_org := public.deal_org_for_write(v_deal);

  select count(*) into v_count
  from public.raise_update_recipients where update_id = p_id;
  if v_count = 0 then
    raise exception 'aucun destinataire';
  end if;

  update public.raise_update_recipients r
  set user_id = p.id
  from public.raise_investors i
  join public.profiles p on lower(p.email) = lower(i.email)
  where r.update_id = p_id and r.investor_id = i.id and r.user_id is null;

  update public.raise_updates set
    statut       = 'publiee',
    published_at = now(),
    published_by = auth.uid(),
    updated_at   = now()
  where id = p_id and statut = 'brouillon'
  returning * into v_row;

  if v_row.id is null then
    raise exception 'mise à jour déjà publiée';
  end if;

  perform public.write_audit(
    v_org, 'update.published', 'raise_update', p_id::text,
    jsonb_build_object(
      'periode', v_row.periode, 'version', v_row.version,
      'destinataires', v_count,
      'indicateurs', jsonb_array_length(v_row.indicateurs)
    ),
    v_deal
  );
  return v_row;
end;
$$;

grant execute on function public.publish_raise_update(uuid) to authenticated;


/**
 * Créer une correction — écran 50, « Créer une correction (V2) ».
 *
 * La nouvelle version part d'une copie complète de l'ancienne, destinataires
 * compris : on corrige un chiffre, on ne ressaisit pas huit indicateurs. La V1
 * reste publiée et lisible.
 */
create or replace function public.correct_raise_update(p_id uuid)
returns public.raise_updates
language plpgsql security definer set search_path = public as $$
declare
  v_src public.raise_updates;
  v_new public.raise_updates;
  v_org uuid;
begin
  select * into v_src from public.raise_updates where id = p_id;
  if v_src.id is null then raise exception 'mise à jour introuvable'; end if;
  if v_src.statut <> 'publiee' then
    raise exception 'seule une mise à jour publiée se corrige';
  end if;
  v_org := public.deal_org_for_write(v_src.deal_id);

  insert into public.raise_updates (
    deal_id, org_id, instrument, financeur, periode, resume, demande,
    indicateurs, document_id, version, corrige, created_by
  )
  values (
    v_src.deal_id, v_org, v_src.instrument, v_src.financeur, v_src.periode,
    v_src.resume, v_src.demande, v_src.indicateurs, v_src.document_id,
    v_src.version + 1, v_src.id, auth.uid()
  )
  returning * into v_new;

  insert into public.raise_update_recipients (update_id, investor_id)
  select v_new.id, investor_id
  from public.raise_update_recipients where update_id = v_src.id;

  return v_new;
end;
$$;

grant execute on function public.correct_raise_update(uuid) to authenticated;


/** Supprimer un brouillon. Une mise à jour publiée ne se supprime pas. */
create or replace function public.delete_raise_update(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_deal uuid;
begin
  select deal_id into v_deal from public.raise_updates
  where id = p_id and statut = 'brouillon';
  if v_deal is null then
    raise exception 'brouillon introuvable ou déjà publié';
  end if;
  perform public.deal_org_for_write(v_deal);

  delete from public.raise_updates where id = p_id;
end;
$$;

grant execute on function public.delete_raise_update(uuid) to authenticated;


/**
 * Le signal de lecture — appelé quand un destinataire ouvre la mise à jour.
 *
 * `security definer` parce que le destinataire n'a pas le droit d'écrire dans
 * la table ; le `where user_id = auth.uid()` garantit qu'il ne compte que sa
 * propre lecture. Aucun journal d'audit : quatre ouvertures d'un même
 * investisseur ne sont pas quatre événements de l'opération.
 */
create or replace function public.seen_raise_update(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.raise_update_recipients
  set vues = vues + 1, derniere_vue = now()
  where update_id = p_id and user_id = auth.uid();
end;
$$;

grant execute on function public.seen_raise_update(uuid) to authenticated;
