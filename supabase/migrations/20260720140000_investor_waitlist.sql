-- Liste d'attente investisseurs (site marketing).
--
-- Phase bêta « fondateurs d'abord » : l'inscription est ouverte aux fondateurs,
-- les investisseurs laissent leur adresse et sont recontactés. C'est le seul
-- formulaire de Sanza ouvert à des visiteurs NON authentifiés — d'où les
-- précautions ci-dessous.

create table if not exists public.investor_waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  company     text,
  ticket      text,
  locale      text not null default 'fr',
  created_at  timestamptz not null default now(),
  -- Deux inscriptions avec la même adresse ne créent qu'une ligne : le
  -- visiteur qui reclique ne doit pas polluer la liste.
  constraint investor_waitlist_email_key unique (email)
);

alter table public.investor_waitlist enable row level security;

-- AUCUNE policy : la table est donc totalement fermée aux clients, anonymes
-- comme authentifiés. Personne ne peut lire la liste de vos prospects
-- investisseurs depuis le navigateur, ni deviner qui s'est inscrit. Le seul
-- chemin d'écriture est la fonction ci-dessous.

/**
 * Inscription à la liste d'attente. `security definer` : contourne la RLS
 * pour cette écriture précise, et rien d'autre.
 *
 * Ne renvoie RIEN, volontairement : si la fonction indiquait « déjà inscrit »,
 * n'importe qui pourrait tester des adresses pour savoir quels investisseurs
 * suivent Sanza. Le formulaire répond donc toujours la même chose.
 */
create or replace function public.join_investor_waitlist(
  p_email   text,
  p_company text default null,
  p_ticket  text default null,
  p_locale  text default 'fr'
)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_email text := lower(trim(p_email));
begin
  -- Validation côté base : l'action serveur valide déjà, mais la fonction ne
  -- doit pas dépendre de la bonne foi de son appelant.
  if v_email is null or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'email invalide';
  end if;

  insert into public.investor_waitlist (email, company, ticket, locale)
  values (
    v_email,
    nullif(trim(coalesce(p_company, '')), ''),
    nullif(trim(coalesce(p_ticket, '')), ''),
    case when p_locale in ('fr', 'en') then p_locale else 'fr' end
  )
  on conflict (email) do update set
    company = coalesce(excluded.company, public.investor_waitlist.company),
    ticket  = coalesce(excluded.ticket,  public.investor_waitlist.ticket);
end;
$$;

-- `anon` inclus : le formulaire vit sur le site public, avant toute connexion.
grant execute on function public.join_investor_waitlist(text, text, text, text)
  to anon, authenticated;
