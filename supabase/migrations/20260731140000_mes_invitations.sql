-- « Vous avez une invitation en attente. »
--
-- LE PROBLÈME, constaté deux fois de suite en test réel. Un fondateur invité
-- confirme son adresse, arrive sur l'invitation, découvre qu'il lui faut
-- d'abord un espace, le crée… et ne revient jamais au lien. Son invitation
-- reste `pending` pour toujours, et le programme voit une entreprise qui
-- « n'a pas répondu » alors qu'elle s'est inscrite exprès.
--
-- On avait résolu la moitié du problème : la destination survit désormais à la
-- confirmation d'e-mail (`next=/rejoindre/<token>`). Mais elle ne survit pas à
-- l'ONBOARDING, qui s'intercale entre les deux.
--
-- POURQUOI PAS FAIRE TRAVERSER `suivant` À L'ONBOARDING. C'est possible — trois
-- parcours de persona et deux actions de fin — mais cela ne réglerait que ce
-- chemin-là. Un fondateur qui perd l'e-mail, qui s'inscrit de son côté avant de
-- cliquer, ou qui repousse à demain resterait bloqué de la même façon.
--
-- L'invitation doit donc VENIR À LUI, où qu'il soit et quand qu'il revienne.
-- C'est une fonctionnalité, pas un rattrapage de redirection.
--
-- ⚠️ Encore la même RLS. `cohort_links` n'est lisible que par le programme ou
-- par l'entreprise DÉJÀ rattachée : l'invité ne peut pas voir ses propres
-- invitations en attente. D'où une fonction, comme pour `invitation_apercu`.

create or replace function public.mes_invitations()
returns table (
  token       text,
  programme   text,
  cohorte     text,
  invitee_le  timestamptz
)
language sql stable security definer set search_path = public as $$
  select
    cl.token,
    coalesce(o.name, 'Un programme'),
    c.name,
    coalesce(cl.relaunched_at, cl.created_at)
  from public.cohort_links cl
  join auth.users u on lower(u.email) = cl.email
  left join public.organizations o on o.id = cl.sae_org_id
  left join public.cohorts c on c.id = cl.cohort_id
  where u.id = auth.uid()
    and cl.status = 'pending'
    -- Une invitation périmée ne se propose pas : `accept_cohort_link` la
    -- refuserait, et proposer un bouton qui échoue est pire que se taire.
    and now() <= coalesce(cl.relaunched_at, cl.created_at) + interval '30 days'
  order by coalesce(cl.relaunched_at, cl.created_at) desc;
$$;

grant execute on function public.mes_invitations() to authenticated;
