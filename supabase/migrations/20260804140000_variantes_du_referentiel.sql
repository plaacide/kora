-- Ce que les réponses de l'onboarding changent au plan de préparation.
--
-- Jusqu'ici, une SARL sénégalaise en pré-amorçage et une SA ivoirienne en
-- série A recevaient exactement la même liste. Le produit collectait la forme
-- juridique, le pays et le stade, les stockait, et n'en faisait rien — c'est
-- l'écart que les huit promesses retirées le 1er août recouvraient.
--
-- TROIS AXES, ET RIEN D'AUTRE. Chacun doit rester prévisible isolément : c'est
-- le critère qui a fait rejeter les couches cumulatives et les matrices
-- d'applicabilité (docs/preparation/DECISIONS.md §13).
--
-- La fonction qui consomme cette table est posée par la migration suivante,
-- `20260804150000_corriger_les_variantes_sans_ecraser.sql`.

create table public.checklist_catalog_variants (
  catalog_key text not null references public.checklist_catalog(key) on delete cascade,
  axis        text not null check (axis in ('forme_juridique', 'country', 'stage')),
  value       text not null,
  -- NULL laisse la valeur du catalogue. C'est ce qui permet à une variante de
  -- ne changer qu'un niveau sans réécrire un intitulé, et inversement.
  label       text,
  description text,
  level       public.requirement_level,
  -- false retire l'exigence du plan. Réservé aux cas où elle n'a pas d'objet,
  -- jamais aux cas où elle est seulement difficile à fournir.
  applicable  boolean not null default true,
  primary key (catalog_key, axis, value)
);

comment on table public.checklist_catalog_variants is
  'Ce qu''une réponse de l''onboarding change à une exigence. Un champ NULL laisse la valeur du catalogue ; applicable = false retire l''exigence. Précédence en cas de concurrence : forme_juridique, puis country, puis stage.';

alter table public.checklist_catalog_variants enable row level security;

insert into public.checklist_catalog_variants
  (catalog_key, axis, value, label, description, level, applicable)
values
  -- SA : le commissaire aux comptes n'est pas conditionnel, il est obligatoire.
  -- L'intitulé du catalogue « ...si seuils atteints » renvoyait la condition au
  -- fondateur alors qu'elle est tranchée par sa forme juridique.
  ('commissaire_aux_comptes', 'forme_juridique', 'SA',
   'Commissaire aux comptes désigné',
   'Obligatoire pour une SA en OHADA, sans condition de seuil. Son absence est un point d''audit immédiat.',
   'required', true),

  -- SARL : ni actionnaires, ni actions. Des associés et des parts sociales.
  -- Le catalogue parlait d'actionnaires à toute une moitié du marché.
  ('registre_actionnaires', 'forme_juridique', 'SARL',
   'Registre des associés et répartition des parts sociales',
   'Une SARL a des associés, pas des actionnaires. La répartition doit concorder avec les statuts et les décisions collectives.',
   null, true),
  ('pacte_actionnaires', 'forme_juridique', 'SARL',
   'Pacte d''associés en vigueur',
   'Le pacte existant conditionne souvent ce qu''un nouvel entrant peut négocier.',
   null, true),
  ('commissaire_aux_comptes', 'forme_juridique', 'SARL',
   'Commissaire aux comptes si les seuils sont atteints',
   'Conditionnel pour une SARL, contrairement à la SA. Les seuils portent sur le chiffre d''affaires, le total du bilan et l''effectif.',
   null, true),

  -- Entreprise individuelle : pas de personne morale distincte. Cinq exigences
  -- de droit des sociétés n'ont simplement pas d'objet — ni statuts, ni
  -- registre, ni pacte, ni commissaire, ni assemblée.
  ('statuts',                 'forme_juridique', 'Entreprise individuelle', null, null, null, false),
  ('registre_actionnaires',   'forme_juridique', 'Entreprise individuelle', null, null, null, false),
  ('pacte_actionnaires',      'forme_juridique', 'Entreprise individuelle', null, null, null, false),
  ('commissaire_aux_comptes', 'forme_juridique', 'Entreprise individuelle', null, null, null, false),
  ('pv_assemblees',           'forme_juridique', 'Entreprise individuelle', null, null, null, false),

  -- Stade : trois exercices clos ne sont pas exigibles d'une entreprise
  -- récente. L'exigence RESTE au plan, en recommandé plutôt qu'en requis.
  -- La masquer priverait le fondateur de la fournir s'il l'a, et lui cacherait
  -- ce qu'on lui demandera plus tard (DECISIONS.md §7).
  ('etats_financiers', 'stage', 'Pré-amorçage',
   'États financiers depuis la création',
   'Trois exercices clos ne sont pas exigibles d''une entreprise récente. Fournissez ce qui existe.',
   'recommended', true),
  ('etats_financiers', 'stage', 'Amorçage',
   'États financiers depuis la création',
   'Trois exercices clos ne sont pas exigibles d''une entreprise récente. Fournissez ce qui existe.',
   'recommended', true),

  -- Pays : SEULEMENT ce qui est vérifié. Le NINEA sénégalais est certain.
  -- Les identifiants fiscaux des treize autres pays ne le sont pas assez pour
  -- être écrits ici — l'intitulé générique « (NINEA/IFU) » reste, et attend une
  -- validation. Une variante inventée serait pire que pas de variante : elle
  -- ferait chercher au fondateur un document qui n'existe pas chez lui.
  ('declaration_fiscale', 'country', 'Sénégal',
   'Déclaration fiscale d''existence (NINEA)',
   'Le NINEA est l''identifiant fiscal sénégalais.',
   null, true);
