import { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Apple from "next-auth/providers/apple";
import LinkedIn from "next-auth/providers/linkedin";
import Credentials from "next-auth/providers/credentials";
import { login as payloadLogin } from "@/app/actions/auth";
import crypto from "crypto";

const providers: NextAuthConfig["providers"] = [];

// Add Credentials provider for email/password login
providers.push(
  Credentials({
    id: "credentials",
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      const result = await payloadLogin(
        credentials.email as string,
        credentials.password as string
      );

      if (result.success && result.user) {
        return {
          id: result.user.id,
          email: result.user.email,
        };
      }

      return null;
    },
  })
);

// Add Google provider if env vars are set
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}

// Add GitHub provider if env vars are set
if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    })
  );
}

// Add Apple provider if env vars are set
if (
  process.env.AUTH_APPLE_ID &&
  process.env.AUTH_APPLE_SECRET &&
  process.env.AUTH_APPLE_TEAM_ID &&
  process.env.AUTH_APPLE_KEY_ID
) {
  providers.push(
    Apple({
      clientId: process.env.AUTH_APPLE_ID,
      clientSecret: process.env.AUTH_APPLE_SECRET,
      authorization: {
        params: {
          scope: "name email",
        },
      },
    })
  );
}

// Add LinkedIn provider if env vars are set
if (process.env.AUTH_LINKEDIN_ID && process.env.AUTH_LINKEDIN_SECRET) {
  providers.push(
    LinkedIn({
      clientId: process.env.AUTH_LINKEDIN_ID,
      clientSecret: process.env.AUTH_LINKEDIN_SECRET,
    })
  );
}

export const authConfig: NextAuthConfig = {
  providers,
  pages: {
    signIn: "/",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      if (account?.provider && account.provider !== "credentials") {
        // For OAuth providers, we might need to create or find user in Payload
        // This would be handled in the signIn callback
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "credentials") {
        return true; // Already authenticated via Payload
      }

      // For OAuth providers, we need to create or find user in Payload
      if (user.email) {
        const { getPayload } = await import("payload");
        const configPromise = await import("../../payload.config");
        const payload = await getPayload({ config: configPromise.default });

        try {
          // Try to find existing user
          const existingUsers = await payload.find({
            collection: "users",
            where: {
              email: {
                equals: user.email,
              },
            },
          });

          if (existingUsers.totalDocs === 0) {
            // Create new user
            await payload.create({
              collection: "users",
              data: {
                email: user.email,
                password: crypto.randomUUID(), // Random password for OAuth users
                role: "user",
              },
            });
          }

          return true;
        } catch (error) {
          console.error("Error creating/finding user:", error);
          return false;
        }
      }

      return false;
    },
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
};

export const getAvailableProviders = () => {
  const available = [];

  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    available.push("google");
  }

  if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
    available.push("github");
  }

  if (
    process.env.AUTH_APPLE_ID &&
    process.env.AUTH_APPLE_SECRET &&
    process.env.AUTH_APPLE_TEAM_ID &&
    process.env.AUTH_APPLE_KEY_ID
  ) {
    available.push("apple");
  }

  if (process.env.AUTH_LINKEDIN_ID && process.env.AUTH_LINKEDIN_SECRET) {
    available.push("linkedin");
  }

  return available;
};