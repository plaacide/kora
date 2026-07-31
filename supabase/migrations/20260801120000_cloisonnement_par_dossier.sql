-- Un invité ne voit que les dossiers qu'on lui a ouverts.
--
-- CE QUE LA VÉRIFICATION A MONTRÉ. Après avoir accepté une invitation portant
-- sur deux dossiers sur six, un compte invité réel pouvait lire :
--
--   · les six dossiers racine, y compris les quatre non accordés ;
--   · les vingt-quatre noms de pièces de l'opération entière ;
--   · la CLÉ DE STOCKAGE de chacune d'elles.
--
-- Ses droits, eux, étaient corrects : `my_document_permission` rendait bien
-- `none` sur les pièces non accordées, et le bucket est privé — le contenu ne
-- fuyait pas. Mais le nom suffit à trahir : « Contrat travail.pdf » dans un
-- jeu de test, « Term sheet Sequoia.pdf » dans la vraie vie.
--
-- Le trou est antérieur : `can_see_deal` ouvrait la lecture de TOUTE
-- l'opération dès qu'un droit existait quelque part, le cloisonnement étant
-- reporté au contenu. C'était défendable tant que le partage était « tout ou
-- rien ». Depuis que l'assistant fait décocher des dossiers, ça ne l'est plus :
-- le fondateur qui retire « Fiscalité » croit l'avoir cachée.
--
-- On aligne donc la LECTURE sur le DROIT, pour les invités seulement. Les
-- internes ne changent pas de vue.
--
-- Limite connue, laissée telle quelle : un droit posé sur un SOUS-dossier seul
-- rend ses parents invisibles, donc le chemin de navigation incomplet.
-- L'assistant n'accorde que des dossiers racine, le cas ne se produit pas
-- aujourd'hui ; le jour où l'on accordera un sous-dossier, il faudra rendre
-- visibles ses ancêtres — sans leur contenu.
--
-- Ré-exécutable.

-- ---------------------------------------------------------------------------
-- Dossiers
-- ---------------------------------------------------------------------------
drop policy if exists folder_select on public.folders;
create policy folder_select on public.folders
  for select using (
    public.can_see_deal(deal_id)
    and (
      exists (
        select 1 from public.deals d
        where d.id = folders.deal_id and public.is_org_internal(d.org_id)
      )
      or public.effective_permission(auth.uid(), folders.id) <> 'none'
    )
  );

-- ---------------------------------------------------------------------------
-- Pièces
-- ---------------------------------------------------------------------------
-- Reprend les deux règles déjà en vigueur — la racine réservée à l'équipe
-- (`documents_racine`), le masquage (`pieces_masquees`) — et y ajoute
-- l'exigence d'un droit effectif sur le dossier.
drop policy if exists document_select on public.documents;
create policy document_select on public.documents
  for select using (
    public.can_see_deal(deal_id)
    and (
      exists (
        select 1 from public.deals d
        where d.id = documents.deal_id and public.is_org_internal(d.org_id)
      )
      or (
        folder_id is not null
        and not hidden_from_guests
        and public.effective_permission(auth.uid(), folder_id) <> 'none'
      )
    )
  );

-- Les versions portent la clé de stockage : sans la même règle, elle fuirait
-- par ce chemin — c'est exactement ce que la vérification a constaté.
drop policy if exists version_select on public.document_versions;
create policy version_select on public.document_versions
  for select using (exists (
    select 1 from public.documents doc
    where doc.id = document_versions.document_id
      and public.can_see_deal(doc.deal_id)
      and (
        exists (
          select 1 from public.deals d
          where d.id = doc.deal_id and public.is_org_internal(d.org_id)
        )
        or (
          doc.folder_id is not null
          and not doc.hidden_from_guests
          and public.effective_permission(auth.uid(), doc.folder_id) <> 'none'
        )
      )
  ));

-- ---------------------------------------------------------------------------
-- Exigences
-- ---------------------------------------------------------------------------
-- La checklist est le plan de travail du fondateur : ce qui manque, ce qui
-- reste à fournir. Un invité y lisait les vingt-trois lignes, donc l'état de
-- préparation complet de l'opération — y compris les trous.
--
-- Rien dans le produit ne montre la checklist à un invité. On la referme.
drop policy if exists checklist_select on public.checklist_items;
create policy checklist_select on public.checklist_items
  for select using (
    public.can_see_deal(deal_id)
    and exists (
      select 1 from public.deals d
      where d.id = checklist_items.deal_id and public.is_org_internal(d.org_id)
    )
  );
