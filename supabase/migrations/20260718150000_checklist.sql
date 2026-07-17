-- Kora — checklist de due diligence + readiness calculé. Ré-exécutable.
--
-- Le readiness cesse d'être un curseur que le fondateur déplace : il devient
-- la conséquence mesurée de la checklist. Un score auto-déclaré n'a aucune
-- valeur pour un investisseur, et n'apprend rien au fondateur.

drop function if exists public.set_checklist_status(uuid, text) cascade;
drop function if exists public.link_checklist_document(uuid, uuid) cascade;
drop function if exists public.recompute_readiness(uuid) cascade;
drop function if exists public.apply_checklist_template(uuid) cascade;
drop table if exists public.checklist_items cascade;
drop type if exists public.checklist_status cascade;
drop type if exists public.checklist_category cascade;

create type public.checklist_status as enum ('todo', 'in_progress', 'done');
create type public.checklist_category as enum ('ohada', 'financier', 'dfi');

create table public.checklist_items (
  id          uuid primary key default gen_random_uuid(),
  deal_id     uuid not null references public.deals(id) on delete cascade,
  category    public.checklist_category not null,
  label       text not null,
  description text not null default '',
  status      public.checklist_status not null default 'todo',
  -- Preuve : le document qui satisfait l'exigence.
  document_id uuid references public.documents(id) on delete set null,
  position    int not null default 1,
  created_at  timestamptz not null default now(),
  unique (deal_id, category, label)
);
create index checklist_deal_idx on public.checklist_items (deal_id, category, position);

/**
 * Readiness = part des exigences satisfaites.
 *
 * 'in_progress' compte pour moitié : une pièce en cours de collecte n'est pas
 * rien, mais elle ne vaut pas une pièce fournie.
 */
create or replace function public.recompute_readiness(p_deal uuid)
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_total int;
  v_score numeric;
  v_pct   int;
begin
  select count(*) into v_total from public.checklist_items where deal_id = p_deal;
  if v_total = 0 then return 0; end if;

  select sum(case status when 'done' then 1 when 'in_progress' then 0.5 else 0 end)
  into v_score
  from public.checklist_items where deal_id = p_deal;

  v_pct := round((v_score / v_total) * 100);
  update public.deals set readiness_score = v_pct where id = p_deal;
  return v_pct;
end;
$$;

create or replace function public.apply_checklist_template(p_deal uuid)
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_org     uuid := public.deal_org_for_write(p_deal);
  v_created int := 0;
  v_node    jsonb;
  v_pos     int;
  v_cat     text;
  v_items   jsonb;
  v_tree    jsonb := '[
    {
      "category": "ohada",
      "items": [
        {"label": "Statuts à jour et enregistrés", "description": "Version en vigueur, avec toutes les modifications depuis la création."},
        {"label": "Extrait RCCM de moins de 3 mois", "description": "Un extrait périmé bloque systématiquement un closing."},
        {"label": "Déclaration fiscale d''existence (NINEA/IFU)", "description": "Preuve d''immatriculation fiscale selon le pays."},
        {"label": "Registre des actionnaires à jour", "description": "Table de capitalisation cohérente avec les statuts et les PV."},
        {"label": "PV des assemblées des 3 derniers exercices", "description": "AGO, AGE et conseils. Les décisions structurantes doivent être traçables."},
        {"label": "Pacte d''actionnaires en vigueur", "description": "Le pacte existant conditionne souvent ce qu''un nouvel investisseur peut négocier."},
        {"label": "Commissaire aux comptes désigné si seuils atteints", "description": "Obligatoire en OHADA au-delà de certains seuils. Son absence est un point d''audit."}
      ]
    },
    {
      "category": "financier",
      "items": [
        {"label": "États financiers SYSCOHADA — 3 exercices", "description": "Bilan, compte de résultat et TAFIRE, référentiel révisé."},
        {"label": "Rapport du commissaire aux comptes", "description": "Rapports général et spécial, avec les réserves éventuelles."},
        {"label": "Quitus ou attestation de régularité fiscale", "description": "Délivré par la DGI. Une dette fiscale non déclarée est un risque de reprise."},
        {"label": "Déclarations de TVA à jour", "description": "Cohérentes avec le chiffre d''affaires déclaré."},
        {"label": "Budget de l''exercice en cours", "description": "Avec le suivi du réalisé, pour juger de la fiabilité des prévisions."},
        {"label": "Business plan et modèle financier", "description": "Hypothèses explicites et vérifiables."},
        {"label": "Tableau de la dette et des covenants", "description": "Emprunts, garanties données, crédit-bail, engagements hors bilan."}
      ]
    },
    {
      "category": "dfi",
      "items": [
        {"label": "Attestation de régularité sociale (CNSS/CNPS/IPRES)", "description": "Exigée par la plupart des bailleurs avant décaissement."},
        {"label": "Registre des bénéficiaires effectifs", "description": "Toute personne détenant plus de 25% du capital, pièces d''identité à l''appui."},
        {"label": "Politique LBC/FT et screening", "description": "Anti-blanchiment, vérification sanctions et personnes politiquement exposées."},
        {"label": "Politique environnementale et sociale", "description": "Attendue par les DFI, souvent alignée sur les normes de performance IFC."},
        {"label": "Plan d''action E&S", "description": "Actions correctives datées et responsables identifiés."},
        {"label": "Agréments sectoriels applicables", "description": "BCEAO, régulateur télécom, ministère de tutelle selon l''activité."},
        {"label": "Assurances en cours de validité", "description": "Polices et attestations couvrant les risques d''exploitation."},
        {"label": "Marques OAPI enregistrées", "description": "Certificats et échéances. Une marque non déposée est un risque sur l''actif principal."}
      ]
    }
  ]'::jsonb;
  v_item jsonb;
begin
  for v_node in select * from jsonb_array_elements(v_tree) loop
    v_cat := v_node->>'category';
    v_items := v_node->'items';
    v_pos := 0;

    for v_item in select * from jsonb_array_elements(v_items) loop
      v_pos := v_pos + 1;
      if not exists (
        select 1 from public.checklist_items
        where deal_id = p_deal
          and category = v_cat::public.checklist_category
          and label = v_item->>'label'
      ) then
        insert into public.checklist_items (deal_id, category, label, description, position)
        values (p_deal, v_cat::public.checklist_category,
                v_item->>'label', v_item->>'description', v_pos);
        v_created := v_created + 1;
      end if;
    end loop;
  end loop;

  perform public.recompute_readiness(p_deal);

  if v_created > 0 then
    perform public.write_audit(
      v_org, 'checklist.template_applied', 'deal', p_deal::text,
      jsonb_build_object('items', v_created), p_deal
    );
  end if;

  return v_created;
end;
$$;

create or replace function public.set_checklist_status(p_item uuid, p_status text)
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_deal  uuid;
  v_org   uuid;
  v_label text;
begin
  select deal_id, label into v_deal, v_label
  from public.checklist_items where id = p_item;
  if v_deal is null then raise exception 'élément introuvable'; end if;
  v_org := public.deal_org_for_write(v_deal);

  update public.checklist_items
  set status = p_status::public.checklist_status
  where id = p_item;

  perform public.write_audit(
    v_org, 'checklist.status_changed', 'checklist', p_item::text,
    jsonb_build_object('label', v_label, 'status', p_status), v_deal
  );

  -- Le score suit l'état réel : il n'est jamais saisi à la main.
  return public.recompute_readiness(v_deal);
end;
$$;

/** Rattache le document qui prouve l'exigence (ou le détache si null). */
create or replace function public.link_checklist_document(p_item uuid, p_doc uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_deal  uuid;
  v_org   uuid;
  v_label text;
begin
  select deal_id, label into v_deal, v_label
  from public.checklist_items where id = p_item;
  if v_deal is null then raise exception 'élément introuvable'; end if;
  v_org := public.deal_org_for_write(v_deal);

  -- Une preuve ne peut pas venir d'un autre deal.
  if p_doc is not null and not exists (
    select 1 from public.documents d where d.id = p_doc and d.deal_id = v_deal
  ) then
    raise exception 'document invalide';
  end if;

  update public.checklist_items set document_id = p_doc where id = p_item;

  perform public.write_audit(
    v_org, 'checklist.document_linked', 'checklist', p_item::text,
    jsonb_build_object('label', v_label, 'document', p_doc), v_deal
  );
end;
$$;

-- create_deal applique aussi la checklist.
create or replace function public.create_deal(
  p_name text,
  p_type text default 'VC',
  p_currency text default 'XOF',
  p_amount numeric default null
)
returns public.deals
language plpgsql security definer set search_path = public as $$
declare
  v_org  uuid;
  v_deal public.deals;
begin
  select m.org_id into v_org
  from public.memberships m
  where m.user_id = auth.uid() and m.role in ('owner', 'admin', 'member')
  limit 1;

  if v_org is null then raise exception 'aucune organisation'; end if;

  insert into public.deals (org_id, name, type, currency, amount, created_by)
  values (v_org, p_name, p_type, p_currency, p_amount, auth.uid())
  returning * into v_deal;

  perform public.apply_dataroom_template(v_deal.id);
  perform public.apply_checklist_template(v_deal.id);

  perform public.write_audit(
    v_org, 'deal.created', 'deal', v_deal.id::text,
    jsonb_build_object('name', p_name, 'type', p_type), v_deal.id
  );

  return v_deal;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.checklist_items enable row level security;

create policy checklist_select on public.checklist_items
  for select using (exists (
    select 1 from public.deals d
    where d.id = checklist_items.deal_id and public.is_org_member(d.org_id)
  ));

grant select on public.checklist_items to authenticated;
grant execute on function public.apply_checklist_template(uuid) to authenticated;
grant execute on function public.set_checklist_status(uuid, text) to authenticated;
grant execute on function public.link_checklist_document(uuid, uuid) to authenticated;
grant execute on function public.recompute_readiness(uuid) to authenticated;
grant execute on function public.create_deal(text, text, text, numeric) to authenticated;
