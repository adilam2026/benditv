"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="text-5xl" aria-hidden>⚠️</p>
      <h1 className="mt-4 text-2xl font-extrabold">Une erreur est survenue</h1>
      <p className="mt-2 text-sm text-stone-500">
        Quelque chose s&apos;est mal passé de notre côté. Vous pouvez réessayer.
      </p>
      <button onClick={reset} className="btn-primary mt-6">Réessayer</button>
    </div>
  );
}
