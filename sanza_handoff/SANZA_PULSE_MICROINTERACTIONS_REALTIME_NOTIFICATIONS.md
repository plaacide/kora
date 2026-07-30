# SANZA PULSE — Micro-interactions, activité temps réel et notifications

**Document d’implémentation destiné à Claude Code**  
**Version : 1.0 — 29 juillet 2026**

---

## 1. Objectif

Créer une couche d’expérience transversale appelée **Sanza Pulse** afin que l’application paraisse vivante, réactive et utile, sans perdre son positionnement premium, institutionnel et sécurisé.

Sanza Pulse doit permettre à l’utilisateur de ressentir en permanence que :

1. le système réagit à ses actions ;
2. son opération de financement progresse ;
3. les changements importants sont visibles ;
4. les prochaines actions sont claires ;
5. les événements stratégiques sont signalés en temps réel.

Le but n’est pas d’ajouter des animations décoratives. Chaque animation ou notification doit au moins : confirmer une action, montrer une progression, attirer l’attention sur un changement, prévenir une erreur, guider l’utilisateur ou rendre visible un événement distant.

---

# 2. Principes de conception

Sanza doit rester : sobre, crédible, institutionnel, fluide, précis, rassurant et moderne.

Éviter :

- les confettis fréquents ;
- les rebonds excessifs ;
- les animations longues ;
- les effets lumineux permanents ;
- les sons activés par défaut ;
- les mouvements sans signification ;
- les transitions différentes dans chaque module.

Une animation ne doit jamais ralentir une action métier. Elle accompagne l’action, elle ne la bloque pas.

Respecter obligatoirement :

```css
@media (prefers-reduced-motion: reduce) {
  /* réduire ou supprimer les animations non essentielles */
}
```

---

# 3. Périmètre de Sanza Pulse

Sanza Pulse couvre :

- micro-interactions ;
- animations de progression ;
- toasts ;
- centre de notifications ;
- activité temps réel ;
- présence collaborative ;
- timeline d’opération ;
- recommandations contextuelles ;
- badges et compteurs ;
- préférences de notification ;
- événements produits ;
- diffusion avec Supabase Realtime.

---

# 4. Architecture UX

## 4.1 Feedback immédiat

Réactions visibles après une action locale :

- bouton pressé ;
- enregistrement en cours ;
- fichier importé ;
- commentaire ajouté ;
- accès révoqué ;
- document validé ;
- statut modifié.

## 4.2 Progression

Éléments montrant l’avancement :

- score de préparation ;
- checklist ;
- onboarding ;
- progression d’une levée ;
- complétion d’une data room ;
- diligence ;
- tâches.

## 4.3 Temps réel

Événements provenant d’autres personnes ou systèmes :

- investisseur connecté ;
- NDA signé ;
- document consulté ;
- question ajoutée ;
- membre d’équipe actif ;
- changement de statut ;
- nouvelle demande.

## 4.4 Intelligence contextuelle

Transformer un événement en action recommandée :

- relancer un investisseur ;
- compléter une pièce manquante ;
- mettre à jour un document consulté ;
- affecter une tâche ;
- préparer une réponse ;
- vérifier une échéance.

---

# 5. Design tokens de mouvement

Créer :

```txt
/v2/config/motion-tokens.ts
```

Exemple :

```ts
export const motion = {
  duration: {
    instant: 100,
    fast: 150,
    standard: 220,
    panel: 280,
    emphasis: 360,
  },
  easing: {
    standard: [0.2, 0, 0, 1],
    enter: [0, 0, 0.2, 1],
    exit: [0.4, 0, 1, 1],
  },
  distance: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 20,
  },
}
```

| Usage | Durée |
|---|---:|
| Pression d’un bouton | 100–140 ms |
| Survol et changement léger | 150–180 ms |
| Apparition d’un toast | 180–220 ms |
| Ouverture d’un panneau | 220–280 ms |
| Changement important d’état | 300–400 ms |

Ne pas définir les durées directement dans chaque composant.

---

# 6. Bibliothèque d’animation

Utiliser la bibliothèque déjà présente dans le projet.

Si aucune bibliothèque n’est installée, privilégier :

- **Motion / Framer Motion** pour les transitions React ;
- CSS natif pour les interactions simples ;
- une seule bibliothèque d’animation.

Créer des composants réutilisables :

```txt
/v2/components/motion/fade-in.tsx
/v2/components/motion/slide-panel.tsx
/v2/components/motion/animated-number.tsx
/v2/components/motion/progress-transition.tsx
/v2/components/motion/stagger-list.tsx
/v2/components/motion/presence-transition.tsx
```

---

# 7. Micro-interactions prioritaires

## 7.1 Boutons

Chaque bouton doit gérer :

- normal ;
- survol ;
- pression ;
- chargement ;
- succès ;
- erreur ;
- désactivé.

Exemple :

```txt
Envoyer l’invitation
→ Envoi…
→ Invitation envoyée
```

## 7.2 Sauvegarde automatique

Afficher près du contenu concerné :

```txt
Sauvegarde…
Enregistré
```

Ne pas afficher un toast à chaque sauvegarde automatique.

## 7.3 Checklist

Lorsqu’une exigence est complétée :

- coche animée ;
- changement visuel du texte ;
- progression globale mise à jour ;
- message expliquant la conséquence lorsque pertinent.

## 7.4 Pipeline investisseurs

Lors d’un glisser-déposer :

- la carte suit naturellement le curseur ;
- la colonne cible réagit ;
- la mise à jour est optimiste ;
- une erreur remet la carte à sa place ;
- le changement génère un événement d’activité.

## 7.5 Compteurs

Animer uniquement les valeurs réellement modifiées. Ne pas relancer les animations à chaque chargement de page.

---

# 8. Importation de documents

## 8.1 États

```txt
queued
uploading
uploaded
processing
classifying
ready
failed
```

## 8.2 Séquence

1. apparition immédiate du fichier ;
2. progression du téléversement ;
3. « Analyse du document » ;
4. « Classement » ;
5. emplacement proposé ;
6. statut « Prêt » ;
7. mise à jour du score lorsque le document complète une exigence.

Exemple :

```txt
États financiers 2025 ajoutés
Classés dans : Finance > États financiers
Votre préparation financière passe de 60 % à 75 %.
```

## 8.3 Erreurs

Gérer explicitement :

- type non accepté ;
- fichier trop volumineux ;
- doublon ;
- échec réseau ;
- document illisible ;
- permission insuffisante.

Toujours proposer une action de résolution.

---

# 9. Tableau de bord vivant

Le tableau de bord doit répondre à quatre questions.

## 9.1 Où en suis-je ?

Afficher :

- niveau de préparation ;
- documents manquants ;
- investisseurs actifs ;
- tâches en retard ;
- accès expirants.

## 9.2 Qu’est-ce qui a changé ?

Créer un bloc :

```txt
Depuis votre dernière visite
```

Exemples :

- Awa Capital a consulté vos états financiers ;
- votre score est passé de 68 % à 72 % ;
- trois documents ont été ajoutés ;
- deux accès expirent vendredi.

## 9.3 Que dois-je faire maintenant ?

Créer une carte :

```txt
Prochaine meilleure action
```

Exemple :

```txt
Complétez vos prévisions financières pour atteindre 80 % de préparation.
```

## 9.4 Qu’est-ce qui progresse ?

Utiliser des transitions discrètes sur : score, étapes, documents validés, diligence et pipeline.

---

# 10. Centre de notifications

Créer un centre global accessible depuis la barre principale.

## 10.1 Catégories

```txt
Tout
Investisseurs
Documents
Équipe
Sécurité
Facturation
```

## 10.2 Niveaux

### Information

Toast temporaire : document ajouté, invitation envoyée, commentaire enregistré.

### Action requise

Notification persistante : document rejeté, demande investisseur, accès expirant, tâche assignée, limite atteinte.

### Événement stratégique

Notification mise en avant : investisseur revenu plusieurs fois, diligence démarrée, NDA signé, échéance proche, term sheet reçue, data room prête.

## 10.3 Contenu

Une notification doit contenir :

- icône ;
- titre ;
- description ;
- date relative ;
- acteur ;
- opération concernée ;
- lien profond ;
- statut lu/non lu ;
- priorité ;
- action principale éventuelle.

---

# 11. Toasts

Créer :

```txt
/v2/components/notifications/toast-provider.tsx
```

```ts
type ToastVariant =
  | "success"
  | "info"
  | "warning"
  | "error"
  | "loading"
```

Règles :

- maximum trois toasts simultanés ;
- durée limitée ;
- erreurs importantes persistantes ;
- ne pas dupliquer une information déjà visible ;
- ne pas utiliser un toast pour une information stratégique durable.

---

# 12. Timeline d’activité

Chaque opération doit disposer d’un fil d’activité.

Route suggérée :

```txt
/v2/operations/[operationId]/activity
```

Types :

- document ajouté, remplacé, approuvé, consulté ou téléchargé ;
- invitation envoyée ;
- NDA signé ;
- accès révoqué ;
- investisseur déplacé ;
- question ajoutée ;
- tâche assignée ;
- réunion enregistrée ;
- statut modifié ;
- commentaire ajouté.

Grouper par aujourd’hui, hier, cette semaine et dates plus anciennes.

Filtres : tout, investisseurs, documents, équipe, sécurité, système.

---

# 13. Présence temps réel

Afficher discrètement :

- visiteurs actifs ;
- membres d’équipe présents ;
- document actuellement consulté ;
- modification en cours ;
- dernière activité.

Prévoir les modes :

- présence précise ;
- présence anonymisée ;
- présence désactivée ;
- activité agrégée.

Exemple sécurisé :

```txt
2 visiteurs actifs
```

Ne pas exposer les identités si les permissions ne l’autorisent pas.

---

# 14. Table `activity_events`

```sql
create table activity_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  operation_id uuid,
  actor_user_id uuid,
  actor_type text not null,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  visibility text not null default 'workspace',
  priority text not null default 'normal',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

`actor_type` :

```txt
user
visitor
system
integration
```

`visibility` :

```txt
private
team
workspace
operation
external
admin
```

`priority` :

```txt
low
normal
high
critical
```

---

# 15. Catalogue initial d’événements

## Documents

```txt
document.upload_started
document.uploaded
document.processing_started
document.classified
document.ready
document.failed
document.viewed
document.downloaded
document.version_created
document.approved
document.rejected
document.deleted
```

## Accès

```txt
access.invited
access.opened
access.verified
access.granted
access.revoked
access.expiring
access.expired
```

## NDA

```txt
nda.sent
nda.opened
nda.signed
nda.declined
```

## Investisseurs

```txt
investor.created
investor.invited
investor.stage_changed
investor.returned
investor.high_engagement_detected
investor.inactive_detected
```

## Diligence

```txt
question.created
question.answered
question.resolved
diligence.started
diligence.status_changed
diligence.completed
```

## Équipe

```txt
task.created
task.assigned
task.completed
task.overdue
comment.created
mention.created
```

## Opération

```txt
operation.created
operation.updated
operation.stage_changed
operation.ready_to_share
operation.closed
```

## Sécurité

```txt
security.suspicious_access
security.download_blocked
security.permission_changed
security.session_revoked
```

---

# 16. Table `notifications`

```sql
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  workspace_id uuid not null,
  activity_event_id uuid references activity_events(id) on delete set null,
  category text not null,
  title text not null,
  body text,
  priority text not null default 'normal',
  action_url text,
  action_label text,
  read_at timestamptz,
  archived_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
```

Index :

```sql
create index notifications_user_unread_idx
on notifications(user_id, read_at, created_at desc);

create index notifications_workspace_idx
on notifications(workspace_id, created_at desc);
```

---

# 17. Préférences de notification

```sql
create table notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  workspace_id uuid not null,
  event_type text not null,
  in_app_enabled boolean not null default true,
  email_mode text not null default 'digest',
  push_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, workspace_id, event_type)
);
```

`email_mode` :

```txt
off
immediate
daily_digest
weekly_digest
```

---

# 18. Supabase Realtime

## Canaux

```txt
workspace:{workspaceId}
operation:{operationId}
user:{userId}
presence:workspace:{workspaceId}
```

Ne jamais utiliser un canal global.

Avant chaque souscription :

- vérifier l’appartenance au workspace ;
- vérifier le rôle ;
- vérifier l’accès à l’opération ;
- appliquer les politiques RLS.

Ne pas diffuser le contenu sensible complet, les documents bruts ou les données d’un autre workspace.

---

# 19. Service central d’événements

Créer :

```txt
/v2/lib/events/event-service.ts
```

Fonctions minimales :

```ts
createActivityEvent(input)
listActivityEvents(filters)
createNotificationsFromEvent(event)
publishRealtimeEvent(event)
markNotificationAsRead(notificationId)
markAllNotificationsAsRead(workspaceId)
archiveNotification(notificationId)
```

Les composants ne doivent pas créer directement les événements certifiés.

---

# 20. Hooks React

Créer :

```txt
/v2/hooks/use-realtime-events.ts
/v2/hooks/use-notifications.ts
/v2/hooks/use-presence.ts
/v2/hooks/use-activity-feed.ts
/v2/hooks/use-motion-preference.ts
```

Exemple :

```ts
const {
  notifications,
  unreadCount,
  markAsRead,
  markAllAsRead,
  isConnected,
} = useNotifications(workspaceId)
```

---

# 21. Composants requis

```txt
/v2/components/notifications/notification-center.tsx
/v2/components/notifications/notification-item.tsx
/v2/components/notifications/notification-bell.tsx
/v2/components/notifications/toast-provider.tsx
/v2/components/notifications/notification-filters.tsx

/v2/components/activity/activity-feed.tsx
/v2/components/activity/activity-item.tsx
/v2/components/activity/activity-group.tsx
/v2/components/activity/activity-filters.tsx

/v2/components/presence/presence-avatars.tsx
/v2/components/presence/active-viewers.tsx
/v2/components/presence/live-indicator.tsx

/v2/components/progress/readiness-progress.tsx
/v2/components/progress/operation-progress.tsx
/v2/components/progress/checklist-progress.tsx
```

---

# 22. Notifications intelligentes

Créer les règles dans :

```txt
/v2/lib/events/insight-rules.ts
```

## Engagement élevé

Condition : même investisseur, au moins trois visites sur sept jours et consultation d’au moins deux catégories sensibles.

Résultat :

```txt
Awa Capital montre un engagement élevé.
Préparez votre prochaine relance ou proposez une réunion de diligence.
```

## Inactivité

Condition : investisseur marqué « intéressé », aucune activité depuis sept jours et aucune prochaine action planifiée.

Résultat :

```txt
Aucune activité récente pour Kora Ventures.
Planifiez une relance.
```

## Document bloquant

Condition : document requis, manquant, diligence active et délai supérieur à cinq jours.

Résultat :

```txt
Ce document bloque probablement la diligence.
Affectez-le à un membre de votre équipe.
```

---

# 23. Moments de progression

## Data room prête

```txt
Votre data room est prête.
Vous pouvez maintenant inviter vos premiers investisseurs.
```

## Première consultation

```txt
Votre premier investisseur a ouvert la data room.
```

## Diligence démarrée

```txt
Votre opération entre en phase de diligence.
Sanza a préparé les prochaines actions recommandées.
```

## Opération clôturée

Animation sobre :

```txt
Opération clôturée
Votre historique et vos documents ont été archivés.
```

---

# 24. États vides

Chaque état vide doit :

- expliquer ce qui manque ;
- montrer la valeur du module ;
- proposer une action principale ;
- rester visuellement vivant.

Exemple Documents :

```txt
Votre data room est encore vide.
Ajoutez vos premiers documents. Sanza vous aidera à les classer.
```

Exemple Investisseurs :

```txt
Ajoutez votre premier investisseur.
Vous pourrez suivre ses échanges, ses consultations et vos prochaines actions.
```

---

# 25. Badges et compteurs

Utiliser des badges en temps réel pour :

- notifications non lues ;
- demandes ouvertes ;
- questions en attente ;
- documents manquants ;
- tâches en retard.

Règles :

- mise à jour sans rechargement ;
- ne pas afficher zéro ;
- `99+` pour les valeurs élevées ;
- valeur exacte disponible pour l’accessibilité.

---

# 26. Navigation et panneaux

Privilégier les panneaux latéraux pour :

- investisseur ;
- document ;
- notification ;
- activité ;
- question.

Le panneau doit conserver le contexte, être accessible au clavier, restaurer le focus à la fermeture et être partageable par URL lorsque pertinent.

---

# 27. Performance et résilience

- éviter les re-renders globaux ;
- paginer l’activité ;
- virtualiser les longues listes ;
- dédupliquer les événements ;
- utiliser les mises à jour optimistes ;
- limiter les souscriptions Realtime ;
- désabonner proprement les canaux ;
- ne pas placer les animations lourdes dans le chemin critique.

En cas de perte de connexion :

```txt
Connexion temps réel interrompue
Reconnexion…
```

L’application doit continuer à fonctionner avec les données disponibles.

---

# 28. RLS et confidentialité

Toutes les tables doivent utiliser RLS.

Ne jamais exposer :

- l’identité d’un investisseur à un autre investisseur ;
- les notes internes ;
- les commentaires privés ;
- les événements de sécurité ;
- une présence non autorisée ;
- les données d’un autre workspace.

Les visiteurs externes ne peuvent voir que leurs propres accès et les notifications explicitement autorisées.

---

# 29. Edge Functions recommandées

```txt
supabase/functions/create-activity-event
supabase/functions/process-notification-rules
supabase/functions/send-notification-email
supabase/functions/send-daily-digest
supabase/functions/send-weekly-digest
supabase/functions/cleanup-expired-notifications
supabase/functions/recalculate-engagement
```

Chaque fonction doit être : authentifiée, idempotente, journalisée, limitée en fréquence, résistante aux doublons et sécurisée par workspace.

---

# 30. Emails et résumés

## Immédiat

Réserver aux événements importants :

- NDA signé ;
- nouvelle question ;
- demande documentaire ;
- suspicion de sécurité ;
- tâche urgente ;
- accès expirant.

## Quotidien

Inclure : activité investisseur, documents ajoutés, tâches ouvertes, échéances et recommandations.

## Hebdomadaire

Inclure : progression globale, investisseurs les plus engagés, documents les plus consultés, blocages et prochaines étapes.

---

# 31. Analytics produit

```txt
notification_center_opened
notification_opened
notification_marked_read
notification_action_clicked
activity_feed_opened
realtime_connected
realtime_disconnected
presence_viewed
document_upload_started
document_upload_completed
document_processing_failed
readiness_score_changed
investor_stage_dragged
smart_insight_displayed
smart_insight_actioned
```

Ajouter : workspace, opération, segment, plan, rôle, type d’événement, source, temps de traitement et résultat.

---

# 32. Accessibilité

Obligatoire :

- navigation clavier ;
- focus visible ;
- annonces ARIA ;
- pas de dépendance exclusive à la couleur ;
- réduction des animations ;
- toasts lisibles par lecteur d’écran ;
- contrastes conformes.

Exemple :

```html
<div aria-live="polite">
  Votre document a été ajouté.
</div>
```

Erreur critique :

```html
<div aria-live="assertive">
  L’import a échoué.
</div>
```

---

# 33. Plan d’implémentation

## Phase 1 — Fondation

1. migrations ;
2. tables ;
3. RLS ;
4. catalogue d’événements ;
5. service d’événements ;
6. service de notifications ;
7. hooks ;
8. Supabase Realtime.

## Phase 2 — Feedback local

1. boutons ;
2. sauvegarde automatique ;
3. toasts ;
4. import de documents ;
5. progression ;
6. états vides ;
7. badges.

## Phase 3 — Temps réel

1. centre de notifications ;
2. activité par opération ;
3. présence ;
4. pipeline ;
5. questions-réponses ;
6. événements investisseur.

## Phase 4 — Intelligence

1. engagement ;
2. inactivité ;
3. blocages ;
4. prochaine meilleure action ;
5. résumés.

---

# 34. Priorités MVP

Implémenter en priorité :

1. fil d’activité ;
2. centre de notifications ;
3. import de documents avec états ;
4. progression animée ;
5. pipeline fluide ;
6. notifications de consultation ;
7. notifications de signature de NDA ;
8. badge de notifications non lues.

Ne pas retarder le MVP avec : sons, push mobile, animations complexes, présence détaillée, IA avancée ou gamification.

---

# 35. Tests obligatoires

## Unitaires

- création d’événement ;
- création de notification ;
- préférences ;
- déduplication ;
- règles d’insight ;
- lu/non lu ;
- filtrage par rôle ;
- réduction des animations.

## Intégration

- événement après upload ;
- notification après NDA ;
- diffusion Realtime ;
- reconnexion ;
- mise à jour optimiste ;
- erreur réseau ;
- isolation entre workspaces.

## End-to-end

- upload complet ;
- investisseur ouvre la data room ;
- fondateur reçoit la notification ;
- notification ouvre le bon contexte ;
- déplacement d’un investisseur ;
- tâche créée depuis une recommandation ;
- utilisateur avec animations réduites.

---

# 36. Critères d’acceptation

L’implémentation est conforme lorsque :

- les événements sont centralisés ;
- les notifications sont persistantes ;
- le temps réel respecte les workspaces ;
- les micro-interactions utilisent des tokens communs ;
- les animations sont désactivables ;
- l’activité est consultable par opération ;
- les notifications ouvrent le bon écran ;
- les badges se mettent à jour sans rechargement ;
- les erreurs sont visibles ;
- les événements sensibles ne fuient pas ;
- le système fonctionne sans Realtime actif ;
- les composants sont réutilisables ;
- les tests critiques sont présents.

---

# 37. Interdictions

Claude Code ne doit pas :

- ajouter des animations sans fonction ;
- coder les durées dans chaque composant ;
- créer les événements certifiés uniquement depuis le frontend ;
- utiliser un canal Realtime global ;
- exposer des données sensibles dans les payloads ;
- afficher tous les événements sous forme de toast ;
- envoyer un email pour chaque consultation ;
- ignorer les préférences utilisateur ;
- ignorer `prefers-reduced-motion` ;
- intégrer des sons par défaut ;
- bloquer une action avec une animation ;
- dupliquer les systèmes de notification ;
- créer une interface statique non branchée.

---

# 38. Instruction finale à Claude Code

Avant toute implémentation :

1. inspecter l’architecture actuelle de `/v2` ;
2. identifier les composants existants ;
3. vérifier les bibliothèques d’animation installées ;
4. vérifier les tables Supabase existantes ;
5. repérer les mécanismes d’activité déjà présents ;
6. proposer les migrations nécessaires ;
7. produire un plan fichier par fichier ;
8. commencer seulement après validation du plan.

L’implémentation doit être progressive et ne doit pas casser les écrans actuels.

Chaque animation doit être branchée à un état réel. Chaque notification doit provenir d’un événement identifiable. Chaque événement doit respecter les permissions et le workspace.

Le résultat attendu est une application Sanza vivante, mais toujours professionnelle, rassurante et efficace.
