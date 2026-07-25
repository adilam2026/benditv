import { prisma } from "@/lib/prisma";
import { sendMail } from "@/server/integrations/mail";

export async function notify(
  userId: string,
  kind: string,
  title: string,
  body?: string,
  link?: string
): Promise<void> {
  const prefs = await prisma.userPreference.findUnique({ where: { userId } });
  if (prefs && !prefs.notifyInApp) return;
  await prisma.notification.create({ data: { userId, kind, title, body, link } });
  if (!prefs || prefs.notifyEmail) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) await sendMail(user.email, title, body ?? title);
  }
}

export async function unreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, readAt: null } });
}
