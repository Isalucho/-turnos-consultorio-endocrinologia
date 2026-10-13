import type { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";
import { clearHits, getRequestIp, isLimited, loginKeys, loginRules, recordHit } from "@/lib/rate-limit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials, request) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const ip = getRequestIp(request);
        const keys = loginKeys(email, ip);
        if (await isLimited(loginRules(email, ip))) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        const isValid = user?.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false;
        if (!user || !isValid) {
          await recordHit([keys.byEmail, keys.byIp]);
          return null;
        }

        await clearHits(keys.byEmail);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
});
