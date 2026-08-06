-- Le logo d'un programme — le premier fichier image du produit.
--
-- L'écran 00a du tunnel programme le demande depuis toujours : « Logo —
-- facultatif, utilisé sur vos dealrooms. Déposez un fichier PNG ou SVG, sinon
-- nous utilisons vos initiales. » Aucun des quatre étages n'existait : ni le
-- champ, ni l'action, ni le paramètre, ni la colonne. C'est le premier.
--
-- OÙ IL VIT. `organizations.branding` est un `jsonb` posé le 16 juillet par la
-- migration `socle`, jamais lu ni écrit depuis. C'est exactement son objet, et
-- l'écran 20 des Dealrooms confirme la portée : « Logo et couleur repris par
-- défaut » — le branding de la Dealroom HÉRITE de celui du programme. Une
-- colonne dédiée sur `organizations` aurait dupliqué ce que `branding` est déjà.
--
-- POURQUOI LE BUCKET EST PUBLIC. La question était ouverte, et l'arbitrage
-- d'ADR-005 du 6 août l'a fermée : la Dealroom s'ouvre SANS COMPTE. Signer les
-- URL des images d'une page que n'importe qui peut ouvrir ne protège rien — ça
-- ajoute un mécanisme et une expiration à gérer pour une confidentialité que la
-- page elle-même n'a pas. Ce qui protège ici, c'est le chemin : la clé porte
-- l'identifiant de l'organisation, un UUID, plus un suffixe aléatoire. Rien ne
-- s'énumère, et remplacer un logo ne se heurte à aucun cache.
--
-- ⚠️ Ce raisonnement vaut pour les images de MARQUE — logo, bannière, logos
-- partenaires. Il ne vaut PAS pour les pièces d'un dossier, qui restent dans le
-- bucket `documents`, privé, servi par URL signée. Deux buckets, deux régimes,
-- et la frontière est la confidentialité de ce qu'ils portent.
--
-- L'ÉCRITURE PASSE PAR UNE RPC AUDITÉE, comme tout le reste : le téléversement
-- se fait côté serveur avec le client admin, puis `set_org_logo` enregistre la
-- clé. Aucune politique d'écriture sur `storage.objects` n'est donc nécessaire,
-- et le client ne touche jamais au stockage.
--
-- Ré-exécutable.

-- ---------------------------------------------------------------------------
-- Le bucket des images de marque
-- ---------------------------------------------------------------------------
-- Les limites sont posées ICI plutôt que dans l'application : un garde-fou que
-- le code ne peut pas oublier. 2 Mo suffisent largement à un logo, et les
-- quatre types couvrent ce que la maquette annonce (PNG, SVG) plus ce qu'un
-- fondateur déposera de toute façon (JPEG, WEBP).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'branding', 'branding', true, 2097152,
  array['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set public            = excluded.public,
      file_size_limit   = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Enregistrer la clé du logo
-- ---------------------------------------------------------------------------
-- Une clé vide EFFACE le logo plutôt que d'écrire une chaîne vide : l'absence
-- se lit alors comme une absence, et l'écran retombe sur les initiales sans
-- avoir à distinguer « pas de logo » de « logo vide ».
create or replace function public.set_org_logo(p_key text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_org  uuid;
  v_vide boolean := coalesce(trim(p_key), '') = '';
begin
  if auth.uid() is null then
    raise exception 'non authentifié';
  end if;

  -- Même sélection que `save_programme` : la première organisation où
  -- l'appelant est propriétaire ou administrateur. Un lecteur ou un
  -- collaborateur ne change pas la marque.
  select m.org_id into v_org
  from public.memberships m
  where m.user_id = auth.uid() and m.role in ('owner', 'admin')
  order by m.created_at
  limit 1;

  if v_org is null then
    raise exception 'aucune organisation';
  end if;

  update public.organizations
  set branding = case
        when v_vide then branding - 'logo'
        else jsonb_set(branding, '{logo}', to_jsonb(trim(p_key)), true)
      end
  where id = v_org;

  perform public.write_audit(
    v_org,
    case when v_vide then 'org.logo_removed' else 'org.logo_updated' end,
    'organization', v_org::text,
    jsonb_build_object('cle', nullif(trim(p_key), ''))
  );
end;
$$;

grant execute on function public.set_org_logo(text) to authenticated;
