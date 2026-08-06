-- Ce que le programme a répondu à l'étape 3 de son inscription.
--
-- L'écran 00b demande « comment accompagnez-vous vos entreprises ? » et accepte
-- PLUSIEURS réponses — suivre une cohorte, structurer avec des Challenges,
-- exposer aux investisseurs, rendre compte à un bailleur. Aucune colonne ne les
-- portait : la question était posée et la réponse jetée.
--
-- Un tableau de codes stables, et non un texte libre : ces réponses décideront
-- de ce que le rail propose, et un libellé qui change casserait la lecture.

alter table public.organizations
  add column if not exists program_focus text[] not null default '{}'::text[];

comment on column public.organizations.program_focus is
  'Façons d''accompagner retenues à l''inscription : cohorte, challenges, dealrooms, rapports.';

/**
 * Enregistre les façons d'accompagner.
 *
 * Les codes inconnus sont ÉCARTÉS plutôt que refusés : l'écran évoluera, et un
 * code de plus ne doit pas bloquer une inscription. Ce qui n'est pas reconnu
 * ne rentre simplement pas.
 */
create or replace function public.set_programme_focus(p_focus text[])
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_org uuid;
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;

  select m.org_id into v_org
  from public.memberships m
  where m.user_id = auth.uid() and m.role in ('owner', 'admin')
  order by m.created_at
  limit 1;

  if v_org is null then raise exception 'accès refusé'; end if;

  update public.organizations
  set program_focus = array(
    select distinct code
    from unnest(coalesce(p_focus, '{}'::text[])) as code
    where code in ('cohorte', 'challenges', 'dealrooms', 'rapports')
  )
  where id = v_org;

  perform public.write_audit(
    v_org, 'org.focus_set', 'organization', v_org::text,
    jsonb_build_object('focus', p_focus)
  );
end;
$$;

grant execute on function public.set_programme_focus(text[]) to authenticated;
