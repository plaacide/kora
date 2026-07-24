# Sanza — App dealroom (dashboard fondateur) · handoff Claude Code

Maquette de référence : **`Sanza App v5.dc.html`** (ouvrir dans le navigateur pour l'interaction réelle : nav, onglets, modals, sélecteurs).
Ce document décrit **quoi construire et pourquoi** — pas du code à copier. Réimplémenter proprement dans la stack existante (React + le design system Sanza, mêmes tokens que `INSTRUCTIONS-CLAUDE.md`).

> **⚠️ Une seule correction par rapport à la maquette.** Tout le layout est **centré avec `max-width` + marges auto** (≈1120px). Le client préfère que **le contenu occupe la quasi-totalité de la largeur de l'écran**. → Supprimer les `max-width` centrés, passer à un conteneur pleine largeur avec padding latéral fixe (ex. `padding: 32px 48px`, `width:100%`), plafonné très haut (ex. `max-width: 1600–1800px`) pour les très grands écrans. Les tables et grilles doivent s'étirer. Tout le reste de la maquette (hiérarchie, composants, densité, sobriété type DocSend, rayons courts) est **validé — à conserver tel quel**.

---

## 0. Principes visuels (déjà dans la maquette — respecter)
- **Surfaces blanches**, hairlines fines `#ECEBE6` (lignes de séparation `#F1F0EC`), **pas d'ombres** (flat).
- Tables **pleine largeur, sans carte englobante** : entête mono uppercase 9px gris, lignes séparées par hairline, hover `#FAFAF8`, lignes hautes (~14px vertical).
- **Rayons courts** (le client n'aime pas le trop arrondi) : cartes/conteneurs **6px**, boutons/inputs/chips **5px**, badges **4px**, avatars **carrés-arrondis 6px** (jamais de cercles pour les avatars). Toggles = pilule (seul élément rond toléré).
- **Orange en accent seul** : wordmark, CTA primaire, état actif de nav, barres de progression, « prochaine action », liens. Tout le reste en neutres.
- Typo : **Instrument Sans** (UI/titres) + **IBM Plex Mono** (chiffres, montants, références, empreintes, labels de colonnes). Titres de page 27px/700, sections 15px/700.
- Palette de travail : encre texte `#1A1B1F`, secondaire `#6E727A`, muet `#9DA0A8`/`#A0A3AB`, orange `#E85C2B` (hover `#D24E1F`), orange texte `#C24619`, tint orange `#FBEDE6`/`#FEF8F4`, vert `#147A5C`/tint `#E4F3EC`, bleu `#185FA5`/tint `#E9F2FB`, rouge PDF `#C0392B`.

---

## 1. Architecture (4 destinations + gestes)
Barre latérale : **Accueil · Espaces · Ma levée** ; groupe « Mon compte » : Sécurité, Roadmap. Topbar : wordmark, **sélecteur d'organisation** (Sulma Whole food), recherche ⌘K, badge « Chiffré · SOC 2 », **CTA Partager**, avatar.

Modèle mental : *une organisation → plusieurs **levées** → chaque levée agrège plusieurs **data rooms (espaces)** et plusieurs **investisseurs**.*

---

## 2. Accueil (`screen=accueil`)
Vue de pilotage inter-levées.
- **Résumé de la levée en cours** (bandeau bordé) : objectif (10 M$) + barre d'avancement des soft-commitments (3,2 M$ · 32 %), dossier prêt (20 %), investisseurs (2/3), vues 7 j. Chaque tuile est un raccourci.
- **Prochaine action** (bandeau tint orange) : la pièce à plus fort impact à déposer → deep-link vers la data room / le suivi.
- **Visites récentes** (table : Qui · Document · Quand · Durée) + un **encart « Signal »** en langage naturel (lecture comportementale).
- **Documents les plus regardés** (barres de vues) + **Qui a regardé le plus** (contacts classés par temps passé).

### Logique métier — Accueil
- « Prochaine action » = pièce manquante de la checklist qui **débloque le plus d'exigences** (pondération, voir §5). Une seule à la fois.
- « Signal » : règle simple — si un contact a vu ≥ X % du deck **puis** ouvert les prévisionnels → statut « instruit / chaud » + reco d'action. Pré-calculé côté back.
- « Durée » d'une visite = temps réel de lecture page par page (tracker viewer, cf. §6).

---

## 3. Espaces (`screen=espaces`)
### 3a. Liste des data rooms (`room=null`)
Table pleine largeur : **Nom** (icône + sous-ligne « levée · N docs · N invités »), **Dernière MàJ**, **Propriétaire** (avatar+nom), **Actif** (toggle vert), actions (Partager + menu ⋯). Filtres en chips (« Mes espaces », « Tous les statuts »). CTA « Nouvelle data room ».
- Une data room **archivée/clôturée** est grisée, toggle off, action « Rouvrir ».

### 3b. Détail d'une data room (`room=<id>`)
En-tête : icône + titre + **chip « Rattachée à : Levée Seed 2026 » (éditable → modal Rattacher)** + statut Actif + actions (Afficher un aperçu / Partager / ⋯).
Onglets internes :
1. **Contenu** — arborescence indexée. Table : **Index (1, 1.1…)**, Nom (dossier/fichier), Type, Dernière MàJ, **Visible** (toggle Oui/Masqué par dossier), ⋯. Toolbar : Organiser / Demander des fichiers / Créer un dossier / Ajouter des contenus.
2. **Autorisations** — qui entre + **droits par dossier** : Personne, Droits (Télécharger / Filigrané / Lecture seule), Dossiers accessibles, Dernière visite, Révoquer. Invités en attente affichés en pointillés.
3. **Suivi de la diligence** — la checklist des pièces à fournir (cf. §5), groupée par catégorie (OHADA, Financier…), barre de complétude globale.
4. **Questions-réponses** — questions posées **par les investisseurs dans cette data room**. États : **À répondre** → brouillon → **Publiée** (visible par tous les invités). Assignable à un membre. C'est le pendant fondateur de ce que voit l'investisseur.
5. **Signatures** — NDA exigé (toggle) + modèle éditable + table des signataires : Signataire, Signé le, **Empreinte** (hash), Preuve (PDF). En attente = pointillés.
6. **Journal d'audit** — flux horodaté, **chaîné par empreinte** (immuable) : Quand, Action (pastille typée : PAGE CONSULTÉE, NDA SIGNÉ, INVITATION ACCEPTÉE, JUSTIFICATIF RATTACHÉ…), Par, Empreinte. Export.

### Logique métier — Espaces / data room
- **Droits par dossier** : autorisation = matrice `{personne × dossier × niveau}`. Ouvrir « Financier » à un DFI sans exposer « Juridique ». Toute lecture est journalisée.
- **Niveaux d'accès** : `Téléchargement` / `Filigrané` (lecture seule, watermark au nom du lecteur) / `Aperçu`. Documents servis **page par page** — le fichier source ne quitte jamais le serveur.
- **NDA** : si exigé, signature **avant** tout accès aux documents ; preuve (horodatage, IP, hash du document signé) rattachée à la personne, visible en Signatures + Journal. Non modifiable.
- **Accès expirables** (90 j par défaut, prolongeable) et **révocables** à tout moment.
- **Visible/Masqué par dossier** : contrôle ce qui apparaît dans la data room côté invité, indépendamment des droits.
- **Journal chaîné** : chaque entrée référence le hash de la précédente (intégrité vérifiable, badge « chaîne intègre »).

---

## 4. Ma levée (`screen=levee`)
Pilotage d'**un tour**. En haut : titre + **bouton « Modifier la levée »** (modal, §4b).

### 4a. Sélecteur de levées (multi-levées)
Rangée de **chips** (pas un dropdown caché) : `Seed 2026 · EN COURS · 10 M$` / `Pre-Seed 2024 · CLÔTURÉE · 1,5 M$` / `+ Nouvelle levée`. Le chip sélectionné pilote tout le détail dessous.
- Levée **en cours** → vue riche (ci-dessous). Levée **clôturée** → bandeau « archivée en lecture seule », montant levé à 100 %, investisseurs closés + parts.

### 4b. Sélecteur d'audience + bande « En bref »
**Le point clé demandé par le client.** Sous les chips : *« Cette levée s'adresse à »* → segmented **VC · Equity / DFI · Impact / Banque · Dette**. Ce choix **change le jeu d'indicateurs** de la bande « En bref » (ce qu'un investisseur voit **avant** d'ouvrir les documents). La bande porte un toggle **« Visible par les invités »** + bouton Modifier.

Indicateurs par audience (5 tuiles) :
- **VC (equity)** : Revenu annualisé + croissance · Marge brute · Traction métier (volume/an, clients B2B) · Runway · Engagé sur le tour + lead.
- **DFI (impact)** : Revenu · Emplois créés · Part femmes · Producteurs sourcés · Gouvernance & E&S.
- **Banque (dette)** : EBITDA (+marge) · **DSCR** (≥ 1,25×) · Ancienneté du CA · Gearing (dette/FP) · Garanties/collatéral.

Le **type de financeur** est aussi en tête du modal « Modifier la levée » : il détermine les champs à renseigner.

### 4c. Résumé de la levée
Carte bordée : Montant recherché + barre engagé/restant · Type de financement (Equity — Seed, valorisation, tags SAFE/OHADA) · Clôture visée · **Description** (pitch court).

### 4d. Historique de financement (précédents investisseurs)
Rail horizontal des tours : chaque nœud = round (badge statut, montant, date) + **pile d'avatars des investisseurs** + noms (lead identifié). Ex. `Pre-Seed 2024 · 1,5 M$ · Awa Ndiaye (lead), Kola, Diallo` → `Seed 2026 (en cours) · 3,2/10 M$ · Sequoia (lead pressenti), Proparco, Teranga`. Total levé à ce jour en légende.

### 4e. Documents clés · Équipe · Investisseurs · Data room attachée
- **Documents clés** : raccourcis vers les pièces phares (deck, prévisionnels, cap table) + compteur de vues ; lien vers la data room.
- **Équipe sur la levée** : membres + rôle métier + **rôle d'accès** (Owner / Éditeur / Lecteur), y compris conseils externes.
- **Investisseurs sur cette levée** (table) : Investisseur (nom + type/rôle), **Ticket**, **Statut** (EN DILIGENCE / SOFT-COMMIT / INVITÉ / CLOSÉ), Data room, Dernière visite. Un investisseur peut être invité mais pas encore signé.
- **Data room attachée** : carte de la room liée + **barre « dossier prêt »** + **« ce qu'il reste à faire »** (3 premières pièces manquantes avec action Déposer) + lien vers le suivi. Bouton **« + Attacher une data room »**.

### 4f. Modals
- **Modifier la levée** : Financeur visé (segmented) · Montant recherché · Déjà engagé (**le restant se calcule : objectif − engagé, + %**) · Type de financement · Valorisation · Stade · Clôture · Description.
- **Rattacher une data room** : liste des rooms sélectionnables (radio) + « Créer une nouvelle data room pour cette levée ». Ouvrable **depuis Ma levée ET depuis l'en-tête de la data room** (même modal).
- **Partager** (global) : email invité · Niveau d'accès · Expire le · toggle **Exiger un NDA** (→ preuve rattachée, visible en Signatures).

### Logique métier — Ma levée
- **Multi-levées** : une org a N levées, chacune avec son propre statut, ses investisseurs, ses data rooms. Le sélecteur ne change que le contexte affiché.
- **Multi-investisseurs par levée** : plusieurs tickets par tour, avec pipeline de statut. `Σ tickets soft-commit/closé = engagé`, alimente la barre « objectif ».
- **Rattachement levée ↔ data room** : relation **N–N** modifiable des deux entrées. Quand une room est rattachée, **son suivi de diligence alimente la barre « dossier prêt » de la levée**, et ses invités remontent dans « Investisseurs sur cette levée ».
- **Audience → indicateurs** : le type de financeur (VC/DFI/Banque) sélectionne le **template d'indicateurs** de la bande « En bref » **et** les champs du modal. Chaque indicateur a un flag `visibleInvité`. Les valeurs sont saisies par le fondateur (pas calculées, sauf le « restant » et les %).
- **Historique** : les levées clôturées d'une même org constituent l'historique de financement affiché sur la levée en cours.
- **Reste à lever** = `objectif − engagé` (recalcul live). **DSCR**, **gearing**, **marge** : saisis (ou remontés de la compta si intégration future), affichés avec seuil de référence (ex. DSCR ≥ 1,25×).

---

## 5. Checklist « Suivi de la diligence » (moteur)
- Référentiels par **catégorie** (OHADA, Financier, Juridique, RH, PI, Conformité/ESG). Chaque **exigence** : titre, description, statut (`Fait`/`À faire`), **emplacement cible** dans l'arbo (ex. `1.2 RCCM & existence légale`), preuves rattachées.
- **Complétude** = pièces fournies / total → alimente « dossier prêt » (sidebar, Accueil, carte data room attachée).
- **Débloquage** : certaines pièces débloquent plusieurs exigences (ex. déclaration fiscale NINEA/IFU → 3 exigences OHADA). La « Prochaine action » = pièce non fournie au **plus fort poids de débloquage**.
- **Piste d'évolution demandée** : adapter le **référentiel de checklist au type de financeur** (une banque ne demande pas les mêmes pièces qu'un VC — ajouter templates Dette/DFI). À prévoir dans le modèle de données (checklist template lié à `audience`).

---

## 6. Modèle de données (indicatif)
```
Organisation
Levee { id, nom, statut(en_cours|cloturee), objectif, engage, devise,
        typeFinancement, stade, valorisation, clotureVisee, description,
        audience(vc|dfi|banque), indicateurs[{cle,label,valeur,sub,visibleInvite}] }
DataRoom { id, nom, statut(actif|archive), proprietaire, ndaRequis, ndaModele,
           leveeIds[] }              // rattachement N–N
Dossier { id, dataRoomId, index, nom, visible }
Document { id, dossierId, index, nom, type, vues, permissionDefaut }
Personne/Invite { id, nom, email, type(vc|dfi|banque|angel), organisation }
Acces { personneId, dataRoomId, niveau(telechargement|filigrane|apercu),
        dossiersAutorises[], expireLe, revoke }
NdaSignature { personneId, dataRoomId, signeLe, ip, empreinte, preuvePdf }
InvestisseurLevee { leveeId, personneId, ticket, statut(invite|soft_commit|en_diligence|close), part }
ExigenceChecklist { id, leveeId|templateAudience, categorie, titre, description,
                    cibleArbo, statut, debloque[], preuves[] }
Visite { personneId, documentId, page, duree, ts }
AuditEntry { ts, type, cible, parPersonneId, empreinte, empreintePrecedente }
```

## 7. Sécurité (écran + transverse)
Chiffrement au repos et en transit (badge SOC 2) · docs servis page par page · journal chaîné immuable · accès expirables/révocables · 2FA activable. À exposer aussi dans l'écran Sécurité.

## 8. Rappels d'implémentation
1. **Pleine largeur** (voir encadré en tête) — la seule vraie modif vs. maquette.
2. Réutiliser le design system Sanza + tokens de `INSTRUCTIONS-CLAUDE.md` (ne pas réinventer de couleurs).
3. Composants réels attendus : `DataTable` (entête mono, hover, hairlines), `Toggle`, `Segmented`, `StatusBadge` (typée), `AvatarStack`, `Modal`, `TabBar`, `KpiTile`, `ProgressBar`, `SanzaLogo`.
4. i18n FR par défaut (produit panafricain francophone) ; montants et références en IBM Plex Mono.
5. Rayons courts partout (6/5/4). Avatars carrés-arrondis. Pas d'ombres.
