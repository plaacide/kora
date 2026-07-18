"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Une page (ou une vignette) chargée SEULEMENT quand elle approche de l'écran.
 *
 * Un mémorandum d'information fait couramment 80 pages : les charger toutes au
 * montage, c'est 80 rendus serveur pour un lecteur qui n'en verra que trois.
 * L'observateur d'intersection déclenche le chargement un écran à l'avance,
 * assez tôt pour que le défilement reste fluide.
 */
export function PageImage({
  versionId,
  page,
  thumb = false,
  alt,
  className,
  onPageCount,
  onVisible,
}: {
  versionId: string;
  page: number;
  thumb?: boolean;
  alt: string;
  className?: string;
  onPageCount?: (n: number) => void;
  onVisible?: (page: number) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const load = async () => {
      if (started.current) return;
      started.current = true;
      try {
        const res = await fetch(
          `/api/viewer/${versionId}/${page}${thumb ? "?s=thumb" : ""}`,
        );
        if (!res.ok) {
          setFailed(true);
          return;
        }
        const count = Number(res.headers.get("X-Page-Count") ?? "0");
        if (count && onPageCount) onPageCount(count);
        const blob = await res.blob();
        setSrc(URL.createObjectURL(blob));
      } catch {
        setFailed(true);
      }
    };

    // rootMargin : on précharge un écran avant l'entrée dans le champ.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            load();
            // Suivi de la page courante pour l'indicateur « 3 / 13 ».
            if (onVisible && e.intersectionRatio > 0.5) onVisible(page);
          }
        }
      },
      { rootMargin: "600px 0px", threshold: [0, 0.51] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [versionId, page, thumb, onPageCount, onVisible]);

  // Libération de l'URL d'objet quand l'image disparaît : sans ça, feuilleter
  // un long document fait grossir la mémoire de l'onglet sans limite.
  useEffect(() => {
    return () => {
      if (src) URL.revokeObjectURL(src);
    };
  }, [src]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="w-full h-auto block"
        />
      ) : (
        <div
          className={cn(
            "w-full h-full",
            failed ? "bg-chip-error-bg" : "skeleton",
          )}
          aria-hidden
        />
      )}
    </div>
  );
}
