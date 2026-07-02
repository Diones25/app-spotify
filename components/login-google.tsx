"use client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { authClient } from "@/lib/auth-client";

export function LoginGoogle() {

  async function loginWithGoogle() {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/me",
      disableRedirect: false,
    });
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <Card className="border-none bg-[#181818] shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight text-white">
            Bem vindo de volta
          </CardTitle>
          <CardDescription className="text-[#a0a0a0]">
            Faça login com sua conta do Google
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center px-6 pb-2">
          <Button
            onClick={loginWithGoogle}
            variant="outline"
            type="button"
            className="cursor-pointer w-full rounded-full border-none bg-[#1DB954] py-3 px-6 text-base font-bold text-black transition-all duration-200 hover:bg-[#1ed760] hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-5">
              <path
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                fill="currentColor"
              />
            </svg>
            Login com Google
          </Button>
        </CardContent>
      </Card>
      <p className="text-center text-xs text-[#a0a0a0]">
        Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade.
      </p>
    </div>
  );
}