import Link from "next/link";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import SigInForm from "./components/sign-in-form";
import SignUpForm from "./components/sign-up-form";

export default async function Authentication() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="flex w-full max-w-sm flex-col gap-5">
        <div className="text-center">
          <Link href="/" className="text-base font-semibold text-slate-950">
            Do Rocha
          </Link>
          <p className="mt-1 text-sm text-slate-500">
            Acesse sua conta da loja.
          </p>
        </div>
        <Tabs defaultValue="sign-in">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sign-in">Entrar</TabsTrigger>
            <TabsTrigger value="sign-up">Criar conta</TabsTrigger>
          </TabsList>
          <TabsContent value="sign-in">
            <SigInForm />
          </TabsContent>
          <TabsContent value="sign-up">
            <SignUpForm />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
