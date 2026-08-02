-- Les exigences manquantes, rédigées par le fondateur.
--
-- Le catalogue était un catalogue de levée en capital avec des étiquettes
-- bancaires posées dessus. Une banque n'y trouvait ni sûretés, ni relevés, ni
-- plan de trésorerie ; l'audit et la diligence n'avaient aucune exigence propre.
-- Vingt-deux exigences deviennent quarante-quatre.
--
-- DEUX RÈGLES DU FONDATEUR APPLIQUÉES ICI :
--   · chercher les doublons PAR LE SENS, pas par l'intitulé — « Licences,
--     autorisations et agréments » proposé pour la diligence redoublait
--     « Agréments sectoriels applicables », qui est donc étiqueté plutôt que
--     recréé ;
--   · `recommandé` plutôt que `requis` quand la présence dépend de
--     l'instrument ou de la demande, faute d'axe pour l'exprimer aujourd'hui.
--     C'est le cas des sûretés, du cadre de résultats et de la protection des
--     données.
--
-- DOSSIERS CORRIGÉS. Plusieurs chemins proposés n'existent pas dans le modèle
-- (1.5, 1.6, 1.7, 2.7, 2.8) ou désignent autre chose que leur objet — le cadre
-- de résultats était rangé sous « Marques OAPI », les déclarations rapprochées
-- sous « Organigramme ». Ils pointent vers le dossier réel, ou restent vides
-- quand aucun ne convient : une exigence sans emplacement suggéré vaut mieux
-- qu'une exigence rangée au mauvais endroit.
--
-- CETTE MIGRATION SEULE DÉGRADERAIT LE PRODUIT. Sans le filtre par objectif
-- qui la suit immédiatement, une levée en capital recevrait la balance générale
-- et le grand livre d'un audit. Les deux ne se rejouent jamais séparément.

insert into public.checklist_catalog
  (key, label, description, domain, level, sources, freshness_days, expected_period, accepted_formats, folder_path)
values
  ('balance_agee', 'Balance âgée des clients et fournisseurs', 'Les créances et les dettes par ancienneté. C''est là que se voient les impayés qu''un bilan agrégé dissimule.', 'finance_and_accounting', 'required', '{audit}', null, 'Clôture de l''exercice', 'PDF, XLSX', '2.1'),
  ('balance_generale', 'Balance générale de clôture', 'Tous les comptes à leur solde de clôture. C''est le point de départ de l''auditeur : sans elle, rien ne se rapproche.', 'finance_and_accounting', 'required', '{audit}', null, 'Dernier exercice clos', 'PDF, XLSX', '2.1'),
  ('cadre_resultats', 'Cadre de résultats et indicateurs de suivi', 'Ce qui relie les activités aux résultats attendus, et comment ils seront mesurés. Devient central dès qu''un financement dépend d''objectifs de développement ou de résultats vérifiables — c''est le cas d''une subvention ou d''une assistance technique.', 'impact_esg', 'recommended', '{dfi}', null, null, 'PDF, XLSX', '6.4'),
  ('contrats_cles_personnel', 'Contrats des dirigeants, salariés et consultants clés', 'Les engagements qui retiennent — ou libèrent — les personnes dont dépend l''activité : rémunération, préavis, non-concurrence, clauses de propriété intellectuelle.', 'team_and_people', 'required', '{diligence,capital}', null, null, 'PDF', '4.2'),
  ('contrats_flux_futurs', 'Contrats et commandes soutenant les flux futurs', 'Contrats signés, bons de commande et engagements commerciaux étayent les revenus attendus. Ils renforcent le prévisionnel sans valoir à eux seuls garantie de remboursement.', 'commercial_and_market', 'recommended', '{bank}', null, null, 'PDF', '3.1'),
  ('contrats_significatifs', 'Registre des contrats significatifs', 'Les engagements qui portent l''activité : clients, fournisseurs, baux, partenariats. Avec durées, montants, clauses de changement de contrôle et de résiliation.', 'commercial_and_market', 'required', '{diligence,capital}', null, null, 'PDF, XLSX', '3.1'),
  ('declarations_rapprochees', 'Déclarations fiscales et sociales rapprochées des comptes', 'Les déclarations déposées, mises en regard des comptes correspondants. Un écart non expliqué entre le déclaré et le comptabilisé est un risque de redressement.', 'tax', 'required', '{audit}', null, 'Dernier exercice clos', 'PDF, XLSX', '2.3'),
  ('grand_livre', 'Grand livre comptable', 'Le détail des écritures compte par compte. C''est ce qui permet de remonter d''un solde à l''opération qui l''a produit.', 'finance_and_accounting', 'required', '{audit}', null, 'Dernier exercice clos', 'PDF, XLSX', '2.1'),
  ('inventaire_immobilisations', 'Inventaire et registre des immobilisations', 'Ce que l''entreprise possède, sa valeur d''origine, ses amortissements et sa valeur nette. Un registre qui ne concorde pas avec le bilan oblige à reprendre l''exercice.', 'finance_and_accounting', 'required', '{audit}', null, 'Clôture de l''exercice', 'PDF, XLSX', '2.1'),
  ('justificatifs_sondage', 'Pièces justificatives demandées par sondage', 'L''auditeur choisit des écritures et en demande la preuve. Rassembler les justificatifs au fil de l''eau évite une course en fin de mission — Sanza ne peut pas deviner lesquelles seront tirées.', 'finance_and_accounting', 'recommended', '{audit}', null, null, 'PDF', null),
  ('litiges_en_cours', 'Litiges, réclamations et risques juridiques en cours', 'Procédures engagées, réclamations reçues et risques identifiés, avec leur exposition estimée. Un litige découvert après signature est le premier motif de renégociation.', 'governance_and_ownership', 'required', '{diligence,capital,bank}', 90, null, 'PDF', '3.4'),
  ('note_projet', 'Note de projet et plan de mise en œuvre', 'Le besoin, la solution, les bénéficiaires, les activités, les responsabilités et le calendrier. Sans chaîne de mise en œuvre lisible, le financeur ne peut pas apprécier la faisabilité.', 'commercial_and_market', 'required', '{dfi}', null, null, 'PDF', '2.5'),
  ('objet_financement', 'Objet du financement et plan d''emploi des fonds', 'À quoi sert l''argent, montant par poste et calendrier prévu. Un emploi des fonds imprécis ralentit l''analyse et rend le besoin difficile à défendre devant un comité.', 'commercial_and_market', 'required', '{bank,dfi}', null, null, 'PDF, XLSX', '2.5'),
  ('parties_liees', 'Opérations avec les parties liées', 'Les flux entre l''entreprise et ses dirigeants, associés ou sociétés apparentées. Non déclarés, ils faussent la lecture de la rentabilité réelle.', 'governance_and_ownership', 'required', '{diligence,capital}', null, null, 'PDF, XLSX', '1.4'),
  ('plan_financement', 'Plan de financement et contributions attendues', 'Coût total, contribution demandée, ressources propres, cofinancements confirmés ou recherchés. Un plan incomplet ne permet pas de vérifier que le projet peut être entièrement financé.', 'finance_and_accounting', 'required', '{dfi}', 180, null, 'PDF, XLSX', '2.5'),
  ('plan_tresorerie', 'Plan de trésorerie prévisionnel', 'Encaissements, décaissements et besoins mois par mois, sur la durée du financement. Un prêt se rembourse avec de la trésorerie, pas avec du résultat comptable.', 'finance_and_accounting', 'required', '{bank,dfi}', 180, 'Durée du financement', 'PDF, XLSX', '2.4'),
  ('propriete_pi', 'Preuves de propriété ou de cession des actifs intellectuels', 'Qui détient le code, les marques, les créations — y compris celles produites par des prestataires. Une cession jamais signée laisse l''actif principal hors de l''entreprise.', 'technology_and_ip', 'recommended', '{diligence,capital}', null, null, 'PDF', '5.2'),
  ('protection_donnees', 'Protection des données et sécurité des systèmes', 'Traitements de données personnelles, déclarations auprès de l''autorité compétente, et dispositions de sécurité. Devient requis dès que l''activité traite des données sensibles.', 'technology_and_ip', 'recommended', '{diligence}', 365, null, 'PDF', null),
  ('rapport_audit_precedent', 'Rapport d''audit précédent et lettre de recommandations', 'Ce qui avait été relevé la fois d''avant, et ce qui a été corrigé depuis. Une recommandation restée sans suite pèse plus lourd qu''un point nouveau.', 'finance_and_accounting', 'recommended', '{audit}', null, null, 'PDF', '2.2'),
  ('rapprochements_bancaires', 'Rapprochements bancaires et relevés correspondants', 'L''écart entre la comptabilité et la banque, expliqué ligne à ligne. Un rapprochement absent ou non justifié est le premier point relevé en audit.', 'finance_and_accounting', 'required', '{audit}', null, 'Clôture de l''exercice', 'PDF, XLSX', '2.1'),
  ('releves_bancaires', 'Relevés bancaires récents', 'Les mouvements bancaires montrent la régularité des encaissements, la saisonnalité et les incidents éventuels — souvent mieux que les états financiers. La période reste celle que demande votre banque ; douze mois est un usage fréquent, pas une règle.', 'finance_and_accounting', 'required', '{bank}', 30, 'Les douze derniers mois', 'PDF', '2.1'),
  ('suretes_garanties', 'Sûretés et garanties proposées', 'Présentez les actifs, engagements ou garanties qui pourraient sécuriser le financement, avec leur valeur disponible lorsqu''elle est connue. Recommandé plutôt que requis : tout concours n''appelle pas une sûreté — un crédit-bail porte sur l''actif financé.', 'finance_and_accounting', 'recommended', '{bank}', null, null, 'PDF', '2.6');

-- Étiqueté plutôt que recréé : la règle du doublon par le sens.
update public.checklist_catalog
set sources = sources || '{diligence}'::public.checklist_source[]
where key = 'agrements_sectoriels';

-- Le socle que l'audit et la diligence réutilisent. Sans ces étiquettes, le
-- filtre par objectif rendrait un plan d'audit sans états financiers.
update public.checklist_catalog
set sources = sources || '{audit}'::public.checklist_source[]
where key in ('etats_financiers', 'rapport_cac', 'commissaire_aux_comptes',
              'declarations_tva', 'quitus_fiscal', 'budget_exercice');

update public.checklist_catalog
set sources = sources || '{diligence}'::public.checklist_source[]
where key in ('statuts', 'extrait_rccm', 'declaration_fiscale',
              'registre_actionnaires', 'pv_assemblees', 'pacte_actionnaires',
              'etats_financiers', 'business_plan', 'marques_oapi',
              'beneficiaires_effectifs', 'assurances');
