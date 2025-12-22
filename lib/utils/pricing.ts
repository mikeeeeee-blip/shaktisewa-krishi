/**
 * Utility functions for product pricing calculations
 */

/**
 * Calculates an estimated price for a variant when the price is unreasonably low
 * @param variantPrice - The current variant price (may be invalid like ₹2)
 * @param originalPrice - The original price of the product
 * @param discountPercent - The discount percentage
 * @param currentPrice - The current price of the product (base variant)
 * @param variantQuantity - The quantity string (e.g., "300 Gm x 1 Qty")
 * @returns Estimated realistic price
 */
export function estimateVariantPrice(
  variantPrice: number | null,
  originalPrice: number,
  discountPercent: number,
  currentPrice: number,
  variantQuantity?: string
): number | null {
  // If price is null, return null
  if (variantPrice === null) {
    return null;
  }

  // If price is unreasonably low (₹2, ₹3, etc.), calculate estimate
  if (variantPrice <= 10) {
    // Use currentPrice if available and reasonable, otherwise calculate from originalPrice and discount
    let estimatedBasePrice = currentPrice;
    if (!estimatedBasePrice || estimatedBasePrice <= 10) {
      // Calculate base discounted price from original price and discount
      estimatedBasePrice = originalPrice * (1 - discountPercent / 100);
    }
    
    // Try to extract quantity multiplier from variant quantity string
    let quantityMultiplier = 1;
    if (variantQuantity) {
      // Extract numbers from quantity string (e.g., "300 Gm x 2 Qty" -> 2)
      const quantityMatch = variantQuantity.match(/x\s*(\d+)\s*qty/i);
      if (quantityMatch) {
        quantityMultiplier = parseInt(quantityMatch[1], 10) || 1;
      } else {
        // Try to extract weight/volume and calculate multiplier
        // For example: "600 gm" from base "300 gm" = 2x
        const baseWeightMatch = variantQuantity.match(/(\d+)\s*(gm|kg|ml|l)/i);
        if (baseWeightMatch) {
          const variantWeight = parseInt(baseWeightMatch[1], 10);
          // Assume base is around 300-500 units for gm/ml, 1 kg/l for larger
          const assumedBaseWeight = variantWeight < 1000 ? 300 : 1000;
          quantityMultiplier = variantWeight / assumedBaseWeight;
          quantityMultiplier = Math.max(1, Math.round(quantityMultiplier * 10) / 10);
        }
      }
    }
    
    // Calculate estimated price: base price * quantity multiplier
    let estimatedPrice = estimatedBasePrice * quantityMultiplier;
    
    // Round to nearest integer
    estimatedPrice = Math.round(estimatedPrice);
    
    // Ensure minimum price of ₹50 (reasonable minimum for agricultural products)
    estimatedPrice = Math.max(50, estimatedPrice);
    
    return estimatedPrice;
  }

  // Price seems reasonable, return as is
  return variantPrice;
}

/**
 * Gets the display price for a variant, with estimation if needed
 */
export function getDisplayPrice(
  variant: { price: number | null; quantity?: string; name?: string },
  product: { originalPrice: number; discountPercent: number; currentPrice: number }
): { price: number | null; isEstimated: boolean } {
  const estimatedPrice = estimateVariantPrice(
    variant.price,
    product.originalPrice,
    product.discountPercent,
    product.currentPrice,
    variant.quantity
  );

  return {
    price: estimatedPrice,
    isEstimated: variant.price !== null && variant.price <= 10 && estimatedPrice !== null,
  };
}

