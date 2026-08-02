-- Deux applicabilités manquaient : l'audit et la diligence.
--
-- Le produit propose six objectifs et le référentiel n'en reconnaissait que
-- quatre. Une exigence propre à un audit n'avait donc aucune étiquette pour
-- dire qu'elle relevait d'un audit, et le filtre par objectif n'aurait rien pu
-- en faire.
--
-- SÉPARÉE DE L'INSERTION DES EXIGENCES. PostgreSQL refuse d'utiliser une valeur
-- d'énumération dans la transaction qui la crée ; les deux migrations ne
-- peuvent pas fusionner.
--
-- `ohada` reste dans cette énumération alors que ce n'est pas une applicabilité
-- mais un régime juridique. Le séparer proprement demande de réécrire les
-- filtres et l'affichage : reporté après la bêta, et d'ici là l'écran ne le
-- présente plus comme un financeur (voir `domain/preparation.ts`).

alter type public.checklist_source add value if not exists 'audit';
alter type public.checklist_source add value if not exists 'diligence';
