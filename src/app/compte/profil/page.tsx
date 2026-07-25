import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth/session";
import { updateProfileAction } from "@/server/actions/account";
import { ActionForm } from "@/components/forms";

export const metadata: Metadata = { title: "Mon profil" };

export default async function ProfilePage() {
  const user = await requireUser();
  const [profile, zones] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId: user.id } }),
    prisma.zone.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-extrabold">Mon profil</h1>
      <div className="card p-6">
        <ActionForm action={updateProfileAction} submitLabel="Enregistrer">
          <div>
            <label className="label" htmlFor="displayName">Nom affiché</label>
            <input id="displayName" name="displayName" defaultValue={profile?.displayName ?? user.name} required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="bio">Présentation</label>
            <textarea id="bio" name="bio" rows={3} defaultValue={profile?.bio ?? ""} className="input" placeholder="Ce que vous aimez tester, vos quartiers…" />
          </div>
          <div>
            <label className="label" htmlFor="zoneId">Zone principale</label>
            <select id="zoneId" name="zoneId" defaultValue={profile?.zoneId ?? ""} className="input">
              <option value="">Non précisée</option>
              {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isPublic" defaultChecked={profile?.isPublic ?? true} />
            Profil visible dans la liste des contributeurs
          </label>
        </ActionForm>
      </div>
      <p className="mt-4 text-xs text-stone-400">
        Adresse e-mail du compte : {user.email} — rôle : {user.role.toLowerCase()}.
      </p>
    </div>
  );
}
