import Link from "next/link";

interface CategorySelectorProps {
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    // outros campos se tiver
  }>;
}

const CategorySelector = ({ categories }: CategorySelectorProps) => {
  return (
    <div className="rounded-3xl bg-[#F4EFFF] p-6">
      {/* Grid responsivo: 2 colunas no mobile, 4 no desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-gray-900 transition-all hover:bg-white/90 hover:shadow-md hover:-translate-y-0.5 active:scale-95"
          >
            {category.name}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CategorySelector;