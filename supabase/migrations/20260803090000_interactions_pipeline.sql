-- Les interactions du pipeline — écrans 41 et 42.
--
-- Le pipeline dit qu'un investisseur est en diligence ; il ne dit pas CE QUI
-- S'EST PASSÉ. L'appel du 12, le NDA envoyé, la relance restée sans réponse :
-- rien de tout cela n'existait, et « prochaine action : relancer David » était
-- donc une note qu'on ne pouvait pas justifier.
--
-- CE QUE SANZA NE FAIT PAS, et que la maquette 42 dit à l'écran : ni envoyer,
-- ni détecter un e-mail. Une interaction est CONSIGNÉE par l'équipe. La
-- confusion serait grave — un fondateur qui croirait sa boîte lue cesserait de
-- consigner, et le pipeline se viderait sans que personne s'en aperçoive.
--
-- Ré-exécutable.

do $$ begin
  create type public.interaction_type as enum (
    'email', 'appel', 'reunion', 'evenement', 'note', 'autre'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.raise_interactions (
  id          uuid primary key default gen_random_uuid(),
  deal_id     uuid not null references public.deals(id) on delete cascade,
  org_id      uuid not null references public.organizations(id) on delete cascade,
  investor_id uuid not null
    references public.raise_investors(id) on delete cascade,
  type        public.interaction_type not null default 'note',
  date_interaction date not null default current_date,
  responsable text,
  -- Qui était là, en texte libre : un participant n'est pas toujours dans
  -- l'équipe, et attendre qu'il ait un compte pour le nommer ferait perdre
  -- l'information au moment où elle est fraîche.
  participants text,
  resume      text,
  -- « Positif — attend la cap table ». Une phrase, pas une note sur cinq :
  -- ce qui compte est ce qu'on en retire, pas un score qu'on inventerait.
  resultat    text,
  prochaine_action text,
  date_relance date,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists raise_interactions_investor_idx
  on public.raise_interactions (investor_id, date_interaction desc);

alter table public.raise_interactions enable row level security;

drop policy if exists raise_interactions_select on public.raise_interactions;
create policy raise_interactions_select on public.raise_interactions
  for select using (public.is_org_internal(org_id));

revoke insert, update, delete on public.raise_interactions from authenticated;


/**
 * Consigner une interaction — écran 42.
 *
 * LA PROCHAINE ACTION REMONTE SUR L'INVESTISSEUR. `raise_investors` porte déjà
 * `prochaine_action` et `date_relance` : ce sont eux qui alimentent les
 * relances dues du pipeline. Les laisser vivre à part obligerait à saisir deux
 * fois la même décision — et le jour où on oublierait la seconde, le pipeline
 * annoncerait une relance qui n'a plus lieu d'être.
 *
 * On ne remonte QUE ce qui est renseigné : consigner une note sans suite ne
 * doit pas effacer la relance décidée la semaine dernière.
 */
create or replace function public.save_raise_interaction(
  p_investor uuid,
  p_id uuid default null,
  p_type text default null,
  p_date date default null,
  p_responsable text default null,
  p_participants text default null,
  p_resume text default null,
  p_resultat text default null,
  p_prochaine_action text default null,
  p_date_relance date default null
)
returns public.raise_interactions
language plpgsql security definer set search_path = public as $$
declare
  v_deal uuid;
  v_org  uuid;
  v_nom  text;
  v_row  public.raise_interactions;
begin
  select deal_id, nom into v_deal, v_nom
  from public.raise_investors where id = p_investor;
  if v_deal is null then raise exception 'investisseur introuvable'; end if;

  v_org := public.deal_org_for_write(v_deal);

  if p_id is null then
    insert into public.raise_interactions (
      deal_id, org_id, investor_id, type, date_interaction, responsable,
      participants, resume, resultat, prochaine_action, date_relance, created_by
    )
    values (
      v_deal, v_org, p_investor,
      coalesce(p_type, 'note')::public.interaction_type,
      coalesce(p_date, current_date), p_responsable, p_participants,
      p_resume, p_resultat, p_prochaine_action, p_date_relance, auth.uid()
    )
    returning * into v_row;
  else
    update public.raise_interactions set
      type             = coalesce(p_type::public.interaction_type, type),
      date_interaction = coalesce(p_date, date_interaction),
      responsable      = p_responsable,
      participants     = p_participants,
      resume           = p_resume,
      resultat         = p_resultat,
      prochaine_action = p_prochaine_action,
      date_relance     = p_date_relance,
      updated_at       = now()
    where id = p_id and investor_id = p_investor
    returning * into v_row;

    if v_row.id is null then raise exception 'interaction introuvable'; end if;
  end if;

  if nullif(trim(coalesce(p_prochaine_action, '')), '') is not null
     or p_date_relance is not null then
    update public.raise_investors set
      prochaine_action = coalesce(
        nullif(trim(coalesce(p_prochaine_action, '')), ''), prochaine_action
      ),
      date_relance = coalesce(p_date_relance, date_relance),
      updated_at   = now()
    where id = p_investor;
  end if;

  perform public.write_audit(
    v_org, 'interaction.logged', 'raise_interaction', v_row.id::text,
    jsonb_strip_nulls(jsonb_build_object(
      'investisseur', v_nom, 'type', coalesce(p_type, 'note'),
      'resultat', p_resultat
    )),
    v_deal
  );

  return v_row;
end;
$$;

grant execute on function public.save_raise_interaction(
  uuid, uuid, text, date, text, text, text, text, text, date
) to authenticated;


/**
 * Retirer une interaction.
 *
 * La prochaine action de l'investisseur n'est PAS reprise à l'interaction
 * précédente : elle a pu être décidée ailleurs, et deviner reviendrait à
 * ressusciter une relance que quelqu'un avait peut-être remplacée.
 */
create or replace function public.delete_raise_interaction(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_deal uuid;
  v_org  uuid;
begin
  select deal_id into v_deal from public.raise_interactions where id = p_id;
  if v_deal is null then raise exception 'interaction introuvable'; end if;
  v_org := public.deal_org_for_write(v_deal);

  delete from public.raise_interactions where id = p_id;

  perform public.write_audit(
    v_org, 'interaction.removed', 'raise_interaction', p_id::text,
    '{}'::jsonb, v_deal
  );
end;
$$;

grant execute on function public.delete_raise_interaction(uuid) to authenticated;
