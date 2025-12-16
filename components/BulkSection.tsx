'use client';

import { productData } from '@/data/products';
import { categorizeProduct } from '@/lib/categories';
import ProductCard from './ProductCard';
import Link from 'next/link';

export default function BulkSection() {
  // Since there are no products with "bulk" in name, show products with large quantities or high discounts
  // as a fallback for Bulk section
  const bulkProducts = Object.values(productData)
    .filter((product) => {
      const category = categorizeProduct(product);
      // If product is already categorized as Bulk, use it
      if (category === 'Bulk') return true;
      // Otherwise, show products with very large quantities or very high discounts as "bulk deals"
      const hasLargeQuantity = product.variants.some(v => 
        v.quantity && (v.quantity.includes('kg') || v.quantity.includes('liter') || v.quantity.includes('Ltr'))
      );
      return hasLargeQuantity && product.discountPercent > 50;
    })
    .slice(0, 10);

  if (bulkProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-6 md:py-8 lg:py-10 bg-white border-t border-gray-200">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">Bulk</h2>
          <Link 
            href="/categories/bulk" 
            className="text-[#16a34a] hover:text-[#15803d] font-semibold text-base md:text-lg transition-colors whitespace-nowrap hover:underline flex items-center gap-1"
          >
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5 md:gap-3">
          {bulkProducts.map((product) => (
            <div key={product.id} className="w-full h-full flex flex-col">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

