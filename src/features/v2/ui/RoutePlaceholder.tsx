import Link from "next/link";

export function RoutePlaceholder({
  title,
  purpose,
  contract,
  links = [],
}: {
  title: string;
  purpose: string;
  contract: readonly string[];
  /**
   * Les chemins qui partent d'ici, tant que l'écran réel n'existe pas.
   *
   * Un écran d'attente sans issue rend intestable tout ce qui vient après :
   * la coque d'une cohorte ne se vérifie que si l'on peut y entrer.
   */
  links?: readonly { href: string; label: string }[];
}) {
  return (
    <main data-sanza-v2-placeholder>
      <header>
        <p>Sanza V2 — structure fonctionnelle</p>
        <h1>{title}</h1>
        <p>{purpose}</p>
      </header>
      <section aria-labelledby="route-contract">
        <h2 id="route-contract">Contrat de l’écran</h2>
        <ul>
          {contract.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      {links.length > 0 && (
        <section aria-labelledby="route-links">
          <h2 id="route-links">Chemins ouverts</h2>
          <ul>
            {links.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p>
        Ce rendu est volontairement neutre. La composition finale sera
        implémentée à partir des maquettes validées.
      </p>
    </main>
  );
}
