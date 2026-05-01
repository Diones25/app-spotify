"use client"

import { createAuthClient } from "better-auth/react";

const authClient = createAuthClient();

export default function Page() {
  const { data: session } = authClient.useSession();

  return (
    <div>
      <h1>Me: {session?.user?.name}</h1>
    </div>
  );
}