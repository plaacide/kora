export function RoutePlaceholder({
  title,
  purpose,
  contract,
}: {
  title: string;
  purpose: string;
  contract: readonly string[];
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
      <p>
        Ce rendu est volontairement neutre. La composition finale sera
        implémentée à partir des maquettes validées.
      </p>
    </main>
  );
}
