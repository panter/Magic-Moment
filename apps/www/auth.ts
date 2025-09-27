import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Apple from "next-auth/providers/apple";
import LinkedIn from "next-auth/providers/linkedin";
import { getPayload } from "payload";
import configPromise from "./payload.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : []),
    ...(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
      ? [
          GitHub({
            clientId: process.env.AUTH_GITHUB_ID,
            clientSecret: process.env.AUTH_GITHUB_SECRET,
          }),
        ]
      : []),
    ...(process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET
      ? [
          Apple({
            clientId: process.env.AUTH_APPLE_ID,
            clientSecret: process.env.AUTH_APPLE_SECRET,
          }),
        ]
      : []),
    ...(process.env.AUTH_LINKEDIN_ID && process.env.AUTH_LINKEDIN_SECRET
      ? [
          LinkedIn({
            clientId: process.env.AUTH_LINKEDIN_ID,
            clientSecret: process.env.AUTH_LINKEDIN_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Create or update user in Payload CMS
      if (account?.provider && account.provider !== "credentials") {
        const payload = await getPayload({ config: configPromise });

        try {
          // Check if user exists
          const existingUsers = await payload.find({
            collection: "users",
            where: {
              email: {
                equals: user.email,
              },
            },
          });

          if (existingUsers.docs.length === 0) {
            // Create new user
            await payload.create({
              collection: "users",
              data: {
                email: user.email || "",
                name: user.name || "",
                role: "user",
                password: `oauth-${account.provider}-${Date.now()}`, // Set a dummy password for OAuth users
                authProvider: account.provider,
              },
            });
          }

          return true;
        } catch (error) {
          console.error("Error creating/updating user in Payload:", error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, account }) {
      if (account) {
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.provider = token.provider as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
