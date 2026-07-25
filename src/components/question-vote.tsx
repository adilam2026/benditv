"use client";

import { useTransition } from "react";
import Link from "next/link";

export function VoteAnswerButton({
  answerId,
  questionId,
  votes,
  loggedIn,
  action,
}: {
  answerId: string;
  questionId: string;
  votes: number;
  loggedIn: boolean;
  action: (answerId: string, questionId: string) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  if (!loggedIn) {
    return (
      <Link href="/connexion" className="hover:text-brand-700">👍 {votes} utile{votes > 1 ? "s" : ""}</Link>
    );
  }
  return (
    <button
      className="hover:text-brand-700"
      disabled={pending}
      onClick={() => startTransition(() => action(answerId, questionId))}
    >
      👍 Utile ({votes})
    </button>
  );
}
