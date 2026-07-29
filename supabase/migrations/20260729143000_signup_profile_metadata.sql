-- L'inscription doit provisionner le profil dans la même transaction que
-- auth.users, sans appel service-role depuis l'application.
--
-- Les valeurs d'autorisation ne sont jamais lues ensuite depuis
-- raw_user_meta_data : elles sont validées puis copiées dans public.profiles,
-- qui reste la source de vérité protégée par RLS.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account_type public.account_type;
begin
  v_account_type :=
    case new.raw_user_meta_data->>'account_type'
      when 'investor' then 'investor'::public.account_type
      when 'sae' then 'sae'::public.account_type
      else 'founder'::public.account_type
    end;

  insert into public.profiles (
    id,
    email,
    full_name,
    locale,
    account_type,
    job_title
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'locale', 'fr'),
    v_account_type,
    nullif(trim(new.raw_user_meta_data->>'job_title'), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Répare les comptes créés avant ce correctif, sans écraser une valeur déjà
-- renseignée dans le profil.
update public.profiles as p
set
  account_type = coalesce(
    p.account_type,
    case u.raw_user_meta_data->>'account_type'
      when 'investor' then 'investor'::public.account_type
      when 'sae' then 'sae'::public.account_type
      else 'founder'::public.account_type
    end
  ),
  job_title = coalesce(
    p.job_title,
    nullif(trim(u.raw_user_meta_data->>'job_title'), '')
  )
from auth.users as u
where u.id = p.id
  and (
    p.account_type is null
    or (
      p.job_title is null
      and nullif(trim(u.raw_user_meta_data->>'job_title'), '') is not null
    )
  );
