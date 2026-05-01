import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { socialToken } from "better-auth/plugins";

export const auth = betterAuth({
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            scope: [
                "https://www.googleapis.com/auth/youtube.readonly",
                "https://www.googleapis.com/auth/userinfo.profile",
                "https://www.googleapis.com/auth/userinfo.email"
            ]
        }
    },
    plugins: [
        nextCookies(),
        socialToken()
    ]
});