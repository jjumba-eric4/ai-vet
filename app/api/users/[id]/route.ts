import { db } from "@/lib/db";
import type { User } from "@/lib/types";

export async function GET(_req: Request, ctx: RouteContext<"/api/users/[id]">) {
  const { id } = await ctx.params;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as unknown as User | undefined;
  if (!user) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(user);
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/users/[id]">) {
  const { id } = await ctx.params;
  const body = (await req.json()) as Partial<Pick<User, "availability" | "busy_until" | "opens_at">>;

  const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as unknown as User | undefined;
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  db.prepare(
    "UPDATE users SET availability = ?, busy_until = ?, opens_at = ? WHERE id = ?"
  ).run(
    body.availability ?? existing.availability,
    body.busy_until ?? null,
    body.opens_at ?? null,
    id
  );

  const updated = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as unknown as User;
  return Response.json(updated);
}
