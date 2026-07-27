-- ═══════════════════════════════════════════════════════════════════════════
-- RÈGLE §0.1 — un programme voit l'ÉTAT d'une startup de sa cohorte, jamais
-- ses documents ni ses deals.
--
-- « Toute PR qui l'entame est refusée d'office. » Une règle de cette force ne
-- peut pas reposer sur la relecture : elle tient à des politiques RLS, et une
-- politique se casse en modifiant une AUTRE table. Ce fichier est donc
-- exécutable et rejouable après chaque migration.
--
--   COMMENT LE LANCER — le coller entier dans l'éditeur SQL de Supabase.
--   Il s'exécute dans une transaction annulée à la fin : il n'écrit RIEN de
--   durable, ni utilisateur, ni organisation, ni document.
--
--   CE QU'IL AFFICHE — une ligne par contrôle, avec « OK » ou « ÉCHEC ».
--   Un seul ÉCHEC signifie que la §0.1 est entamée.
--
-- POURQUOI DES FIXTURES PLUTÔT QUE LES DONNÉES RÉELLES. Tester sur la base
-- vivante ne prouve rien de stable : le jour où aucune cohorte n'a de startup
-- avec un document, tous les contrôles passent au vert sans rien vérifier. Le
-- scénario est donc construit ici, complet, à chaque exécution.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- On travaille en superutilisateur pour poser le décor ; l'impersonation
-- vient plus loin.
set local role postgres;

do $$
declare
  v_prog_org  uuid;
  v_start_org uuid;
  v_prog_user uuid := gen_random_uuid();
  v_fond_user uuid := gen_random_uuid();
  v_cohorte   uuid;
  v_deal      uuid;
  v_dossier   uuid;
  v_doc       uuid;
begin
  -- Deux comptes : un directeur de programme, une fondatrice.
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                          email_confirmed_at, created_at, updated_at)
  values
    (v_prog_user, '00000000-0000-0000-0000-000000000000', 'authenticated',
     'authenticated', 'test-programme@rls.invalid', '', now(), now(), now()),
    (v_fond_user, '00000000-0000-0000-0000-000000000000', 'authenticated',
     'authenticated', 'test-fondatrice@rls.invalid', '', now(), now(), now());

  -- ⚠️ `on conflict` OBLIGATOIRE, et non par prudence : le déclencheur
  -- `on_auth_user_created` a DÉJÀ créé ces deux profils au moment de l'insert
  -- ci-dessus. Un `insert` nu échoue en 23505 sur `profiles_pkey`.
  --
  -- On écrit quand même, plutôt que de se reposer sur le déclencheur : celui-ci
  -- lit `full_name` dans `raw_user_meta_data`, que ce scénario ne remplit pas.
  -- Les fixtures resteraient anonymes, et un échec deviendrait illisible.
  insert into public.profiles (id, email, full_name)
  values (v_prog_user, 'test-programme@rls.invalid', 'Test Programme'),
         (v_fond_user, 'test-fondatrice@rls.invalid', 'Test Fondatrice')
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name;

  insert into public.organizations (name, slug)
  values ('Programme de test RLS', 'rls-test-programme-' || substr(v_prog_user::text, 1, 8))
  returning id into v_prog_org;

  insert into public.organizations (name, slug)
  values ('Startup de test RLS', 'rls-test-startup-' || substr(v_fond_user::text, 1, 8))
  returning id into v_start_org;

  insert into public.memberships (org_id, user_id, role)
  values (v_prog_org, v_prog_user, 'owner'),
         (v_start_org, v_fond_user, 'owner');

  -- La startup est BIEN dans la cohorte du programme : c'est le cas qui
  -- compte. Tester avec une startup étrangère ne prouverait rien — n'importe
  -- quelle politique la refuserait.
  insert into public.cohorts (org_id, name)
  values (v_prog_org, 'Saison de test')
  returning id into v_cohorte;

  insert into public.cohort_members (cohort_id, startup_org_id)
  values (v_cohorte, v_start_org);

  -- Et elle a une data room garnie.
  insert into public.deals (org_id, name, created_by)
  values (v_start_org, 'Salle confidentielle', v_fond_user)
  returning id into v_deal;

  insert into public.folders (deal_id, name)
  values (v_deal, 'Propriété intellectuelle')
  returning id into v_dossier;

  insert into public.documents (deal_id, folder_id, name, status, created_by)
  values (v_deal, v_dossier, 'Brevet-confidentiel.pdf', 'ready', v_fond_user)
  returning id into v_doc;

  -- Transmis aux contrôles par un réglage de session : `do` n'a pas de
  -- valeur de retour, et une table temporaire survivrait mal au changement de
  -- rôle qui suit.
  perform set_config('rlstest.prog_user', v_prog_user::text, true);
  perform set_config('rlstest.start_org', v_start_org::text, true);
  perform set_config('rlstest.deal',      v_deal::text,      true);
  perform set_config('rlstest.cohorte',   v_cohorte::text,   true);
end $$;

-- ── ON DEVIENT LE PROGRAMME ────────────────────────────────────────────────
-- `role authenticated` + les claims JWT : exactement ce que PostgREST met en
-- place pour une requête de l'application. `auth.uid()` lit `request.jwt.claims`.
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', current_setting('rlstest.prog_user'),
    'role', 'authenticated',
    'email', 'test-programme@rls.invalid'
  )::text,
  true
);
set local role authenticated;

-- ── LES CONTRÔLES ──────────────────────────────────────────────────────────
-- Chacun compte des lignes VISIBLES sous RLS. Zéro est la réponse attendue
-- partout où la §0.1 s'applique.

select
  'documents de la startup' as controle,
  count(*)                  as vues,
  0                         as attendu,
  case when count(*) = 0 then 'OK' else 'ÉCHEC — §0.1 entamée' end as verdict
from public.documents
where deal_id = current_setting('rlstest.deal')::uuid

union all
select
  'versions de documents', count(*), 0,
  case when count(*) = 0 then 'OK' else 'ÉCHEC — §0.1 entamée' end
from public.document_versions v
join public.documents d on d.id = v.document_id
where d.deal_id = current_setting('rlstest.deal')::uuid

union all
select
  'dossiers de la data room', count(*), 0,
  case when count(*) = 0 then 'OK' else 'ÉCHEC — §0.1 entamée' end
from public.folders
where deal_id = current_setting('rlstest.deal')::uuid

union all
select
  'deals de la startup', count(*), 0,
  case when count(*) = 0 then 'OK' else 'ÉCHEC — §0.1 entamée' end
from public.deals
where org_id = current_setting('rlstest.start_org')::uuid

union all
-- Le NOM d'un document est déjà une fuite : « Term sheet Sequoia.pdf » dit
-- l'essentiel sans qu'on ouvre le fichier. Contrôlé séparément parce qu'une
-- politique peut très bien masquer le contenu et laisser passer le titre.
select
  'noms de documents (fuite par le titre)', count(*), 0,
  case when count(*) = 0 then 'OK' else 'ÉCHEC — §0.1 entamée' end
from public.documents
where deal_id = current_setting('rlstest.deal')::uuid
  and name is not null

union all
-- ── LE CONTRÔLE INVERSE ────────────────────────────────────────────────────
-- Aussi important que les autres : une RLS qui bloque TOUT passerait les cinq
-- contrôles ci-dessus tout en rendant le produit inutilisable. Le programme
-- DOIT voir sa cohorte et l'appartenance de la startup.
select
  'sa propre cohorte (doit être visible)', count(*), 1,
  case when count(*) = 1 then 'OK' else 'ÉCHEC — le programme ne voit plus sa cohorte' end
from public.cohorts
where id = current_setting('rlstest.cohorte')::uuid

union all
select
  'appartenance à la cohorte (doit être visible)', count(*), 1,
  case when count(*) = 1 then 'OK' else 'ÉCHEC — le programme ne voit plus ses membres' end
from public.cohort_members
where cohort_id = current_setting('rlstest.cohorte')::uuid;

-- L'état de préparation transite par `sae_portfolio()`, une fonction qui
-- ÉNUMÈRE ses colonnes : ce qui n'y figure pas ne peut pas fuiter. On vérifie
-- qu'aucune colonne de document ne s'y est glissée depuis.
select
  'colonnes de sae_portfolio()' as controle,
  coalesce(string_agg(p.name, ', ' order by p.ordinality), '—') as colonnes,
  case
    -- `count(*) = 0` d'abord : sans lui, une fonction DISPARUE donnerait
    -- `bool_or` à null, donc « OK ». Un contrôle qui passe au vert quand son
    -- objet n'existe plus est pire que pas de contrôle.
    when count(*) = 0
      then 'ÉCHEC — sae_portfolio() est introuvable'
    when bool_or(p.name ~* '(document|file|storage|path|version|nom_fichier)')
      then 'ÉCHEC — une colonne de document est exposée'
    else 'OK'
  end as verdict
from unnest(
  (select proargnames from pg_proc
   where proname = 'sae_portfolio' and pronamespace = 'public'::regnamespace
   limit 1)
) with ordinality as p(name, ordinality);

rollback;
