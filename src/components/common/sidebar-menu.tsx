"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SidebarMenuProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export const SidebarMenu = ({ title, children, defaultOpen = false }: SidebarMenuProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border-b pb-4 last:border-0">
      <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-left">
        <span className="font-semibold">{title}</span>
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};