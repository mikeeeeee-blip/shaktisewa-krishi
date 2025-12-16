'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import Toast from './Toast';

interface ProductVariant {
  name: string;
  quantity: string;
  price: number | null;
  isBestSeller?: boolean | null;
  inStock?: boolean | null;
}

interface Product {
  id: string;
  name: string;
  brand: string | null;
  rating: number | null;
  reviews: number | null;
  originalPrice: number;
  currentPrice: number;
  discount: number;
  discountPercent: number;
  images: readonly string[] | string[];
  variants: readonly ProductVariant[] | ProductVariant[];
  isBestSeller: boolean | null;
  freeDelivery: boolean | null;
  pricePerUnit: string | null;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [showToast, setShowToast] = useState(false);
  
  // Safe array access with fallbacks
  const selectedVariant = product.variants?.[0];
  const productImage = product.images?.[0] || '/placeholder-image.png';

  // Early return if no variant or image
  const hasImages = product.images && Array.isArray(product.images) && product.images.length > 0;
  if (!selectedVariant || !hasImages) {
    return null;
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedVariant || selectedVariant.price === null) return; // Don't add if price is null
    addToCart({
      productId: product.id,
      name: product.name,
      brand: product.brand || '',
      image: productImage,
      variant: selectedVariant.name,
      quantity: selectedVariant.quantity,
      price: selectedVariant.price,
      originalPrice: product.originalPrice,
    });
    setShowToast(true);
  };

  return (
    <Link href={`/products/${product.id}`} className="block h-full">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 hover-lift flex flex-col h-full">
        {/* Image Section - Fixed height */}
        <div className="relative aspect-square bg-gray-50 flex-shrink-0">
          <Image
            src={productImage}
            alt={product.name || 'Product image'}
            fill
            className="object-contain p-1 sm:p-1.5 md:p-2 lg:p-2.5"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-image.png';
            }}
          />

          {/* Discount Badge - Top Left - Matching agribegri.com style */}
          {product.discountPercent > 0 && (
            <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 z-10">
              <span className="bg-red-600 text-white text-[9px] sm:text-[10px] md:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded shadow-sm">
                {product.discountPercent}% Off
              </span>
            </div>
          )}

          {/* Heart Icon - Top Right */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 p-1 sm:p-1.5 bg-white/95 backdrop-blur-sm rounded-full shadow-md hover:bg-white hover:shadow-lg transition-all duration-200 z-10 group"
            aria-label="Add to favorites"
          >
            <Heart size={14} className="sm:w-4 sm:h-4 text-gray-500 group-hover:text-red-500 transition-colors" />
          </button>
        </div>

        {/* Content Section - Optimized for card visibility */}
        <div className="p-2 sm:p-2.5 md:p-3 flex-1 flex flex-col">
          {/* Product Name - Better readability */}
          <h3 className="text-[11px] sm:text-xs md:text-sm font-semibold text-gray-900 mb-1 sm:mb-1.5 line-clamp-2 min-h-[2.25rem] leading-tight">
            {product.name}
          </h3>

          {/* Brand - Better visibility */}
          {product.brand && (
            <p className="text-[9px] sm:text-[10px] text-gray-600 mb-1 sm:mb-1.5 line-clamp-1 font-medium">
              {product.brand}
            </p>
          )}

          {/* Rating and Reviews - Compact display */}
          {product.rating !== null && product.reviews !== null && (
            <div className="flex items-center gap-0.5 mb-1 sm:mb-1.5">
              <div className="flex items-center">
                <span className="text-yellow-500 text-[10px] sm:text-xs">★</span>
                <span className="text-[10px] sm:text-xs text-gray-700 ml-0.5 font-semibold">{product.rating}</span>
              </div>
              <span className="text-[9px] sm:text-[10px] text-gray-500">
                ({product.reviews > 999 ? `${(product.reviews / 1000).toFixed(1)}k` : product.reviews})
              </span>
            </div>
          )}

          {/* Price Section - Clear pricing */}
          <div className="mb-1 sm:mb-1.5 flex items-baseline gap-1 sm:gap-1.5">
            {selectedVariant.price !== null ? (
              <>
                <span className="text-xs sm:text-sm md:text-base font-bold text-gray-900">
                  ₹{selectedVariant.price}
                </span>
                <span className="text-[10px] sm:text-xs text-gray-500 line-through">
                  ₹{product.originalPrice}
                </span>
              </>
            ) : (
              <span className="text-[10px] sm:text-xs text-gray-500">Price not available</span>
            )}
          </div>

          {/* Quantity - Clear display */}
          <p className="text-[9px] sm:text-[10px] text-gray-600 mb-1.5 sm:mb-2 line-clamp-1 font-medium">
            {selectedVariant.quantity}
          </p>

          {/* Add to Cart Button - Optimized size */}
          <button
            onClick={handleAddToCart}
            disabled={selectedVariant.price === null}
            className="w-full bg-[#16a34a] hover:bg-[#15803d] disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-[10px] sm:text-xs font-semibold py-1.5 sm:py-2 md:py-2.5 rounded-md transition-all duration-200 mt-auto flex items-center justify-center shadow-sm hover:shadow-md"
          >
            {selectedVariant.price === null ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
      
      <Toast
        message="Item added to cart!"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </Link>
  );
}
