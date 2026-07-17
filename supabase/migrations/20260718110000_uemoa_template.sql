-- Kora — template de data room OHADA / UEMOA. Ré-exécutable.
--
-- Objectif : qu'un fondateur ouvre sa data room et sache immédiatement QUOI
-- mettre et OÙ. La structure reprend les 6 racines du design et détaille les
-- pièces réellement exigées dans une opération en zone OHADA/UEMOA
-- (RCCM, SYSCOHADA, quitus DGI, CNSS, OAPI, bénéficiaires effectifs, E&S).
--
-- V0 : template FIXE. La personnalisation par type de deal viendra en V1
-- (elle est inscrite sur la roadmap publique).

alter table public.folders
  add column if not exists description text not null default '';

drop function if exists public.apply_dataroom_template(uuid) cascade;

create or replace function public.apply_dataroom_template(p_deal uuid)
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_org     uuid := public.deal_org_for_write(p_deal);
  v_created int := 0;
  v_parent  uuid;
  v_pos     int := 0;
  v_cpos    int;
  v_node    jsonb;
  v_child   jsonb;
  v_tree    jsonb := '[
    {
      "name": "Corporate",
      "description": "L''identité juridique de la société : qui elle est, qui la détient, qui décide.",
      "children": [
        {"name": "Statuts", "description": "Statuts à jour et enregistrés, ainsi que toutes les modifications depuis la création."},
        {"name": "RCCM & existence légale", "description": "Extrait RCCM de moins de 3 mois, déclaration fiscale d''existence, NINEA/IFU selon le pays."},
        {"name": "Registre des actionnaires", "description": "Registre des titres, table de capitalisation à jour, pactes d''actionnaires antérieurs."},
        {"name": "PV d''assemblées", "description": "Procès-verbaux d''AGO, d''AGE et de conseil des 3 derniers exercices."}
      ]
    },
    {
      "name": "Financier",
      "description": "Les comptes, la fiscalité et les projections. Le cœur de la due diligence.",
      "children": [
        {"name": "États financiers SYSCOHADA", "description": "Bilan, compte de résultat et TAFIRE des 3 derniers exercices, en référentiel SYSCOHADA révisé."},
        {"name": "Commissaire aux comptes", "description": "Rapports général et spécial du CAC, si un commissaire est désigné."},
        {"name": "Fiscalité", "description": "Liasses fiscales, déclarations TVA, quitus ou attestation de régularité fiscale (DGI)."},
        {"name": "Budget", "description": "Budget de l''exercice en cours et suivi mensuel du réalisé."},
        {"name": "Projections", "description": "Business plan, modèle financier, hypothèses de croissance, analyse de sensibilité."},
        {"name": "Dette & engagements", "description": "Contrats de prêt, covenants, garanties données, crédit-bail, engagements hors bilan."}
      ]
    },
    {
      "name": "Juridique",
      "description": "Les engagements de la société envers les tiers, et les risques qui en découlent.",
      "children": [
        {"name": "Contrats clients", "description": "Contrats significatifs, conditions générales de vente, concentration du chiffre d''affaires."},
        {"name": "Contrats fournisseurs", "description": "Contrats significatifs, exclusivités, clauses de dépendance."},
        {"name": "Baux & immobilier", "description": "Baux commerciaux, titres fonciers, autorisations d''occupation."},
        {"name": "Litiges", "description": "Contentieux en cours, mises en demeure, décisions rendues, provisions associées."},
        {"name": "Assurances", "description": "Polices en cours et attestations de couverture."}
      ]
    },
    {
      "name": "RH",
      "description": "L''équipe, les contrats et la conformité sociale.",
      "children": [
        {"name": "Organigramme", "description": "Organigramme à jour et effectifs par fonction."},
        {"name": "Contrats clés", "description": "Contrats des dirigeants et personnes clés, clauses de non-concurrence et de propriété intellectuelle."},
        {"name": "Conformité sociale", "description": "Déclarations et attestation de régularité CNSS/CNPS/IPRES selon le pays, convention collective applicable."},
        {"name": "Rémunération", "description": "Grille salariale, plan d''intéressement, actions ou options attribuées."}
      ]
    },
    {
      "name": "Propriété intellectuelle",
      "description": "Ce que la société possède d''immatériel — souvent l''actif principal d''une startup.",
      "children": [
        {"name": "Marques OAPI", "description": "Certificats d''enregistrement OAPI, classes couvertes, échéances de renouvellement."},
        {"name": "Logiciels & code", "description": "Cessions de droits signées par les prestataires et fondateurs, inventaire des licences open source."},
        {"name": "Noms de domaine", "description": "Preuves de propriété des domaines et des comptes associés."}
      ]
    },
    {
      "name": "Conformité",
      "description": "Ce qu''un investisseur institutionnel ou un DFI exigera avant tout décaissement.",
      "children": [
        {"name": "KYC bénéficiaires", "description": "Pièces d''identité des bénéficiaires effectifs (détention supérieure à 25%) et registre des UBO."},
        {"name": "LBC/FT", "description": "Politique de lutte anti-blanchiment, résultats de screening sanctions et PEP."},
        {"name": "Licences & agréments", "description": "Agréments sectoriels : BCEAO, régulateur télécom, ministère de tutelle selon l''activité."},
        {"name": "ESG & impact", "description": "Politique environnementale et sociale, plan d''action E&S, indicateurs d''impact attendus par les DFI."}
      ]
    }
  ]'::jsonb;
begin
  for v_node in select * from jsonb_array_elements(v_tree) loop
    v_pos := v_pos + 1;

    select id into v_parent
    from public.folders
    where deal_id = p_deal and parent_id is null and name = v_node->>'name';

    if v_parent is null then
      insert into public.folders (deal_id, parent_id, name, description, position)
      values (p_deal, null, v_node->>'name', v_node->>'description', v_pos)
      returning id into v_parent;
      v_created := v_created + 1;
    else
      -- Consigne rafraîchie même si le dossier existe déjà.
      update public.folders set description = v_node->>'description'
      where id = v_parent and description = '';
    end if;

    v_cpos := 0;
    for v_child in select * from jsonb_array_elements(v_node->'children') loop
      v_cpos := v_cpos + 1;
      if not exists (
        select 1 from public.folders
        where deal_id = p_deal and parent_id = v_parent
          and name = v_child->>'name'
      ) then
        insert into public.folders (deal_id, parent_id, name, description, position)
        values (p_deal, v_parent, v_child->>'name', v_child->>'description', v_cpos);
        v_created := v_created + 1;
      end if;
    end loop;
  end loop;

  perform public.reindex_deal(p_deal);

  if v_created > 0 then
    perform public.write_audit(
      v_org, 'dataroom.template_applied', 'deal', p_deal::text,
      jsonb_build_object('folders', v_created, 'template', 'OHADA/UEMOA'), p_deal
    );
  end if;

  return v_created;
end;
$$;

grant execute on function public.apply_dataroom_template(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Roadmap : dire honnêtement que le template est figé en V0
-- ---------------------------------------------------------------------------
insert into public.roadmap_items (title, description, status, eta_label, is_official)
select
  'Templates de data room personnalisables',
  'La structure OHADA/UEMOA est aujourd''hui fixe et identique pour tous les deals. En V1 : templates adaptés au type d''opération (VC, PE, M&A, dette DFI) et au secteur, dossiers modifiables, et possibilité d''enregistrer vos propres modèles.',
  'planned', 'V1', true
where not exists (
  select 1 from public.roadmap_items
  where title = 'Templates de data room personnalisables'
);

insert into public.roadmap_items (title, description, status, eta_label, is_official)
select
  'Structure OHADA/UEMOA guidée',
  'La data room est pré-remplie avec l''arborescence attendue en zone OHADA — RCCM, états financiers SYSCOHADA, quitus fiscal, conformité CNSS, marques OAPI, bénéficiaires effectifs, exigences E&S des DFI — et chaque dossier explique quoi y déposer.',
  'shipped', 'V0', true
where not exists (
  select 1 from public.roadmap_items
  where title = 'Structure OHADA/UEMOA guidée'
);
