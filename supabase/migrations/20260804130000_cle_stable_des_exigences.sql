-- Donner une identité stable à chaque exigence du référentiel.
--
-- POURQUOI, ET POURQUOI AVANT LES VARIANTES. L'identité d'une exigence
-- matérialisée reposait sur son intitulé : `apply_checklist_template` cherchait
-- « existe-t-il déjà une ligne portant ce libellé ? ». Or la migration suivante
-- fait précisément varier les libellés — « Registre des actionnaires » devient
-- « Registre des associés » pour une SARL. Réappliquer le modèle aurait alors
-- inséré une deuxième ligne au lieu de reconnaître la même exigence, et le
-- fondateur se serait retrouvé avec deux registres à fournir.
--
-- La clé, elle, ne bouge jamais. C'est elle qui permet à un intitulé de changer
-- sans que l'exigence perde son identité.
--
-- CETTE MIGRATION NE CHANGE RIEN AU PLAN PRODUIT : mêmes vingt-deux exigences,
-- mêmes libellés, mêmes niveaux.

alter table public.checklist_catalog add column key text;

update public.checklist_catalog set key = case label
  when 'Déclaration fiscale d''existence (NINEA/IFU)'              then 'declaration_fiscale'
  when 'Extrait RCCM de moins de 3 mois'                           then 'extrait_rccm'
  when 'Statuts à jour et enregistrés'                             then 'statuts'
  when 'Commissaire aux comptes désigné si seuils atteints'        then 'commissaire_aux_comptes'
  when 'Pacte d''actionnaires en vigueur'                          then 'pacte_actionnaires'
  when 'Politique LBC/FT et screening'                             then 'lbc_ft'
  when 'PV des assemblées des 3 derniers exercices'                then 'pv_assemblees'
  when 'Registre des actionnaires à jour'                          then 'registre_actionnaires'
  when 'Registre des bénéficiaires effectifs'                      then 'beneficiaires_effectifs'
  when 'Budget de l''exercice en cours'                            then 'budget_exercice'
  when 'États financiers SYSCOHADA — 3 exercices'                  then 'etats_financiers'
  when 'Rapport du commissaire aux comptes'                        then 'rapport_cac'
  when 'Tableau de la dette et des covenants'                      then 'tableau_dette'
  when 'Déclarations de TVA à jour'                                then 'declarations_tva'
  when 'Quitus ou attestation de régularité fiscale'               then 'quitus_fiscal'
  when 'Agréments sectoriels applicables'                          then 'agrements_sectoriels'
  when 'Assurances en cours de validité'                           then 'assurances'
  when 'Business plan et modèle financier'                         then 'business_plan'
  when 'Attestation de régularité sociale (CNSS/CNPS/IPRES)'       then 'regularite_sociale'
  when 'Marques OAPI enregistrées'                                 then 'marques_oapi'
  when 'Plan d''action E&S'                                        then 'plan_action_es'
  when 'Politique environnementale et sociale'                     then 'politique_es'
end;

alter table public.checklist_catalog alter column key set not null;
alter table public.checklist_catalog add constraint checklist_catalog_key_unique unique (key);

comment on column public.checklist_catalog.key is
  'Identité stable de l''exigence. L''intitulé varie selon la forme juridique ou le pays ; la clé, jamais. C''est elle qui empêche une variante de créer un doublon.';

alter table public.checklist_items add column catalog_key text;

-- Reprise des exigences déjà posées. Celles qui ne correspondent à aucune
-- entrée du catalogue restent à NULL : soit ajoutées à la main, soit héritées
-- d'une version antérieure du modèle — « Attestation de non-faillite » est dans
-- ce cas, et doit survivre telle quelle.
update public.checklist_items ci
set catalog_key = c.key
from public.checklist_catalog c
where c.label = ci.label and ci.catalog_key is null;

comment on column public.checklist_items.catalog_key is
  'Exigence du référentiel dont celle-ci découle. NULL = ajoutée à la main par le fondateur, elle n''existe dans aucun catalogue.';

create index if not exists checklist_items_catalog_key_idx
  on public.checklist_items (deal_id, catalog_key);

create or replace function public.apply_checklist_template(p_deal uuid)
 returns integer
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_org     uuid := public.deal_org_for_write(p_deal);
  v_created int := 0;
  v_item    record;
  v_folder  uuid;
  v_pos     int;
begin
  for v_item in
    select key, label, description, domain, level, sources,
           freshness_days, expected_period, accepted_formats, folder_path
    from public.checklist_catalog
    order by domain, label
  loop
    select f.id into v_folder
    from public.folders f
    where f.index_path = v_item.folder_path and f.deal_id = p_deal
    limit 1;

    select coalesce(max(position), 0) + 1 into v_pos
    from public.checklist_items
    where deal_id = p_deal and domain = v_item.domain;

    -- L'intitulé reste accepté comme identité de repli, le temps que les plans
    -- posés avant cette migration soient tous rattachés à leur clé.
    if not exists (
      select 1 from public.checklist_items
      where deal_id = p_deal
        and (catalog_key = v_item.key
             or (catalog_key is null and label = v_item.label))
    ) then
      insert into public.checklist_items (
        deal_id, catalog_key, domain, label, description, position, folder_id,
        level, sources, freshness_days, expected_period, accepted_formats
      )
      values (
        p_deal, v_item.key, v_item.domain, v_item.label, v_item.description,
        v_pos, v_folder, v_item.level, v_item.sources, v_item.freshness_days,
        v_item.expected_period, v_item.accepted_formats
      );
      v_created := v_created + 1;
    else
      update public.checklist_items
      set folder_id = coalesce(folder_id, v_folder)
      where deal_id = p_deal
        and (catalog_key = v_item.key
             or (catalog_key is null and label = v_item.label));
    end if;
  end loop;

  perform public.recompute_readiness(p_deal);

  if v_created > 0 then
    perform public.write_audit(
      v_org, 'checklist.template_applied', 'deal', p_deal::text,
      jsonb_build_object('items', v_created), p_deal
    );
  end if;

  return v_created;
end;
$function$;
