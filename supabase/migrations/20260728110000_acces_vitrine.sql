-- Accès à la vitrine — mécanisme SÉPARÉ des droits documentaires.
--
-- POURQUOI PAS UN NIVEAU `perm_level`, alors que les règles §4 disent
-- « réutiliser le mécanisme d'invitation, niveau vitrine ».
--
-- Parce que la porte des documents, dans `src/lib/viewer/access.ts`, tient en
-- une ligne :
--
--     if (!level || level === "none") return 403;
--
-- Il n'y a pas de hiérarchie, pas de liste blanche : TOUT niveau autre que
-- `none` ouvre les pièces. Une permission au niveau « vitrine » aurait donc
-- donné aux investisseurs de la devanture l'accès au contenu des data rooms —
-- silencieusement, et en contradiction frontale avec la règle §0.1, dont la
-- violation vaut refus d'office.
--
-- Deux raisons de plus, moindres : `permissions` est scopée à un DOSSIER
-- (`folder_id not null`) alors qu'un accès vitrine porte sur une COHORTE, ce
-- qui aurait imposé d'inventer un faux dossier ; et `nextLevel()` fait tourner
-- l'échelle en boucle, donc « vitrine » serait apparu dans le sélecteur de
-- droits d'une data room.
--
-- Le geste reste celui de la spec — invitation nominative par le programme,
-- révocable, sans lien anonyme ni indexation. C'est la PLOMBERIE qui diffère,
-- et elle rend le débordement impossible par construction plutôt que par
-- vigilance.

create table if not exists public.showcase_access (
  id            uuid primary key default gen_random_uuid(),
  cohort_id     uuid not null references public.cohorts(id) on delete cascade,
  email         text not null,
  -- Même convention que `invitations` : un jeton non devinable, seule chose
  -- que l'invité possède avant d'avoir un compte.
  token         text not null unique
                default encode(extensions.gen_random_bytes(32), 'hex'),
  -- Nul tant que l'invité n'a pas ouvert le lien : on invite une ADRESSE,
  -- on rattache un compte ensuite.
  investor_user uuid references auth.users(id) on delete cascade,
  invited_by    uuid references public.profiles(id) on delete set null,
  invited_at    timestamptz not null default now(),
  accepted_at   timestamptz,
  revoked_at    timestamptz,
  unique (cohort_id, email)
);

create index if not exists showcase_access_user_idx
  on public.showcase_access (investor_user) where revoked_at is null;

alter table public.showcase_access enable row level security;

-- Le programme gère les invitations de SES cohortes ; l'investisseur voit la
-- sienne. Personne d'autre.
drop policy if exists showcase_access_select on public.showcase_access;
create policy showcase_access_select on public.showcase_access
  for select using (
    investor_user = auth.uid()
    or exists (select 1 from public.cohorts c
               where c.id = cohort_id and public.is_org_member(c.org_id))
  );

drop policy if exists showcase_access_write on public.showcase_access;
create policy showcase_access_write on public.showcase_access
  for all using (
    exists (select 1 from public.cohorts c
            where c.id = cohort_id and public.is_org_member(c.org_id))
  )
  with check (
    exists (select 1 from public.cohorts c
            where c.id = cohort_id and public.is_org_member(c.org_id))
  );

/**
 * L'utilisateur courant voit-il la vitrine de cette cohorte ?
 *
 * `stable` et non `volatile` : appelée dans des policies, elle serait sinon
 * réévaluée pour chaque ligne parcourue.
 */
create or replace function public.has_showcase_access(p_cohort uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.showcase_access a
    where a.cohort_id = p_cohort
      and a.investor_user = auth.uid()
      and a.accepted_at is not null
      and a.revoked_at is null
  );
$$;

-- La vitrine devient lisible par ses invités — et par eux seuls. Les fiches
-- DÉPUBLIÉES restent invisibles : `unpublished_at is null`.
drop policy if exists showcase_entries_select_invite on public.showcase_entries;
create policy showcase_entries_select_invite on public.showcase_entries
  for select using (
    unpublished_at is null and public.has_showcase_access(cohort_id)
  );

/**
 * Rattache un compte à une invitation, au premier passage. Le jeton décide de
 * l'adresse : l'invité ne la choisit pas, il ne peut donc pas s'inviter à la
 * place d'un autre.
 */
create or replace function public.accept_showcase_invite(p_token text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  a public.showcase_access;
  v_email text;
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;

  select * into a from public.showcase_access where token = p_token;
  if a.id is null or a.revoked_at is not null then return null; end if;

  select lower(email) into v_email from auth.users where id = auth.uid();
  if v_email is distinct from lower(a.email) then
    raise exception 'cette invitation vise une autre adresse';
  end if;

  update public.showcase_access
  set investor_user = auth.uid(),
      accepted_at = coalesce(accepted_at, now())
  where id = a.id;

  return a.cohort_id;
end;
$$;

grant execute on function public.has_showcase_access(uuid) to authenticated;
grant execute on function public.accept_showcase_invite(text) to authenticated;
