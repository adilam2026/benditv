import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth/session";
import { markNotificationsReadAction } from "@/server/actions/account";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unread = notifications.filter((n) => !n.readAt).length;
  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Notifications {unread > 0 && <span className="text-base font-medium text-accent-700">({unread} non lues)</span>}</h1>
        <div className="flex gap-2">
          <Link href="/compte/preferences" className="btn-secondary">Préférences</Link>
          {unread > 0 && (
            <form action={markNotificationsReadAction}>
              <button type="submit" className="btn-secondary">Tout marquer lu</button>
            </form>
          )}
        </div>
      </div>
      <div className="card divide-y divide-stone-100">
        {notifications.map((n) => (
          <div key={n.id} className={`p-4 ${n.readAt ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{!n.readAt && <span className="mr-1 text-accent-600" aria-label="Non lue">●</span>}{n.title}</p>
                {n.body && <p className="text-sm text-stone-500">{n.body}</p>}
                <p className="mt-0.5 text-xs text-stone-400">{n.createdAt.toLocaleDateString("fr-FR")}</p>
              </div>
              {n.link && <Link href={n.link} className="btn-ghost shrink-0">Voir</Link>}
            </div>
          </div>
        ))}
        {notifications.length === 0 && <p className="p-8 text-center text-sm text-stone-500">Aucune notification.</p>}
      </div>
    </div>
  );
}
