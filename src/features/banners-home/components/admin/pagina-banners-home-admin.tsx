"use client";

import {
  CalendarDays,
  Copy,
  Edit3,
  Eye,
  FileImage,
  Home,
  ImageIcon,
  Link2,
  Monitor,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  Smartphone,
  Store,
  Tablet,
  Trash2,
  Upload,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { alternarStatusBannerHome } from "../../actions/alternar-status-banner-home";
import { removerBannerHome } from "../../actions/remover-banner-home";
import { salvarBannerHome } from "../../actions/salvar-banner-home";
import {
  POSICOES_BANNER_HOME,
  ROTULOS_POSICAO_BANNER_HOME,
  TIPOS_DESTAQUE_BANNER_HOME,
} from "../../constants/banners-home";
import type {
  BannerHomeAdminDados,
  FocoImagemBannerHome,
  MetadataImagemBannerHome,
  PosicaoBannerHome,
  TamanhoImagemBannerHome,
  TipoBannerHome,
  TipoDestaqueBannerHome,
} from "../../types/banners-home.types";
import { UploadImagemBannerHome } from "./upload-imagem-banner-home";

type PropriedadesPagina = { banners: BannerHomeAdminDados[] };
type DispositivoPreview = "desktop" | "tablet" | "mobile";
type TipoLink = "sem_link" | "interno" | "externo";

type FormularioBanner = {
  id?: string;
  nome: string;
  posicao: PosicaoBannerHome;
  tipoBanner: TipoBannerHome;
  tipoDestaque: TipoDestaqueBannerHome;
  ativo: boolean;
  titulo: string;
  subtitulo: string;
  textoApoio: string;
  precoChamada: string;
  textoBotao: string;
  tipoLink: TipoLink;
  linkBotao: string;
  imagemUrl: string;
  imagemMobileUrl: string;
  imagemAlt: string;
  focoImagem: FocoImagemBannerHome;
  tamanhoImagem: TamanhoImagemBannerHome;
  metadataImagem: MetadataImagemBannerHome | null;
  modeloSvg:
    | "ondas_comerciais"
    | "formas_promocionais"
    | "linhas_institucionais";
  variacaoVisual: "azul_ambar" | "verde" | "grafite";
  corFundo: string;
  corTexto: string;
  corDestaque: string;
  dataInicio: string;
  dataFim: string;
  ordem: number;
};

const formularioInicial: FormularioBanner = {
  nome: "",
  posicao: "principal_esquerdo",
  tipoBanner: "imagem",
  tipoDestaque: "institucional",
  ativo: false,
  titulo: "",
  subtitulo: "",
  textoApoio: "",
  precoChamada: "",
  textoBotao: "",
  tipoLink: "sem_link",
  linkBotao: "",
  imagemUrl: "",
  imagemMobileUrl: "",
  imagemAlt: "",
  focoImagem: "center",
  tamanhoImagem: "cover",
  metadataImagem: null,
  modeloSvg: "linhas_institucionais",
  variacaoVisual: "azul_ambar",
  corFundo: "#164e63",
  corTexto: "#ffffff",
  corDestaque: "#f59e0b",
  dataInicio: "",
  dataFim: "",
  ordem: 0,
};

function dataParaCampo(data: Date | null) {
  return data ? new Date(data).toISOString().slice(0, 16) : "";
}

function formularioDoBanner(banner: BannerHomeAdminDados): FormularioBanner {
  return {
    id: banner.id.startsWith("fallback-") ? undefined : banner.id,
    nome: banner.nome ?? banner.titulo ?? "",
    posicao: banner.posicao,
    tipoBanner: banner.tipoBanner,
    tipoDestaque: banner.tipoDestaque,
    ativo: banner.ativo,
    titulo: banner.titulo ?? "",
    subtitulo: banner.subtitulo ?? "",
    textoApoio: banner.textoApoio ?? "",
    precoChamada: banner.precoChamada ?? "",
    textoBotao: banner.textoBotao ?? "",
    tipoLink: banner.linkBotao
      ? banner.linkBotao.startsWith("/")
        ? "interno"
        : "externo"
      : "sem_link",
    linkBotao: banner.linkBotao ?? "",
    imagemUrl: banner.imagemUrl ?? "",
    imagemMobileUrl: banner.imagemMobileUrl ?? "",
    imagemAlt: banner.imagemAlt ?? "",
    focoImagem: banner.focoImagem as FocoImagemBannerHome,
    tamanhoImagem: banner.tamanhoImagem as TamanhoImagemBannerHome,
    metadataImagem: banner.metadataImagem as MetadataImagemBannerHome | null,
    modeloSvg: banner.modeloSvg as FormularioBanner["modeloSvg"],
    variacaoVisual: banner.variacaoVisual as FormularioBanner["variacaoVisual"],
    corFundo: banner.corFundo ?? "#164e63",
    corTexto: banner.corTexto ?? "#ffffff",
    corDestaque: banner.corDestaque ?? "#f59e0b",
    dataInicio: dataParaCampo(banner.dataInicio),
    dataFim: dataParaCampo(banner.dataFim),
    ordem: banner.ordem,
  };
}

function paginaDaPosicao(posicao: PosicaoBannerHome) {
  return posicao === "produto_institucional" ? "Produto" : "Home";
}

function obterDataValida(data: Date | null | undefined) {
  if (!data) return null;
  const dataConvertida = new Date(data);
  const timestamp = dataConvertida.getTime();
  return Number.isFinite(timestamp) && timestamp > 0 ? dataConvertida : null;
}

function formatarAtualizacao(updatedAt: Date | null, createdAt: Date | null) {
  const data = obterDataValida(updatedAt) ?? obterDataValida(createdAt);
  if (!data) return "Data não disponível";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(data));
}

function MiniaturaBanner({ banner }: { banner: BannerHomeAdminDados }) {
  return (
    <div className="group/preview bg-muted relative h-[68px] w-28 shrink-0 overflow-hidden rounded-lg border sm:h-[76px] sm:w-36">
      {banner.tipoBanner === "imagem" && banner.imagemUrl ? (
        <Image
          src={banner.imagemUrl}
          alt={banner.imagemAlt ?? banner.titulo ?? "Banner"}
          fill
          sizes="144px"
          className="object-cover"
        />
      ) : (
        <div
          className="flex size-full items-center p-3"
          style={{
            backgroundColor: banner.corFundo ?? "#164e63",
            color: banner.corTexto ?? "#ffffff",
          }}
        >
          <div className="absolute -top-8 -right-6 size-20 rounded-full bg-white/15 blur-sm" />
          <p className="relative line-clamp-2 text-xs font-bold">
            {banner.titulo ?? "Banner SVG"}
          </p>
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover/preview:opacity-100">
        <Eye className="size-5 text-white" />
      </div>
    </div>
  );
}

function CartaoBanner({
  banner,
  pendente,
  aoEditar,
  aoPreVisualizar,
  aoDuplicar,
  aoExcluir,
  aoAlternar,
}: {
  banner: BannerHomeAdminDados;
  pendente: boolean;
  aoEditar: () => void;
  aoPreVisualizar: () => void;
  aoDuplicar: () => void;
  aoExcluir: () => void;
  aoAlternar: (ativo: boolean) => void;
}) {
  const ehFallback = banner.id.startsWith("fallback-");

  return (
    <Card className="gap-0 py-0 shadow-xs transition-shadow hover:shadow-sm">
      <CardContent className="grid grid-cols-[112px_minmax(0,1fr)] gap-3 p-3.5 sm:flex sm:items-center">
        <MiniaturaBanner banner={banner} />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-foreground truncate font-semibold">
              {banner.nome ?? banner.titulo ?? "Banner sem nome"}
            </p>
            <Badge variant="outline" className="h-5 text-[10px] font-medium">
              {banner.tipoBanner === "imagem" ? "Imagem" : "SVG"}
            </Badge>
          </div>
          <p className="text-muted-foreground truncate text-xs">
            {paginaDaPosicao(banner.posicao)} ·{" "}
            {ROTULOS_POSICAO_BANNER_HOME[banner.posicao]} · Sem campanha
          </p>
          <p className="text-muted-foreground/80 flex items-center gap-1.5 text-[11px]">
            <CalendarDays className="size-3" /> Atualizado em{" "}
            {formatarAtualizacao(banner.updatedAt, banner.createdAt)}
          </p>
        </div>
        <div className="col-span-2 flex items-center justify-between gap-3 border-t pt-3 sm:justify-end sm:border-0 sm:pt-0">
          <div className="flex min-w-24 items-center gap-2">
            <Switch
              checked={banner.ativo}
              disabled={pendente || ehFallback}
              onCheckedChange={aoAlternar}
              aria-label={`Alterar status de ${banner.nome ?? banner.titulo ?? "banner"}`}
            />
            <span className="text-xs font-medium">
              {banner.ativo ? "Ativo" : "Inativo"}
            </span>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={aoEditar}>
            <Edit3 className="size-3.5" /> Editar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Mais ações"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={aoPreVisualizar}>
                <Eye /> Pré-visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={aoDuplicar}>
                <Copy /> Duplicar
              </DropdownMenuItem>
              {!ehFallback && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={aoExcluir}>
                    <Trash2 /> Excluir
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

function ControleCor({
  rotulo,
  valor,
  aoMudar,
}: {
  rotulo: string;
  valor: string;
  aoMudar: (valor: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{rotulo}</Label>
      <div className="bg-background flex h-10 items-center gap-2 rounded-md border px-2">
        <input
          type="color"
          value={valor}
          onChange={(evento) => aoMudar(evento.target.value)}
          className="size-7 cursor-pointer rounded border-0 bg-transparent p-0"
        />
        <Input
          value={valor.toUpperCase()}
          onChange={(evento) => aoMudar(evento.target.value)}
          className="h-8 border-0 px-1 font-mono text-xs shadow-none focus-visible:ring-0"
          maxLength={7}
        />
      </div>
    </div>
  );
}

function PreviewEditor({ formulario }: { formulario: FormularioBanner }) {
  const [dispositivo, setDispositivo] = useState<DispositivoPreview>("desktop");
  const largura =
    dispositivo === "mobile"
      ? "max-w-[280px]"
      : dispositivo === "tablet"
        ? "max-w-[520px]"
        : "max-w-full";
  const imagem =
    dispositivo === "mobile" && formulario.imagemMobileUrl
      ? formulario.imagemMobileUrl
      : formulario.imagemUrl;

  return (
    <aside className="bg-muted/25 flex min-h-0 flex-col lg:h-[calc(100vh-81px)] lg:border-l">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <p className="text-sm font-semibold">Pré-visualização</p>
        <div className="bg-background flex rounded-lg border p-1">
          {(
            [
              ["desktop", Monitor, "Desktop"],
              ["tablet", Tablet, "Tablet"],
              ["mobile", Smartphone, "Mobile"],
            ] as const
          ).map(([valor, Icone, rotulo]) => (
            <button
              key={valor}
              type="button"
              onClick={() => setDispositivo(valor)}
              className={`flex size-8 items-center justify-center rounded-md transition ${dispositivo === valor ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              title={rotulo}
              aria-label={`Visualizar em ${rotulo}`}
            >
              <Icone className="size-4" />
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="bg-background/70 flex min-h-[360px] flex-1 items-center justify-center rounded-xl border border-dashed p-5">
          <div
            className={`relative w-full overflow-hidden rounded-xl shadow-sm transition-[max-width] ${largura}`}
          >
            <div
              className="relative flex min-h-48 items-center overflow-hidden p-7"
              style={{
                backgroundColor: formulario.corFundo,
                color: formulario.corTexto,
              }}
            >
              {formulario.tipoBanner === "imagem" && imagem ? (
                <Image
                  src={imagem}
                  alt={formulario.imagemAlt || "Pré-visualização"}
                  fill
                  sizes="(max-width: 768px) 280px, 600px"
                  className="object-cover"
                />
              ) : (
                <>
                  <div
                    className="absolute -top-20 -right-14 size-52 rounded-full opacity-25 blur-2xl"
                    style={{ backgroundColor: formulario.corDestaque }}
                  />
                  <div
                    className="absolute right-10 -bottom-14 size-28 rounded-full border-[18px] opacity-20"
                    style={{ borderColor: formulario.corDestaque }}
                  />
                  <div className="relative z-10 max-w-[78%]">
                    <p className="text-[10px] font-bold tracking-[0.18em] uppercase opacity-75">
                      {formulario.subtitulo || "Subtítulo"}
                    </p>
                    <h3 className="mt-2 text-2xl leading-tight font-bold">
                      {formulario.titulo || "Título do banner"}
                    </h3>
                    {formulario.textoApoio && (
                      <p className="mt-2 text-xs leading-5 opacity-80">
                        {formulario.textoApoio}
                      </p>
                    )}
                    {formulario.textoBotao && (
                      <span
                        className="mt-4 inline-flex rounded-full px-4 py-2 text-xs font-semibold"
                        style={{ backgroundColor: formulario.corDestaque }}
                      >
                        {formulario.textoBotao}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <p className="text-muted-foreground mt-3 text-center text-xs">
          {paginaDaPosicao(formulario.posicao)} ·{" "}
          {ROTULOS_POSICAO_BANNER_HOME[formulario.posicao]} ·{" "}
          {formulario.tipoBanner === "imagem" ? "Imagem" : "SVG"}
        </p>
      </div>
    </aside>
  );
}

export function PaginaBannersHomeAdmin({ banners }: PropriedadesPagina) {
  const router = useRouter();
  const [pendente, iniciarTransicao] = useTransition();
  const [editorAberto, setEditorAberto] = useState(false);
  const [modoEditor, setModoEditor] = useState<"novo" | "editar">("novo");
  const [formulario, setFormulario] =
    useState<FormularioBanner>(formularioInicial);
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState("todas");
  const [posicao, setPosicao] = useState("todas");
  const [status, setStatus] = useState("todos");
  const [tipo, setTipo] = useState("todos");
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [erroNome, setErroNome] = useState<string | null>(null);

  const atualizar = <Campo extends keyof FormularioBanner>(
    campo: Campo,
    valor: FormularioBanner[Campo],
  ) => setFormulario((atual) => ({ ...atual, [campo]: valor }));

  const bannersFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return banners.filter((banner) => {
      const textos = [
        banner.nome,
        banner.titulo,
        paginaDaPosicao(banner.posicao),
        ROTULOS_POSICAO_BANNER_HOME[banner.posicao],
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("pt-BR");
      return (
        (!termo || textos.includes(termo)) &&
        (pagina === "todas" ||
          paginaDaPosicao(banner.posicao).toLocaleLowerCase() === pagina) &&
        (posicao === "todas" || banner.posicao === posicao) &&
        (status === "todos" ||
          (status === "ativos" ? banner.ativo : !banner.ativo)) &&
        (tipo === "todos" || banner.tipoBanner === tipo)
      );
    });
  }, [banners, busca, pagina, posicao, status, tipo]);

  const grupos = [
    {
      chave: "home",
      titulo: "HOME",
      icone: Home,
      banners: bannersFiltrados.filter(
        (banner) => banner.posicao !== "produto_institucional",
      ),
    },
    {
      chave: "produto",
      titulo: "PRODUTO",
      icone: Package,
      banners: bannersFiltrados.filter(
        (banner) => banner.posicao === "produto_institucional",
      ),
    },
  ].filter((grupo) => grupo.banners.length > 0);

  function executar(
    acao: () => Promise<{ success: boolean }>,
    sucesso: string,
    aoConcluir?: () => void,
  ) {
    iniciarTransicao(async () => {
      try {
        await acao();
        toast.success(sucesso);
        aoConcluir?.();
        router.refresh();
      } catch (erro) {
        toast.error(
          erro instanceof Error
            ? erro.message
            : "Não foi possível concluir a ação.",
        );
      }
    });
  }

  function novoBanner(
    posicaoInicial: PosicaoBannerHome = "principal_esquerdo",
  ) {
    setModoEditor("novo");
    setErroNome(null);
    setFormulario({ ...formularioInicial, posicao: posicaoInicial });
    setEditorAberto(true);
  }

  function editarBanner(banner: BannerHomeAdminDados) {
    setModoEditor("editar");
    setErroNome(null);
    setFormulario(formularioDoBanner(banner));
    setEditorAberto(true);
  }

  function salvar() {
    if (!formulario.nome.trim()) {
      setErroNome("Informe o nome administrativo do banner.");
      return;
    }

    setErroNome(null);
    executar(
      () =>
        salvarBannerHome({
          ...formulario,
          linkBotao:
            formulario.tipoLink === "sem_link" ? "" : formulario.linkBotao,
          dataInicio: formulario.dataInicio
            ? new Date(formulario.dataInicio)
            : null,
          dataFim: formulario.dataFim ? new Date(formulario.dataFim) : null,
        }),
      formulario.id
        ? "Banner atualizado com sucesso."
        : "Banner criado com sucesso.",
      () => setEditorAberto(false),
    );
  }

  function duplicar(banner: BannerHomeAdminDados) {
    const copia = formularioDoBanner(banner);
    executar(
      () =>
        salvarBannerHome({
          ...copia,
          id: undefined,
          nome: `${copia.nome || copia.titulo} (cópia)`,
          ativo: false,
          dataInicio: copia.dataInicio ? new Date(copia.dataInicio) : null,
          dataFim: copia.dataFim ? new Date(copia.dataFim) : null,
        }),
      "Banner duplicado como inativo.",
    );
  }

  const totalAtivos = banners.filter((banner) => banner.ativo).length;

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6 lg:p-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
            <FileImage className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">
              Gestão de Banners
            </h1>
            <p className="text-muted-foreground text-sm">
              Crie e organize banners de todas as páginas da loja
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href="/" target="_blank">
              <Store className="size-4" /> Ver loja
            </a>
          </Button>
          <Button onClick={() => novoBanner()}>
            <Plus className="size-4" /> Novo banner
          </Button>
        </div>
      </header>

      <div className="bg-card grid grid-cols-3 divide-x rounded-xl border shadow-xs">
        {[
          ["TOTAL", banners.length],
          ["ATIVOS", totalAtivos],
          ["INATIVOS", banners.length - totalAtivos],
        ].map(([rotulo, valor]) => (
          <div key={rotulo} className="px-4 py-3.5">
            <p className="text-muted-foreground text-[10px] font-semibold tracking-wider">
              {rotulo}
            </p>
            <p className="mt-0.5 text-xl font-bold">{valor}</p>
          </div>
        ))}
      </div>

      <Collapsible
        open={filtrosAbertos}
        onOpenChange={setFiltrosAbertos}
        className="bg-card rounded-xl border p-3 shadow-xs"
      >
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar por nome, página ou campanha..."
              className="pl-9"
            />
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <SlidersHorizontal className="size-4" />
              <span className="sr-only">Abrir filtros</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <div className="mt-3 hidden gap-2 md:grid md:grid-cols-4">
          <Select value={pagina} onValueChange={setPagina}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as páginas</SelectItem>
              <SelectItem value="home">Home</SelectItem>
              <SelectItem value="produto">Produto</SelectItem>
            </SelectContent>
          </Select>
          <Select value={posicao} onValueChange={setPosicao}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as posições</SelectItem>
              {POSICOES_BANNER_HOME.map((item) => (
                <SelectItem key={item.valor} value={item.valor}>
                  {item.rotulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="ativos">Ativos</SelectItem>
              <SelectItem value="inativos">Inativos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="imagem">Imagem</SelectItem>
              <SelectItem value="svg">SVG editável</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CollapsibleContent
          forceMount
          className="data-[state=closed]:hidden md:hidden"
        >
          <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-4">
            <Select value={pagina} onValueChange={setPagina}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as páginas</SelectItem>
                <SelectItem value="home">Home</SelectItem>
                <SelectItem value="produto">Produto</SelectItem>
              </SelectContent>
            </Select>
            <Select value={posicao} onValueChange={setPosicao}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as posições</SelectItem>
                {POSICOES_BANNER_HOME.map((item) => (
                  <SelectItem key={item.valor} value={item.valor}>
                    {item.rotulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="ativos">Ativos</SelectItem>
                <SelectItem value="inativos">Inativos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="imagem">Imagem</SelectItem>
                <SelectItem value="svg">SVG editável</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="space-y-7">
        {grupos.map(({ chave, titulo, icone: Icone, banners: itens }) => (
          <section key={chave} className="space-y-3">
            <div className="flex items-center gap-2">
              <Icone className="text-muted-foreground size-4" />
              <h2 className="text-xs font-bold tracking-[0.16em]">{titulo}</h2>
              <Badge
                variant="secondary"
                className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px]"
              >
                {itens.length}
              </Badge>
            </div>
            <div className="space-y-2.5">
              {itens.map((banner) => (
                <CartaoBanner
                  key={banner.id}
                  banner={banner}
                  pendente={pendente}
                  aoEditar={() => editarBanner(banner)}
                  aoPreVisualizar={() => editarBanner(banner)}
                  aoDuplicar={() => duplicar(banner)}
                  aoExcluir={() =>
                    executar(
                      () => removerBannerHome(banner.id),
                      "Banner excluído.",
                    )
                  }
                  aoAlternar={(ativo) =>
                    executar(
                      () => alternarStatusBannerHome({ id: banner.id, ativo }),
                      ativo ? "Banner ativado." : "Banner desativado.",
                    )
                  }
                />
              ))}
            </div>
          </section>
        ))}
        {grupos.length === 0 && (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <ImageIcon className="text-muted-foreground/50 mx-auto size-8" />
            <p className="mt-3 font-semibold">Nenhum banner encontrado</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Ajuste os filtros ou crie um novo banner.
            </p>
          </div>
        )}
      </div>

      <Sheet open={editorAberto} onOpenChange={setEditorAberto}>
        <SheetContent
          side="right"
          className="w-full gap-0 overflow-hidden p-0 sm:max-w-[min(96vw,1320px)]"
        >
          <SheetHeader className="flex-row items-center justify-between gap-4 border-b py-4 pr-14 pl-5 text-left">
            <div className="min-w-0">
              <SheetTitle className="truncate">
                {modoEditor === "editar"
                  ? `Editar: ${formulario.nome || formulario.titulo || "Banner sem nome"}`
                  : "Novo banner"}
              </SheetTitle>
              <SheetDescription>
                Configure exibição, conteúdo e publicação
              </SheetDescription>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setEditorAberto(false)}
                className="hidden sm:inline-flex"
              >
                Cancelar
              </Button>
              <Button onClick={salvar} disabled={pendente}>
                Salvar banner
              </Button>
            </div>
          </SheetHeader>
          <div className="grid h-[calc(100vh-81px)] overflow-y-auto lg:grid-cols-[minmax(0,1fr)_minmax(400px,0.9fr)] lg:overflow-hidden">
            <div className="space-y-7 p-5 lg:overflow-y-auto lg:p-6">
              <div className="space-y-2">
                <Label htmlFor="nome-banner">Nome do banner</Label>
                <Input
                  id="nome-banner"
                  value={formulario.nome}
                  onChange={(evento) => {
                    atualizar("nome", evento.target.value);
                    if (evento.target.value.trim()) setErroNome(null);
                  }}
                  placeholder="Ex: Campanha de inverno"
                  aria-invalid={Boolean(erroNome)}
                  aria-describedby={erroNome ? "erro-nome-banner" : undefined}
                />
                {erroNome && (
                  <p id="erro-nome-banner" className="text-destructive text-xs">
                    {erroNome}
                  </p>
                )}
              </div>

              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold">Local de exibição</h3>
                  <p className="text-muted-foreground text-xs">
                    Defina onde o banner será mostrado.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Página</Label>
                    <Input
                      value={paginaDaPosicao(formulario.posicao)}
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Posição</Label>
                    <Select
                      value={formulario.posicao}
                      onValueChange={(valor: PosicaoBannerHome) =>
                        atualizar("posicao", valor)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {POSICOES_BANNER_HOME.map((item) => (
                          <SelectItem key={item.valor} value={item.valor}>
                            {item.rotulo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Campanha</Label>
                    <Select value="sem-campanha" disabled>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sem-campanha">
                          Sem campanha
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>
              <Separator />

              <section className="space-y-4">
                <h3 className="text-sm font-semibold">Tipo de banner</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      {
                        valor: "imagem",
                        icone: Upload,
                        titulo: "Imagem",
                        descricao: "Upload de arte pronta (JPG, PNG, WebP)",
                      },
                      {
                        valor: "svg",
                        icone: FileImage,
                        titulo: "SVG editável",
                        descricao: "Texto e cores editáveis, sempre nítido",
                      },
                    ] as const
                  ).map(({ valor, icone: Icone, titulo, descricao }) => (
                    <button
                      key={valor}
                      type="button"
                      onClick={() => atualizar("tipoBanner", valor)}
                      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${formulario.tipoBanner === valor ? "border-primary bg-primary/5 ring-primary/15 ring-2" : "hover:bg-muted/50"}`}
                    >
                      <span
                        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${formulario.tipoBanner === valor ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                      >
                        <Icone className="size-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold">
                          {titulo}
                        </span>
                        <span className="text-muted-foreground mt-1 block text-xs leading-5">
                          {descricao}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
              <Separator />

              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold">Conteúdo</h3>
                  <p className="text-muted-foreground text-xs">
                    Personalize o conteúdo apresentado ao cliente.
                  </p>
                </div>
                {formulario.tipoBanner === "imagem" ? (
                  <div className="space-y-4">
                    <UploadImagemBannerHome
                      titulo="Imagem desktop"
                      posicao={formulario.posicao}
                      imagemUrl={formulario.imagemUrl}
                      imagemAlt={formulario.imagemAlt}
                      metadataImagem={formulario.metadataImagem}
                      onImagemChange={(dados) =>
                        setFormulario((atual) => ({
                          ...atual,
                          imagemUrl: dados.imagemUrl,
                          imagemAlt: dados.imagemAlt,
                          metadataImagem: dados.metadataImagem,
                        }))
                      }
                    />
                    <UploadImagemBannerHome
                      titulo="Imagem mobile (opcional)"
                      posicao={formulario.posicao}
                      imagemUrl={formulario.imagemMobileUrl}
                      imagemAlt={formulario.imagemAlt}
                      metadataImagem={null}
                      onImagemChange={(dados) =>
                        atualizar("imagemMobileUrl", dados.imagemUrl)
                      }
                    />
                    <div className="space-y-2">
                      <Label>Texto alternativo (alt)</Label>
                      <Input
                        value={formulario.imagemAlt}
                        onChange={(evento) =>
                          atualizar("imagemAlt", evento.target.value)
                        }
                        placeholder="Descreva a imagem"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ponto de foco</Label>
                      <Select
                        value={formulario.focoImagem}
                        onValueChange={(valor: FocoImagemBannerHome) =>
                          atualizar("focoImagem", valor)
                        }
                      >
                        <SelectTrigger>
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
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Modelo</Label>
                      <Select
                        value={formulario.tipoDestaque}
                        onValueChange={(valor: TipoDestaqueBannerHome) =>
                          atualizar("tipoDestaque", valor)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_DESTAQUE_BANNER_HOME.map((modelo) => (
                            <SelectItem key={modelo.valor} value={modelo.valor}>
                              {modelo.rotulo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Título</Label>
                        <Input
                          value={formulario.titulo}
                          onChange={(evento) =>
                            atualizar("titulo", evento.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Subtítulo</Label>
                        <Input
                          value={formulario.subtitulo}
                          onChange={(evento) =>
                            atualizar("subtitulo", evento.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Texto de apoio</Label>
                      <Textarea
                        value={formulario.textoApoio}
                        onChange={(evento) =>
                          atualizar("textoApoio", evento.target.value)
                        }
                      />
                    </div>
                    {["promocao", "oferta", "lancamento"].includes(
                      formulario.tipoDestaque,
                    ) && (
                      <div className="space-y-2">
                        <Label>Chamada de oferta</Label>
                        <Input
                          value={formulario.precoChamada}
                          onChange={(evento) =>
                            atualizar("precoChamada", evento.target.value)
                          }
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Texto do botão</Label>
                      <Input
                        value={formulario.textoBotao}
                        onChange={(evento) =>
                          atualizar("textoBotao", evento.target.value)
                        }
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <ControleCor
                        rotulo="Fundo"
                        valor={formulario.corFundo}
                        aoMudar={(valor) => atualizar("corFundo", valor)}
                      />
                      <ControleCor
                        rotulo="Texto"
                        valor={formulario.corTexto}
                        aoMudar={(valor) => atualizar("corTexto", valor)}
                      />
                      <ControleCor
                        rotulo="Destaque"
                        valor={formulario.corDestaque}
                        aoMudar={(valor) => atualizar("corDestaque", valor)}
                      />
                    </div>
                  </div>
                )}
              </section>
              <Separator />

              <section className="space-y-3">
                <h3 className="text-sm font-semibold">Link</h3>
                <div className="bg-muted inline-flex rounded-lg p-1">
                  {(
                    [
                      ["sem_link", "Sem link"],
                      ["interno", "Interno"],
                      ["externo", "Externo"],
                    ] as const
                  ).map(([valor, rotulo]) => (
                    <button
                      key={valor}
                      type="button"
                      onClick={() => atualizar("tipoLink", valor)}
                      className={`rounded-md px-4 py-2 text-xs font-medium transition ${formulario.tipoLink === valor ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"}`}
                    >
                      {rotulo}
                    </button>
                  ))}
                </div>
                {formulario.tipoLink !== "sem_link" && (
                  <div className="relative">
                    <Link2 className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <Input
                      value={formulario.linkBotao}
                      onChange={(evento) =>
                        atualizar("linkBotao", evento.target.value)
                      }
                      placeholder={
                        formulario.tipoLink === "interno"
                          ? "/categoria/ofertas"
                          : "https://exemplo.com"
                      }
                      className="pl-9"
                    />
                  </div>
                )}
              </section>
              <Separator />

              <section className="space-y-3">
                <h3 className="text-sm font-semibold">Publicação</h3>
                <div className="rounded-xl border p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Banner ativo</p>
                      <p className="text-muted-foreground text-xs">
                        Visível na loja quando ativo e dentro do período
                      </p>
                    </div>
                    <Switch
                      checked={formulario.ativo}
                      onCheckedChange={(ativo) => atualizar("ativo", ativo)}
                    />
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Início (opcional)</Label>
                      <Input
                        type="datetime-local"
                        value={formulario.dataInicio}
                        onChange={(evento) =>
                          atualizar("dataInicio", evento.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fim (opcional)</Label>
                      <Input
                        type="datetime-local"
                        value={formulario.dataFim}
                        onChange={(evento) =>
                          atualizar("dataFim", evento.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              </section>

              <div className="flex justify-end gap-2 border-t pt-5">
                <Button
                  variant="outline"
                  onClick={() => setEditorAberto(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={salvar} disabled={pendente}>
                  Salvar banner
                </Button>
              </div>
            </div>
            <PreviewEditor formulario={formulario} />
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}
