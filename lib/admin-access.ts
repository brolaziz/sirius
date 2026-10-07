import "server-only";
import { redirect, notFound } from "next/navigation";
import { readSession } from "@/lib/user";
import { prisma } from "@/lib/prisma";

/** Always read the current role. A cookie or a hidden navigation item grants no access. */
export async function requireAdminUser(adminOnly = false) {
  const session = await readSession();
  if (session.status === "unavailable") throw session.error;
  if (session.status === "signed-out") redirect("/admin/login");
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, role: true, name: true } });
  if (!user || (user.role !== "ADMIN" && (adminOnly || user.role !== "EDITOR"))) notFound();
  return user;
}
