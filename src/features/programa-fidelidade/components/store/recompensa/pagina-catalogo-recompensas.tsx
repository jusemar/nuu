import { Gift } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/features/header";
import { formatarPontosCliente } from "@/features/programa-fidelidade/lib/formatar-fidelidade-cliente";
import type { RecompensaPublica } from "@/features/programa-fidelidade/queries/catalogo/listar-recompensas-publicas";

function CartaoRecompensa({ recompensa, saldo }: { recompensa: RecompensaPublica; saldo: number | null }) {
  const faltantes = saldo === null ? 0 : Math.max(0, recompensa.custoPontos - saldo);
  return <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
    <div className="relative aspect-[4/3] bg-slate-100">
      <Image src={recompensa.imagemUrl || "/produto-sem-foto.webp"} alt={recompensa.nome} fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-contain p-4" />
    </div>
    <CardContent className="space-y-3 p-5">
      <h2 className="line-clamp-2 min-h-12 text-base font-semibold text-slate-950">{recompensa.nome}</h2>
      <p className="text-xl font-bold text-[#0C447C]">{formatarPontosCliente(recompensa.custoPontos)} pontos</p>
      {faltantes > 0 ? <p className="text-sm text-amber-800">Faltam {formatarPontosCliente(faltantes)} pontos</p> : null}
      <Button className="w-full" asChild={faltantes === 0} disabled={faltantes > 0}>
        {faltantes > 0 ? "Saldo insuficiente" : <Link href={`/troque-seus-pontos/${encodeURIComponent(recompensa.slug)}`}>Resgatar</Link>}
      </Button>
    </CardContent>
  </Card>;
}

export function PaginaCatalogoRecompensas({
  catalogo, saldoDisponivel, programaAtivo,
}: {
  catalogo: { recompensas: RecompensaPublica[]; pagina: number; proximaPagina: number | null };
  saldoDisponivel: number | null;
  programaAtivo: boolean;
}) {
  return <><Header /><main className="min-h-screen bg-slate-50">
    <div className="mx-auto max-w-6xl space-y-7 px-4 py-8 md:px-6 md:py-12">
      <header className="space-y-2">
        <p className="flex items-center gap-2 text-sm font-medium text-[#0C447C]"><Gift className="size-4" /> Programa de fidelidade</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">Troque seus pontos</h1>
        <p className="text-slate-600">Use seus pontos para resgatar produtos selecionados.</p>
        {saldoDisponivel !== null ? <p className="text-sm font-medium text-slate-700">Seu saldo: {formatarPontosCliente(saldoDisponivel)} pontos</p>
          : <p className="text-sm text-slate-600">Entre na sua conta para ver seus pontos.</p>}
      </header>
      {!programaAtivo ? <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        O programa está pausado. Seus pontos continuam disponíveis para consulta.
      </p> : null}
      {catalogo.recompensas.length === 0 ? <section className="rounded-xl border bg-white p-8 text-center">
        <h2 className="font-semibold text-slate-950">Nenhuma recompensa disponível no momento</h2>
        <p className="mt-2 text-sm text-slate-600">Volte em breve para conferir novos produtos.</p>
      </section> : <section aria-label="Recompensas disponíveis" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {catalogo.recompensas.map((recompensa) => <CartaoRecompensa key={recompensa.id} recompensa={recompensa} saldo={saldoDisponivel} />)}
      </section>}
      <nav aria-label="Páginas de recompensas" className="flex justify-center gap-3">
        {catalogo.pagina > 1 ? <Button variant="outline" asChild><Link href={`/troque-seus-pontos?pagina=${catalogo.pagina - 1}`}>Anterior</Link></Button> : null}
        {catalogo.proximaPagina ? <Button variant="outline" asChild><Link href={`/troque-seus-pontos?pagina=${catalogo.proximaPagina}`}>Próxima</Link></Button> : null}
      </nav>
    </div>
  </main></>;
}
