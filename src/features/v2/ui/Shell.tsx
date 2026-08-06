"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";

import { v2Routes } from "../navigation/routes";
import { CompteMenu } from "./CompteMenu";
import { Icon, type IconName } from "./Icon";
import { SanzaMark, SanzaWordmark } from "./Logo";
import { PushLink } from "./PushTransitions";

/**
 * Préférence de repli du rail — TRANSITIONS.md §1.
 *
 * « Dépliée par défaut […] C'est l'état initial pour tout nouvel
 * utilisateur », et le choix « est persisté et ne change jamais tout seul ».
 * D'où ces deux règles : on part déplié, et seul un clic sur le chevron
 * modifie la préférence — jamais un redimensionnement.
 *
 * `localStorage` est une source extérieure à React, avec une valeur au rendu
 * serveur (déplié) qui diffère de celle du navigateur : c'est précisément ce
 * que `useSyncExternalStore` sait faire. Lire la préférence dans un effet et
 * appeler `setState` provoquerait un rendu en cascade — et le signaler est le
 * rôle du garde-fou `react-hooks/set-state-in-effect`.
 */
const RAIL_PREFERENCE = "sanza.v2.rail";

const railListeners = new Set<() => void>();

/**
 * L'instantané doit rester identique d'un appel à l'autre tant que rien n'a
 * changé, faute de quoi React rendrait sans fin. D'où ce cache.
 */
let railSnapshot: boolean | null = null;

function readRailPreference(): boolean {
  try {
    const stored = window.localStorage.getItem(RAIL_PREFERENCE);
    if (stored === "collapsed") return false;
    if (stored === "expanded") return true;
  } catch {
    // Navigation privée, stockage refusé : on garde le défaut déplié.
  }
  return true;
}

function subscribeToRail(onChange: () => void): () => void {
  railListeners.add(onChange);
  return () => railListeners.delete(onChange);
}

function railIsExpanded(): boolean {
  railSnapshot ??= readRailPreference();
  return railSnapshot;
}

/** Au rendu serveur, le rail est déplié : le défaut de la spec. */
function railIsExpandedOnServer(): boolean {
  return true;
}

function setRailExpanded(next: boolean): void {
  railSnapshot = next;
  try {
    window.localStorage.setItem(RAIL_PREFERENCE, next ? "expanded" : "collapsed");
  } catch {
    // Préférence non mémorisable : le choix reste valable pour la session.
  }
  railListeners.forEach((listener) => listener());
}

interface EntreeRail {
  href: string;
  label: string;
  icon: IconName;
  mobile?: boolean;
}

/**
 * Le rail n'est pas le même selon le métier.
 *
 * Le fondateur pilote SES opérations ; le programme pilote un PORTEFEUILLE
 * d'entreprises qu'il n'a pas le droit d'ouvrir. Ce ne sont pas les mêmes
 * destinations, et une liste unique obligeait à masquer les unes pour montrer
 * les autres — ce qui revient à écrire deux rails en un, mais illisible.
 *
 * Les libellés, l'ordre et les icônes viennent des attributs `title` du rail
 * des maquettes : `screens/` pour le fondateur, `parcours-programme/` pour le
 * programme.
 *
 * Tant que les écrans sont en dur, le métier est porté par le groupe de
 * routes. Il viendra de `profiles.account_type` au branchement.
 */
export type Metier = "fondateur" | "programme";

const RAILS: Record<Metier, readonly EntreeRail[]> = {
  fondateur: [
    { href: "/v2/accueil", label: "Accueil", icon: "home" },
    { href: "/v2/operations", label: "Opérations", icon: "grid" },
    { href: "/v2/invitations", label: "Invitations", icon: "inbox" },
    { href: "/v2/recherche", label: "Recherche", icon: "search", mobile: true },
  ],
  programme: [
    { href: v2Routes.programme.accueil, label: "Accueil", icon: "home" },
    {
      href: v2Routes.programme.portefeuille,
      label: "Portefeuille",
      icon: "wallet",
    },
    { href: v2Routes.programme.cohortes.list, label: "Cohortes", icon: "layers" },
    {
      href: v2Routes.programme.dealrooms.list,
      label: "Dealrooms",
      icon: "presentation",
    },
    { href: v2Routes.programme.demandes, label: "Demandes", icon: "inbox" },
    { href: v2Routes.programme.rapports, label: "Rapports", icon: "chart" },
  ],
};

/**
 * Le second niveau du fil d'Ariane — « Lever › Configurer la levée ».
 *
 * Toutes les maquettes en portent un : le bandeau y nomme la section, puis le
 * sous-écran ouvert. Sans lui, l'assistant de partage, la configuration d'une
 * levée ou une mise à jour publiée s'affichent sous le seul mot de leur
 * section, et rien ne dit d'où l'on vient ni comment revenir.
 *
 * Il se déduit de l'URL plutôt que d'être poussé par chaque page : ces
 * sous-écrans sont ouverts par un paramètre de requête sur la même route, et
 * une mise en page ne reçoit pas les paramètres de requête dans Next.
 */
function sousEcranCourant(
  section: string,
  params: URLSearchParams,
): string | null {
  if (section === "lever") {
    const vue = params.get("view");
    if (vue === "configure") return "Configurer la levée";
    if (vue === "close") return "Clôturer la levée";
    if (vue === "updates") {
      // L'assistant et la mise à jour publiée sont deux étages distincts.
      if (params.get("step") === "nouvelle") {
        return "Mises à jour › Créer une mise à jour";
      }
      if (params.get("maj")) return "Mises à jour › Détail";
      return "Mises à jour";
    }
    // La fiche d'une relation porte son nom, comme « Investisseurs › Sahel
    // Growth Fund » dans les maquettes 28 et 29. Le nom n'est pas dans l'URL :
    // le bandeau annonce donc l'étage sans le nommer, et la fiche elle-même
    // porte le titre.
    if (vue === "pipeline") {
      return params.get("fiche") ? "Pipeline › Relation" : "Pipeline";
    }
    if (vue === "commitments") return "Engagements";
    return null;
  }

  if (section === "access") {
    if (params.get("share")) return "Créer un accès";
    if (params.get("request")) return "Demande d’accès";
    if (params.get("apercu")) return "Aperçu invité";
    return null;
  }

  if (section === "preparation") {
    if (params.get("exigence")) return "Détail de l’exigence";
    if (params.get("import")) return "Importer une liste";
    if (params.get("new")) return "Ajouter une exigence";
    return null;
  }

  return null;
}

export function WorkspaceShell({
  children,
  email,
  metier = "fondateur",
}: {
  children: ReactNode;
  email: string;
  metier?: Metier;
}) {
  const path = usePathname();
  const rail = RAILS[metier];
  const expanded = useSyncExternalStore(
    subscribeToRail,
    railIsExpanded,
    railIsExpandedOnServer,
  );

  // Libellés repris des attributs `title` du rail dans les maquettes.
  // Le pied est commun aux deux métiers : le rail programme ne dessine ni
  // Équipe ni Abonnement, alors qu'un programme a des collaborateurs et un
  // plan qui mord déjà à l'invitation. Les laisser dehors reproduirait, pour
  // le programme, le défaut corrigé pour le fondateur — un écran qu'aucun
  // chemin ne dessert n'existe pas.
  const bottom: Array<{ href: string; label: string; icon: IconName; mobile?: boolean }> = [
    { href: "/v2/team", label: "Équipe", icon: "users" },
    { href: "/v2/security", label: "Sécurité", icon: "shield" },
    // L'abonnement n'était dans aucun rail : l'écran existait à une adresse que
    // personne ne pouvait atteindre. Un écran qu'on ne peut pas ouvrir ne
    // compte pas.
    { href: "/v2/abonnement", label: "Abonnement", icon: "landmark" },
    { href: "/v2/roadmap", label: "Aide", icon: "help", mobile: true },
  ];

  const link = (item: { href: string; label: string; icon: IconName; mobile?: boolean }) => (
    <Link
      aria-label={expanded ? undefined : item.label}
      className="v2-rail-link"
      data-active={
        item.href === "/v2/operations"
          ? path.startsWith("/v2/operations")
          : item.href === v2Routes.programme.cohortes.list ||
              item.href === v2Routes.programme.dealrooms.list
            ? // Une cohorte ouverte garde « Cohortes » allumé, comme une
              // opération ouverte garde « Opérations » : le rail dit où l'on
              // est, pas sur quoi l'on vient de cliquer.
              path.startsWith(item.href)
            : path === item.href
      }
      data-mobile-hide={item.mobile}
      href={item.href}
      key={item.label}
      title={expanded ? undefined : item.label}
    >
      <Icon name={item.icon} />
      {expanded && <span>{item.label}</span>}
    </Link>
  );

  return (
    <div className="v2">
      <div className="v2-shell">
        <nav
          aria-label="Navigation principale"
          className="v2-rail"
          data-expanded={expanded}
        >
          <div className="v2-rail-head">
            {/* Le logo entier, pas l'icône À CÔTÉ du mot : les deux portent
                les mêmes « a » et se répétaient. Replié, le rail n'a la place
                que du signe — c'est le seul cas où l'icône sert. */}
            <Link className="v2-mark" href="/v2" aria-label="Sanza">
              {expanded ? (
                <SanzaWordmark height={22} />
              ) : (
                <SanzaMark size={30} />
              )}
            </Link>
            <button
              aria-expanded={expanded}
              aria-label={expanded ? "Replier la navigation" : "Déplier la navigation"}
              className="v2-rail-toggle"
              onClick={() => setRailExpanded(!expanded)}
              type="button"
            >
              <Icon name="chevron" />
            </button>
          </div>
          {rail.map(link)}
          <span className="v2-rail-space" />
          {bottom.map(link)}
          <CompteMenu email={email} />
          {/* LA VERSION, EN BAS DU RAIL. Un bêta-testeur qui signale un défaut
              ne sait pas dire sur quoi il l'a vu ; nous non plus. Le numéro se
              lit d'un coup d'œil et part avec la capture d'écran. Discret à
              dessein — il informe, il ne se met pas en avant. */}
          <span className="v2-rail-version" title="Version de Sanza">
            v0.1
            <small>bêta</small>
          </span>
        </nav>
        {children}
      </div>
    </div>
  );
}

/** Sélecteur rapide de l’écran 63 — les noms viennent de la maquette. */


const pageLabels: Record<string, string> = {
  overview: "Vue d’ensemble",
  preparation: "Préparation",
  access: "Partage et accès",
  lever: "Lever",
  investors: "Investisseurs",
  activity: "Activité",
  documents: "Data room",
};

export function OperationShell({
  children,
  operationId,
  operationName,
  operationObjectif,
  operations = [],
  folders = [],
  activeAccesses = 0,
  preparation,
}: {
  children: ReactNode;
  operationId: string;
  /** Le nom réel. Le rail affichait « Série A 2026 » sur toutes les opérations. */
  operationName?: string;
  /** Ce que l'opération cherche, déjà mis en mots. */
  operationObjectif?: string | null;
  /** Les autres opérations de l'organisation, pour le sélecteur. */
  operations?: readonly { id: string; nom: string; archivee: boolean }[];
  /** Dossiers racine de l'opération, lus en base par le layout. */
  folders?: readonly string[];
  /** Accès réellement ouverts. Le bandeau annonçait « 3 » en toutes lettres. */
  activeAccesses?: number;
  /** Exigences prêtes sur exigences dues. Le rail annonçait « 18/24 ». */
  preparation?: { ready: number; due: number };
}) {
  const path = usePathname();
  const [pickerOpen, setPickerOpen] = useState(false);
  const root = `/v2/operations/${encodeURIComponent(operationId)}`;
  const currentSection =
    Object.keys(pageLabels).find((section) => path.includes(`/${section}`)) ??
    "overview";
  const folder = decodeURIComponent(path.split("/documents/")[1] ?? "").replaceAll("/", " / ");
  const currentLabel = folder || pageLabels[currentSection];
  const params = useSearchParams();
  const sousEcran = sousEcranCourant(currentSection, params);
  const nav = [
    ["overview", "Vue d’ensemble"],
    ["preparation", "Préparation"],
    ["access", "Partage et accès"],
    ["lever", "Lever"],
    ["activity", "Activité"],
  ];

  const cta: { label: string; href: string; secondary?: boolean } | null =
    currentSection === "overview"
      ? { label: "Commencer la préparation", href: `${root}/preparation` }
      : currentSection === "documents"
        ? // La data room porte ses propres actions au-dessus du contenu —
          // ajouter, partager, créer un dossier. Un second « Ajouter du
          // contenu » dans l'en-tête faisait doublon, et celui du haut était
          // rogné par le bord de l'écran sur une fenêtre étroite.
          null
        : currentSection === "preparation"
          ? { label: "Ajouter une exigence", href: `${path}?new=1` }
          : currentSection === "access"
            ? { label: "Créer un accès", href: `${path}?share=recipient` }
          : currentSection === "lever"
            ? null // Lever affiche ses propres actions dans sa page.
          : currentSection === "activity"
            ? // Le journal porte sa propre recherche et son propre export :
              // ils agissent sur ce qui est filtré à l'écran, ce qu'un lien
              // d'en-tête ne saurait pas faire.
              null
          : currentSection === "investors"
            ? { label: "Ajouter un investisseur", href: `${path}?panel=add` }
          : null;

  // Chaque écran cherche dans ce qu'il montre, pas dans les documents.
  const searchLabel =
    currentSection === "investors"
        ? "Rechercher un investisseur…"
        : currentSection === "lever"
          ? "Rechercher…"
          : "Rechercher";

  // « Partagée » ne dépend pas de l'écran qu'on regarde mais de l'existence
  // d'un accès ouvert : la data room ne devenait « partagée » que parce qu'on
  // avait cliqué sur l'onglet Partage.
  const shared = activeAccesses > 0;

  return (
    <>
      <aside className="v2-ctx">
        <div className="v2-ctx-head">
          <PushLink back className="v2-back" href={v2Routes.operations.list}>
            ← Toutes les opérations
          </PushLink>
          <button
            aria-expanded={pickerOpen}
            className="v2-ctx-title"
            onClick={() => setPickerOpen((value) => !value)}
            type="button"
          >
            {operationName ?? "Cette opération"}
            <Icon name="chevron" />
          </button>
          <div className="v2-ctx-sub">
            {/* Le type se lisait « Levée en capital » sur TOUTES les
                opérations, dossier bancaire compris. Une étiquette fausse sur
                l'écran qu'on regarde toute la journée finit par être crue. */}
            {operationObjectif && <span>{operationObjectif}</span>}
            <span className="v2-badge">{shared ? "Partagée" : "Privée"}</span>
          </div>

          {pickerOpen && (
            <div className="v2-ctx-picker">
              <div className="v2-nav-label">Vos opérations</div>
              {/* TROIS NOMS EN DUR — « Série A 2026 », « Prêt Ecobank »,
                  « Diligence IFC » — s'affichaient à tout le monde, et chacun
                  renvoyait à la liste au lieu d'ouvrir l'opération. Un
                  sélecteur qui ne sélectionne rien. */}
              {operations.length === 0 ? (
                <span className="v2-ctx-vide">Aucune autre opération</span>
              ) : (
                operations.map((autre) => (
                  <Link
                    data-current={autre.id === operationId}
                    href={`/v2/operations/${autre.id}/overview`}
                    key={autre.id}
                  >
                    <i />
                    {autre.nom}
                    {autre.archivee && <small>archivée</small>}
                  </Link>
                ))
              )}
              <hr className="v2-hr" />
              <Link href="/v2/operations">Voir toutes les opérations</Link>
              <Link href={v2Routes.operations.new}>
                <Icon name="plus" />
                Nouvelle opération
              </Link>
            </div>
          )}
        </div>
        <div className="v2-nav-group">
          <div className="v2-nav-label">Piloter</div>
          {nav.map(([slug, label]) => (
            <Link
              className="v2-nav-item"
              data-active={path.includes(`/${slug}`)}
              href={`${root}/${slug}`}
              key={slug}
            >
              {label}
              {slug === "preparation" && preparation && (
                <small>
                  {preparation.ready}/{preparation.due}
                </small>
              )}
            </Link>
          ))}
        </div>
        <div className="v2-nav-group v2-tree">
          <div className="v2-nav-label">Documents</div>
          <Link
            className="v2-nav-item"
            data-active={path.endsWith("/documents")}
            href={`${root}/documents`}
          >
            <Icon name="folder" />Data room
          </Link>
          {folders.map((item) => (
            <Link
              className="v2-nav-item"
              data-active={folder === item}
              data-level="2"
              href={`${root}/documents/${encodeURIComponent(item)}`}
              key={item}
            >
              <Icon name="folder" />{item}
            </Link>
          ))}
        </div>
      </aside>
      <div className="v2-main">
        <header className="v2-top">
          {folder && <span className="v2-crumb-muted">Data room /</span>}
          <strong>{currentLabel}</strong>
          {sousEcran && (
            <>
              <span className="v2-crumb-sep">›</span>
              <strong className="v2-crumb-leaf">{sousEcran}</strong>
            </>
          )}
          <span className="v2-spacer" />
          {currentSection !== "lever" && (
            <span className="v2-privacy" data-shared={shared}>
              <i />
              {shared
                ? `Partagée — ${activeAccesses} accès actif${activeAccesses > 1 ? "s" : ""}`
                : "Privée"}
            </span>
          )}
          {currentSection !== "lever" && currentSection !== "activity" && (
            <div className="v2-search"><Icon name="search" />{searchLabel}</div>
          )}
          {cta && (
            <Link
              className="v2-btn"
              data-variant={cta.secondary ? "secondary" : undefined}
              href={cta.href}
            >
              {cta.label}
            </Link>
          )}
        </header>
        <main className="v2-work">{children}</main>
      </div>
    </>
  );
}

/**
 * La coque d'une cohorte — écrans 03 à 17.
 *
 * Même anatomie que celle d'une opération, autre contenu : on revient à la
 * liste des cohortes, le titre est celui de la cohorte, et les six
 * destinations portent leur compteur. La maquette n'affiche PAS un compteur à
 * zéro — l'écran 03 montre « Entreprises 0 » parce que la cohorte est vide et
 * que le zéro est justement l'information, mais les Challenges, les questions
 * et les Dealrooms n'y portent aucun nombre. D'où `compteur ?? undefined` et
 * non `compteur ?? 0`.
 */
export function CohorteShell({
  children,
  cohorteId,
  nom,
  periode,
  effectif,
  compteurs,
  crumb,
  search = "Rechercher",
  action,
}: {
  children: ReactNode;
  cohorteId: string;
  nom: string;
  /** « mars → décembre 2026 ». */
  periode: string;
  /** « 12 entreprises » ou « 0 / 15 places » selon que la cohorte est peuplée. */
  effectif: string;
  compteurs: {
    entreprises?: number;
    challenges?: number;
    questions?: number;
    dealrooms?: number;
  };
  /** Le dernier étage du fil d'Ariane, quand l'écran en ouvre un. */
  crumb?: ReactNode;
  search?: string | false;
  action?: ReactNode;
}) {
  const path = usePathname();
  const routes = v2Routes.programme.cohortes;
  const nav: Array<[string, string, number | undefined]> = [
    [routes.root(cohorteId), "Vue d’ensemble", undefined],
    [routes.entreprises(cohorteId), "Entreprises", compteurs.entreprises],
    [routes.challenges(cohorteId), "Challenges", compteurs.challenges],
    [
      routes.questions(cohorteId),
      "Questions & suggestions",
      compteurs.questions,
    ],
    [routes.dealrooms(cohorteId), "Dealrooms", compteurs.dealrooms],
    [routes.rapports(cohorteId), "Rapports", undefined],
  ];

  return (
    <>
      <aside className="v2-ctx">
        <div className="v2-ctx-head">
          <PushLink back className="v2-back" href={routes.list}>
            ← Toutes les cohortes
          </PushLink>
          <div className="v2-ctx-title">
            <b>{nom}</b>
          </div>
          {/* UNE SEULE LIGNE, séparée par un point médian — « mars → décembre
              2026 · 12 entreprises ». Deux éléments distincts héritaient du
              `space-between` de la coque d'opération, qui les repoussait aux
              deux bords : « mars → décembre » et « 2026 » se retrouvaient sur
              deux lignes dans 240 px. La maquette n'écrit qu'un texte. */}
          <div className="v2-ctx-sub">
            <span>
              {periode} · {effectif}
            </span>
          </div>
        </div>
        <div className="v2-nav-group">
          <div className="v2-nav-label">Cohorte</div>
          {nav.map(([href, label, compteur]) => (
            <Link
              className="v2-nav-item"
              data-active={
                href === routes.root(cohorteId)
                  ? path === href
                  : path.startsWith(href)
              }
              href={href}
              key={href}
            >
              {label}
              {compteur !== undefined && <small>{compteur}</small>}
            </Link>
          ))}
        </div>
      </aside>
      <div className="v2-main">
        <header className="v2-top">
          <span className="v2-crumb-muted">Mes cohortes ›</span>
          <strong>{nom}</strong>
          {crumb && (
            <>
              <span className="v2-crumb-sep">›</span>
              <strong className="v2-crumb-leaf">{crumb}</strong>
            </>
          )}
          <span className="v2-spacer" />
          {search !== false && (
            <div className="v2-search"><Icon name="search" />{search}</div>
          )}
          {action}
        </header>
        <main className="v2-work">{children}</main>
      </div>
    </>
  );
}

/**
 * La coque d'une Dealroom publiée — écrans 25 à 28.
 *
 * Même anatomie que celle d'une cohorte. Le statut vit dans l'en-tête et non
 * dans une des six entrées : il ne change pas selon l'écran qu'on regarde, et
 * c'est la première chose qu'on veut savoir en entrant.
 */
export function DealroomShell({
  children,
  dealroomId,
  nom,
  statut,
  compteurs,
  titre,
  search = false,
  action,
}: {
  children: ReactNode;
  dealroomId: string;
  nom: string;
  statut: string;
  compteurs: { entreprises?: number; audience?: number; demandes?: number };
  /** Le dernier étage du fil d'Ariane. */
  titre?: string;
  search?: string | false;
  action?: ReactNode;
}) {
  const path = usePathname();
  const routes = v2Routes.programme.dealrooms;
  const nav: Array<[string, string, number | undefined]> = [
    [routes.root(dealroomId), "Vue d’ensemble", undefined],
    [routes.entreprises(dealroomId), "Entreprises", compteurs.entreprises],
    [routes.audience(dealroomId), "Audience", compteurs.audience],
    [routes.demandes(dealroomId), "Demandes", compteurs.demandes],
    [routes.branding(dealroomId), "Branding", undefined],
    [routes.activite(dealroomId), "Activité", undefined],
  ];

  return (
    <>
      <aside className="v2-ctx">
        <div className="v2-ctx-head">
          <PushLink back className="v2-back" href={routes.list}>
            ← Toutes les Dealrooms
          </PushLink>
          <div className="v2-ctx-title">
            <b>{nom}</b>
          </div>
          <div className="v2-ctx-sub">
            <span className="v2-badge" data-tone="green">
              <span className="v2-dot" />
              {statut}
            </span>
          </div>
        </div>
        <div className="v2-nav-group">
          <div className="v2-nav-label">Dealroom</div>
          {nav.map(([href, label, compteur]) => (
            <Link
              className="v2-nav-item"
              data-active={
                href === routes.root(dealroomId)
                  ? path === href
                  : path.startsWith(href)
              }
              href={href}
              key={href}
            >
              {label}
              {compteur !== undefined && <small>{compteur}</small>}
            </Link>
          ))}
        </div>
      </aside>
      <div className="v2-main">
        <header className="v2-top">
          <span className="v2-crumb-muted">Dealrooms ›</span>
          <strong>{titre ?? nom}</strong>
          <span className="v2-spacer" />
          {search !== false && (
            <div className="v2-search"><Icon name="search" />{search}</div>
          )}
          {action}
        </header>
        <main className="v2-work">{children}</main>
      </div>
    </>
  );
}

export function Standalone({
  action,
  children,
  search = "Rechercher",
  title,
}: {
  /** Bouton primaire de la barre supérieure, quand la maquette en prévoit un. */
  action?: ReactNode;
  children: ReactNode;
  /** `false` sur les écrans dont la maquette ne montre pas de recherche. */
  search?: string | false;
  title: string;
}) {
  return (
    <div className="v2-main">
      <header className="v2-top">
        <strong>{title}</strong>
        <span className="v2-spacer" />
        {search !== false && (
          <div className="v2-search"><Icon name="search" />{search}</div>
        )}
        {action}
      </header>
      <main className="v2-work">{children}</main>
    </div>
  );
}
