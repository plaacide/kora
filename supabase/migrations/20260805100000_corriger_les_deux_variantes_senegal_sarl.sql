-- Deux corrections de fond, apportées par le fondateur sources à l'appui.
--
-- 1. « REGISTRE DES ASSOCIÉS » N'EST PAS ÉTABLI. Les renseignements sur les
--    associés figurent dans les formalités RCCM (formulaire M1 / M1 bis), mais
--    rien ne permet d'affirmer que toute SARL sénégalaise détient un document
--    autonome portant ce titre. J'avais écrit cette variante ; elle demandait
--    une pièce dont le nom n'est pas établi, ce qui envoie le fondateur
--    chercher ce qui n'existe peut-être pas chez lui.
--
--    L'exigence porte donc sur L'INFORMATION RECHERCHÉE et non sur un titre.
--    Plusieurs preuves sont acceptables — statuts, formulaire RCCM, actes de
--    cession, tableau certifié, registre interne s'il est tenu.
--
-- 2. « NINEA » EST UN NUMÉRO, PAS UN DOCUMENT. On demande la preuve
--    d'immatriculation, pas une pièce nommée d'après un identifiant. Elle reste
--    distincte de l'immatriculation au RCCM.
--
-- Sources citées par le fondateur : guide du créateur d'entreprise de l'APIX
-- Sénégal, formulaire RCCM M1 de l'OHADA, portail RCCM.

update public.checklist_catalog_variants
set label = 'Liste à jour des associés et répartition des parts sociales',
    description = 'Une répartition du capital incohérente avec les statuts ou les formalités RCCM bloque rapidement une diligence. Plusieurs preuves conviennent : statuts à jour, formulaire RCCM M1 ou M1 bis, actes de cession de parts, tableau de répartition certifié par la société, ou registre interne lorsqu''il est tenu.'
where catalog_key = 'registre_actionnaires'
  and axis = 'forme_juridique' and value = 'SARL';

update public.checklist_catalog_variants
set label = 'Attestation ou preuve d''immatriculation au NINEA',
    description = 'Le NINEA est un numéro, pas un document : c''est la preuve d''immatriculation qui est attendue. Elle confirme l''identification administrative et fiscale de l''entreprise au Sénégal, et son absence bloque l''instruction d''un dossier local. Distincte de l''immatriculation au RCCM.'
where catalog_key = 'declaration_fiscale'
  and axis = 'country' and value = 'Sénégal';

-- La SARL unipersonnelle n'a qu'un associé : le pluriel sonne faux, et la
-- pièce attendue n'est pas la même. Les décisions de l'associé unique sont une
-- exigence de gouvernance distincte — elles ne prouvent pas la détention.
insert into public.checklist_catalog_variants
  (catalog_key, axis, value, label, description, level, applicable)
values
  ('registre_actionnaires', 'forme_juridique', 'SARL unipersonnelle',
   'Identité de l''associé unique et détention du capital',
   'Un associé unique reste un actionnariat : la détention doit se prouver, même sans répartition. Les décisions de l''associé unique relèvent de la gouvernance et ne remplacent pas cette preuve.',
   null, true)
on conflict (catalog_key, axis, value) do nothing;

-- L'exigence sur la dette est ENRICHIE plutôt que dédoublée : un échéancier
-- séparé redemanderait la même information sous un autre format.
update public.checklist_catalog
set description = 'Emprunts, garanties données, crédit-bail, engagements hors bilan. Pour chaque ligne : créancier, montant initial, solde, taux, échéance, date de maturité, sûreté et covenant éventuels.'
where key = 'tableau_dette';
