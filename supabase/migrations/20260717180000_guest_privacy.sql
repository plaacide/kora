-- Kora — confidentialité des invités.
--
-- Problème corrigé : un 'guest' (investisseur externe) voyait la liste des
-- membres de l'organisation — donc QUI D'AUTRE regarde le deal. Dans une
-- syndication, l'identité des co-investisseurs est justement l'information
-- que le fondateur protège.
--
-- Règle : les rôles INTERNES (owner/admin/member) voient leurs collègues.
-- Un invité ne voit que lui-même.

/** L'appelant est-il un membre interne de cette organisation ? */
create or replace function public.is_org_internal(p_org uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = p_org
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin', 'member')
  );
$$;

/** Partage-t-on une org avec p_user, ET l'appelant y est-il interne ? */
create or replace function public.shares_org_with(p_user uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.memberships a
    join public.memberships b on a.org_id = b.org_id
    where a.user_id = auth.uid()
      and b.user_id = p_user
      and a.role in ('owner', 'admin', 'member')
  );
$$;

-- profiles : un invité ne voit que son propre profil.
drop policy if exists profile_select on public.profiles;
create policy profile_select on public.profiles
  for select using (id = auth.uid() or public.shares_org_with(id));

-- memberships : un invité ne voit que sa propre appartenance.
drop policy if exists membership_select on public.memberships;
create policy membership_select on public.memberships
  for select using (
    user_id = auth.uid() or public.is_org_internal(org_id)
  );

grant execute on function public.is_org_internal(uuid) to authenticated;
grant execute on function public.shares_org_with(uuid) to authenticated;
