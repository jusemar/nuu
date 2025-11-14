// src/components/admin/rich-text-editor.tsx
"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { Extension } from '@tiptap/core'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo, 
  Image as ImageIcon, 
  Table as TableIcon, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Palette, 
  ChevronDown,
  Code,
  X
} from 'lucide-react'
import { useEffect, useState, useRef } from 'react'

// Extensão customizada para FontSize
const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle'],
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize?.replace(/['"]+/g, ''),
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {}
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize })
          .run()
      },
      unsetFontSize: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .removeEmptyTextStyle()
          .run()
      },
    }
  },
})

// Extensão customizada para FontFamily
const FontFamily = Extension.create({
  name: 'fontFamily',

  addOptions() {
    return {
      types: ['textStyle'],
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: (element) => element.style.fontFamily?.replace(/['"]+/g, ''),
            renderHTML: (attributes) => {
              if (!attributes.fontFamily) {
                return {}
              }
              return {
                style: `font-family: ${attributes.fontFamily}`,
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setFontFamily: (fontFamily: string) => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontFamily })
          .run()
      },
      unsetFontFamily: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontFamily: null })
          .removeEmptyTextStyle()
          .run()
      },
    }
  },
})

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const MenuBar = ({ editor }: { editor: any }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const colorsRef = useRef<HTMLDivElement>(null)
  const tableGridRef = useRef<HTMLDivElement>(null)
  const htmlModalRef = useRef<HTMLDivElement>(null)
  const [showColors, setShowColors] = useState(false)
  const [showTableGrid, setShowTableGrid] = useState(false)
  const [showHtmlModal, setShowHtmlModal] = useState(false)
  const [selectedRows, setSelectedRows] = useState(3)
  const [selectedCols, setSelectedCols] = useState(3)
  const [htmlContent, setHtmlContent] = useState('')

  if (!editor) {
    return null
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target?.result as string
        editor.chain().focus().setImage({ src: base64 }).run()
      }
      reader.readAsDataURL(file)
    }
  }

  const insertTable = (rows: number, cols: number) => {
    editor.chain().focus().insertTable({ 
      rows: rows, 
      cols: cols, 
      withHeaderRow: true 
    }).run()
    setShowTableGrid(false)
  }

  const handleCellHover = (row: number, col: number) => {
    setSelectedRows(row + 1)
    setSelectedCols(col + 1)
  }

  const handleCellClick = (row: number, col: number) => {
    insertTable(row + 1, col + 1)
  }

  const insertHtml = () => {
    if (htmlContent.trim()) {
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = htmlContent
      editor.chain().focus().insertContent(tempDiv.innerHTML).run()
      setHtmlContent('')
      setShowHtmlModal(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showColors && colorsRef.current && 
          !colorsRef.current.contains(event.target as Node)) {
        setShowColors(false)
      }
      
      if (showTableGrid && tableGridRef.current && 
          !tableGridRef.current.contains(event.target as Node)) {
        setShowTableGrid(false)
      }

      if (showHtmlModal && htmlModalRef.current && 
          !htmlModalRef.current.contains(event.target as Node)) {
        setShowHtmlModal(false)
        setHtmlContent('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showColors, showTableGrid, showHtmlModal])

  const colors = [
    { name: 'Preto', value: '#000000' },
    { name: 'Vermelho', value: '#dc2626' },
    { name: 'Verde', value: '#16a34a' },
    { name: 'Azul', value: '#2563eb' },
    { name: 'Amarelo', value: '#ca8a04' },
    { name: 'Roxo', value: '#9333ea' },
    { name: 'Laranja', value: '#ea580c' },
    { name: 'Rosa', value: '#db2777' },
    { name: 'Cinza', value: '#6b7280' },
    { name: 'Marrom', value: '#78350f' },
    { name: 'Padrão', value: '#1a1a1a' },
    { name: 'Destaque', value: '#0066cc' },
    { name: 'Secundário', value: '#666666' }
  ]

  const fontSizes = [
    { label: 'Pequeno', value: '16px' },
    { label: 'Normal', value: '20px' },
    { label: 'Grande', value: '28px' },
    { label: 'Subtítulo', value: '36px' },
    { label: 'Título', value: '48px' }
  ]

  const fonts = [
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Times New Roman', value: 'Times New Roman, serif' },
    { label: 'Courier New', value: 'Courier New, monospace' },    
    { label: 'Verdana', value: 'Verdana, sans-serif' },
    { label: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif' },
    { label: 'Padrão', value: 'Inter, -apple-system, sans-serif' },
    { label: 'Título', value: 'Georgia, serif' }
  ]

  const maxRows = 6
  const maxCols = 6

  return (
    <div className="border-b p-2 flex flex-wrap gap-1 items-center relative">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-gray-100 ${
          editor.isActive('bold') ? 'bg-gray-200' : ''
        }`}
        type="button"
      >
        <Bold className="w-4 h-4" />
      </button>
      
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-gray-100 ${
          editor.isActive('italic') ? 'bg-gray-200' : ''
        }`}
        type="button"
      >
        <Italic className="w-4 h-4" />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-gray-100 ${
          editor.isActive('bulletList') ? 'bg-gray-200' : ''
        }`}
        type="button"
      >
        <List className="w-4 h-4" />
      </button>
      
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded hover:bg-gray-100 ${
          editor.isActive('orderedList') ? 'bg-gray-200' : ''
        }`}
        type="button"
      >
        <ListOrdered className="w-4 h-4" />
      </button>

      <button
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={`p-2 rounded hover:bg-gray-100 ${
          editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''
        }`}
        type="button"
      >
        <AlignLeft className="w-4 h-4" />
      </button>

      <button
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={`p-2 rounded hover:bg-gray-100 ${
          editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''
        }`}
        type="button"
      >
        <AlignCenter className="w-4 h-4" />
      </button>

      <button
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={`p-2 rounded hover:bg-gray-100 ${
          editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''
        }`}
        type="button"
      >
        <AlignRight className="w-4 h-4" />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-2 rounded hover:bg-gray-100 ${
          editor.isActive('blockquote') ? 'bg-gray-200' : ''
        }`}
        type="button"
      >
        <Quote className="w-4 h-4" />
      </button>

      {/* Código HTML */}
      <div className="relative">
        <button 
          className="p-2 rounded hover:bg-gray-100"
          onClick={() => setShowHtmlModal(true)}
          type="button"
          title="Inserir código HTML"
        >
          <Code className="w-4 h-4" />
        </button>
        
        {showHtmlModal && (
          <div 
            ref={htmlModalRef}
            className="absolute top-full left-0 mt-1 bg-white border rounded shadow-lg p-2 z-50 w-64"
          >
            <textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              placeholder="Cole HTML aqui..."
              className="w-full h-20 p-2 border rounded text-sm font-mono resize-none"
              rows={4}
            />
            
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  setHtmlContent('')
                  setShowHtmlModal(false)
                }}
                className="flex-1 border border-gray-300 py-1 px-2 rounded text-xs hover:bg-gray-50"
                type="button"
              >
                Cancelar
              </button>
              <button
                onClick={insertHtml}
                disabled={!htmlContent.trim()}
                className="flex-1 bg-blue-600 text-white py-1 px-2 rounded text-xs hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                type="button"
              >
                Inserir
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <button 
          className="p-2 rounded hover:bg-gray-100 flex items-center gap-1" 
          type="button"
          onClick={() => {
            setShowColors(!showColors)
            setShowTableGrid(false)
          }}
        >
          <Palette className="w-4 h-4" />
          <ChevronDown className="w-3 h-3" />
        </button>
        {showColors && (
          <div 
            ref={colorsRef}
            className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-xl p-3 z-50 w-64"
          >
            <h4 className="text-sm font-medium mb-2">Cor do Texto</h4>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {colors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => {
                    editor.chain().focus().setColor(color.value).run()
                    setShowColors(false)
                  }}
                  className="w-8 h-8 rounded border-2 border-gray-200 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                  type="button"
                />
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="color"
                onChange={(e) => {
                  editor.chain().focus().setColor(e.target.value).run()
                  setShowColors(false)
                }}
                className="w-8 h-8 p-0 border-0"
              />
              <button
                onClick={() => {
                  editor.chain().focus().unsetColor().run()
                  setShowColors(false)
                }}
                className="flex-1 text-xs text-gray-600 hover:text-gray-800 border rounded px-2 py-1"
                type="button"
              >
                Cor Padrão
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <select
          onChange={(e) => {
            const size = e.target.value
            if (size) {
              editor.chain().focus().setFontSize(size).run()
            } else {
              editor.chain().focus().unsetFontSize().run()
            }
          }}
          className="p-2 rounded border text-sm bg-white pr-8 appearance-none"
          defaultValue=""
        >
          <option value="">Tamanho</option>
          {fontSizes.map((size) => (
            <option key={size.value} value={size.value}>{size.label}</option>
          ))}
        </select>
        <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
      </div>

      <div className="relative">
        <select
          onChange={(e) => {
            const font = e.target.value
            if (font) {
              editor.chain().focus().setFontFamily(font).run()
            } else {
              editor.chain().focus().unsetFontFamily().run()
            }
          }}
          className="p-2 rounded border text-sm bg-white pr-8 appearance-none min-w-32"
          defaultValue=""
        >
          <option value="">Fonte</option>
          {fonts.map((font) => (
            <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
              {font.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
      </div>

      <button
        onClick={() => fileInputRef.current?.click()}
        className="p-2 rounded hover:bg-gray-100"
        type="button"
      >
        <ImageIcon className="w-4 h-4" />
      </button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      <div className="relative">
        <button 
          className="p-2 rounded hover:bg-gray-100"
          onMouseEnter={() => setShowTableGrid(true)}
          type="button"
        >
          <TableIcon className="w-4 h-4" />
        </button>
        
        {showTableGrid && (
          <div 
            ref={tableGridRef}
            className="absolute top-full left-0 mt-1 bg-white border rounded shadow-lg p-2 z-50"
            onMouseLeave={() => setShowTableGrid(false)}
          >
            <div className="border border-gray-300 rounded overflow-hidden inline-block">
              <div className="flex flex-col">
                {Array.from({ length: maxRows }).map((_, rowIndex) => (
                  <div key={rowIndex} className="flex">
                    {Array.from({ length: maxCols }).map((_, colIndex) => (
                      <div
                        key={colIndex}
                        className={`
                          w-4 h-4 border border-gray-200 cursor-pointer
                          transition-colors
                          ${rowIndex < selectedRows && colIndex < selectedCols 
                            ? 'bg-blue-100 border-blue-300'
                            : 'bg-white hover:bg-gray-50'
                          }
                        `}
                        onMouseEnter={() => handleCellHover(rowIndex, colIndex)}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        title={`${rowIndex + 1} × ${colIndex + 1} Tabela`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="text-center text-xs text-gray-600 mt-1">
              {selectedRows} × {selectedCols}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1"></div>

      <button
        onClick={() => editor.chain().focus().undo().run()}
        className="p-2 rounded hover:bg-gray-100"
        type="button"
      >
        <Undo className="w-4 h-4" />
      </button>
      
      <button
        onClick={() => editor.chain().focus().redo().run()}
        className="p-2 rounded hover:bg-gray-100"
        type="button"
      >
        <Redo className="w-4 h-4" />
      </button>
    </div>
  )
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false)
  const previousValueRef = useRef<string>(value)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: 'list-disc list-outside ml-4',
          },
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: 'list-decimal list-outside ml-4',
          },
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'left',
      }),
      TextStyle,
      Color.configure({
        types: ['textStyle'],
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'table-editor',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'table-row-editor',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'table-header-editor',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'table-cell-editor',
        },
      }),
      FontSize,
      FontFamily,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html)
      previousValueRef.current = html
    },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none p-4 min-h-[200px] focus:outline-none focus:ring-0 border-0',
        style: 'font-family: Arial, sans-serif;',
      },
    },
  })

  // 🔥 SOLUÇÃO PROFISSIONAL CORRIGIDA: Sincronização com tratamento de edge cases
  useEffect(() => {
    if (!editor) return

    // Edge case 1: Reset completo quando value é string vazia
    if (value === '' && editor.getHTML() !== '<p></p>') {
      editor.commands.clearContent()
      previousValueRef.current = ''
      return
    }

    // Edge case 2: Só sincroniza se o valor externo mudou E for diferente do atual
    const isExternalChange = value !== previousValueRef.current
    const isDifferentFromCurrent = value !== editor.getHTML()

    if (isExternalChange && isDifferentFromCurrent) {
      // Preserva a seleção e posição do cursor
      const { from, to } = editor.state.selection
      
      // CORREÇÃO: setContent sem segundo parâmetro ou com objeto vazio
      editor.commands.setContent(value)
      
      // Restaura a seleção se possível
      try {
        editor.commands.setTextSelection({ 
          from: Math.min(from, editor.state.doc.content.size), 
          to: Math.min(to, editor.state.doc.content.size) 
        })
      } catch (e) {
        // Se não conseguir restaurar, vai para o final
        editor.commands.focus('end')
      }
      
      previousValueRef.current = value
    }
  }, [editor, value])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      const style = document.createElement('style')
      style.textContent = `
        .tiptap table {
          border-collapse: collapse;
          margin: 0.5rem 0;
          border: 1px solid #d1d5db;
          background-color: white;
          width: auto;
        }
        
        .tiptap table td,
        .tiptap table th {
          border: 1px solid #e5e7eb;
          padding: 4px 8px;
          text-align: left;
          background-color: white;
          white-space: nowrap;
          height: 28px;
          line-height: 1.2;
        }
        
        .tiptap table th {
          background-color: #f9fafb;
          font-weight: 600;
          color: #374151;
        }

        .tiptap table td {
          min-width: fit-content;
          color: #4b5563;
        }

        /* FORÇAR ESPAÇO EDITÁVEL AO LADO DA TABELA */
        .tiptap .ProseMirror {
          min-height: 150px;
        }
        
        .tiptap .ProseMirror > * {
          margin: 0.25rem 0;
        }
        
        /* GARANTIR QUE EXISTAM PARÁGRAFOS EDITÁVEIS */
        .tiptap .ProseMirror:before {
          content: "";
          display: block;
          height: 1px;
        }
        
        .tiptap .ProseMirror:after {
          content: "";
          display: block;
          height: 1px;
        }
      `
      document.head.appendChild(style)

      return () => {
        document.head.removeChild(style)
      }
    }
  }, [mounted])

  if (!mounted || !editor) {
    return (
      <div className="border rounded-lg min-h-[200px] p-4 bg-muted/20">
        <div className="text-muted-foreground text-sm">
          Carregando editor...
        </div>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}