-- L'adresse invitée, à partir du jeton, pour quelqu'un qui n'a pas de compte.
--
-- LE PROBLÈME. On veut pré-remplir l'inscription avec l'adresse invitée : c'est
-- elle, et elle seule, qui fera accepter l'invitation (`accept_cohort_link` et
-- `accept_showcase_invite` comparent l'adresse du compte connecté à celle
-- invitée). Laisser l'invité la retaper, c'est l'exposer à créer un compte avec
-- une AUTRE adresse et à se heurter à « cette invitation vise une autre
-- adresse » sans comprendre.
--
-- Or l'invité n'est pas encore authentifié. `cohort_links` et `showcase_access`
-- sont fermées à `anon` — RLS ET absence de `grant`. Une lecture directe depuis
-- la page renvoie zéro ligne, en silence : le pré-remplissage ne marcherait
-- jamais, et rien ne le signalerait.
--
-- POURQUOI PAS LA CLÉ DE SERVICE. On pourrait interroger la table avec la clé
-- privilégiée depuis le serveur. Mais cette clé ouvre TOUT, et l'ouvrir dans
-- une page publique pour lire une colonne est disproportionné. Cette fonction
-- expose exactement une chose : l'adresse d'une invitation vivante.
--
-- CE QUE ÇA DIVULGUE, ET POURQUOI C'EST ACCEPTABLE. Qui détient le jeton
-- apprend l'adresse invitée. Le jeton fait 256 bits aléatoires — il ne se
-- devine pas — et il a été envoyé À CETTE ADRESSE. Le détenir, c'est déjà avoir
-- accès à la boîte. On n'apprend donc rien de plus qu'en lisant le message.
--
-- Une invitation révoquée, expirée ou déjà acceptée ne renvoie RIEN : hors de
-- ce cas d'usage, il n'y a aucune raison de divulguer quoi que ce soit.

create or replace function public.invitation_email(p_token text)
returns text
language plpgsql security definer stable set search_path = public as $$
declare
  v_email text;
begin
  if coalesce(trim(p_token), '') = '' then return null; end if;

  -- Invitation de cohorte (entreprise invitée par un programme).
  select cl.email into v_email
  from public.cohort_links cl
  where cl.token = p_token and cl.status = 'pending';

  if v_email is not null then return v_email; end if;

  -- Invitation de vitrine (investisseur invité par un programme).
  select sa.email into v_email
  from public.showcase_access sa
  where sa.token = p_token
    and sa.revoked_at is null
    and sa.accepted_at is null;

  return v_email;
end;
$$;

-- `anon` inclus : c'est tout l'objet de la fonction — servir quelqu'un qui n'a
-- pas encore de compte.
grant execute on function public.invitation_email(text) to anon, authenticated;
