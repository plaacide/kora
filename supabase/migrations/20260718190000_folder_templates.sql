-- Kora — modèles de documents par dossier. Ré-exécutable.
--
-- Les modèles sont GLOBAUX, pas copiés dans chaque deal : un modèle vierge
-- n'est pas une pièce fournie. S'ils étaient des documents du deal, ils
-- gonfleraient le compteur et fausseraient le readiness.

drop table if exists public.folder_templates cascade;

create table public.folder_templates (
  id          uuid primary key default gen_random_uuid(),
  -- Rattachement par NOM de dossier : les modèles suivent le template de
  -- data room, sans dépendre des identifiants d'un deal particulier.
  folder_name text not null,
  title       text not null,
  description text not null default '',
  /** Corps du modèle, en texte structuré. Téléchargeable tel quel. */
  body        text not null,
  position    int not null default 1,
  created_at  timestamptz not null default now(),
  unique (folder_name, title)
);
create index folder_templates_folder_idx on public.folder_templates (folder_name, position);

alter table public.folder_templates enable row level security;

create policy folder_templates_read on public.folder_templates
  for select to authenticated using (true);

grant select on public.folder_templates to authenticated;

-- ---------------------------------------------------------------------------
-- Modèles OHADA / UEMOA
-- ---------------------------------------------------------------------------
insert into public.folder_templates (folder_name, title, description, body, position) values

('Registre des actionnaires', 'Table de capitalisation', 'Tableau à compléter : qui détient quoi, avant et après l''opération.',
'TABLE DE CAPITALISATION — [Nom de la société]
Date d''arrêté : [JJ/MM/AAAA]
Capital social : [montant] FCFA · Valeur nominale : [montant] FCFA

ACTIONNAIRE | TYPE DE TITRES | NOMBRE | % CAPITAL | % DROITS DE VOTE | DATE D''ENTRÉE
[Fondateur 1] | Actions ordinaires | | | |
[Fondateur 2] | Actions ordinaires | | | |
[Investisseur A] | Actions de préférence | | | |
[Pool salariés] | Options / BSPCE | | | |
TOTAL | | | 100% | 100% |

ENGAGEMENTS DILUTIFS
Instrument | Bénéficiaire | Nombre potentiel | Conditions | Échéance

À VÉRIFIER
- Cohérence avec les statuts et les PV d''assemblée.
- Chaque ligne doit être justifiée par un acte (souscription, cession, augmentation).
- Les cessions doivent respecter les clauses de préemption du pacte.', 1),

('PV d''assemblées', 'Procès-verbal d''assemblée générale', 'Structure attendue d''un PV en zone OHADA.',
'PROCÈS-VERBAL D''ASSEMBLÉE GÉNÉRALE [ORDINAIRE / EXTRAORDINAIRE]
[Dénomination sociale] — [Forme : SA / SARL] au capital de [montant] FCFA
Siège social : [adresse] · RCCM : [numéro]

L''an [année], le [date], à [heure], les actionnaires se sont réunis à [lieu],
sur convocation de [organe], conformément aux statuts et à l''Acte uniforme
OHADA relatif au droit des sociétés commerciales.

PRÉSENCE
Présents / représentés : [nombre] actionnaires détenant [nombre] actions,
soit [%] du capital. Le quorum étant atteint, l''assemblée peut valablement
délibérer.

BUREAU
Président : [nom] · Scrutateurs : [noms] · Secrétaire : [nom]

ORDRE DU JOUR
1. [Point]
2. [Point]

RÉSOLUTIONS
Première résolution — [texte de la résolution]
Vote : adoptée / rejetée à [%] des voix.

Plus rien n''étant à l''ordre du jour, la séance est levée à [heure].

Signatures : Le Président — Le Secrétaire — Les Scrutateurs', 1),

('Statuts', 'Points de contrôle des statuts', 'Ce qu''un investisseur vérifiera dans vos statuts.',
'POINTS DE CONTRÔLE — STATUTS (OHADA)

IDENTITÉ
- Dénomination, forme sociale, durée, siège social
- Objet social : suffisamment large pour l''activité réelle et les projets

CAPITAL
- Montant, valeur nominale, répartition
- Cohérence avec le registre des actionnaires et les PV
- Catégories d''actions (ordinaires, préférence) et droits attachés

GOUVERNANCE
- Organe de direction, durée des mandats, pouvoirs
- Conditions de quorum et de majorité (AGO / AGE)
- Conventions réglementées : procédure prévue

TITRES
- Clauses d''agrément et de préemption
- Conditions de cession
- Cohérence avec le pacte d''actionnaires en vigueur

FORMALITÉS
- Statuts enregistrés, à jour de toutes les modifications
- Dépôt au RCCM effectué pour chaque modification

POINTS D''ATTENTION FRÉQUENTS
- Objet social trop étroit, qui bloque une nouvelle activité
- Statuts non mis à jour après une augmentation de capital
- Contradiction entre statuts et pacte : le pacte ne prime pas sur les statuts', 1),

('KYC bénéficiaires', 'Registre des bénéficiaires effectifs', 'Toute personne physique détenant plus de 25%, directement ou indirectement.',
'REGISTRE DES BÉNÉFICIAIRES EFFECTIFS (UBO)
[Dénomination sociale] — RCCM : [numéro] — Date : [JJ/MM/AAAA]

BÉNÉFICIAIRE 1
Nom et prénoms :
Date et lieu de naissance :
Nationalité :
Résidence fiscale :
Type de pièce d''identité / numéro / validité :
Nature de la détention : directe / indirecte (via [entité])
Pourcentage du capital :
Pourcentage des droits de vote :
Personne politiquement exposée (PEP) : oui / non — si oui, préciser la fonction

BÉNÉFICIAIRE 2
[répéter la structure]

CHAÎNE DE DÉTENTION INDIRECTE
Décrire chaque niveau jusqu''à la personne physique.

PIÈCES À JOINDRE
- Copie de la pièce d''identité en cours de validité de chaque UBO
- Justificatif de domicile de moins de 3 mois
- Organigramme de détention signé par le représentant légal

RÈGLE
Le seuil de 25% est le standard des bailleurs. En cas de doute sur le contrôle
effectif, déclarer plutôt que d''omettre : une omission découverte en due
diligence coûte plus cher qu''une déclaration large.', 1),

('ESG & impact', 'Politique environnementale et sociale', 'Attendue par les DFI, souvent alignée sur les normes de performance IFC.',
'POLITIQUE ENVIRONNEMENTALE ET SOCIALE (E&S)
[Dénomination sociale] — Version [x] — [date] — Approuvée par [organe]

1. ENGAGEMENT
La société s''engage à conduire ses activités dans le respect de la
réglementation nationale applicable et des normes de performance de la SFI
(IFC Performance Standards).

2. PÉRIMÈTRE
Activités, sites et filiales couverts.

3. IDENTIFICATION DES RISQUES
Risques environnementaux : [ex. gestion des déchets, consommation d''eau]
Risques sociaux : [ex. conditions de travail, santé et sécurité]
Risques communautaires : [ex. relations avec les riverains]

4. ENGAGEMENTS OPÉRATIONNELS
- Conditions de travail conformes au code du travail applicable
- Interdiction du travail des enfants et du travail forcé
- Non-discrimination à l''embauche et dans l''évolution
- Santé et sécurité au travail : équipements, formation, registre d''incidents
- Mécanisme de remontée des plaintes accessible aux salariés et aux tiers

5. GOUVERNANCE
Responsable E&S désigné : [nom, fonction]
Fréquence de revue : [annuelle]

6. SUIVI
Indicateurs suivis et fréquence de reporting aux investisseurs.

PLAN D''ACTION E&S
ACTION | RISQUE TRAITÉ | RESPONSABLE | ÉCHÉANCE | STATUT', 1),

('Projections', 'Structure du modèle financier', 'Ce qu''un investisseur attend dans un business plan.',
'MODÈLE FINANCIER — STRUCTURE ATTENDUE
[Nom du deal] — Horizon : [3 à 5 ans] — Devise : [FCFA]

1. HYPOTHÈSES (onglet séparé, jamais en dur dans les formules)
- Volumes : [unités vendues, clients, tickets]
- Prix : [évolution et justification]
- Coûts variables : [par unité]
- Charges fixes : [masse salariale, loyers, marketing]
- Délais : [encaissement clients, paiement fournisseurs, stocks]
- Fiscalité : [IS, TVA, taux applicables]
- Investissements et amortissements

2. COMPTE DE RÉSULTAT PRÉVISIONNEL
Chiffre d''affaires → marge brute → EBITDA → résultat net

3. PLAN DE TRÉSORERIE MENSUEL
Le point le plus regardé : à quel moment le cash devient négatif.

4. BILAN PRÉVISIONNEL
Cohérent avec le résultat et la trésorerie.

5. BESOIN DE FINANCEMENT
Montant, calendrier de décaissement, utilisation des fonds.

6. ANALYSE DE SENSIBILITÉ
Effet sur le runway d''une variation de : volumes (-20%), prix (-10%),
délais de paiement (+30 jours).

RÈGLES
- Toute hypothèse doit être justifiable par un fait (contrat, historique, étude).
- Les projections doivent se raccorder aux derniers comptes SYSCOHADA réels.
- Un modèle sans onglet d''hypothèses séparé est un signal négatif.', 1),

('Dette & engagements', 'Tableau de la dette', 'Emprunts, garanties et engagements hors bilan.',
'TABLEAU DE LA DETTE ET DES ENGAGEMENTS
[Dénomination sociale] — Arrêté au [date]

EMPRUNTS
PRÊTEUR | MONTANT INITIAL | CAPITAL RESTANT DÛ | TAUX | ÉCHÉANCE | GARANTIES

COVENANTS
PRÊTEUR | COVENANT | SEUIL | VALEUR ACTUELLE | RESPECTÉ (O/N)

GARANTIES DONNÉES
BÉNÉFICIAIRE | NATURE (caution, nantissement, hypothèque) | MONTANT | ACTIF GREVÉ

CRÉDIT-BAIL
BAILLEUR | BIEN | LOYER | DURÉE RESTANTE | OPTION D''ACHAT

ENGAGEMENTS HORS BILAN
NATURE | CONTREPARTIE | MONTANT | ÉCHÉANCE

CLAUSES DE CHANGEMENT DE CONTRÔLE
Lister les contrats dont une cession déclencherait exigibilité ou résiliation.
C''est le premier point qu''un acquéreur vérifie.', 1),

('Organigramme', 'Organigramme et effectifs', 'Qui fait quoi, et où sont les dépendances.',
'ORGANIGRAMME ET EFFECTIFS
[Dénomination sociale] — [date]

DIRECTION
FONCTION | NOM | DEPUIS | TYPE DE CONTRAT | RÉMUNÉRATION ANNUELLE

EFFECTIFS PAR FONCTION
FONCTION | CDI | CDD | PRESTATAIRES | TOTAL
Direction | | | |
Commercial | | | |
Technique | | | |
Support | | | |
TOTAL | | | |

PERSONNES CLÉS
Identifier les personnes dont le départ mettrait l''activité en difficulté,
et préciser pour chacune : contrat signé, clause de non-concurrence, clause
de cession de propriété intellectuelle.

DÉPENDANCES À SIGNALER
- Fonction critique tenue par une seule personne
- Prestataire assurant une fonction cœur sans contrat écrit
- Dirigeant sans contrat de travail ni mandat formalisé', 1),

('Contrats clients', 'Synthèse des contrats clients', 'Concentration et clauses sensibles.',
'SYNTHÈSE DES CONTRATS CLIENTS
[Dénomination sociale] — Arrêté au [date]

CLIENT | CA ANNUEL | % DU CA TOTAL | DÉBUT | ÉCHÉANCE | RECONDUCTION | PRÉAVIS

CONCENTRATION
Part des 3 premiers clients dans le chiffre d''affaires : [%]
Au-delà de 50%, la concentration devient un point de négociation sur la valorisation.

CLAUSES À SIGNALER PAR CONTRAT
- Changement de contrôle : le client peut-il résilier en cas de cession ?
- Exclusivité accordée
- Pénalités de retard ou de performance
- Juridiction et droit applicable

PIÈCES À JOINDRE
Contrats des clients représentant plus de 10% du chiffre d''affaires, signés
et à jour de leurs avenants.', 1),

('Marques OAPI', 'Inventaire de propriété intellectuelle', 'Ce que la société possède réellement.',
'INVENTAIRE DE PROPRIÉTÉ INTELLECTUELLE
[Dénomination sociale] — [date]

MARQUES (OAPI)
MARQUE | N° DÉPÔT | CLASSES | DATE DE DÉPÔT | ÉCHÉANCE | TITULAIRE | PAYS COUVERTS

Rappel : un dépôt OAPI couvre les 17 États membres. Vérifier que le titulaire
est bien la société, et non un fondateur à titre personnel.

NOMS DE DOMAINE
DOMAINE | REGISTRAR | TITULAIRE DU COMPTE | ÉCHÉANCE

LOGICIELS ET CODE
COMPOSANT | AUTEUR (salarié / prestataire) | CESSION DE DROITS SIGNÉE (O/N)

Sans cession écrite, les droits d''un prestataire lui restent acquis :
c''est le défaut le plus fréquent et le plus coûteux à régulariser.

LICENCES OPEN SOURCE
COMPOSANT | LICENCE | COMPATIBLE USAGE COMMERCIAL (O/N)

Signaler toute licence copyleft (GPL, AGPL) intégrée au produit.', 1),

('Litiges', 'État des litiges', 'Contentieux, réclamations et provisions.',
'ÉTAT DES LITIGES ET RÉCLAMATIONS
[Dénomination sociale] — Arrêté au [date]

CONTENTIEUX EN COURS
PARTIE ADVERSE | NATURE | JURIDICTION | MONTANT RÉCLAMÉ | PROVISION COMPTABILISÉE | STADE | CONSEIL

MISES EN DEMEURE REÇUES OU ENVOYÉES (12 derniers mois)
PARTIE | OBJET | DATE | SUITE DONNÉE

CONTRÔLES ADMINISTRATIFS
ADMINISTRATION (fiscale, sociale, sectorielle) | PÉRIODE | STATUT | REDRESSEMENT ÉVENTUEL

DÉCLARATION
Le représentant légal atteste qu''à sa connaissance, aucun autre litige,
réclamation ou procédure n''est en cours ou menacé.

Nom, qualité, date, signature.

RÈGLE
Un litige omis et découvert en due diligence détruit la confiance bien plus
que le litige lui-même.', 1),

('Budget', 'Budget et suivi du réalisé', 'Comparer le prévu et le réel : le vrai test de fiabilité.',
'BUDGET ET SUIVI DU RÉALISÉ
[Dénomination sociale] — Exercice [année] — Devise : FCFA

POSTE | BUDGET ANNUEL | RÉALISÉ À DATE | ÉCART | ÉCART %
Chiffre d''affaires | | | |
Achats consommés | | | |
Masse salariale | | | |
Loyers et charges | | | |
Marketing | | | |
Autres charges | | | |
EBITDA | | | |

TRÉSORERIE
Solde d''ouverture | Encaissements | Décaissements | Solde de clôture | Runway (mois)

COMMENTAIRE SUR LES ÉCARTS SIGNIFICATIFS
Expliquer tout écart supérieur à 10%. Un budget systématiquement dépassé sans
explication est un signal de gouvernance plus que de gestion.', 1);
