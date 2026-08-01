-- Faire atteindre les variantes aux plans DÉJÀ posés.
--
-- CE QUI MANQUAIT, ET QUE LE FONDATEUR A VU AVANT MOI. Les variantes se
-- résolvent à la matérialisation du plan. Une opération créée avant leur
-- existence gardait donc ses anciens intitulés, et rien ne la reprenait : sur
-- l'écran de sa SA en pré-amorçage, il lisait toujours « Commissaire aux
-- comptes si seuils atteints » en recommandé, alors que sa forme juridique le
-- rend obligatoire.
--
-- Mes propres essais ne l'avaient pas montré parce qu'ils créaient tous des
-- opérations NEUVES. Une fonctionnalité vraie seulement pour ce qui vient
-- après elle est, vue de l'écran, une fonctionnalité qui ne marche pas.
--
-- LA MÊME GARDE QU'AILLEURS. L'intitulé, la description et le niveau ne sont
-- repris que si l'intitulé stocké correspond ENCORE à une valeur connue du
-- référentiel — celle du catalogue ou d'une de ses variantes. Un intitulé
-- réécrit à la main par le fondateur n'est pas touché.
--
-- CE QU'ELLE NE FAIT PAS : retirer les exigences devenues sans objet. Une
-- entreprise individuelle qui aurait déjà un plan garde ses vingt-deux
-- exigences. Supprimer d'un plan existant détruirait du travail, et la règle
-- « changer ne supprime jamais rien » vaut aussi pour une migration.

with profil as (
  select d.id as deal_id, s.forme_juridique, s.country, s.stage
  from public.deals d
  left join public.startups s on s.org_id = d.org_id
),
resolu as (
  select p.deal_id,
         c.key,
         coalesce(vf.label,       vp.label,       vs.label,       c.label)       as label,
         coalesce(vf.description, vp.description, vs.description, c.description) as description,
         coalesce(vs.level,       vf.level,       vp.level,       c.level)       as level
  from profil p
  cross join public.checklist_catalog c
  left join public.checklist_catalog_variants vf
    on vf.catalog_key = c.key and vf.axis = 'forme_juridique' and vf.value = p.forme_juridique
  left join public.checklist_catalog_variants vp
    on vp.catalog_key = c.key and vp.axis = 'country'         and vp.value = p.country
  left join public.checklist_catalog_variants vs
    on vs.catalog_key = c.key and vs.axis = 'stage'           and vs.value = p.stage
)
update public.checklist_items ci
set label       = r.label,
    description = r.description,
    level       = r.level
from resolu r
where ci.deal_id     = r.deal_id
  and ci.catalog_key = r.key
  and (ci.label is distinct from r.label
       or ci.level is distinct from r.level
       or ci.description is distinct from r.description)
  and ci.label = any (
    select l from (
      select c2.label as l from public.checklist_catalog c2 where c2.key = r.key
      union
      select v2.label from public.checklist_catalog_variants v2
       where v2.catalog_key = r.key and v2.label is not null
    ) connus
  );
