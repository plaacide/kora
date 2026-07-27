-- L'invité doit pouvoir LIRE l'invitation qu'on lui adresse.
--
-- LE BLOCAGE, constaté en production. `/rejoindre/<token>` affichait « Cette
-- invitation n'est plus valable » à tout invité, y compris avec un jeton
-- parfaitement vivant. La page interrogeait `cohort_links` avec la session de
-- l'invité, et la politique de lecture dit :
--
--     is_org_internal(sae_org_id)
--     or (startup_org_id is not null and is_org_internal(startup_org_id))
--
-- Or l'invité n'est pas membre du programme, et `startup_org_id` reste NUL
-- jusqu'à l'acceptation. Les deux branches sont donc fausses, la requête
-- renvoie zéro ligne, et l'écran conclut à une invitation introuvable.
--
-- C'est un serpent qui se mord la queue : il faut avoir accepté pour pouvoir
-- lire l'invitation qu'on doit accepter. Le commentaire de la politique dit
-- bien « le fondateur pour savoir QUI le suit » — mais cela ne vaut qu'APRÈS.
--
-- ON NE TOUCHE PAS À LA POLITIQUE. L'élargir pour laisser un invité lire des
-- lignes de `cohort_links` ouvrirait la table entière à des comptes qui n'ont
-- rien à y voir, et il faudrait alors exprimer « sauf celles dont je détiens le
-- jeton » en SQL de politique — impossible sans exposer le jeton à la requête.
-- Une fonction bornée est le bon outil : elle rend TROIS champs, pour UN jeton.

create or replace function public.invitation_apercu(p_token text)
returns table (
  email      text,
  statut     text,
  programme  text,
  cohorte    text
)
language sql stable security definer set search_path = public as $$
  select
    cl.email,
    cl.status,
    coalesce(o.name, 'Un programme'),
    c.name
  from public.cohort_links cl
  left join public.organizations o on o.id = cl.sae_org_id
  left join public.cohorts c on c.id = cl.cohort_id
  where cl.token = p_token
    and coalesce(trim(p_token), '') <> ''
  limit 1;
$$;

comment on function public.invitation_apercu(text) is
  'Ce qu''un porteur de jeton a le droit de savoir de son invitation : à quelle '
  'adresse elle est adressée, où elle en est, et qui l''envoie. Rien d''autre — '
  'ni identifiants, ni contenu de la cohorte.';

-- `anon` inclus : l'écran doit pouvoir dire « invitation révoquée » à quelqu'un
-- qui n'a pas encore de compte, plutôt que de l'envoyer s'inscrire pour rien.
grant execute on function public.invitation_apercu(text) to anon, authenticated;
