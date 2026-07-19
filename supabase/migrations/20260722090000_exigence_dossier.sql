-- Relie chaque exigence de la checklist au dossier où sa pièce se dépose.
--
-- Les deux listes existaient côte à côte sans se connaître : le fondateur
-- lisait « Extrait RCCM de moins de 3 mois », puis se retournait vers une
-- arborescence de 30 dossiers et devait deviner lequel. C'est la différence
-- entre une liste et un guide.
--
-- Rattachement par `index_path` et non par nom : un fondateur peut renommer
-- « RCCM & existence légale », il ne renumérote pas 1.2. Le lien est résolu à
-- l'application du référentiel, quand les dossiers viennent d'être créés
-- (create_deal applique la data room AVANT la checklist).
--
-- `on delete set null` : supprimer un dossier ne doit pas faire disparaître
-- l'exigence — elle reste due, elle n'a simplement plus d'emplacement suggéré.

alter table public.checklist_items
  add column if not exists folder_id uuid
  references public.folders(id) on delete set null;

create index if not exists checklist_folder_idx
  on public.checklist_items (folder_id);


-- ---------------------------------------------------------------------------
-- Correspondance de référence.
--
-- Trois cas ont demandé un arbitrage, signalés ici pour qu'ils puissent être
-- rediscutés sans relire tout le fichier :
--   · Pacte d'actionnaires -> 1.3 (avec le registre : c'est la même matière
--     capitalistique) plutôt que 1.1 Statuts.
--   · Commissaire aux comptes désigné -> 2.2 (le dossier existe, côté
--     financier) plutôt qu'un dossier Corporate.
--   · Attestation de régularité sociale -> 4.3 Conformité sociale (RH) plutôt
--     que 6.x Conformité, qui traite la conformité réglementaire de l'activité.
-- ---------------------------------------------------------------------------
create or replace function public.checklist_folder_map()
returns table (label text, folder_path text)
language sql immutable as $$
  select * from (values
    -- OHADA
    ('Statuts à jour et enregistrés',                         '1.1'),
    ('Extrait RCCM de moins de 3 mois',                       '1.2'),
    ('Déclaration fiscale d''existence (NINEA/IFU)',          '1.2'),
    ('Registre des actionnaires à jour',                      '1.3'),
    ('PV des assemblées des 3 derniers exercices',            '1.4'),
    ('Pacte d''actionnaires en vigueur',                      '1.3'),
    ('Commissaire aux comptes désigné si seuils atteints',    '2.2'),
    -- Financier
    ('États financiers SYSCOHADA — 3 exercices',              '2.1'),
    ('Rapport du commissaire aux comptes',                    '2.2'),
    ('Quitus ou attestation de régularité fiscale',           '2.3'),
    ('Déclarations de TVA à jour',                            '2.3'),
    ('Budget de l''exercice en cours',                        '2.4'),
    ('Business plan et modèle financier',                     '2.5'),
    ('Tableau de la dette et des covenants',                  '2.6'),
    -- DFI / bailleurs
    ('Attestation de régularité sociale (CNSS/CNPS/IPRES)',   '4.3'),
    ('Registre des bénéficiaires effectifs',                  '6.1'),
    ('Politique LBC/FT et screening',                         '6.2'),
    ('Politique environnementale et sociale',                 '6.4'),
    ('Plan d''action E&S',                                    '6.4'),
    ('Agréments sectoriels applicables',                      '6.3'),
    ('Assurances en cours de validité',                       '3.5'),
    ('Marques OAPI enregistrées',                             '5.1')
  ) as t(label, folder_path);
$$;


-- Rattachement des exigences DÉJÀ créées (les deals existants).
-- Les exigences ajoutées à la main par un fondateur n'ont pas d'entrée dans la
-- correspondance : elles restent sans dossier suggéré, ce qui est correct.
update public.checklist_items ci
set folder_id = f.id
from public.checklist_folder_map() m
join public.folders f on f.index_path = m.folder_path
where ci.label = m.label
  and f.deal_id = ci.deal_id
  and ci.folder_id is null;


-- ---------------------------------------------------------------------------
-- Le référentiel pose désormais le dossier attendu à la création du deal.
-- ---------------------------------------------------------------------------
create or replace function public.apply_checklist_template(p_deal uuid)
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_org     uuid := public.deal_org_for_write(p_deal);
  v_created int := 0;
  v_node    jsonb;
  v_pos     int;
  v_cat     text;
  v_items   jsonb;
  v_tree    jsonb := '[
    {
      "category": "ohada",
      "items": [
        {"label": "Statuts à jour et enregistrés", "description": "Version en vigueur, avec toutes les modifications depuis la création."},
        {"label": "Extrait RCCM de moins de 3 mois", "description": "Un extrait périmé bloque systématiquement un closing."},
        {"label": "Déclaration fiscale d''existence (NINEA/IFU)", "description": "Preuve d''immatriculation fiscale selon le pays."},
        {"label": "Registre des actionnaires à jour", "description": "Table de capitalisation cohérente avec les statuts et les PV."},
        {"label": "PV des assemblées des 3 derniers exercices", "description": "AGO, AGE et conseils. Les décisions structurantes doivent être traçables."},
        {"label": "Pacte d''actionnaires en vigueur", "description": "Le pacte existant conditionne souvent ce qu''un nouvel investisseur peut négocier."},
        {"label": "Commissaire aux comptes désigné si seuils atteints", "description": "Obligatoire en OHADA au-delà de certains seuils. Son absence est un point d''audit."}
      ]
    },
    {
      "category": "financier",
      "items": [
        {"label": "États financiers SYSCOHADA — 3 exercices", "description": "Bilan, compte de résultat et TAFIRE, référentiel révisé."},
        {"label": "Rapport du commissaire aux comptes", "description": "Rapports général et spécial, avec les réserves éventuelles."},
        {"label": "Quitus ou attestation de régularité fiscale", "description": "Délivré par la DGI. Une dette fiscale non déclarée est un risque de reprise."},
        {"label": "Déclarations de TVA à jour", "description": "Cohérentes avec le chiffre d''affaires déclaré."},
        {"label": "Budget de l''exercice en cours", "description": "Avec le suivi du réalisé, pour juger de la fiabilité des prévisions."},
        {"label": "Business plan et modèle financier", "description": "Hypothèses explicites et vérifiables."},
        {"label": "Tableau de la dette et des covenants", "description": "Emprunts, garanties données, crédit-bail, engagements hors bilan."}
      ]
    },
    {
      "category": "dfi",
      "items": [
        {"label": "Attestation de régularité sociale (CNSS/CNPS/IPRES)", "description": "Exigée par la plupart des bailleurs avant décaissement."},
        {"label": "Registre des bénéficiaires effectifs", "description": "Toute personne détenant plus de 25% du capital, pièces d''identité à l''appui."},
        {"label": "Politique LBC/FT et screening", "description": "Anti-blanchiment, vérification sanctions et personnes politiquement exposées."},
        {"label": "Politique environnementale et sociale", "description": "Attendue par les DFI, souvent alignée sur les normes de performance IFC."},
        {"label": "Plan d''action E&S", "description": "Actions correctives datées et responsables identifiés."},
        {"label": "Agréments sectoriels applicables", "description": "BCEAO, régulateur télécom, ministère de tutelle selon l''activité."},
        {"label": "Assurances en cours de validité", "description": "Polices et attestations couvrant les risques d''exploitation."},
        {"label": "Marques OAPI enregistrées", "description": "Certificats et échéances. Une marque non déposée est un risque sur l''actif principal."}
      ]
    }
  ]'::jsonb;
  v_item jsonb;
  v_folder uuid;
begin
  for v_node in select * from jsonb_array_elements(v_tree) loop
    v_cat := v_node->>'category';
    v_items := v_node->'items';
    v_pos := 0;

    for v_item in select * from jsonb_array_elements(v_items) loop
      v_pos := v_pos + 1;

      -- Dossier attendu : résolu par index_path. Reste null si le dossier
      -- n'existe pas (data room personnalisée) — l'exigence est alors due
      -- sans emplacement suggéré, plutôt que rattachée au mauvais endroit.
      select f.id into v_folder
      from public.checklist_folder_map() m
      join public.folders f
        on f.index_path = m.folder_path and f.deal_id = p_deal
      where m.label = v_item->>'label'
      limit 1;

      if not exists (
        select 1 from public.checklist_items
        where deal_id = p_deal
          and category = v_cat::public.checklist_category
          and label = v_item->>'label'
      ) then
        insert into public.checklist_items
          (deal_id, category, label, description, position, folder_id)
        values (p_deal, v_cat::public.checklist_category,
                v_item->>'label', v_item->>'description', v_pos, v_folder);
        v_created := v_created + 1;
      else
        -- Deal existant dont la checklist est déjà posée : on complète le
        -- rattachement sans toucher au statut ni à la preuve.
        update public.checklist_items
        set folder_id = v_folder
        where deal_id = p_deal
          and category = v_cat::public.checklist_category
          and label = v_item->>'label'
          and folder_id is null
          and v_folder is not null;
      end if;
    end loop;
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
$$;

grant execute on function public.checklist_folder_map() to authenticated;
grant execute on function public.apply_checklist_template(uuid) to authenticated;
