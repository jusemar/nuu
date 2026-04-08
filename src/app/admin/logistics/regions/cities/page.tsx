/**
 * PÁGINA DE CIDADES - Rota Next.js
 * 
 * Esta página recebe o parâmetro 'state' da URL e renderiza o componente de cidades.
 */

'use client';

import { useSearchParams } from 'next/navigation';
import { CitiesPage } from '@/features/admin/logistics/regions/cities/components/CitiesPage';

export default function Page() {
  // Pega o estado da URL (ex: ?state=SP)
  const searchParams = useSearchParams();
  const stateUf = searchParams.get('state') || undefined;

  // Nome do estado (mockado - depois busca do banco)
  const stateNames: Record<string, string> = {
    SP: 'São Paulo',
    RJ: 'Rio de Janeiro',
    MG: 'Minas Gerais',
    RS: 'Rio Grande do Sul',
    PR: 'Paraná',
  };

  return (
    <CitiesPage 
      stateUf={stateUf} 
      stateName={stateUf ? stateNames[stateUf] : undefined} 
    />
  );
}