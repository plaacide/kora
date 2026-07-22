-- Réglages NDA par data room : l'exiger (ou non) par défaut, et son MODÈLE
-- (le texte de l'accord affiché au signataire).
--
-- Jusqu'ici l'écran « Signatures » avait un interrupteur « NDA exigé », un
-- « Modifier le modèle » et un « PDF ↓ » décoratifs. On donne du réel :
--   - deals.nda_required : exiger un NDA par défaut à l'invitation ;
--   - deals.nda_template : le texte de l'accord (sinon un texte générique).
--
-- Ré-exécutable.

alter table public.deals
  add column if not exists nda_required boolean not null default false;
alter table public.deals
  add column if not exists nda_template text;

create or replace function public.set_deal_nda(
  p_deal uuid,
  p_required boolean default null,
  p_template text default null
)
returns public.deals
language plpgsql security definer set search_path = public as $$
declare
  v_org  uuid := public.deal_org_for_write(p_deal);
  v_deal public.deals;
begin
  update public.deals set
    nda_required = coalesce(p_required, nda_required),
    -- p_template null = inchangé ; chaîne (même vide) = nouvelle valeur.
    nda_template = coalesce(p_template, nda_template)
  where id = p_deal
  returning * into v_deal;

  perform public.write_audit(
    v_org, 'deal.nda_updated', 'deal', p_deal::text,
    jsonb_strip_nulls(jsonb_build_object('required', p_required, 'template_set', p_template is not null)),
    p_deal
  );
  return v_deal;
end;
$$;

grant execute on function public.set_deal_nda(uuid, boolean, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Preuve de signature d'un NDA (pour la page « Preuve ↓ »). Accessible à
-- l'équipe interne du deal OU au signataire lui-même. Renvoie la ligne + le
-- texte du modèle en vigueur.
-- ---------------------------------------------------------------------------
create or replace function public.nda_proof(p_id uuid)
returns table (
  signer_name text,
  signer_email text,
  signed_at timestamptz,
  ip_address text,
  user_agent text,
  signature_hash text,
  deal_name text,
  org_name text,
  nda_template text
)
language plpgsql security definer set search_path = public as $$
declare
  v_org    uuid;
  v_signer uuid;
begin
  select d.org_id, n.signer_user_id into v_org, v_signer
  from public.ndas n join public.deals d on d.id = n.deal_id
  where n.id = p_id;

  if v_org is null then raise exception 'preuve introuvable'; end if;
  if not (public.is_org_internal(v_org) or v_signer = auth.uid()) then
    raise exception 'accès refusé';
  end if;

  return query
  select n.signer_name, n.signer_email, n.signed_at, n.ip_address, n.user_agent,
         n.signature_hash, d.name, o.name, d.nda_template
  from public.ndas n
  join public.deals d on d.id = n.deal_id
  join public.organizations o on o.id = d.org_id
  where n.id = p_id;
end;
$$;

grant execute on function public.nda_proof(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- invitation_public renvoie aussi le MODÈLE de NDA, pour l'afficher au
-- signataire dans le parcours public. Le type de retour change => DROP requis.
-- ---------------------------------------------------------------------------
drop function if exists public.invitation_public(text);

create or replace function public.invitation_public(p_token text)
returns table (
  email        text,
  deal_name    text,
  org_name     text,
  nda_required boolean,
  nda_template text,
  valid        boolean
)
language sql stable security definer set search_path = public as $$
  select i.email,
         d.name,
         o.name,
         i.nda_required,
         d.nda_template,
         (i.status <> 'revoked'
          and i.status <> 'accepted'
          and (i.expires_at is null or i.expires_at > now()))
  from public.invitations i
  join public.deals d on d.id = i.deal_id
  join public.organizations o on o.id = d.org_id
  where i.token = p_token;
$$;

grant execute on function public.invitation_public(text) to anon, authenticated;
