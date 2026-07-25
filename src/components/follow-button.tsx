"use client";

import { useTransition } from "react";

export function FollowButton({
  targetId,
  following,
  path,
  action,
}: {
  targetId: string;
  following: boolean;
  path: string;
  action: (targetId: string, path: string) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      className={following ? "btn-secondary shrink-0" : "btn-primary shrink-0"}
      disabled={pending}
      onClick={() => startTransition(() => action(targetId, path))}
    >
      {following ? "Suivi ✓" : "Suivre"}
    </button>
  );
}
