-- Masquer une pièce aux invités, sans la sortir de son dossier.
--
-- Le droit se pose sur un DOSSIER : ouvrir « Finance et comptabilité » ouvrait
-- jusqu'ici les douze pièces qu'il contient. Or il y en a toujours une qu'on
-- ne veut pas montrer à ce tour-là — un rapport d'audit, une lettre d'avocat —
-- et la seule parade était de la déplacer ailleurs, donc de désorganiser sa
-- data room pour un problème d'accès.
--
-- Le masquage est une propriété de la PIÈCE, pas de l'invitation. C'est un
-- choix délibéré :
--
--   · il se décide dans la data room, là où on regarde le fichier, et non
--     enfoui dans un assistant de partage qu'on ne rouvre jamais ;
--   · il vaut pour TOUS les invités, présents et à venir. Une pièce masquée
--     pour l'un et visible pour l'autre serait un état qu'aucun écran ne
--     montre en entier, donc un état qu'on oublie ;
--   · l'assistant de partage n'a plus qu'à LIRE ce qui est masqué et le dire
--     au moment de choisir les dossiers.
--
-- Ré-exécutable.

alter table public.documents
  add column if not exists hidden_from_guests boolean not null default false;

create index if not exists documents_hidden_idx
  on public.documents (deal_id) where hidden_from_guests;


-- ---------------------------------------------------------------------------
-- LECTURE — un invité ne voit pas même le nom
-- ---------------------------------------------------------------------------
-- Le nom suffit à trahir : « Audit fiscal — redressement.pdf » en dit déjà
-- trop. Le masquage se joue donc au SELECT, pas seulement au téléchargement.
--
-- Même forme que la règle de la racine, posée par `documents_racine` : la
-- pièce reste pleinement visible en interne, elle disparaît pour les invités.
drop policy if exists document_select on public.documents;
create policy document_select on public.documents
  for select using (
    public.can_see_deal(deal_id)
    and (
      (folder_id is not null and not hidden_from_guests)
      or exists (
        select 1 from public.deals d
        where d.id = documents.deal_id and public.is_org_internal(d.org_id)
      )
    )
  );

-- Les versions portent `storage_key`, la clé du fichier dans le bucket privé :
-- sans la même règle, la pièce masquée fuirait par ce chemin.
drop policy if exists version_select on public.document_versions;
create policy version_select on public.document_versions
  for select using (exists (
    select 1 from public.documents doc
    where doc.id = document_versions.document_id
      and public.can_see_deal(doc.deal_id)
      and (
        (doc.folder_id is not null and not doc.hidden_from_guests)
        or exists (
          select 1 from public.deals d
          where d.id = doc.deal_id and public.is_org_internal(d.org_id)
        )
      )
  ));


-- ---------------------------------------------------------------------------
-- DROITS — la visionneuse refuse une pièce masquée à un invité
-- ---------------------------------------------------------------------------
-- La RLS cache la ligne, mais `my_document_permission` s'exécute en
-- `security definer` : elle voit tout. Sans ce garde-fou, un invité qui
-- connaîtrait l'identifiant d'une pièce masquée obtiendrait son niveau, donc
-- le fichier. Deux barrières valent mieux qu'une quand la seconde est une
-- ligne de code.
create or replace function public.my_document_permission(p_doc uuid)
returns public.perm_level
language plpgsql stable security definer set search_path = public as $$
declare
  v_folder uuid;
  v_deal   uuid;
  v_org    uuid;
  v_masque boolean;
begin
  select folder_id, deal_id, hidden_from_guests
    into v_folder, v_deal, v_masque
  from public.documents where id = p_doc;

  if v_deal is null then return 'none'; end if;

  select org_id into v_org from public.deals where id = v_deal;

  -- SEULE ligne ajoutée à la logique d'origine : une pièce masquée n'existe
  -- pas pour qui n'est pas de la maison. Tout ce qui suit est inchangé —
  -- notamment le fait qu'un `member` passe par `effective_permission` et n'a
  -- donc PAS 'edit' d'office. Remonter ce test plus haut « pour simplifier »
  -- élargirait les droits de toute l'équipe sans que rien ne le signale.
  if v_masque
     and not public.has_org_role(
       v_org, array['owner', 'admin', 'member']::public.org_role[]
     ) then
    return 'none';
  end if;

  -- Rangé : la règle habituelle, remontée de l'arborescence comprise.
  if v_folder is not null then
    return public.effective_permission(auth.uid(), v_folder);
  end if;

  -- À la racine : l'équipe interne, et personne d'autre.
  if public.has_org_role(v_org, array['owner', 'admin', 'member']::public.org_role[]) then
    return 'edit';
  end if;

  return 'none';
end;
$$;

grant execute on function public.my_document_permission(uuid) to authenticated;


-- ---------------------------------------------------------------------------
-- Masquer / démasquer
-- ---------------------------------------------------------------------------
create or replace function public.set_document_hidden(
  p_doc uuid,
  p_hidden boolean
)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_deal uuid;
  v_org  uuid;
  v_nom  text;
begin
  select deal_id, name into v_deal, v_nom
  from public.documents where id = p_doc;
  if v_deal is null then raise exception 'pièce introuvable'; end if;

  -- Vérifie le droit d'écrire sur l'opération, et lève sinon.
  v_org := public.deal_org_for_write(v_deal);

  update public.documents
  set hidden_from_guests = p_hidden
  where id = p_doc;

  -- Masquer et démasquer sont des gestes de sécurité : ils se tracent, sinon
  -- personne ne peut dire QUAND une pièce a cessé d'être cachée.
  perform public.write_audit(
    v_org,
    case when p_hidden then 'document.hidden' else 'document.unhidden' end,
    'document', p_doc::text,
    jsonb_build_object('name', v_nom), v_deal
  );

  return p_hidden;
end;
$$;

grant execute on function public.set_document_hidden(uuid, boolean) to authenticated;
