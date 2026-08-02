-- Les extensions sectorielles : santé et services financiers.
--
-- DEUX SECTEURS SUR DIX. Huit fondateurs sur dix ne verront aucun ajout — c'est
-- le comportement attendu, l'extension ne concernant que les activités
-- réellement soumises à agrément. Mesuré : santé 24 exigences pour une levée
-- contre 17 pour un commerce, services financiers 19.
--
-- TROIS ARBITRAGES DU FONDATEUR, APPLIQUÉS ICI.
--
-- 1. UNE SEULE EXIGENCE POUR QUATRE VOIES fintech. Une entreprise n'en emprunte
--    qu'une : afficher quatre lignes dont trois seront écartées ferait passer
--    pour un retard ce qui est un choix. Les voies sont énumérées dans la
--    description, et la plus fréquente — la convention avec un établissement
--    déjà agréé — y est nommée en premier.
--
-- 2. LBC/FT : REMPLACEMENT, PAS DOUBLON. L'exigence générale existait déjà ;
--    le secteur financier ne la dédouble pas, il la précise.
--
-- 3. LES DISPOSITIFS MÉDICAUX : CONSERVÉS, MAIS ACTIVÉS PAYS PAR PAYS. Je ne
--    sais pas si leur enregistrement est obligatoire en UEMOA ni en CEMAC.
--    L'exigence existe donc au référentiel, documentée, et n'apparaît chez
--    personne tant qu'un pays vérifié ne l'allume pas — plutôt que de faire
--    chercher un document dont l'existence n'est pas établie. C'est la règle
--    que le fondateur m'a opposée sur le « Registre des associés ».
--
-- DEUX MÉCANISMES CRÉÉS POUR CELA : le secteur devient le cinquième axe de
-- variante, et `activation_par_pays` inverse la logique habituelle — ailleurs
-- une exigence est visible et une variante la retire ; ici elle est éteinte et
-- seul un pays l'allume.


alter table public.checklist_catalog
  add column if not exists activation_par_pays boolean not null default false;

comment on column public.checklist_catalog.activation_par_pays is
  'true = l''exigence reste invisible tant qu''une variante de pays ne l''active pas explicitement. Pour ce dont la portée géographique n''est pas vérifiée.';

alter table public.checklist_catalog_variants
  drop constraint if exists checklist_catalog_variants_axis_check;
alter table public.checklist_catalog_variants
  add constraint checklist_catalog_variants_axis_check
  check (axis in ('forme_juridique', 'country', 'stage', 'objectif', 'sector'));

insert into public.checklist_catalog
  (key, label, description, domain, level, sources, accepted_formats, folder_path, activation_par_pays)
values
  ('agrement_activite_financiere', 'Agrément ou convention permettant l''activité', 'Aucun financeur n''ira plus loin sans cette pièce. Selon votre modèle : convention avec un établissement déjà agréé — la voie de la plupart des fintechs, et le contrat devient alors la pièce maîtresse du dossier —, agrément d''établissement de monnaie électronique, de système financier décentralisé, ou d''établissement de crédit.', 'company_registration', 'required', '{bank,dfi,capital,diligence}', 'PDF', '6.3', false),
  ('autorisation_etablissement_sante', 'Autorisation d''ouverture et d''exploitation de l''établissement', 'Délivrée par le ministère de la Santé. Son absence expose à une fermeture administrative — c''est le premier point qu''un financeur vérifie.', 'company_registration', 'required', '{bank,dfi,capital,diligence}', 'PDF', '6.3', false),
  ('conventionnement_assurance_maladie', 'Conventionnement avec les organismes de couverture maladie', 'IPM, CMU, mutuelles. Ce n''est pas une licence, mais cela conditionne souvent le modèle économique — un financeur le demandera.', 'commercial_and_market', 'recommended', '{bank,dfi,capital,diligence}', 'PDF', '3.1', false),
  ('dechets_de_soins', 'Plan de gestion des déchets d''activités de soins', 'Filière d''élimination des déchets à risque infectieux et des piquants-tranchants, souvent adossée à une autorisation environnementale.', 'impact_esg', 'recommended', '{bank,dfi,capital,diligence}', 'PDF', '6.4', false),
  ('dispositifs_medicaux', 'Enregistrement des dispositifs médicaux', 'Concerne les équipements et matériels médicaux mis sur le marché. La forme et le caractère obligatoire de cet enregistrement varient, et n''ont pas été vérifiés pour l''UEMOA ni la CEMAC : cette exigence n''apparaît que dans les pays où elle a été confirmée.', 'company_registration', 'recommended', '{bank,dfi,capital,diligence}', 'PDF', '6.3', true),
  ('distribution_medicaments', 'Autorisation d''importation et de distribution de médicaments', 'Pour les grossistes répartiteurs et les importateurs. Les autorisations de mise sur le marché des produits distribués en font partie.', 'company_registration', 'recommended', '{bank,dfi,capital,diligence}', 'PDF', '6.3', false),
  ('donnees_de_sante', 'Traitement des données de santé', 'Les données de santé sont des données personnelles sensibles : le régime est plus strict qu''ailleurs, avec fréquemment une autorisation préalable et non une simple déclaration.', 'technology_and_ip', 'required', '{bank,dfi,capital,diligence}', 'PDF', '6.2', false),
  ('inscription_ordre_sante', 'Inscription à l''Ordre des professionnels employés', 'Médecins, pharmaciens, chirurgiens-dentistes ou sages-femmes selon les profils. L''inscription est nominative. Dans plusieurs pays, l''exercice — et parfois la détention du capital d''une officine — est réservé à un professionnel inscrit : la structure capitalistique elle-même peut être contrainte.', 'team_and_people', 'required', '{bank,dfi,capital,diligence}', 'PDF', '4.3', false),
  ('licence_officine', 'Licence d''exploitation d''officine', 'Ne concerne que les pharmacies. Sa délivrance est généralement liée à la qualification du titulaire.', 'company_registration', 'recommended', '{bank,dfi,capital,diligence}', 'PDF', '6.3', false),
  ('protection_donnees_autorite', 'Déclaration auprès de l''autorité de protection des données', 'L''obligation est générale ; l''autorité et la forme changent selon le pays — CDP au Sénégal, ARTCI en Côte d''Ivoire. Confirmez celle dont vous dépendez.', 'technology_and_ip', 'required', '{bank,dfi,capital,diligence}', 'PDF', '6.2', false)
on conflict (key) do nothing;

-- Le secteur commande l'apparition : chaque exigence est éteinte partout SAUF
-- dans le sien. Écrit comme un produit cartésien plutôt qu'en quatre-vingt-dix
-- lignes — la règle reste lisible, et ajouter un secteur ne demande pas de
-- retoucher chaque exigence.
insert into public.checklist_catalog_variants (catalog_key, axis, value, applicable)
select k, 'sector', s, false
from unnest(array['autorisation_etablissement_sante','inscription_ordre_sante',
                  'donnees_de_sante','dechets_de_soins','licence_officine',
                  'distribution_medicaments','conventionnement_assurance_maladie',
                  'dispositifs_medicaux']) k,
     unnest(array['Agriculture et agroalimentaire','Commerce et distribution',
                  'Éducation et formation','Énergie','Industrie et BTP',
                  'Transport et logistique','Autre secteur',
                  'Technologies et télécoms','Services financiers']) s
on conflict do nothing;

insert into public.checklist_catalog_variants (catalog_key, axis, value, applicable)
select k, 'sector', s, false
from unnest(array['agrement_activite_financiere','protection_donnees_autorite']) k,
     unnest(array['Agriculture et agroalimentaire','Commerce et distribution',
                  'Éducation et formation','Énergie','Industrie et BTP',
                  'Transport et logistique','Autre secteur',
                  'Technologies et télécoms','Santé']) s
on conflict do nothing;

-- LBC/FT : remplacement, pas doublon.
update public.checklist_catalog
set label = 'Dispositif LBC/FT et déclaration à la CENTIF',
    description = 'Politique anti-blanchiment, vérification de la clientèle, screening des sanctions et des personnes politiquement exposées, et désignation du correspondant. La CENTIF existe dans chaque État de l''UEMOA ; son équivalent en CEMAC est l''ANIF.',
    sources = sources || '{bank,capital,diligence}'::public.checklist_source[]
where key = 'lbc_ft';
