-- L'engagement de la relation suit l'engagement déclaré.
--
-- `raise_investors.engagement` est né avant `raise_commitments` : c'était alors
-- la seule façon de dire « soft-commit ». Depuis, l'engagement RÉEL vit dans sa
-- propre table, avec son montant, sa date et sa preuve — et les deux se sont
-- mis à diverger. La fiche de la maquette 41 les affiche côte à côte, ce qui l'a
-- rendu visible : « Soft-commit » sur la relation, « confirmé » sur le montant.
--
-- C'est la même erreur que `montant_engage` saisi à la main, corrigée de la
-- même manière : une seule source, et une colonne dénormalisée que la RPC tient
-- à jour. Garder deux vérités, c'est garantir qu'elles se contrediront le jour
-- où l'une sera mise à jour seule.
--
-- Ré-exécutable.

create or replace function public.save_raise_commitment(
  p_investor uuid,
  p_niveau text,
  p_montant bigint,
  p_devise text default null,
  p_date date default null,
  p_preuve text default null,
  p_commentaire text default null,
  p_responsable text default null
)
returns public.raise_commitments
language plpgsql security definer set search_path = public as $$
declare
  v_deal    uuid;
  v_org     uuid;
  v_nom     text;
  v_avant   public.raise_commitments;
  v_apres   public.raise_commitments;
begin
  select deal_id, nom into v_deal, v_nom
  from public.raise_investors where id = p_investor;
  if v_deal is null then raise exception 'investisseur introuvable'; end if;

  v_org := public.deal_org_for_write(v_deal);

  select * into v_avant from public.raise_commitments where investor_id = p_investor;

  insert into public.raise_commitments (
    deal_id, org_id, investor_id, niveau, montant, devise, date_engagement,
    preuve, commentaire, responsable, created_by
  )
  values (
    v_deal, v_org, p_investor, p_niveau::public.commitment_level, p_montant,
    p_devise, coalesce(p_date, current_date), p_preuve, p_commentaire,
    p_responsable, auth.uid()
  )
  on conflict (investor_id) do update set
    niveau          = excluded.niveau,
    montant         = excluded.montant,
    devise          = coalesce(excluded.devise, public.raise_commitments.devise),
    date_engagement = excluded.date_engagement,
    preuve          = excluded.preuve,
    commentaire     = excluded.commentaire,
    responsable     = excluded.responsable,
    updated_at      = now()
  returning * into v_apres;

  -- Les deux vocabulaires coïncident — `interet`, `soft_commit`, `confirme` —
  -- ce qui n'est pas un hasard : la colonne de la relation a servi de brouillon
  -- à l'énumération des engagements. Ce sont deux ÉNUMÉRATIONS distinctes, d'où
  -- le passage par le texte : PostgreSQL ne convertit pas l'une en l'autre.
  update public.raise_investors
  set engagement = p_niveau::public.investor_commitment, updated_at = now()
  where id = p_investor;

  perform public.write_audit(
    v_org,
    case when v_avant.id is null then 'commitment.recorded' else 'commitment.requalified' end,
    'raise_commitment', v_apres.id::text,
    jsonb_strip_nulls(jsonb_build_object(
      'investisseur', v_nom,
      'niveau_avant', v_avant.niveau, 'montant_avant', v_avant.montant,
      'niveau', p_niveau, 'montant', p_montant, 'preuve', p_preuve
    )),
    v_deal
  );

  perform public.recompute_secured(v_deal);
  return v_apres;
end;
$$;

grant execute on function public.save_raise_commitment(
  uuid, text, bigint, text, date, text, text, text
) to authenticated;


/**
 * Retirer un engagement remet la relation à « aucun ».
 *
 * Et non à son niveau d'avant : celui-ci n'existe plus nulle part, et le
 * deviner ferait réapparaître un soft-commit que personne ne soutient plus.
 */
create or replace function public.delete_raise_commitment(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_deal     uuid;
  v_org      uuid;
  v_investor uuid;
begin
  select deal_id, investor_id into v_deal, v_investor
  from public.raise_commitments where id = p_id;
  if v_deal is null then raise exception 'engagement introuvable'; end if;
  v_org := public.deal_org_for_write(v_deal);

  delete from public.raise_commitments where id = p_id;

  update public.raise_investors
  set engagement = 'aucun'::public.investor_commitment, updated_at = now()
  where id = v_investor;

  perform public.write_audit(
    v_org, 'commitment.removed', 'raise_commitment', p_id::text, '{}'::jsonb, v_deal
  );
  perform public.recompute_secured(v_deal);
end;
$$;

grant execute on function public.delete_raise_commitment(uuid) to authenticated;


-- Rattrapage : aligner les relations qui portent déjà un engagement déclaré.
update public.raise_investors i
set engagement = c.niveau::text::public.investor_commitment
from public.raise_commitments c
where c.investor_id = i.id and i.engagement::text <> c.niveau::text;
