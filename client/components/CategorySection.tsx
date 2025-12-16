'use client';

import ProductCard from './ProductCard';
import { productData } from '@/data/products';
import { categorizeProduct, categorySlugs, type CategoryType } from '@/lib/categories';
import Link from 'next/link';

interface CategorySectionProps {
  categoryName: CategoryType;
  title?: string;
  limit?: number;
  bgColor?: 'white' | 'gray';
}

export default function CategorySection({ 
  categoryName, 
  title,
  limit = 10,
  bgColor = 'white'
}: CategorySectionProps) {
  // Filter products by category
  const categoryProducts = Object.values(productData)
    .filter((product) => {
      const productCategory = categorizeProduct(product);
      return productCategory === categoryName;
    })
    .slice(0, limit);

  const displayTitle = title || categoryName;
  const categorySlug = categorySlugs[categoryName];

  // Don't render if no products found
  if (categoryProducts.length === 0) {
    return null;
  }

  return (
    <section className={`section-container ${bgColor === 'gray' ? 'bg-gray-50' : 'bg-white'}`}>
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="category-section-header">
          <h2>{displayTitle}</h2>
          <Link href={`/categories/${categorySlug}`}>
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5 md:gap-3">
          {categoryProducts.map((product) => (
            <div key={product.id} className="w-full h-full flex flex-col">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

