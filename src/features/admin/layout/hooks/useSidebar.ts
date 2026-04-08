/**
 * HOOK useSidebar - Controla todo o estado do menu lateral
 */

'use client';

import { useState, useCallback } from 'react';
import type { SidebarState } from '../types/sidebar';

/**
 * Hook principal do sidebar
 */
export function useSidebar(defaultExpanded: string[] = []) {
  // Estado do sidebar
  const [state, setState] = useState<SidebarState>({
    isCollapsed: false,
    expandedGroups: defaultExpanded,
    isMobileOpen: false,
  });

  // Alterna sidebar recolhido/expandido (desktop)
  const toggleCollapse = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isCollapsed: !prev.isCollapsed,
    }));
  }, []);

  // Abre/fecha um grupo específico
  const toggleGroup = useCallback((groupId: string) => {
    setState((prev) => {
      const isExpanded = prev.expandedGroups.includes(groupId);
      
      return {
        ...prev,
        expandedGroups: isExpanded
          ? prev.expandedGroups.filter((id) => id !== groupId)
          : [...prev.expandedGroups, groupId],
      };
    });
  }, []);

  // Abre menu no mobile
  const openMobile = useCallback(() => {
    setState((prev) => ({ ...prev, isMobileOpen: true }));
  }, []);

  // Fecha menu no mobile
  const closeMobile = useCallback(() => {
    setState((prev) => ({ ...prev, isMobileOpen: false }));
  }, []);

  // Verifica se grupo está expandido
  const isGroupExpanded = useCallback(
    (groupId: string) => state.expandedGroups.includes(groupId),
    [state.expandedGroups]
  );

  // RETORNA TUDO - esta linha estava faltando ou incompleta
  return {
    isCollapsed: state.isCollapsed,
    isMobileOpen: state.isMobileOpen,
    expandedGroups: state.expandedGroups,
    toggleCollapse,
    toggleGroup,
    openMobile,      // <-- ESTAVA FALTANDO
    closeMobile,
    isGroupExpanded,
  };
}