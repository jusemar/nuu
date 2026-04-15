/**
 * PÁGINA DE BAIRROS - Rota Next.js
 * 
 * Recebe parâmetros de cidade e estado via query string.
 * Ex: /admin/logistics/bairros?cidade=São%20Paulo&uf=SP
 */

'use client';

import { useSearchParams } from 'next/navigation';
import { BairrosPage } from '@/features/admin/logistics/bairros/components/BairrosPage';

export default function Page() {
  // Pega parâmetros da URL
  const searchParams = useSearchParams();
  const cidade = searchParams.get('cidade') || undefined;
  const uf = searchParams.get('uf') || undefined;

  return (
    <BairrosPage 
      cidadeFiltro={cidade} 
      estadoUfFiltro={uf} 
    />
  );
}