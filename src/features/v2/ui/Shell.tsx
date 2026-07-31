"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";

import { v2Routes } from "../navigation/routes";
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

const rail: Array<{
  href: string;
  label: string;
  icon: IconName;
  mobile?: boolean;
}> = [
  { href: "/v2/accueil", label: "Accueil", icon: "home" },
  { href: "/v2/operations", label: "Opérations", icon: "grid" },
  { href: "/v2/invitations", label: "Invitations", icon: "inbox" },
  { href: "/v2/recherche", label: "Recherche", icon: "search", mobile: true },
];

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
    if (vue === "pipeline") return "Pipeline";
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
}: {
  children: ReactNode;
  email: string;
}) {
  const path = usePathname();
  const expanded = useSyncExternalStore(
    subscribeToRail,
    railIsExpanded,
    railIsExpandedOnServer,
  );

  // Libellés repris des attributs `title` du rail dans les maquettes.
  const bottom: Array<{ href: string; label: string; icon: IconName; mobile?: boolean }> = [
    { href: "/v2/team", label: "Équipe", icon: "users" },
    { href: "/v2/security", label: "Sécurité", icon: "shield" },
    { href: "/v2/roadmap", label: "Aide", icon: "help", mobile: true },
  ];

  const link = (item: { href: string; label: string; icon: IconName; mobile?: boolean }) => (
    <Link
      aria-label={expanded ? undefined : item.label}
      className="v2-rail-link"
      data-active={
        item.href === "/v2/operations"
          ? path.startsWith("/v2/operations")
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
          <span className="v2-avatar">{email.slice(0, 2).toUpperCase() || "SA"}</span>
        </nav>
        {children}
      </div>
    </div>
  );
}

/** Sélecteur rapide de l’écran 63 — les noms viennent de la maquette. */
const OTHER_OPERATIONS = ["Série A 2026", "Prêt Ecobank", "Diligence IFC"];


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
  folders = [],
  activeAccesses = 0,
  preparation,
}: {
  children: ReactNode;
  operationId: string;
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
        ? { label: "Ajouter du contenu", href: `${path}?upload=1` }
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
            Série A 2026
            <Icon name="chevron" />
          </button>
          <div className="v2-ctx-sub">
            <span>Levée en capital</span>
            <span className="v2-badge">Privée</span>
          </div>

          {pickerOpen && (
            <div className="v2-ctx-picker">
              <div className="v2-nav-label">Vos opérations</div>
              {OTHER_OPERATIONS.map((name, index) => (
                <Link data-current={index === 0} href="/v2/operations" key={name}>
                  <i />
                  {name}
                </Link>
              ))}
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
