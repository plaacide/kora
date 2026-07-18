-- Demandes de démo des structures d'accompagnement (SAE).
--
-- Le plan Portfolio se vend en rendez-vous, pas en self-service : ce
-- formulaire recueille la demande, l'équipe recontacte. Mêmes précautions que
-- la liste d'attente investisseurs : table fermée, fonction seule voie
-- d'écriture, jamais d'indice sur l'existence d'une adresse.

create table if not exists public.sae_demo_requests (
  id           uuid primary key default gen_random_uuid(),
  email        text not null,
  org_name     text,
  cohort_size  text,
  locale       text not null default 'fr',
  created_at   timestamptz not null default now(),
  constraint sae_demo_requests_email_key unique (email)
);

alter table public.sae_demo_requests enable row level security;
-- AUCUNE policy : fermée aux clients, anonymes comme authentifiés.

create or replace function public.request_sae_demo(
  p_email       text,
  p_org_name    text default null,
  p_cohort_size text default null,
  p_locale      text default 'fr'
)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_email text := lower(trim(p_email));
begin
  if v_email is null or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'email invalide';
  end if;

  insert into public.sae_demo_requests (email, org_name, cohort_size, locale)
  values (
    v_email,
    nullif(trim(coalesce(p_org_name, '')), ''),
    nullif(trim(coalesce(p_cohort_size, '')), ''),
    case when p_locale in ('fr', 'en') then p_locale else 'fr' end
  )
  on conflict (email) do update set
    org_name    = coalesce(excluded.org_name, public.sae_demo_requests.org_name),
    cohort_size = coalesce(excluded.cohort_size, public.sae_demo_requests.cohort_size);
end;
$$;

grant execute on function public.request_sae_demo(text, text, text, text)
  to anon, authenticated;
