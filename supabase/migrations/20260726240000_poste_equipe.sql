-- Poste de la personne dans l'entreprise (CEO, CFO, Directrice juridique…).
--
-- Demandé à l'inscription et affiché dans « Équipe sur la levée » : un
-- investisseur veut savoir QUI porte la levée, pas seulement le rôle de
-- permission (owner/éditeur). Vaut pour le fondateur comme pour les membres
-- d'équipe qu'il invite ensuite — ils passent par le même formulaire.
--
-- Ré-exécutable.

alter table public.profiles
  add column if not exists job_title text;

-- Chacun renseigne SON poste (pas celui des autres) : la fonction n'écrit que
-- sur la ligne de l'appelant.
create or replace function public.set_my_job_title(p_title text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'non authentifié'; end if;
  update public.profiles
  set job_title = nullif(trim(p_title), '')
  where id = auth.uid();
end;
$$;

grant execute on function public.set_my_job_title(text) to authenticated;
