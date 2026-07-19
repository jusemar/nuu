"use client";

import {
  ChevronRight,
  ChevronDown,
  GripVertical,
  Folder,
  Edit,
  Plus,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SubcategoryItem } from "./SubcategoriesCard";
import { useState } from "react";
import { normalizarSlugCategoria } from "../../lib/slug-categoria";

interface SubcategoryNodeProps {
  item: SubcategoryItem;
  subcategories: SubcategoryItem[];
  expandedItems: string[];
  toggleExpand: (id: string) => void;
  getLevelColor: (level: number) => string;
  getLevelBadge: (level: number) => React.ReactNode;
  onDeleteSubcategory: (id: string) => void;
  onEditSubcategory: (id: string, newName: string, slug: string) => void;
  onAddChildSubcategory: (parentId: string, name: string, slug: string) => void;
  // 🔽🔽🔽 NOVAS PROPS PARA DRAG-AND-DROP 🔽🔽🔽
  dragAttributes?: any;
  dragListeners?: any;
  isDragging?: boolean;
}

export function SubcategoryNode({
  item,
  subcategories,
  expandedItems,
  toggleExpand,
  getLevelColor,
  getLevelBadge,
  onDeleteSubcategory,
  onEditSubcategory,
  onAddChildSubcategory,
  // 🔽🔽🔽 RECEBENDO PROPS DE DRAG 🔽🔽🔽
  dragAttributes,
  dragListeners,
  isDragging = false,
}: SubcategoryNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editSlug, setEditSlug] = useState(
    item.slug || normalizarSlugCategoria(item.name),
  );
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [newChildSlug, setNewChildSlug] = useState("");
  const [childSlugEditadoManualmente, setChildSlugEditadoManualmente] =
    useState(false);

  const children = subcategories.filter((child) => child.parent === item.id);
  const hasChildren = children.length > 0;
  const isExpanded = expandedItems.includes(item.id);

  const indent =
    item.level === 1 ? "ml-0" : item.level === 2 ? "ml-6" : "ml-12";
  const connector =
    item.level > 1 ? (
      <div
        className={`absolute top-0 bottom-0 left-0 w-4 border-b border-l border-gray-300`}
      ></div>
    ) : null;

  // 🔽🔽🔽 ÍCONE DE ARRASTE CONECTADO AO DND 🔽🔽🔽
  const DragHandle = () => (
    <GripVertical
      className="h-4 w-4 cursor-move text-gray-400 hover:text-gray-600"
      {...dragAttributes}
      {...dragListeners}
    />
  );

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditName(item.name);
    setEditSlug(item.slug || normalizarSlugCategoria(item.name));
  };

  const handleSaveEdit = () => {
    if (editName.trim() && editSlug.trim()) {
      onEditSubcategory(item.id, editName.trim(), editSlug.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName(item.name);
    setEditSlug(item.slug || normalizarSlugCategoria(item.name));
  };

  const handleStartAddChild = () => {
    setIsAddingChild(true);
    setNewChildName("");
    setNewChildSlug("");
    setChildSlugEditadoManualmente(false);
    if (!isExpanded) {
      toggleExpand(item.id);
    }
  };

  const handleSaveChild = () => {
    if (newChildName.trim() && newChildSlug.trim()) {
      onAddChildSubcategory(item.id, newChildName.trim(), newChildSlug.trim());
      setIsAddingChild(false);
      setNewChildName("");
      setNewChildSlug("");
      setChildSlugEditadoManualmente(false);
    }
  };

  const handleCancelAddChild = () => {
    setIsAddingChild(false);
    setNewChildName("");
    setNewChildSlug("");
    setChildSlugEditadoManualmente(false);
  };

  const handleDelete = () => {
    onDeleteSubcategory(item.id);
  };

  return (
    <div className={`relative ${indent} ${isDragging ? "opacity-50" : ""}`}>
      {connector}

      {/* ITEM PRINCIPAL */}
      <div
        className={`mb-1 flex items-center gap-2 rounded-lg border p-3 ${getLevelColor(item.level)} group transition-all hover:shadow-sm`}
      >
        <button
          onClick={() => toggleExpand(item.id)}
          className="text-gray-500 hover:text-gray-700"
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <div className="h-4 w-4"></div>
          )}
        </button>

        {/* ÍCONE DE ARRASTE CONECTADO */}
        <DragHandle />

        <Folder className="h-4 w-4 flex-shrink-0" />

        {/* CONTEÚDO CONDICIONAL */}
        {isEditing ? (
          <div className="grid flex-1 gap-2 sm:grid-cols-2">
            <Input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-8 flex-1 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveEdit();
                if (e.key === "Escape") handleCancelEdit();
              }}
            />
            <Input
              value={editSlug}
              onChange={(e) => setEditSlug(e.target.value)}
              className="h-8 text-sm"
              aria-label={`Slug de ${item.name}`}
              placeholder="slug-da-subcategoria"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveEdit();
                if (e.key === "Escape") handleCancelEdit();
              }}
            />
            <div className="flex items-center gap-1 sm:col-span-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-green-500 hover:text-green-700"
                onClick={handleSaveEdit}
                title="Salvar"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-500 hover:text-red-700"
                onClick={handleCancelEdit}
                title="Cancelar"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <span className="flex-1 truncate font-medium">{item.name}</span>
        )}

        <div className="flex items-center gap-2">
          {getLevelBadge(item.level)}

          {hasChildren && (
            <Badge variant="secondary" className="text-xs">
              {children.length}
            </Badge>
          )}

          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {/* BOTÃO EDITAR */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-blue-500 hover:text-blue-700"
              onClick={handleStartEdit}
              title="Editar nome"
              disabled={isEditing || isAddingChild || isDragging}
            >
              <Edit className="h-3 w-3" />
            </Button>

            {/* BOTÃO ADICIONAR FILHO */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-green-500 hover:text-green-700"
              onClick={handleStartAddChild}
              title="Adicionar subcategoria filha"
              disabled={
                isEditing || isAddingChild || isDragging || item.level >= 4
              }
            >
              <Plus className="h-3 w-3" />
            </Button>

            {/* BOTÃO EXCLUIR */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-700"
              onClick={handleDelete}
              title="Excluir esta subcategoria e todos os seus filhos"
              disabled={isEditing || isAddingChild || isDragging}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* INPUT PARA ADICIONAR FILHO */}
      {isAddingChild && (
        <div className="mt-1 mb-2 ml-10 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-2">
          <div className="grid gap-2 sm:grid-cols-[auto_1fr_1fr] sm:items-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-500 hover:text-red-500"
              onClick={handleCancelAddChild}
              title="Cancelar"
            >
              <X className="h-3 w-3" />
            </Button>

            <Input
              autoFocus
              value={newChildName}
              onChange={(e) => {
                const nome = e.target.value;
                setNewChildName(nome);
                if (!childSlugEditadoManualmente) {
                  setNewChildSlug(normalizarSlugCategoria(nome));
                }
              }}
              placeholder={`Digite o nome da subcategoria filha de "${item.name}"...`}
              className="h-8 flex-1 border-gray-300 text-sm"
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  newChildName.trim() &&
                  newChildSlug.trim()
                ) {
                  handleSaveChild();
                }
                if (e.key === "Escape") {
                  handleCancelAddChild();
                }
              }}
            />
            <Input
              value={newChildSlug}
              onChange={(e) => {
                setChildSlugEditadoManualmente(true);
                setNewChildSlug(e.target.value);
              }}
              placeholder="slug-da-subcategoria"
              aria-label={`Slug da nova subcategoria filha de ${item.name}`}
              className="h-8 border-gray-300 text-sm"
            />

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-500 hover:text-green-500"
              disabled={!newChildName.trim()}
              onClick={handleSaveChild}
              title="Salvar"
            >
              <Check className="h-3 w-3" />
            </Button>
          </div>
          <p className="mt-1 ml-9 text-xs text-gray-600">
            Criando como nível {item.level + 1} • Pressione{" "}
            <kbd className="rounded bg-gray-200 px-1 py-0.5">Enter</kbd> para
            salvar
          </p>
        </div>
      )}
    </div>
  );
}
