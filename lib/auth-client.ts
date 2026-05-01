import { createAuthClient } from "better-auth/client";
import { socialToken } from "better-auth/plugins";

export const authClient = createAuthClient({
    baseURL: "http://localhost:3000",
    redirectUrl: "/",
    plugins: [
        socialToken()
    ]
});