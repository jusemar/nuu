"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pilcrow,
  Redo2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import {
  type ConteudoPaginaDinamica,
  conteudoPaginaDinamicaSchema,
  enderecoLinkSchema,
} from "../../schemas/conteudo-pagina-dinamica.schema";

type Propriedades = {
  valor: ConteudoPaginaDinamica;
  aoAlterar: (valor: ConteudoPaginaDinamica) => void;
};

export function EditorConteudoPagina({ valor, aoAlterar }: Propriedades) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        hardBreak: false,
        strike: false,
        heading: { levels: [1, 2, 3] },
        link: {
          autolink: false,
          linkOnPaste: false,
          openOnClick: false,
          defaultProtocol: "https",
        },
      }),
    ],
    content: valor,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert min-h-64 max-w-none px-4 py-3 focus:outline-none",
        "aria-label": "Conteúdo da página",
      },
    },
    onUpdate: ({ editor: instancia }) => {
      const resultado = conteudoPaginaDinamicaSchema.safeParse(
        instancia.getJSON(),
      );
      if (resultado.success) aoAlterar(resultado.data);
    },
  });

  if (!editor)
    return <div className="bg-muted h-72 animate-pulse rounded-lg" />;

  function definirLink() {
    if (!editor) return;
    const atual = editor.getAttributes("link").href as string | undefined;
    const href = window.prompt("Endereço do link", atual ?? "https://");
    if (href === null) return;
    if (!href.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    if (!enderecoLinkSchema.safeParse(href.trim()).success) {
      toast.error(
        "Use um caminho interno ou um link HTTP, HTTPS, e-mail ou telefone.",
      );
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: href.trim() })
      .run();
  }

  const botao = (
    rotulo: string,
    Icone: typeof Bold,
    ativo: boolean,
    executar: () => void,
    desabilitado = false,
  ) => (
    <Button
      key={rotulo}
      type="button"
      size="icon"
      variant={ativo ? "secondary" : "ghost"}
      aria-label={rotulo}
      aria-pressed={ativo}
      title={rotulo}
      disabled={desabilitado}
      onClick={executar}
    >
      <Icone className="size-4" />
    </Button>
  );

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="bg-muted/50 flex flex-wrap gap-1 border-b p-2">
        {botao("Parágrafo", Pilcrow, editor.isActive("paragraph"), () =>
          editor.chain().focus().setParagraph().run(),
        )}
        {[1, 2, 3].map((nivel) =>
          botao(
            `Título ${nivel}`,
            [Heading1, Heading2, Heading3][nivel - 1]!,
            editor.isActive("heading", { level: nivel }),
            () =>
              editor
                .chain()
                .focus()
                .toggleHeading({ level: nivel as 1 | 2 | 3 })
                .run(),
          ),
        )}
        {botao("Negrito", Bold, editor.isActive("bold"), () =>
          editor.chain().focus().toggleBold().run(),
        )}
        {botao("Itálico", Italic, editor.isActive("italic"), () =>
          editor.chain().focus().toggleItalic().run(),
        )}
        {botao("Link", Link2, editor.isActive("link"), definirLink)}
        {botao(
          "Lista com marcadores",
          List,
          editor.isActive("bulletList"),
          () => editor.chain().focus().toggleBulletList().run(),
        )}
        {botao(
          "Lista numerada",
          ListOrdered,
          editor.isActive("orderedList"),
          () => editor.chain().focus().toggleOrderedList().run(),
        )}
        {botao(
          "Desfazer",
          Undo2,
          false,
          () => editor.chain().focus().undo().run(),
          !editor.can().undo(),
        )}
        {botao(
          "Refazer",
          Redo2,
          false,
          () => editor.chain().focus().redo().run(),
          !editor.can().redo(),
        )}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
