import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    trustedOrigins: [
        "http://localhost:3000",
        "https://app-spotify-rouge.vercel.app",
    ],
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            scope: [
                "https://www.googleapis.com/auth/youtube.readonly",
                "https://www.googleapis.com/auth/userinfo.profile",
                "https://www.googleapis.com/auth/userinfo.email"
            ],
            accessType: "offline",
            prompt: "consent",
            mapProfileToUser: (profile) => {
                return {
                    name: profile.name,
                    email: profile.email,
                    image: profile.picture,
                }
            }
        }
    },
    plugins: [
        nextCookies(),
    ]
});