import { z } from "zod";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { apiError, notFound, unauthenticated } from "@/lib/errors";
import { listAthletes } from "@/lib/queries";

const CreateSchema = z.object({
  name: z.string().min(1).max(120),
  sport: z.enum(["football", "running", "other"]),
  email: z.string().email().max(200),
  password: z.string().min(8).max(200)
});

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return unauthenticated();
  if (user.role !== "admin") return notFound();

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get("pageSize") ?? 20) || 20));

  const all = await withRls(rlsFrom(user), (tx) => listAthletes(tx));
  const start = (page - 1) * pageSize;
  const data = all.slice(start, start + pageSize);
  return NextResponse.json({
    data,
    pagination: {
      page,
      pageSize,
      totalItems: all.length,
      totalPages: Math.max(1, Math.ceil(all.length / pageSize))
    }
  });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return unauthenticated();
  if (user.role !== "admin") return notFound();

  const json = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return apiError(422, "VALIDATION_ERROR", "Invalid athlete", parsed.error.flatten());
  }

  const email = parsed.data.email.trim().toLowerCase();
  const hash = await bcrypt.hash(parsed.data.password, 12);

  try {
    const created = await withRls(rlsFrom(user), async (tx) => {
      const accounts = await tx<{ id: string }[]>`
        insert into accounts (email, password_hash, role)
        values (${email}, ${hash}, 'athlete')
        returning id
      `;
      const athletes = await tx<{ id: string; name: string; sport: string }[]>`
        insert into athletes (account_id, name, sport)
        values (${accounts[0].id}, ${parsed.data.name}, ${parsed.data.sport})
        returning id, name, sport
      `;
      await tx`
        insert into integrations (athlete_id, provider, status)
        values (${athletes[0].id}, 'whoop', 'disconnected')
      `;
      return athletes[0];
    });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (err) {
    const msg = String(err);
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return apiError(409, "VALIDATION_ERROR", "Email already exists");
    }
    throw err;
  }
}
