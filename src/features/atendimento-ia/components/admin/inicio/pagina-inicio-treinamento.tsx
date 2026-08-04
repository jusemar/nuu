import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  FlaskConical,
  MessagesSquare,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROTAS_TREINAMENTO_ADMIN_POR_ID } from "@/features/atendimento-ia/constants/admin/rotas-treinamento";

import { EstruturaPaginaTreinamento } from "../compartilhados/estrutura-pagina-treinamento";

const atalhos = [
  {
    descricao:
      "Organize informações da empresa, perguntas e respostas e comportamento.",
    href: ROTAS_TREINAMENTO_ADMIN_POR_ID.conhecimentos,
    icone: BrainCircuit,
    titulo: "Conhecimentos",
  },
  {
    descricao: "Avalie respostas sanitizadas e prepare propostas de melhoria.",
    href: ROTAS_TREINAMENTO_ADMIN_POR_ID.revisoes,
    icone: MessagesSquare,
    titulo: "Revisões",
  },
  {
    descricao: "Compare respostas em um ambiente sem efeitos reais.",
    href: ROTAS_TREINAMENTO_ADMIN_POR_ID.testes,
    icone: FlaskConical,
    titulo: "Testes",
  },
  {
    descricao: "Acompanhe qualidade, uso, custo e evolução.",
    href: ROTAS_TREINAMENTO_ADMIN_POR_ID.metricas,
    icone: CheckCircle2,
    titulo: "Métricas",
  },
] as const;

export function PaginaInicioTreinamento({
  resumo,
}: {
  resumo: {
    avaliacoes: number;
    conhecimentos: number;
    ocorrencias: number;
    totalConversas: number;
    transferencias: number;
    versoes: number;
  };
}) {
  const indicadores = [
    ["Conversas nos últimos 30 dias", resumo.totalConversas],
    ["Avaliações existentes", resumo.avaliacoes],
    ["Transferências", resumo.transferencias],
    ["Ocorrências", resumo.ocorrencias],
    ["Conhecimentos institucionais", resumo.conhecimentos],
    ["Versões existentes", resumo.versoes],
  ] as const;
  return (
    <EstruturaPaginaTreinamento
      titulo="Treinamento da IA"
      descricao="Melhore respostas com revisão humana, testes isolados e publicação controlada."
    >
      <section aria-labelledby="resumo-titulo" className="space-y-3">
        <div>
          <h2 id="resumo-titulo" className="text-lg font-semibold">
            O que precisa de atenção
          </h2>
          <p className="text-muted-foreground text-sm">
            Dados reais disponíveis, agregados sem conteúdo pessoal.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {indicadores.map(([rotulo, valor], indice) => (
            <Card key={rotulo} className="gap-3 py-4">
              <CardContent className="flex items-center justify-between px-4 sm:px-5">
                <div>
                  <p className="text-muted-foreground text-sm">{rotulo}</p>
                  <p className="mt-1 text-2xl font-bold">{valor}</p>
                </div>
                {indice === 3 && valor > 0 ? (
                  <AlertTriangle
                    className="text-destructive size-5"
                    aria-hidden="true"
                  />
                ) : (
                  <Badge variant={valor > 0 ? "warning" : "success"}>
                    {valor > 0 ? "Verificar" : "Em dia"}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <section aria-labelledby="atalhos-titulo" className="space-y-3">
        <h2 id="atalhos-titulo" className="text-lg font-semibold">
          Acessos rápidos
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {atalhos.map(({ descricao, href, icone: Icone, titulo }) => (
            <Card
              key={href}
              className="gap-4 py-5 transition-shadow hover:shadow-md"
            >
              <CardHeader className="px-5">
                <span className="bg-primary/10 text-primary mb-2 w-fit rounded-lg p-2">
                  <Icone className="size-5" aria-hidden="true" />
                </span>
                <CardTitle>{titulo}</CardTitle>
                <CardDescription>{descricao}</CardDescription>
              </CardHeader>
              <CardContent className="px-5">
                <Link
                  className="text-primary focus-visible:ring-ring inline-flex min-h-10 items-center gap-2 rounded-md font-medium focus-visible:ring-2 focus-visible:outline-none"
                  href={href}
                >
                  Abrir módulo{" "}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </EstruturaPaginaTreinamento>
  );
}
