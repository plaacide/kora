-- ═══════════════════════════════════════════════════════════════════════════
-- ISOLATION ENTRE ORGANISATIONS — deux entreprises sans aucun lien.
--
-- `rls_programme_0_1.sql` couvre un cas particulier : un programme et une
-- startup de SA cohorte, donc deux organisations qui se connaissent. Le cas
-- ordinaire n'était couvert nulle part : deux entreprises étrangères l'une à
-- l'autre, qui n'ont en commun que d'utiliser Sanza. C'est pourtant la
-- situation de tous les comptes, tout le temps.
--
--   COMMENT LE LANCER — le coller entier dans l'éditeur SQL de Supabase.
--   Il s'exécute dans une transaction annulée à la fin : il n'écrit RIEN de
--   durable.
--
--   CE QU'IL AFFICHE — une ligne par contrôle, avec « OK » ou « ÉCHEC ».
--
-- CE QU'IL VÉRIFIE, ET POURQUOI EN DEUX TEMPS.
--   · La LECTURE : Beta ne voit rien d'Alpha. C'est ce que les politiques RLS
--     défendent.
--   · L'ÉCRITURE : Beta ne peut rien écrire chez Alpha. Ce second temps est
--     indispensable — les RPC sont `security definer`, donc elles s'exécutent
--     avec les droits de leur propriétaire et TRAVERSENT la RLS. Une politique
--     de lecture irréprochable ne dit rien de ce qu'une RPC laisse écrire.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

set local role postgres;

create temp table rlstest_resultats (
  ord      int,
  controle text,
  mesure   text,
  attendu  text,
  verdict  text
) on commit drop;

-- La table est remplie après le passage en `authenticated` : sans ce droit,
-- les contrôles échoueraient sur la table de résultats elle-même.
grant all on rlstest_resultats to authenticated;

do $$
declare
  v_org_alpha  uuid;
  v_org_beta   uuid;
  v_user_alpha uuid := gen_random_uuid();
  v_user_beta  uuid := gen_random_uuid();
  v_deal_alpha        uuid;
  v_deal_alpha_vierge uuid;
  v_deal_beta         uuid;
  v_folder            uuid;
begin
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                          email_confirmed_at, created_at, updated_at)
  values
    (v_user_alpha, '00000000-0000-0000-0000-000000000000', 'authenticated',
     'authenticated', 'test-alpha@rls.invalid', '', now(), now(), now()),
    (v_user_beta, '00000000-0000-0000-0000-000000000000', 'authenticated',
     'authenticated', 'test-beta@rls.invalid', '', now(), now(), now());

  -- `on conflict` obligatoire : le déclencheur `on_auth_user_created` a déjà
  -- créé ces profils. Voir la note détaillée dans `rls_programme_0_1.sql`.
  insert into public.profiles (id, email, full_name)
  values (v_user_alpha, 'test-alpha@rls.invalid', 'Test Alpha'),
         (v_user_beta, 'test-beta@rls.invalid', 'Test Beta')
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name;

  insert into public.organizations (name, slug)
  values ('Entreprise Alpha', 'rls-alpha-' || substr(v_user_alpha::text, 1, 8))
  returning id into v_org_alpha;

  insert into public.organizations (name, slug)
  values ('Entreprise Beta', 'rls-beta-' || substr(v_user_beta::text, 1, 8))
  returning id into v_org_beta;

  -- Aucune cohorte, aucune invitation, aucun lien : deux entreprises qui
  -- s'ignorent. C'est précisément le cas que ce fichier couvre.
  insert into public.memberships (org_id, user_id, role)
  values (v_org_alpha, v_user_alpha, 'owner'),
         (v_org_beta, v_user_beta, 'owner');

  -- L'opération d'Alpha, garnie : documents, levée, invitation, exigences.
  insert into public.deals (org_id, name, objectif, created_by)
  values (v_org_alpha, 'Série B confidentielle', 'levee', v_user_alpha)
  returning id into v_deal_alpha;

  insert into public.folders (deal_id, name)
  values (v_deal_alpha, 'Finance et comptabilité')
  returning id into v_folder;

  insert into public.documents (deal_id, folder_id, name, created_by)
  values (v_deal_alpha, v_folder, 'Term sheet Sequoia.pdf', v_user_alpha);

  insert into public.raises (deal_id, org_id, name, montant_cible, devise, statut)
  values (v_deal_alpha, v_org_alpha, 'Série B 2026', 900000000, 'XOF', 'en_cours');

  insert into public.checklist_items (deal_id, category, label)
  values (v_deal_alpha, 'ohada', 'Statuts à jour');

  -- Une SECONDE opération chez Alpha, celle-là sans levée.
  --
  -- `create_raise` refuse aussi quand une levée est déjà en cours. Éprouvé sur
  -- l'opération ci-dessus, il aurait refusé pour cette raison-là, et le
  -- contrôle serait passé au vert sans jamais toucher au contrôle d'accès —
  -- vert y compris le jour où l'isolation serait cassée.
  insert into public.deals (org_id, name, objectif, created_by)
  values (v_org_alpha, 'Opération sans levée', 'levee', v_user_alpha)
  returning id into v_deal_alpha_vierge;

  -- Beta a sa propre opération : sans elle, les contrôles inverses ne
  -- prouveraient rien.
  insert into public.deals (org_id, name, objectif, created_by)
  values (v_org_beta, 'Ma propre levée', 'levee', v_user_beta)
  returning id into v_deal_beta;

  perform set_config('rlstest.org_alpha', v_org_alpha::text, true);
  perform set_config('rlstest.org_beta', v_org_beta::text, true);
  perform set_config('rlstest.deal_alpha', v_deal_alpha::text, true);
  perform set_config('rlstest.deal_alpha_vierge', v_deal_alpha_vierge::text, true);
  perform set_config('rlstest.deal_beta', v_deal_beta::text, true);
  perform set_config('rlstest.folder_alpha', v_folder::text, true);
  perform set_config('rlstest.user_beta', v_user_beta::text, true);
end $$;

-- ── ON DEVIENT BETA ────────────────────────────────────────────────────────
-- `role authenticated` + les claims JWT : exactement ce que PostgREST met en
-- place pour une requête de l'application.
do $$
begin
  perform set_config(
    'request.jwt.claims',
    json_build_object(
      'sub', current_setting('rlstest.user_beta'),
      'role', 'authenticated',
      'email', 'test-beta@rls.invalid'
    )::text,
    true
  );
end $$;

set local role authenticated;

-- ── CE QUE BETA NE DOIT PAS VOIR ───────────────────────────────────────────
insert into rlstest_resultats
select 1, 'opérations d''Alpha', count(*)::text, '0',
  case when count(*) = 0 then 'OK' else 'ÉCHEC — fuite entre organisations' end
from public.deals where org_id = current_setting('rlstest.org_alpha')::uuid;

insert into rlstest_resultats
select 2, 'dossiers d''Alpha', count(*)::text, '0',
  case when count(*) = 0 then 'OK' else 'ÉCHEC — fuite entre organisations' end
from public.folders where deal_id = current_setting('rlstest.deal_alpha')::uuid;

-- Le NOM d'un document est déjà une fuite : « Term sheet Sequoia.pdf » dit
-- l'essentiel sans qu'on ouvre le fichier.
insert into rlstest_resultats
select 3, 'documents d''Alpha (fuite par le titre)', count(*)::text, '0',
  case when count(*) = 0 then 'OK' else 'ÉCHEC — fuite entre organisations' end
from public.documents where deal_id = current_setting('rlstest.deal_alpha')::uuid;

-- Le montant recherché et la valorisation d'une entreprise sont parmi ses
-- informations les plus sensibles.
insert into rlstest_resultats
select 4, 'levées d''Alpha (montants)', count(*)::text, '0',
  case when count(*) = 0 then 'OK' else 'ÉCHEC — fuite entre organisations' end
from public.raises where deal_id = current_setting('rlstest.deal_alpha')::uuid;

insert into rlstest_resultats
select 5, 'exigences d''Alpha', count(*)::text, '0',
  case when count(*) = 0 then 'OK' else 'ÉCHEC — fuite entre organisations' end
from public.checklist_items where deal_id = current_setting('rlstest.deal_alpha')::uuid;

insert into rlstest_resultats
select 6, 'journal d''audit d''Alpha', count(*)::text, '0',
  case when count(*) = 0 then 'OK' else 'ÉCHEC — fuite entre organisations' end
from public.audit_log where org_id = current_setting('rlstest.org_alpha')::uuid;

insert into rlstest_resultats
select 7, 'organisation Alpha elle-même', count(*)::text, '0',
  case when count(*) = 0 then 'OK' else 'ÉCHEC — fuite entre organisations' end
from public.organizations where id = current_setting('rlstest.org_alpha')::uuid;

-- ── CE QUE BETA NE DOIT PAS ÉCRIRE ─────────────────────────────────────────
-- Les RPC sont `security definer` : elles traversent la RLS. Leur refus doit
-- donc venir de leur propre code, et c'est ce qu'on éprouve ici.
--
-- Chaque tentative vit dans son bloc `exception` : sans lui, le premier échec
-- avorterait la transaction et les contrôles suivants ne tourneraient jamais.
--
-- ⚠️ LE MOTIF DU REFUS EST VÉRIFIÉ, PAS SEULEMENT LE REFUS.
-- Une RPC peut refuser pour une raison qui n'a rien à voir avec l'accès —
-- `create_raise` refuse aussi quand une levée est déjà en cours. Se contenter
-- de « ça a échoué, donc c'est protégé » rendrait le contrôle vert le jour où
-- l'isolation serait cassée. Un refus d'accès et lui seul vaut OK.
do $$
declare
  v_msg text;
begin
  begin
    -- Sur l'opération SANS levée : le seul refus possible est celui de l'accès.
    perform public.create_raise(current_setting('rlstest.deal_alpha_vierge')::uuid, 'Levée pirate');
    insert into rlstest_resultats values
      (8, 'ouvrir une levée chez Alpha', 'acceptée', 'refus d''accès',
       'ÉCHEC — écriture possible chez une autre organisation');
  exception when others then
    get stacked diagnostics v_msg = message_text;
    insert into rlstest_resultats values
      (8, 'ouvrir une levée chez Alpha', 'refusée (' || v_msg || ')', 'refus d''accès',
       case when v_msg ilike '%refus%' then 'OK'
            else 'ÉCHEC — refusée, mais pas pour un motif d''accès' end);
  end;

  begin
    perform public.save_raise(
      current_setting('rlstest.deal_alpha')::uuid, 1, null, null, null, null, null, null, null, null
    );
    insert into rlstest_resultats values
      (9, 'modifier la levée d''Alpha', 'acceptée', 'refus d''accès',
       'ÉCHEC — écriture possible chez une autre organisation');
  exception when others then
    get stacked diagnostics v_msg = message_text;
    insert into rlstest_resultats values
      (9, 'modifier la levée d''Alpha', 'refusée (' || v_msg || ')', 'refus d''accès',
       case when v_msg ilike '%refus%' then 'OK'
            else 'ÉCHEC — refusée, mais pas pour un motif d''accès' end);
  end;

  begin
    perform public.create_folder(
      current_setting('rlstest.deal_alpha')::uuid, null, 'Dossier pirate'
    );
    insert into rlstest_resultats values
      (10, 'créer un dossier chez Alpha', 'acceptée', 'refus d''accès',
       'ÉCHEC — écriture possible chez une autre organisation');
  exception when others then
    get stacked diagnostics v_msg = message_text;
    insert into rlstest_resultats values
      (10, 'créer un dossier chez Alpha', 'refusée (' || v_msg || ')', 'refus d''accès',
       case when v_msg ilike '%refus%' then 'OK'
            else 'ÉCHEC — refusée, mais pas pour un motif d''accès' end);
  end;

  -- L'écriture directe, sans passer par une RPC : c'est la RLS seule qui
  -- répond ici. Un `update` bloqué ne lève pas d'erreur — il ne touche
  -- simplement aucune ligne.
  begin
    update public.deals set name = 'Renommée par Beta'
    where id = current_setting('rlstest.deal_alpha')::uuid;

    insert into rlstest_resultats
    select 11, 'renommer l''opération d''Alpha en direct',
      case when count(*) = 0 then 'aucune ligne touchée' else 'ligne modifiée' end,
      'aucune ligne touchée',
      case when count(*) = 0 then 'OK' else 'ÉCHEC — la RLS d''écriture ne protège pas' end
    from public.deals
    where id = current_setting('rlstest.deal_alpha')::uuid
      and name = 'Renommée par Beta';
  exception when others then
    get stacked diagnostics v_msg = message_text;
    insert into rlstest_resultats values
      (11, 'renommer l''opération d''Alpha en direct',
       'refusée (' || v_msg || ')', 'aucune ligne touchée', 'OK');
  end;
end $$;

-- ── LES CONTRÔLES INVERSES ─────────────────────────────────────────────────
-- Aussi importants que les autres : une RLS qui bloque TOUT passerait tous
-- les contrôles précédents tout en rendant le produit inutilisable.
insert into rlstest_resultats
select 12, 'sa propre opération (doit être visible)', count(*)::text, '1',
  case when count(*) = 1 then 'OK' else 'ÉCHEC — Beta ne voit plus ses propres données' end
from public.deals where id = current_setting('rlstest.deal_beta')::uuid;

insert into rlstest_resultats
select 13, 'sa propre organisation (doit être visible)', count(*)::text, '1',
  case when count(*) = 1 then 'OK' else 'ÉCHEC — Beta ne voit plus son organisation' end
from public.organizations where id = current_setting('rlstest.org_beta')::uuid;

do $$
declare
  v_msg text;
begin
  begin
    perform public.create_raise(current_setting('rlstest.deal_beta')::uuid, 'Ma levée');
    insert into rlstest_resultats values
      (14, 'ouvrir une levée chez soi (doit être permis)', 'acceptée', 'acceptée', 'OK');
  exception when others then
    get stacked diagnostics v_msg = message_text;
    insert into rlstest_resultats values
      (14, 'ouvrir une levée chez soi (doit être permis)',
       'refusée (' || v_msg || ')', 'acceptée',
       'ÉCHEC — Beta ne peut plus travailler sur sa propre opération');
  end;
end $$;

-- Un seul `select` final : l'éditeur SQL de Supabase n'affiche que le dernier
-- jeu de résultats d'un script.
select controle, mesure, attendu, verdict
from rlstest_resultats
order by ord;

rollback;
