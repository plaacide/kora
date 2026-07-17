-- Kora — roadmap publique + suggestions + votes. Ré-exécutable.
--
-- La roadmap est GLOBALE (produit Kora), pas rattachée à une organisation :
-- elle vit donc hors du modèle multi-tenant, et se lit sans être connecté.

drop function if exists public.toggle_roadmap_vote(uuid) cascade;
drop function if exists public.suggest_feature(text, text) cascade;
drop table if exists public.roadmap_votes cascade;
drop table if exists public.roadmap_items cascade;
drop type if exists public.roadmap_status cascade;

create type public.roadmap_status as enum (
  'planned', 'in_progress', 'shipped'
);

-- Droit d'administration produit (le fondateur), distinct des rôles d'org.
alter table public.profiles
  add column if not exists platform_admin boolean not null default false;

create table public.roadmap_items (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text not null default '',
  status      public.roadmap_status not null default 'planned',
  -- Libellé d'échéance assumé et vague ("V1 · T4 2026") plutôt qu'une date
  -- ferme : on ne promet pas ce qu'on ne peut pas tenir.
  eta_label   text,
  /** true = feuille de route officielle ; false = suggestion communautaire. */
  is_official boolean not null default false,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index roadmap_items_status_idx on public.roadmap_items (status, is_official);

create table public.roadmap_votes (
  item_id    uuid not null references public.roadmap_items(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (item_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Suggestion (toute personne connectée)
-- ---------------------------------------------------------------------------
create or replace function public.suggest_feature(p_title text, p_description text)
returns public.roadmap_items
language plpgsql security definer set search_path = public as $$
declare
  v_item public.roadmap_items;
begin
  if auth.uid() is null then
    raise exception 'non authentifié';
  end if;
  if length(trim(p_title)) < 4 then
    raise exception 'titre trop court';
  end if;

  -- is_official forcé à false : personne ne s'ajoute à la roadmap officielle.
  insert into public.roadmap_items (title, description, status, is_official, created_by)
  values (trim(p_title), coalesce(trim(p_description), ''), 'planned', false, auth.uid())
  returning * into v_item;

  -- L'auteur vote pour sa propre suggestion.
  insert into public.roadmap_votes (item_id, user_id) values (v_item.id, auth.uid());

  return v_item;
end;
$$;

-- ---------------------------------------------------------------------------
-- Vote (bascule)
-- ---------------------------------------------------------------------------
create or replace function public.toggle_roadmap_vote(p_item uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_exists boolean;
begin
  if auth.uid() is null then
    raise exception 'non authentifié';
  end if;

  select exists (
    select 1 from public.roadmap_votes
    where item_id = p_item and user_id = auth.uid()
  ) into v_exists;

  if v_exists then
    delete from public.roadmap_votes
    where item_id = p_item and user_id = auth.uid();
    return false;
  end if;

  insert into public.roadmap_votes (item_id, user_id) values (p_item, auth.uid());
  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS — lecture publique, écriture encadrée
-- ---------------------------------------------------------------------------
alter table public.roadmap_items enable row level security;
alter table public.roadmap_votes enable row level security;

create policy roadmap_read on public.roadmap_items
  for select to anon, authenticated using (true);

-- Écriture uniquement via suggest_feature(). Mise à jour réservée au produit.
create policy roadmap_admin_update on public.roadmap_items
  for update using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.platform_admin
  ));

create policy votes_read on public.roadmap_votes
  for select to anon, authenticated using (true);

grant select on public.roadmap_items to anon, authenticated;
grant update on public.roadmap_items to authenticated;
grant select on public.roadmap_votes to anon, authenticated;
grant execute on function public.suggest_feature(text, text) to authenticated;
grant execute on function public.toggle_roadmap_vote(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Feuille de route officielle — ce qui reste à construire, dit honnêtement
-- ---------------------------------------------------------------------------
insert into public.roadmap_items (title, description, status, eta_label, is_official) values
  ('Pipeline (kanban)', 'Vue kanban des deals : Sourcing → Screening → Due diligence → Comité → Signé → Passé, avec totaux par colonne et déplacement des deals.', 'planned', 'V1', true),
  ('Fiche deal', 'Vue consolidée d''un deal : KPIs, timeline, jalons, équipe, notes de comité, documents clés.', 'planned', 'V1', true),
  ('Checklist de due diligence', 'Checklists OHADA / Financier / DFI avec statuts, liaison aux documents et calcul du score de readiness.', 'planned', 'V1', true),
  ('Readiness Score', 'Jauge de complétude de la data room par catégorie, avec recommandations actionnables.', 'planned', 'V1', true),
  ('Q&A', 'Questions/réponses structurées : brouillon → revue interne → publiée, avec filtres et export.', 'planned', 'V1', true),
  ('Versions & comparaison', 'Historique des versions d''un document et comparaison visuelle des changements.', 'planned', 'V1', true),
  ('Recherche globale', 'Recherche plein texte dans les documents avec extraits surlignés.', 'planned', 'V1', true),
  ('KYC / AML', 'Vérifications d''identité, RCCM, sanctions, PEP et médias sur les contreparties.', 'planned', 'V1', true),
  ('Syndication', 'Suivi des co-investisseurs et des engagements par rapport à la cible.', 'planned', 'V1', true),
  ('Calendrier', 'Échéances : comités, closings, expirations d''accès, deadlines de reporting.', 'planned', 'V1', true),
  ('Portefeuille & reporting LP', 'Suivi des participations, KPIs des sociétés, TVPI/IRR et rapports LP brandés.', 'planned', 'V1', true),
  ('Collecte de KPI (mobile)', 'Formulaire mobile pour que les sociétés du portefeuille remontent leurs indicateurs, avec relances.', 'planned', 'V1', true),
  ('Paramètres & branding', 'Gestion des membres et des rôles, logo sur les rooms et filigranes, domaines autorisés.', 'planned', 'V1', true),
  ('Facturation & mobile money', 'Abonnement en FCFA, paiement par Wave et Orange Money, factures.', 'planned', 'V1', true),
  ('Notifications', 'Choix des alertes par canal : email, in-app et WhatsApp.', 'planned', 'V1', true),
  ('Centre d''aide', 'Guides par profil (fondateur, investisseur, conseil) et support.', 'planned', 'V1', true),
  ('Analyse IA des documents', 'Détection de points d''attention, résumés et extraction de chiffres clés. Option premium : vos documents ne servent jamais à entraîner un modèle.', 'planned', 'V2', true),
  ('Data room sécurisée', 'Arborescence indexée automatiquement, dépôt de documents, chiffrement au repos.', 'shipped', 'V0', true),
  ('Visionneuse filigranée', 'Pages rendues côté serveur avec filigrane dynamique. Le fichier source ne quitte jamais le serveur : le téléchargement est réellement impossible.', 'shipped', 'V0', true),
  ('Permissions par dossier', 'Niveaux Aucun → Filigrané → Voir → Télécharger → Éditer, hérités et expirables.', 'shipped', 'V0', true),
  ('Invitations & NDA e-signé', 'Invitation par email, signature électronique du NDA avec preuve horodatée, puis accès au niveau prévu.', 'shipped', 'V0', true),
  ('Journal d''audit inviolable', 'Chaque action horodatée et chaînée par empreinte. Aucune ligne ne peut être modifiée ou supprimée.', 'shipped', 'V0', true),
  ('Authentification à deux facteurs', '2FA par code à usage unique, obligatoire à la connexion une fois activée.', 'shipped', 'V0', true);
