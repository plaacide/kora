-- Les trois modèles Sanza par défaut.
--
-- POURQUOI CES TROIS-LÀ, ET PAS L'AUDIT NI LA M&A. Ce n'est pas un arbitrage
-- de goût : le domaine trace déjà la ligne. `intentCanCarryRaise()` rend vrai
-- pour `equity`, `debt` et `dfi`, et faux pour `diligence` et `audit`, avec ce
-- commentaire — « une diligence subie ou un audit n'en portent pas ».
--
-- Un modèle Sanza accompagne une préparation que l'entreprise DÉCIDE, vers un
-- financement qu'elle RECHERCHE. Un audit et une due diligence sont subis :
-- l'échéance vient du dehors, et un Challenge qui dit « avancez étape par
-- étape » n'y a pas la même portée. Ils sont dotés au référentiel — 10 et 19
-- exigences — et feront d'excellents modèles ; simplement pas ceux qu'on livre
-- par défaut.
--
-- Le « modèle accélérateur » n'entre pas non plus, pour une raison différente :
-- il existe DÉJÀ. `challenge_templates.org_id` non nul, c'est exactement ça —
-- un programme qui écrit son propre modèle. Ce n'est pas un modèle Sanza,
-- c'est une catégorie de modèles, et l'architecture la porte depuis le socle.
--
-- CHAQUE CRITÈRE CONNECTÉ VISE UNE CLÉ RÉELLE du catalogue, vérifiée contre
-- `cle_stable_des_exigences`. C'est ce qui les rend vivants : un critère
-- connecté sans clé ne se valide jamais, et l'entreprise l'attend
-- indéfiniment. Les critères qui ne correspondent à AUCUNE pièce du
-- référentiel — un pitch deck, des relevés bancaires — sont donc manuels, et
-- c'est assumé plutôt que masqué.
--
-- Le premier modèle REMPLACE « Préparer le dossier investisseur » posé le
-- 6 août : c'est le même, mieux doté. Le mettre à jour plutôt que d'en créer
-- un second préserve le lien des Challenges déjà créés depuis lui.
--
-- Ré-exécutable : identifiants fixes, critères replacés en bloc.

-- ---------------------------------------------------------------------------
-- 1 · Levée de fonds — investisseurs   (source `capital`)
-- ---------------------------------------------------------------------------
insert into public.challenge_templates (id, org_id, title, category, duration, description)
values (
  '9a3f0000-0000-4000-8000-000000000001', null,
  'Levée de fonds — investisseurs',
  'Levée de fonds',
  '3 semaines',
  'Préparer l''entreprise à échanger avec des investisseurs : société, gouvernance, finances et récit. Le modèle à utiliser avant un Demo Day ou une mise en relation.'
)
on conflict (id) do update
  set title = excluded.title, category = excluded.category,
      duration = excluded.duration, description = excluded.description;

delete from public.challenge_template_criteria
where template_id = '9a3f0000-0000-4000-8000-000000000001';

insert into public.challenge_template_criteria
  (template_id, label, source, catalog_key, required, structural, position)
values
  -- STRUCTUREL : sans états financiers, il n'y a pas de dossier investisseur.
  -- Un programme ne peut pas retirer ce critère de ce modèle.
  ('9a3f0000-0000-4000-8000-000000000001', 'États financiers SYSCOHADA — 3 exercices',
   'connecte', 'etats_financiers', true, true, 0),
  ('9a3f0000-0000-4000-8000-000000000001', 'Statuts à jour et enregistrés',
   'connecte', 'statuts', true, false, 1),
  ('9a3f0000-0000-4000-8000-000000000001', 'Registre des actionnaires à jour',
   'connecte', 'registre_actionnaires', true, false, 2),
  ('9a3f0000-0000-4000-8000-000000000001', 'Pacte d''actionnaires en vigueur',
   'connecte', 'pacte_actionnaires', true, false, 3),
  ('9a3f0000-0000-4000-8000-000000000001', 'Business plan et modèle financier',
   'connecte', 'business_plan', true, false, 4),
  -- MANUELS : aucune pièce du référentiel ne les porte. Les marquer
  -- « connectés » aurait produit des critères qui ne se valident jamais.
  ('9a3f0000-0000-4000-8000-000000000001', 'Pitch deck à jour',
   'manuel', null, true, false, 5),
  ('9a3f0000-0000-4000-8000-000000000001', 'Douze mois de métriques',
   'manuel', null, false, false, 6);

-- ---------------------------------------------------------------------------
-- 2 · Financement bancaire   (source `bank`)
-- ---------------------------------------------------------------------------
insert into public.challenge_templates (id, org_id, title, category, duration, description)
values (
  '9a3f0000-0000-4000-8000-000000000002', null,
  'Financement bancaire',
  'Dette',
  '3 semaines',
  'Constituer un dossier de crédit recevable : régularité fiscale et sociale, états financiers, endettement et prévisionnel. Ce qu''une banque de la zone OHADA demande avant d''instruire.'
)
on conflict (id) do update
  set title = excluded.title, category = excluded.category,
      duration = excluded.duration, description = excluded.description;

delete from public.challenge_template_criteria
where template_id = '9a3f0000-0000-4000-8000-000000000002';

insert into public.challenge_template_criteria
  (template_id, label, source, catalog_key, required, structural, position)
values
  ('9a3f0000-0000-4000-8000-000000000002', 'États financiers SYSCOHADA — 3 exercices',
   'connecte', 'etats_financiers', true, true, 0),
  ('9a3f0000-0000-4000-8000-000000000002', 'Quitus ou attestation de régularité fiscale',
   'connecte', 'quitus_fiscal', true, false, 1),
  ('9a3f0000-0000-4000-8000-000000000002', 'Attestation de régularité sociale (CNSS/CNPS/IPRES)',
   'connecte', 'regularite_sociale', true, false, 2),
  ('9a3f0000-0000-4000-8000-000000000002', 'Tableau de la dette et des covenants',
   'connecte', 'tableau_dette', true, false, 3),
  ('9a3f0000-0000-4000-8000-000000000002', 'Budget de l''exercice en cours',
   'connecte', 'budget_exercice', true, false, 4),
  ('9a3f0000-0000-4000-8000-000000000002', 'Relevés bancaires des douze derniers mois',
   'manuel', null, true, false, 5),
  ('9a3f0000-0000-4000-8000-000000000002', 'Garanties proposées',
   'manuel', null, false, false, 6);

-- ---------------------------------------------------------------------------
-- 3 · Financement institutionnel — DFI et bailleurs   (source `dfi`)
-- ---------------------------------------------------------------------------
insert into public.challenge_templates (id, org_id, title, category, duration, description)
values (
  '9a3f0000-0000-4000-8000-000000000003', null,
  'Financement institutionnel — DFI et bailleurs',
  'Institutionnel',
  '4 semaines',
  'Ce qu''un bailleur ou une institution de développement exige en plus d''un dossier bancaire : politique environnementale et sociale, conformité LBC/FT, bénéficiaires effectifs.'
)
on conflict (id) do update
  set title = excluded.title, category = excluded.category,
      duration = excluded.duration, description = excluded.description;

delete from public.challenge_template_criteria
where template_id = '9a3f0000-0000-4000-8000-000000000003';

insert into public.challenge_template_criteria
  (template_id, label, source, catalog_key, required, structural, position)
values
  -- STRUCTUREL : c'est la politique E&S qui distingue un dossier bailleur d'un
  -- dossier bancaire. La retirer viderait le modèle de sa raison d'être.
  ('9a3f0000-0000-4000-8000-000000000003', 'Politique environnementale et sociale',
   'connecte', 'politique_es', true, true, 0),
  ('9a3f0000-0000-4000-8000-000000000003', 'Politique LBC/FT et screening',
   'connecte', 'lbc_ft', true, false, 1),
  ('9a3f0000-0000-4000-8000-000000000003', 'Registre des bénéficiaires effectifs',
   'connecte', 'beneficiaires_effectifs', true, false, 2),
  ('9a3f0000-0000-4000-8000-000000000003', 'États financiers SYSCOHADA — 3 exercices',
   'connecte', 'etats_financiers', true, false, 3),
  ('9a3f0000-0000-4000-8000-000000000003', 'Business plan et modèle financier',
   'connecte', 'business_plan', true, false, 4),
  ('9a3f0000-0000-4000-8000-000000000003', 'Plan d''action E&S',
   'connecte', 'plan_action_es', false, false, 5),
  ('9a3f0000-0000-4000-8000-000000000003', 'Indicateurs d''impact du dernier exercice',
   'manuel', null, false, false, 6);
