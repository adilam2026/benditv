export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-8" role="status" aria-label="Chargement">
      <div className="h-8 w-64 animate-pulse rounded-xl bg-stone-200" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="card h-36 animate-pulse bg-stone-100" />
      ))}
      <span className="sr-only">Chargement en cours…</span>
    </div>
  );
}
