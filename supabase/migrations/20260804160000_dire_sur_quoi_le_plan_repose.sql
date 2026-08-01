-- Sur quoi ce plan a-t-il RÉELLEMENT été construit ?
--
-- POURQUOI CETTE FONCTION EXISTE. L'écran Préparation annonce désormais « 22
-- exigences, d'après le socle juridique OHADA, votre forme juridique — SA,
-- votre stade — Pré-amorçage ». Il serait facile d'y déverser toutes les
-- réponses de l'onboarding. Ce serait faux : une entreprise ivoirienne a bien
-- un pays, mais aucune variante ne s'y rattache aujourd'hui, et l'annoncer
-- comme un facteur du plan serait exactement la faute que les huit phrases
-- retirées le 1er août commettaient.
--
-- La fonction n'expose donc un axe QUE s'il a produit au moins une variante.
-- C'est pourquoi elle interroge `checklist_catalog_variants` et non `startups`.
--
-- SÉCURITÉ. `security definer` est nécessaire et non un raccourci : `startups`
-- est en lecture propriétaire seul (`owner_id = auth.uid()`), donc un
-- collaborateur pourtant autorisé sur l'opération ne verrait rien sans cela.
-- `can_see_deal` — la garde de la politique `deal_select` — reste ce qui
-- autorise la lecture.
--
-- Une première version appelait `can_read_deal`, qui n'existe pas. PL/pgSQL ne
-- résolvant pas les appels à la création, elle s'était créée sans erreur et
-- aurait échoué au premier affichage. Vérifier l'existence d'une fonction
-- avant de l'appeler, y compris quand son nom paraît évident.

create or replace function public.plan_basis(p_deal uuid)
 returns table (forme_juridique text, country text, stage text)
 language plpgsql
 stable
 security definer
 set search_path to 'public'
as $function$
declare
  v_forme text;
  v_pays  text;
  v_stade text;
begin
  if not public.can_see_deal(p_deal) then
    return;
  end if;

  select s.forme_juridique, s.country, s.stage
    into v_forme, v_pays, v_stade
  from public.startups s
  join public.deals d on d.org_id = s.org_id
  where d.id = p_deal
  limit 1;

  return query
  select
    case when exists (select 1 from public.checklist_catalog_variants v
                       where v.axis = 'forme_juridique' and v.value = v_forme)
         then v_forme end,
    case when exists (select 1 from public.checklist_catalog_variants v
                       where v.axis = 'country' and v.value = v_pays)
         then v_pays end,
    case when exists (select 1 from public.checklist_catalog_variants v
                       where v.axis = 'stage' and v.value = v_stade)
         then v_stade end;
end;
$function$;

grant execute on function public.plan_basis(uuid) to authenticated;
