// src/features/product-grid-with-load-more/components/ProductGridSkeleton.tsx
export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
      {[...Array(12)].map((_, index) => (
        <div 
          key={index}
          className="bg-gray-100 rounded-2xl overflow-hidden animate-pulse"
        >
          {/* Imagem placeholder */}
          <div className="aspect-[3/4] bg-gray-200" />
          
          {/* Conteúdo placeholder */}
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-5 bg-gray-200 rounded w-1/3" />
            
            {/* Botões placeholder */}
            <div className="flex justify-between items-center pt-2">
              <div className="h-8 w-8 bg-gray-200 rounded-full" />
              <div className="h-8 w-20 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}