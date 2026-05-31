"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Edit, ImageIcon, Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { alternarStatusBannerHome } from "../../actions/alternar-status-banner-home";
import { removerBannerHome } from "../../actions/remover-banner-home";
import { salvarBannerHome } from "../../actions/salvar-banner-home";
import {
  MODELOS_SVG_BANNER_HOME,
  POSICOES_BANNER_HOME,
  ROTULOS_POSICAO_BANNER_HOME,
  ROTULOS_TIPO_DESTAQUE_BANNER_HOME,
  TIPOS_BANNER_HOME,
  TIPOS_DESTAQUE_BANNER_HOME,
  VARIACOES_VISUAIS_BANNER_HOME,
} from "../../constants/banners-home";
import type {
  BannerHomeDados,
  FocoImagemBannerHome,
  MetadataImagemBannerHome,
  ModeloSvgBannerHome,
  PosicaoBannerHome,
  TamanhoImagemBannerHome,
  TipoBannerHome,
  TipoDestaqueBannerHome,
  VariacaoVisualBannerHome,
} from "../../types/banners-home.types";
import { UploadImagemBannerHome } from "./upload-imagem-banner-home";

type PaginaBannersHomeAdminProps = {
  banners: BannerHomeDados[];
};

type FormularioBannerHome = {
  id?: string;
  posicao: PosicaoBannerHome;
  tipoBanner: TipoBannerHome;
  ativo: boolean;
  titulo: string;
  subtitulo: string;
  textoApoio: string;
  precoChamada: string;
  textoBotao: string;
  linkBotao: string;
  imagemUrl: string;
  imagemAlt: string;
  imagemMobileUrl: string;
  focoImagem: FocoImagemBannerHome;
  tamanhoImagem: TamanhoImagemBannerHome;
  metadataImagem: MetadataImagemBannerHome | null;
  tipoDestaque: TipoDestaqueBannerHome;
  modeloSvg: ModeloSvgBannerHome;
  variacaoVisual: VariacaoVisualBannerHome;
  ordem: number;
};

const formularioInicial: FormularioBannerHome = {
  posicao: "principal_esquerdo",
  tipoBanner: "svg",
  ativo: false,
  titulo: "",
  subtitulo: "",
  textoApoio: "",
  precoChamada: "",
  textoBotao: "",
  linkBotao: "",
  imagemUrl: "",
  imagemAlt: "",
  imagemMobileUrl: "",
  focoImagem: "center",
  tamanhoImagem: "cover",
  metadataImagem: null,
  tipoDestaque: "oferta",
  modeloSvg: "ondas_comerciais",
  variacaoVisual: "azul_ambar",
  ordem: 0,
};

function criarFormularioPorBanner(
  banner: BannerHomeDados,
): FormularioBannerHome {
  return {
    id: banner.id,
    posicao: banner.posicao,
    tipoBanner: banner.tipoBanner,
    ativo: banner.ativo,
    titulo: banner.titulo ?? "",
    subtitulo: banner.subtitulo ?? "",
    textoApoio: banner.textoApoio ?? "",
    precoChamada: banner.precoChamada ?? "",
    textoBotao: banner.textoBotao ?? "",
    linkBotao: banner.linkBotao ?? "",
    imagemUrl: banner.imagemUrl ?? "",
    imagemAlt: banner.imagemAlt ?? "",
    imagemMobileUrl: banner.imagemMobileUrl ?? "",
    focoImagem: banner.focoImagem as FocoImagemBannerHome,
    tamanhoImagem: banner.tamanhoImagem as TamanhoImagemBannerHome,
    metadataImagem: banner.metadataImagem as MetadataImagemBannerHome | null,
    tipoDestaque: banner.tipoDestaque,
    modeloSvg: banner.modeloSvg as ModeloSvgBannerHome,
    variacaoVisual: banner.variacaoVisual as VariacaoVisualBannerHome,
    ordem: banner.ordem,
  };
}

export function PaginaBannersHomeAdmin({
  banners,
}: PaginaBannersHomeAdminProps) {
  const router = useRouter();
  const formularioRef = useRef<HTMLDivElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [formulario, setFormulario] =
    useState<FormularioBannerHome>(formularioInicial);

  const bannersOrdenados = useMemo(
    () =>
      [...banners].sort((a, b) => {
        if (a.posicao !== b.posicao) return a.posicao.localeCompare(b.posicao);
        if (a.ativo !== b.ativo) return a.ativo ? -1 : 1;
        return a.ordem - b.ordem;
      }),
    [banners],
  );

  const quantidadeAtivosPorPosicao = useMemo(() => {
    return banners.reduce(
      (acc, banner) => {
        if (banner.ativo) acc[banner.posicao] = (acc[banner.posicao] ?? 0) + 1;
        return acc;
      },
      {} as Record<PosicaoBannerHome, number | undefined>,
    );
  }, [banners]);

  const textoAjudaPosicao = POSICOES_BANNER_HOME.find(
    (posicao) => posicao.valor === formulario.posicao,
  )?.descricao;

  function atualizarFormulario<TCampo extends keyof FormularioBannerHome>(
    campo: TCampo,
    valor: FormularioBannerHome[TCampo],
  ) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  }

  function novoBanner(posicao?: PosicaoBannerHome) {
    setFormulario({
      ...formularioInicial,
      posicao: posicao ?? formulario.posicao,
    });
    formularioRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function editarBanner(banner: BannerHomeDados) {
    setFormulario(criarFormularioPorBanner(banner));
    formularioRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function executarAcao(
    acao: () => Promise<{ success: boolean }>,
    mensagemSucesso: string,
  ) {
    startTransition(async () => {
      try {
        await acao();
        toast.success(mensagemSucesso);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Não foi possível salvar.",
        );
      }
    });
  }

  function salvarFormulario() {
    executarAcao(
      () => salvarBannerHome(formulario),
      formulario.id
        ? "Banner atualizado com sucesso."
        : "Banner criado com sucesso.",
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
      <div className="space-y-2">
        <p className="text-sm font-medium text-blue-600">Configurações</p>
        <h1 className="text-2xl font-semibold tracking-normal text-gray-950 md:text-3xl">
          Banners da Home
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-gray-600">
          Escolha a posição onde este banner será exibido na Home. O banner
          principal aceita múltiplos ativos em carrossel; o secundário mantém
          apenas um banner fixo ativo.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {POSICOES_BANNER_HOME.map((posicao) => (
          <button
            key={posicao.valor}
            type="button"
            onClick={() => novoBanner(posicao.valor)}
            className={`rounded-lg border p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/40 ${
              formulario.posicao === posicao.valor
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-gray-950">{posicao.rotulo}</p>
              {quantidadeAtivosPorPosicao[posicao.valor] && (
                <Badge className="bg-green-100 text-green-800">
                  {quantidadeAtivosPorPosicao[posicao.valor]} ativo
                  {quantidadeAtivosPorPosicao[posicao.valor] === 1 ? "" : "s"}
                </Badge>
              )}
            </div>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              {posicao.descricao}
            </p>
          </button>
        ))}
      </div>

      <Card ref={formularioRef}>
        <CardHeader>
          <CardTitle>
            {formulario.id ? "Editar banner" : "Criar banner"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
            <p>
              Banner principal permite múltiplos banners ativos e funciona como
              carrossel.
            </p>
            <p>
              Banner secundário permite apenas um banner fixo. Ao ativar outro,
              o anterior é desativado automaticamente.
            </p>
            <p>
              Banners inativos ficam salvos, mas não aparecem para o cliente.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Posição do banner</Label>
              <Select
                value={formulario.posicao}
                onValueChange={(valor: PosicaoBannerHome) =>
                  atualizarFormulario("posicao", valor)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Escolha a posição" />
                </SelectTrigger>
                <SelectContent>
                  {POSICOES_BANNER_HOME.map((posicao) => (
                    <SelectItem key={posicao.valor} value={posicao.valor}>
                      {posicao.rotulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs leading-5 text-gray-500">
                {textoAjudaPosicao}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Tipo do banner</Label>
              <Select
                value={formulario.tipoBanner}
                onValueChange={(valor: TipoBannerHome) =>
                  atualizarFormulario("tipoBanner", valor)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_BANNER_HOME.map((tipo) => (
                    <SelectItem key={tipo.valor} value={tipo.valor}>
                      {tipo.rotulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs leading-5 text-gray-500">
                {
                  TIPOS_BANNER_HOME.find(
                    (tipo) => tipo.valor === formulario.tipoBanner,
                  )?.descricao
                }
              </p>
            </div>

            <div className="space-y-2">
              <Label>Tipo de destaque</Label>
              <Select
                value={formulario.tipoDestaque}
                onValueChange={(valor: TipoDestaqueBannerHome) =>
                  atualizarFormulario("tipoDestaque", valor)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_DESTAQUE_BANNER_HOME.map((tipo) => (
                    <SelectItem key={tipo.valor} value={tipo.valor}>
                      {tipo.rotulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Status</Label>
                <p className="text-xs text-gray-500">
                  Inativo não aparece na Home.
                </p>
              </div>
              <Switch
                checked={formulario.ativo}
                onCheckedChange={(ativo) => atualizarFormulario("ativo", ativo)}
              />
            </div>
          </div>

          {formulario.tipoBanner === "imagem" && (
            <UploadImagemBannerHome
              posicao={formulario.posicao}
              imagemUrl={formulario.imagemUrl}
              imagemAlt={formulario.imagemAlt}
              metadataImagem={formulario.metadataImagem}
              onImagemChange={(dados) => {
                atualizarFormulario("imagemUrl", dados.imagemUrl);
                atualizarFormulario("imagemAlt", dados.imagemAlt);
                atualizarFormulario("metadataImagem", dados.metadataImagem);
              }}
            />
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Título principal
                {formulario.tipoBanner === "svg" ? " *" : ""}
              </Label>
              <Input
                value={formulario.titulo}
                onChange={(event) =>
                  atualizarFormulario("titulo", event.target.value)
                }
                placeholder="Ex: Oferta especial da semana"
              />
              <p className="text-xs leading-5 text-gray-500">
                {formulario.tipoBanner === "svg"
                  ? "Obrigatório para banners SVG."
                  : "Opcional para banners de imagem pronta."}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Subtítulo</Label>
              <Input
                value={formulario.subtitulo}
                onChange={(event) =>
                  atualizarFormulario("subtitulo", event.target.value)
                }
                placeholder="Ex: Oferta especial"
              />
            </div>
            <div className="space-y-2">
              <Label>Preço ou chamada de oferta</Label>
              <Input
                value={formulario.precoChamada}
                onChange={(event) =>
                  atualizarFormulario("precoChamada", event.target.value)
                }
                placeholder="Ex: R$ 399,00"
              />
            </div>
            <div className="space-y-2">
              <Label>Ordem de exibição</Label>
              <Input
                type="number"
                min={0}
                value={formulario.ordem}
                onChange={(event) =>
                  atualizarFormulario("ordem", Number(event.target.value))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Texto de apoio</Label>
            <Textarea
              value={formulario.textoApoio}
              onChange={(event) =>
                atualizarFormulario("textoApoio", event.target.value)
              }
              placeholder="Separe frases com |. Ex: Frete gratis|12x sem juros|Entrega hoje"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {formulario.tipoBanner === "imagem" && (
              <div className="space-y-2 md:col-span-2">
                <Label>Texto alternativo da imagem</Label>
                <Input
                  value={formulario.imagemAlt}
                  onChange={(event) =>
                    atualizarFormulario("imagemAlt", event.target.value)
                  }
                  placeholder="Ex: Campanha de pneus com desconto"
                />
                <p className="text-xs leading-5 text-gray-500">
                  Texto usado por leitores de tela e SEO. Descreva a campanha de
                  forma objetiva.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Texto do botão</Label>
              <Input
                value={formulario.textoBotao}
                onChange={(event) =>
                  atualizarFormulario("textoBotao", event.target.value)
                }
                placeholder="Ex: Comprar agora"
              />
            </div>
            <div className="space-y-2">
              <Label>Link do botão</Label>
              <Input
                value={formulario.linkBotao}
                onChange={(event) =>
                  atualizarFormulario("linkBotao", event.target.value)
                }
                placeholder="Ex: /categoria/promocoes"
              />
            </div>
          </div>

          {formulario.tipoBanner === "svg" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Modelo visual SVG/background</Label>
                <Select
                  value={formulario.modeloSvg}
                  onValueChange={(valor: ModeloSvgBannerHome) =>
                    atualizarFormulario("modeloSvg", valor)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELOS_SVG_BANNER_HOME.map((modelo) => (
                      <SelectItem key={modelo.valor} value={modelo.valor}>
                        {modelo.rotulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Cor/variação visual</Label>
                <Select
                  value={formulario.variacaoVisual}
                  onValueChange={(valor: VariacaoVisualBannerHome) =>
                    atualizarFormulario("variacaoVisual", valor)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VARIACOES_VISUAIS_BANNER_HOME.map((variacao) => (
                      <SelectItem key={variacao.valor} value={variacao.valor}>
                        {variacao.rotulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Enquadramento da imagem</Label>
                <Select
                  value={formulario.tamanhoImagem}
                  onValueChange={(valor: TamanhoImagemBannerHome) =>
                    atualizarFormulario("tamanhoImagem", valor)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cover">Preencher área</SelectItem>
                    <SelectItem value="contain">
                      Mostrar imagem inteira
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Foco visual</Label>
                <Select
                  value={formulario.focoImagem}
                  onValueChange={(valor: FocoImagemBannerHome) =>
                    atualizarFormulario("focoImagem", valor)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="center">Centro</SelectItem>
                    <SelectItem value="top">Topo</SelectItem>
                    <SelectItem value="bottom">Base</SelectItem>
                    <SelectItem value="left">Esquerda</SelectItem>
                    <SelectItem value="right">Direita</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={salvarFormulario}
              disabled={isPending}
            >
              <Save className="h-4 w-4" />
              Salvar alterações
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => novoBanner()}
            >
              <Plus className="h-4 w-4" />
              Novo banner
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Banners cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {bannersOrdenados.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-sm text-gray-500">
              Nenhum banner cadastrado ainda. Crie o primeiro banner para
              substituir o fallback seguro da Home.
            </p>
          ) : (
            <div className="space-y-3">
              {bannersOrdenados.map((banner) => (
                <div
                  key={banner.id}
                  className="flex flex-col justify-between gap-4 rounded-lg border p-4 md:flex-row md:items-center"
                >
                  <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-slate-50">
                      {banner.tipoBanner === "imagem" && banner.imagemUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={banner.imagemUrl}
                          alt={banner.imagemAlt ?? banner.titulo ?? "Banner"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-100 to-amber-100 text-blue-700">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-gray-950">
                          {banner.titulo ?? "Banner de imagem sem título"}
                        </p>
                        <Badge variant={banner.ativo ? "default" : "secondary"}>
                          {banner.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                        <Badge variant="outline">
                          {
                            ROTULOS_TIPO_DESTAQUE_BANNER_HOME[
                              banner.tipoDestaque
                            ]
                          }
                        </Badge>
                        <Badge variant="outline">
                          {banner.tipoBanner === "imagem" ? "Imagem" : "SVG"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {ROTULOS_POSICAO_BANNER_HOME[banner.posicao]} • Ordem{" "}
                        {banner.ordem}
                      </p>
                      <p className="text-xs text-gray-500">
                        {banner.ativo
                          ? "Este banner aparece para o cliente."
                          : "Este banner está salvo, mas não aparece na Home."}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Switch
                      checked={banner.ativo}
                      disabled={isPending}
                      onCheckedChange={(ativo) =>
                        executarAcao(
                          () =>
                            alternarStatusBannerHome({ id: banner.id, ativo }),
                          ativo && banner.posicao === "secundario_direito"
                            ? "Banner secundário ativado. Outro secundário ativo foi desativado."
                            : ativo
                              ? "Banner principal ativado no carrossel."
                              : "Banner desativado.",
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => editarBanner(banner)}
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={isPending}
                      onClick={() =>
                        executarAcao(
                          () => removerBannerHome(banner.id),
                          "Banner removido com sucesso.",
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                      Remover
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
