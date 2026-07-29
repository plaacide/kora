"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { Icon, type IconName } from "./Icon";

const rail: Array<{
  href: string;
  label: string;
  icon: IconName;
  mobile?: boolean;
}> = [
  { href: "/v2", label: "Accueil", icon: "home" },
  { href: "/v2/operations", label: "Opérations", icon: "grid" },
  { href: "/v2/invitations", label: "Invitations", icon: "inbox" },
  { href: "/v2/operations?search=1", label: "Recherche", icon: "search", mobile: true },
];

export function WorkspaceShell({
  children,
  email,
}: {
  children: ReactNode;
  email: string;
}) {
  const path = usePathname();

  return (
    <div className="v2">
      <div className="v2-shell">
        <nav className="v2-rail" aria-label="Navigation principale">
          <Link className="v2-mark" href="/v2" aria-label="Sanza">S</Link>
          {rail.map((item) => (
            <Link
              aria-label={item.label}
              className="v2-rail-link"
              data-active={
                item.href === "/v2/operations"
                  ? path.startsWith("/v2/operations")
                  : path === item.href
              }
              data-mobile-hide={item.mobile}
              href={item.href}
              key={item.label}
            >
              <Icon name={item.icon} />
            </Link>
          ))}
          <span className="v2-rail-space" />
          <Link aria-label="Équipe" className="v2-rail-link" href="/v2/team">
            <Icon name="users" />
          </Link>
          <Link aria-label="Sécurité" className="v2-rail-link" href="/v2/security">
            <Icon name="shield" />
          </Link>
          <Link
            aria-label="Aide"
            className="v2-rail-link"
            data-mobile-hide="true"
            href="/roadmap"
          >
            <Icon name="help" />
          </Link>
          <span className="v2-avatar">{email.slice(0, 2).toUpperCase() || "SA"}</span>
        </nav>
        {children}
      </div>
    </div>
  );
}

const folders = [
  "Société et immatriculation",
  "Gouvernance et actionnariat",
  "Finance et comptabilité",
  "Fiscalité",
  "Commercial et marché",
  "Équipe et RH",
  "Technologie et PI",
  "Impact et ESG",
];

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
}: {
  children: ReactNode;
  operationId: string;
}) {
  const path = usePathname();
  const root = `/v2/operations/${encodeURIComponent(operationId)}`;
  const currentSection =
    Object.keys(pageLabels).find((section) => path.includes(`/${section}`)) ??
    "overview";
  const folder = decodeURIComponent(path.split("/documents/")[1] ?? "").replaceAll("/", " / ");
  const currentLabel = folder || pageLabels[currentSection];
  const nav = [
    ["overview", "Vue d’ensemble"],
    ["preparation", "Préparation"],
    ["access", "Partage et accès"],
    ["lever", "Lever"],
    ["activity", "Activité"],
  ];

  const cta =
    currentSection === "overview"
      ? { label: "Commencer la préparation", href: `${root}/preparation` }
      : currentSection === "documents"
        ? { label: "Ajouter du contenu", href: `${path}?upload=1` }
        : currentSection === "preparation"
          ? { label: "Ajouter une exigence", href: `${path}?new=1` }
          : currentSection === "access"
            ? { label: "Créer un accès", href: `${path}?share=recipient` }
          : currentSection === "lever"
            ? { label: "Ajouter un investisseur", href: `${root}/lever?view=pipeline&panel=add` }
          : currentSection === "activity"
            ? { label: "Exporter", href: `${path}?export=1`, secondary: true }
          : currentSection === "investors"
            ? { label: "Ajouter un investisseur", href: `${path}?panel=add` }
          : null;

  // Chaque écran cherche dans ce qu'il montre, pas dans les documents.
  const searchLabel =
    currentSection === "activity"
      ? "Rechercher dans le journal…"
      : currentSection === "investors"
        ? "Rechercher un investisseur…"
        : "Rechercher";

  const shared = currentSection === "access" || currentSection === "lever";

  return (
    <>
      <aside className="v2-ctx">
        <div className="v2-ctx-head">
          <Link className="v2-back" href="/v2/operations">← Toutes les opérations</Link>
          <div className="v2-ctx-title">
            Série A 2026
            <Icon name="more" />
          </div>
          <div className="v2-ctx-sub">
            <span>Levée en capital</span>
            <span className="v2-badge">Privée</span>
          </div>
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
              {slug === "preparation" && <small>18/24</small>}
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
          <span className="v2-spacer" />
          <span className="v2-privacy" data-shared={shared}>
            <i />{shared ? "Partagée — 3 accès actifs" : "Privée"}
          </span>
          <div className="v2-search"><Icon name="search" />{searchLabel}</div>
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
