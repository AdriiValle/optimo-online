import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { lookupAccountByEmail, athleteByAccountId } from "@/lib/queries";
import type { SessionUser } from "@/lib/types";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const account = await sql().begin(async (tx) => lookupAccountByEmail(tx, email));
        if (!account) return null;
        const ok = await bcrypt.compare(password, account.password_hash);
        if (!ok) return null;

        const athlete =
          account.role === "athlete"
            ? await sql().begin(async (tx) => {
                await tx`select set_config('app.current_role', 'admin', true)`;
                await tx`select set_config('app.account_id', ${account.id}, true)`;
                return athleteByAccountId(tx, account.id);
              })
            : null;

        return {
          id: account.id,
          email: account.email,
          role: account.role,
          athleteId: athlete?.id ?? null
        };
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.athleteId = user.athleteId;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = String(token.id ?? "");
      session.user.role = token.role as SessionUser["role"];
      session.user.athleteId = typeof token.athleteId === "string" ? token.athleteId : null;
      return session;
    }
  }
});

export async function currentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    role: session.user.role,
    athleteId: session.user.athleteId
  };
}

export function rlsFrom(user: SessionUser) {
  return {
    role: user.role,
    accountId: user.id,
    athleteId: user.athleteId
  };
}
