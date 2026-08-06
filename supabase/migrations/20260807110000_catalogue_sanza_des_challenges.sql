-- Le premier modèle Sanza — et un seul, faute de contenu pour les autres.
--
-- ⚠️ CE QUE CETTE MIGRATION NE FAIT PAS, ET POURQUOI. L'écran 10 annonce
-- « 14 modèles » et sa barre de catégories les compte. Or la maquette n'en
-- NOMME que trois, et un seul porte de vrais critères — les deux autres
-- affichent « Critère 1 », « Critère 2 »… Le contenu des treize autres
-- n'existe dans aucun document du paquet.
--
-- Semer trois modèles dont deux inutilisables serait pire que d'en semer un :
-- `create_challenge` refuse une liste vide, donc un programme qui choisirait
-- « Structurer votre levée Seed » se heurterait à une erreur sans comprendre.
-- Et inventer treize modèles serait inventer le produit.
--
-- Le catalogue est donc un LIVRABLE DU FONDATEUR. La bibliothèque affiche ce
-- que la base contient : un modèle aujourd'hui, quatorze le jour où ils
-- seront écrits, sans changer une ligne de code.
--
-- ⚠️ « MONTANT RECHERCHÉ RENSEIGNÉ » EST SEMÉ EN MANUEL, pas en connecté.
-- La maquette le marque « connecté », mais il n'y a rien à quoi l'accrocher :
-- ce n'est pas une pièce du catalogue, c'est un champ de la levée
-- (`raises.montant_cible`), et `startup_requirement_facts` ne lit que les
-- exigences. Le laisser en connecté aurait produit un critère qui ne se
-- valide JAMAIS — l'entreprise l'attendrait indéfiniment. C'est la limite
-- qu'ADR-003 demande d'écrire dans l'écran plutôt que de découvrir en
-- production.
--
-- Ré-exécutable : l'identifiant est fixe, et les critères sont replacés.

insert into public.challenge_templates
  (id, org_id, title, category, duration, description)
values (
  '9a3f0000-0000-4000-8000-000000000001', null,
  'Préparer le dossier investisseur',
  'Levée de fonds',
  '2 semaines',
  'Une version claire et investissable de l''entreprise, prête à être partagée : pitch deck, états financiers, cap table et montant recherché. Le modèle le plus utilisé avant un Demo Day ou une mise en relation.'
)
on conflict (id) do update
  set title       = excluded.title,
      category    = excluded.category,
      duration    = excluded.duration,
      description = excluded.description;

-- Les critères sont replacés en bloc : c'est la seule façon d'être
-- ré-exécutable sans accumuler les doublons ni dépendre d'un identifiant.
delete from public.challenge_template_criteria
where template_id = '9a3f0000-0000-4000-8000-000000000001';

insert into public.challenge_template_criteria
  (template_id, label, source, catalog_key, required, structural, position)
values
  ('9a3f0000-0000-4000-8000-000000000001',
   'Pitch deck finalisé', 'manuel', null, true, false, 0),
  -- STRUCTUREL : un programme ne peut pas le retirer de ce modèle Sanza.
  -- `create_challenge` refuse la création si la liste l'omet.
  ('9a3f0000-0000-4000-8000-000000000001',
   'États financiers disponibles', 'connecte', 'etats_financiers', true, true, 1),
  ('9a3f0000-0000-4000-8000-000000000001',
   'Cap table à jour', 'connecte', 'registre_actionnaires', true, false, 2),
  -- MANUEL, et non connecté — voir l'en-tête.
  ('9a3f0000-0000-4000-8000-000000000001',
   'Montant recherché renseigné', 'manuel', null, true, false, 3),
  ('9a3f0000-0000-4000-8000-000000000001',
   'One-pager rédigé', 'manuel', null, false, false, 4);

-- ---------------------------------------------------------------------------
-- Lire la bibliothèque — écrans 10 et 16
-- ---------------------------------------------------------------------------
-- Les modèles Sanza (`org_id` NULL) et ceux du programme, dans la même
-- lecture : les deux écrans montrent les mêmes cartes, et `sanza` dit lequel
-- est lequel. Deux fonctions auraient dupliqué la règle.
create or replace function public.challenge_library()
returns table (
  id          uuid,
  sanza       boolean,
  title       text,
  category    text,
  duration    text,
  description text,
  criteres    bigint,
  connectes   bigint,
  utilisations bigint
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select t.id,
         t.org_id is null,
         t.title, t.category, t.duration, t.description,
         (select count(*) from public.challenge_template_criteria c
           where c.template_id = t.id),
         (select count(*) from public.challenge_template_criteria c
           where c.template_id = t.id and c.source = 'connecte'),
         -- « Déjà utilisé dans 2 de vos cohortes » — écran 10. On compte les
         -- COHORTES distinctes, pas les Challenges : deux Challenges créés
         -- dans la même cohorte n'en font pas deux.
         (select count(distinct ch.cohort_id) from public.challenges ch
           where ch.template_id = t.id and public.is_org_member(ch.org_id))
  from public.challenge_templates t
  where t.archived_at is null
    and (t.org_id is null or public.is_org_member(t.org_id))
  order by t.org_id is not null, t.category, t.title;
$$;

grant execute on function public.challenge_library() to authenticated;

-- Les critères d'un modèle — l'aperçu de l'écran 10, et le point de départ
-- de l'écran 12.
create or replace function public.challenge_template_detail(p_template uuid)
returns table (
  label       text,
  source      text,
  catalog_key text,
  required    boolean,
  structural  boolean,
  rang        int
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select c.label, c.source::text, c.catalog_key, c.required, c.structural, c.position
  from public.challenge_template_criteria c
  join public.challenge_templates t on t.id = c.template_id
  where c.template_id = p_template
    and (t.org_id is null or public.is_org_member(t.org_id))
  order by c.position;
$$;

grant execute on function public.challenge_template_detail(uuid) to authenticated;
