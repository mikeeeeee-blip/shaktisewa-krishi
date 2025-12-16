'use client';

import ProductCard from './ProductCard';
import { productData } from '@/data/products';

export default function FeaturedProducts() {
  // Filter featured products - match krishansheclatagro.com Featured Products section
  // These are primarily Exylon products (Crop Protection) and other high-quality products
  const featuredProducts = Object.values(productData)
    .filter((product) => {
      const name = product.name.toLowerCase();
      // Include Exylon products (from krishansheclatagro.com Featured Products)
      if (name.includes('exylon')) return true;
      // Include Perfect Crop Dekkan Charger Plus
      if (name.includes('perfect crop') && name.includes('dekkan')) return true;
      // Include other high-quality products
      if (product.isBestSeller || product.discountPercent > 50 || (product.rating && product.rating > 4.5)) {
        return true;
      }
      return false;
    })
    .sort((a, b) => {
      // Prioritize Exylon products first
      const aIsExylon = a.name.toLowerCase().includes('exylon');
      const bIsExylon = b.name.toLowerCase().includes('exylon');
      if (aIsExylon && !bIsExylon) return -1;
      if (!aIsExylon && bIsExylon) return 1;
      return 0;
    })
    .slice(0, 12); // Show first 12 featured products

  return (
    <section className="py-6 md:py-8 lg:py-10 bg-white">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">Featured Products</h2>
          <a href="#" className="text-[#16a34a] hover:text-[#15803d] font-semibold text-base md:text-lg transition-colors whitespace-nowrap hover:underline">
            View All →
          </a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5 md:gap-3">
          {featuredProducts.map((product) => (
            <div key={product.id} className="w-full h-full flex flex-col">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

