-- La roadmap publique annonçait « Prévu » sur six écrans DÉJÀ livrés.
--
-- Un testeur qui la consulte en conclut que la moitié du produit n'existe pas,
-- alors que ces six écrans sont dans le menu et fonctionnent en production
-- (vérifiés un à un : pipeline kanban, fiche deal, checklist 22 pièces,
-- readiness calculé, Q&A avec export, historique des versions).
--
-- Sur une page dont l'argument est « cette page dit honnêtement où on en est »,
-- l'écart n'est pas un détail de contenu : il retourne la promesse.
--
-- `eta_label` passe de 'V1' à 'V0' pour rester cohérent avec les autres
-- éléments livrés.

update public.roadmap_items
set status = 'shipped', eta_label = 'V0'
where title in (
  'Pipeline (kanban)',
  'Fiche deal',
  'Checklist de due diligence',
  'Readiness Score',
  'Q&A',
  'Versions & comparaison'
)
and status <> 'shipped';
