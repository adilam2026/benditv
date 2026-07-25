import { prisma } from "@/lib/prisma";

export async function audit(
  actorId: string | null,
  action: string,
  target?: string,
  detail?: string
): Promise<void> {
  try {
    await prisma.auditLog.create({ data: { actorId, action, target, detail } });
  } catch {
    // Le journal d'audit ne doit jamais faire échouer l'action principale.
  }
}

export async function trackEvent(
  kind: string,
  userId?: string | null,
  payload?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.analyticsEvent.create({
      data: { kind, userId: userId ?? null, payload: payload ? JSON.parse(JSON.stringify(payload)) : undefined },
    });
  } catch {
    // idem : l'analytique est non bloquante
  }
}
