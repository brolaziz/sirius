import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ session: vi.fn(), user: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/user", () => ({ readSession: mocks.session }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: mocks.user } } }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); }, notFound: () => { throw new Error("notFound"); } }));
import { requireAdminUser } from "@/lib/admin-access";
describe("admin authorization", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.session.mockResolvedValue({ status: "signed-in", userId: "owned-user" }); });
  it("sends signed-out visitors to the dedicated login without reading content", async () => {
    mocks.session.mockResolvedValue({ status: "signed-out" });
    await expect(requireAdminUser()).rejects.toThrow("redirect:/admin/login");
    expect(mocks.user).not.toHaveBeenCalled();
  });
  it("refuses students and accounts that no longer exist", async () => {
    mocks.user.mockResolvedValue({ id: "owned-user", role: "STUDENT" });
    await expect(requireAdminUser()).rejects.toThrow("notFound");
    mocks.user.mockResolvedValue(null);
    await expect(requireAdminUser()).rejects.toThrow("notFound");
  });
  it("permits editor content access but reserves analytics for admins", async () => {
    mocks.user.mockResolvedValue({ id: "owned-user", role: "EDITOR" });
    expect((await requireAdminUser()).role).toBe("EDITOR");
    await expect(requireAdminUser(true)).rejects.toThrow("notFound");
  });
  it("checks a revoked role again even with the same signed-in session", async () => {
    mocks.user.mockResolvedValueOnce({ id: "owned-user", role: "ADMIN" }).mockResolvedValueOnce({ id: "owned-user", role: "STUDENT" });
    expect((await requireAdminUser(true)).role).toBe("ADMIN");
    await expect(requireAdminUser()).rejects.toThrow("notFound");
  });
  it("reports a session infrastructure failure without a redirect loop", async () => {
    mocks.session.mockResolvedValue({ status: "unavailable", error: new Error("Session unavailable") });
    await expect(requireAdminUser()).rejects.toThrow("Session unavailable");
    expect(mocks.user).not.toHaveBeenCalled();
  });
});
