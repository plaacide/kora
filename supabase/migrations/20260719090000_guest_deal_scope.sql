-- ---------------------------------------------------------------------------
-- Cloisonnement des invités PAR DEAL
--
-- Jusqu'ici la lecture d'un deal reposait sur `is_org_member`, qui ne
-- distingue pas un associé d'un invité. Conséquence vérifiée : un investisseur
-- invité sur un deal voyait TOUS les deals de l'organisation — leur nom, leur
-- arborescence, le nom des documents, la checklist et le journal d'audit.
-- Le contenu des fichiers restait protégé, mais l'existence même d'une
-- opération confidentielle fuitait.
--
-- L'invitation est pourtant déjà par deal (`invitations.deal_id`) et se
-- matérialise par des lignes `permissions(deal_id, user_id, folder_id)`.
-- C'est cette réalité que la RLS doit refléter :
--
--   interne (owner/admin/member)  → tous les deals de son organisation
--   invité (guest)                → uniquement les deals où il a une
--                                   permission active
-- ---------------------------------------------------------------------------

-- Idempotent : la migration est rejouable.
drop policy if exists deal_select on public.deals;
drop policy if exists folder_select on public.folders;
drop policy if exists document_select on public.documents;
drop policy if exists version_select on public.document_versions;
drop policy if exists checklist_select on public.checklist_items;
drop policy if exists audit_select on public.audit_log;

-- ---------------------------------------------------------------------------
-- Le prédicat central
-- ---------------------------------------------------------------------------

/**
 * Vrai si l'utilisateur courant a le droit de savoir que ce deal existe.
 *
 * `security definer` : la fonction lit `permissions` et `memberships` en
 * contournant leur propre RLS, ce qui évite une récursion de politiques.
 * Elle ne renvoie qu'un booléen sur le deal demandé — elle n'expose rien.
 *
 * Une permission `none` ou expirée ne donne pas accès : c'est la même règle
 * que `effective_permission`, dupliquée ici volontairement (la RLS ne doit
 * pas dépendre d'une fonction qui, elle, peut être assouplie plus tard).
 */
create or replace function public.can_see_deal(p_deal uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    -- Interne : accès à tous les deals de son organisation.
    select 1 from public.deals d
    where d.id = p_deal and public.is_org_internal(d.org_id)
  ) or exists (
    -- Invité : uniquement là où on lui a ouvert quelque chose.
    select 1 from public.permissions p
    where p.deal_id = p_deal
      and p.user_id = auth.uid()
      and p.level <> 'none'
      and (p.expires_at is null or p.expires_at > now())
  );
$$;

grant execute on function public.can_see_deal(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Politiques réécrites
-- ---------------------------------------------------------------------------

create policy deal_select on public.deals
  for select using (public.can_see_deal(id));

create policy folder_select on public.folders
  for select using (public.can_see_deal(deal_id));

create policy document_select on public.documents
  for select using (public.can_see_deal(deal_id));

create policy checklist_select on public.checklist_items
  for select using (public.can_see_deal(deal_id));

-- `document_versions` porte `storage_key` : c'est la clé du fichier dans le
-- bucket privé. Le même cloisonnement s'applique.
create policy version_select on public.document_versions
  for select using (exists (
    select 1 from public.documents doc
    where doc.id = document_versions.document_id
      and public.can_see_deal(doc.deal_id)
  ));

-- Le journal d'audit reste un outil d'organisation : il raconte qui a fait
-- quoi sur l'ensemble des deals, y compris les entrées sans deal_id
-- (création d'org, sécurité). Un invité n'a rien à y voir — sauf ses propres
-- actions, qui sont sa preuve de ce qu'il a signé et consulté.
create policy audit_select on public.audit_log
  for select using (
    public.is_org_internal(org_id)
    or actor_id = auth.uid()
  );
