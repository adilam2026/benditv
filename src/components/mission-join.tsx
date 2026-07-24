"use client";

import { useTransition } from "react";
import Link from "next/link";

export function JoinMissionButton({
  missionId,
  joined,
  loggedIn,
  action,
}: {
  missionId: string;
  joined: boolean;
  loggedIn: boolean;
  action: (missionId: string) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  if (!loggedIn) return <Link href="/connexion" className="btn-primary">Participer</Link>;
  if (joined) return <span className="btn-secondary cursor-default">✓ Vous participez</span>;
  return (
    <button className="btn-primary" disabled={pending} onClick={() => startTransition(() => action(missionId))}>
      {pending ? "Inscription…" : "Participer à la mission"}
    </button>
  );
}
