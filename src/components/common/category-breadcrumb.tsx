// src/components/common/category-breadcrumb.tsx
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ChevronRightIcon } from "lucide-react";
import { Fragment } from "react";

interface CategoryBreadcrumbProps {
  categories: Array<{ id: string; name: string; slug: string }>;
  currentPage?: string;
  className?: string;
  currentPageClassName?: string;
}

export const CategoryBreadcrumb = ({
  categories,
  currentPage,
  className,
  currentPageClassName,
}: CategoryBreadcrumbProps) => {
  return (
    <Breadcrumb aria-label="Navegação estrutural da categoria">
      <BreadcrumbList className={className}>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        {categories.map((category, index) => {
          const atual = !currentPage && index === categories.length - 1;
          return (
            <Fragment key={category.id}>
              <BreadcrumbSeparator>
                <ChevronRightIcon size={16} />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                {atual ? (
                  <BreadcrumbPage>{category.name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={`/category/${category.slug}`}>
                    {category.name}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
        {currentPage ? (
          <>
            <BreadcrumbSeparator>
              <ChevronRightIcon size={16} />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage className={currentPageClassName}>
                {currentPage}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
