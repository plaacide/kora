-- Un quatrième rôle interne : le lecteur.
--
-- La maquette 33 en montre quatre — Propriétaire, Administrateur,
-- Contributeur, Lecteur interne — et la base n'en connaît que trois plus
-- `guest`. Le manquant n'est pas cosmétique : c'est l'avocat de l'entreprise,
-- le conseil, l'expert-comptable. Quelqu'un qui doit LIRE la data room sans
-- pouvoir y déposer, la partager ni la modifier.
--
-- Aujourd'hui il n'y a que deux mauvaises réponses :
--
--   · en faire un `member`, et il peut déposer, rattacher, tout modifier ;
--   · en faire un `guest`, et il devient un invité EXTERNE — filigrané, avec
--     une échéance, rangé dans Partage et accès. Or la maquette 33 dit
--     explicitement que les invités externes « ne figurent jamais ici ».
--
-- Arbitrage rendu le 2 août 2026, à la demande du fondateur.
--
-- POURQUOI CETTE MIGRATION EST COURTE, alors que vingt-six endroits énumèrent
-- les rôles internes. Chaque garde d'ÉCRITURE liste `('owner','admin',
-- 'member')` : ajouter une valeur l'exclut donc automatiquement partout, sans
-- toucher à une ligne. Seule la LECTURE passe par une fonction unique,
-- `is_org_internal`, et c'est la seule à élargir.
--
-- Autrement dit : le nouveau rôle est refusé en écriture par défaut, et admis
-- en lecture par un seul changement. C'est l'inverse qui aurait été
-- dangereux.
--
-- Ré-exécutable.

alter type public.org_role add value if not exists 'internal_viewer';

/**
 * Le `::text` n'est pas une négligence.
 *
 * PostgreSQL refuse qu'une valeur d'énumération soit UTILISÉE dans la même
 * transaction que le `add value` qui la crée — et l'éditeur SQL exécute tout
 * d'un bloc. Comparer sur le texte contourne le problème sans imposer de
 * couper la migration en deux, ce qu'on oublierait de faire au prochain
 * ajout.
 */
create or replace function public.is_org_internal(p_org uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = p_org
      and m.user_id = auth.uid()
      and m.role::text in ('owner', 'admin', 'member', 'internal_viewer')
  );
$$;

grant execute on function public.is_org_internal(uuid) to authenticated;
