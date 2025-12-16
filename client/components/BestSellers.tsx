'use client';

import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import { getBestsellerProducts } from '@/lib/api/products';

// Fallback products data (used when API is unavailable)
const fallbackProducts = [
  {
    id: '1',
    name: 'HUBEL - Humic Acid 98% Potassium Humate, Suitable for All Crops, Enhances Root Mass, Brix Level, and Plant Growth',
    brand: 'Noble Crop Science',
    rating: 4.68,
    reviews: 467,
    originalPrice: 670,
    currentPrice: 261,
    discount: 409,
    discountPercent: 61,
    images: [
      'https://agribegri.com/_next/image?url=https%3A%2F%2Fdujjhct8zer0r.cloudfront.net%2Fmedia%2Fprod_image%2F3748729181735026400.webp&w=1080&q=75',
      'https://agribegri.com/_next/image?url=https%3A%2F%2Fdujjhct8zer0r.cloudfront.net%2Fmedia%2Fprod_image%2Fb019300ec1dcd5f9fb609b000e8b603c-12-24-24-14-43-03.webp&w=1080&q=75',
      'https://agribegri.com/_next/image?url=https%3A%2F%2Fdujjhct8zer0r.cloudfront.net%2Fmedia%2Fprod_image%2F9d3d19c670017070466917205f9ec8dd-12-24-24-14-43-10.webp&w=1080&q=75',
      'https://agribegri.com/_next/image?url=https%3A%2F%2Fdujjhct8zer0r.cloudfront.net%2Fmedia%2Fprod_image%2Ff89d63a2c7f1503789f023d53cfe1973-12-24-24-14-43-17.webp&w=1080&q=75',
      'https://agribegri.com/_next/image?url=https%3A%2F%2Fdujjhct8zer0r.cloudfront.net%2Fmedia%2Fprod_image%2Fca353da675ce19a23340abd5691ba112-12-24-24-14-43-27.webp&w=1080&q=75',
      'https://agribegri.com/_next/image?url=https%3A%2F%2Fdujjhct8zer0r.cloudfront.net%2Fmedia%2Fprod_image%2F6ab7ebe2b24d6cd2dd5fe1850b15ca3b-12-27-24-09-42-35.webp&w=1080&q=75',
    ],
    variants: [
      { name: '300 gm', quantity: '300 Gm x 1 Qty', price: 261, isBestSeller: true },
      { name: '600 gm', quantity: '300 Gm x 2 Qty', price: 387, isBestSeller: true },
      { name: '900 gm', quantity: '300 Gm x 3 Qty', price: 530, isBestSeller: true },
      { name: '900 gm', quantity: '900 Gm x 1 Qty', price: 490 },
      { name: '1500 gm', quantity: '300 Gm x 5 Qty', price: 695 },
      { name: '2700 gm', quantity: '900 Gm x 3 Qty', price: 1050 },
      { name: '3 kg', quantity: '300 Gm x 10 Qty', price: 1254 },
      { name: '4500 gm', quantity: '900 Gm x 5 Qty', price: 1645 },
    ],
    isBestSeller: true,
    freeDelivery: true,
    pricePerUnit: '(₹87.00 /100 gm)',
  },
  {
    id: '2',
    name: 'Pellot - Paclobutrazol 23% SC Plant Growth Regulator, Ideal for Mango and Other Major Vegetable Crops',
    brand: 'KRISHANSHECLAT AGROXGLOBAL Trade Link Private Limited',
    rating: 4.49,
    reviews: 242,
    originalPrice: 3740,
    currentPrice: 1244,
    discount: 2496,
    discountPercent: 66,
    images: [
      'https://agribegri.com/_next/image?url=https%3A%2F%2Fdujjhct8zer0r.cloudfront.net%2Fmedia%2Fprod_image%2F5099926071733209484.webp&w=1080&q=75',
      'https://agribegri.com/_next/image?url=https%3A%2F%2Fdujjhct8zer0r.cloudfront.net%2Fmedia%2Fprod_image%2F9191f2a34fd6415dddf08aa6205ee1fc-12-03-24-12-34-20.webp&w=1080&q=75',
      'https://agribegri.com/_next/image?url=https%3A%2F%2Fdujjhct8zer0r.cloudfront.net%2Fmedia%2Fprod_image%2Fe4b99b6e2c2422a891a9703cf00e0de5-12-03-24-12-34-26.webp&w=1080&q=75',
      'https://agribegri.com/_next/image?url=https%3A%2F%2Fdujjhct8zer0r.cloudfront.net%2Fmedia%2Fprod_image%2Fdb748ddd79254280448952b11fe33133-12-03-24-12-34-32.webp&w=1080&q=75',
      'https://agribegri.com/_next/image?url=https%3A%2F%2Fdujjhct8zer0r.cloudfront.net%2Fmedia%2Fprod_image%2F311ca5b2b6ae02acef01de1127e3999d-12-03-24-12-34-38.webp&w=1080&q=75',
    ],
    variants: [
      { name: '500 ml', quantity: '500 ML x 1 Qty', price: 668, isBestSeller: true },
      { name: '1 liter', quantity: '500 ML x 2 Qty', price: 1244, isBestSeller: true },
      { name: '2 liter', quantity: '500 ML x 4 Qty', price: 2442 },
      { name: '5 liter', quantity: '500 ML x 10 Qty', price: 5724 },
      { name: '10 liter', quantity: '500 ML x 20 Qty', price: 10882 },
      { name: '50 liter', quantity: '500 ML x 100 Qty', price: 46403 },
    ],
    isBestSeller: true,
    freeDelivery: true,
    pricePerUnit: '(₹124.40 /100 ml)',
  },
  {
    id: '3',
    name: 'Clorentis Insecticide - Chlorantraniliprole 18.5% SC',
    brand: 'KRISHANSHECLAT AGROXGLOBAL Trade Link Private Limited',
    rating: 4.57,
    reviews: 303,
    originalPrice: 460,
    currentPrice: 217,
    discount: 243,
    discountPercent: 52,
    images: [
      'https://agribegri.com/_next/image?url=https%3A%2F%2Fdujjhct8zer0r.cloudfront.net%2Fmedia%2Fprod_image%2F8301106561733208381.webp&w=1080&q=75',
      'https://agribegri.com/_next/image?url=https%3A%2F%2Fdujjhct8zer0r.cloudfront.net%2Fmedia%2Fprod_image%2F827c90c964e22b573b46305e9164b616-12-03-24-12-15-40.webp&w=1080&q=75',
      'https://agribegri.com/_next/image?url=https%3A%2F%2Fdujjhct8zer0r.cloudfront.net%2Fmedia%2Fprod_image%2Ff791d54b3a246b3cfbc04c5f79795970-12-03-24-12-15-47.webp&w=1080&q=75',
      'https://agribegri.com/_next/image?url=https%3A%2F%2Fdujjhct8zer0r.cloudfront.net%2Fmedia%2Fprod_image%2Fad95c0cc4d6b5765a97d3689c823f854-12-03-24-12-15-54.webp&w=1080&q=75',
      'https://agribegri.com/_next/image?url=https%3A%2F%2Fdujjhct8zer0r.cloudfront.net%2Fmedia%2Fprod_image%2F15d32db21416f8c9e09818e3a4725f0b-12-03-24-12-16-01.webp&w=1080&q=75',
    ],
    variants: [
      { name: '30 ml', quantity: '30 ML X 1 Qty', price: 217, isBestSeller: true },
      { name: '60 ml', quantity: '30 ML x 2 Qty', price: 306, isBestSeller: true },
      { name: '150 ml', quantity: '30 ML x 5 Qty', price: 599 },
      { name: '150 ml', quantity: '150 ML x 1 Qty', price: 541 },
      { name: '300 ml', quantity: '30 ML X 10 Qty', price: 1099 },
      { name: '300 ml', quantity: '150 ML x 2 Qty', price: 956 },
      { name: '600 ml', quantity: '30 ML x 20 Qty', price: 2087 },
      { name: '600 ml', quantity: '150 ML x 4 Qty', price: 1769 },
      { name: '1500 ml', quantity: '150 ML x 10 Qty', price: 4215 },
      { name: '3000 ml', quantity: '150 ML X 20 Qty', price: 8061 },
      { name: '9 liter', quantity: '150 ML x 60 Qty', price: 23994 },
      { name: '12 liter', quantity: '30 ML x 400 Qty', price: 36411 },
      { name: '15 liter', quantity: '30 ML x 500 Qty', price: 45514 },
      { name: '45 liter', quantity: '150 ML x 300 Qty', price: 145162 },
    ],
    isBestSeller: true,
    freeDelivery: true,
    pricePerUnit: '(₹723.33 /100 ml)',
  },
  {
    id: '4',
    name: 'Agrigib - Gibberellic Acid 0.001% L',
    brand: 'KRISHANSHECLAT AGROXGLOBAL Trade Link Private Limited',
    rating: 4.57,
    reviews: 209,
    originalPrice: 960,
    currentPrice: 426,
    discount: 534,
    discountPercent: 55,
    images: [
      'https://agribegri.com/_next/image?url=https%3A%2F%2Fdujjhct8zer0r.cloudfront.net%2Fmedia%2Fprod_image%2F10684522411733210493.webp&w=1080&q=75',
      'https://agribegri.com/_next/image?url=https%3A%2F%2Fdujjhct8zer0r.cloudfront.net%2Fmedia%2Fprod_image%2Ff50c774f7e2965f5cc4fd2b47c125e58-12-03-24-12-51-06.webp&w=1080&q=75',
      'https://agribegri.com/_next/image?url=https%3A%2F%2Fdujjhct8zer0r.cloudfront.net%2Fmedia%2Fprod_image%2Ff85c3dd8cd4ff29b7d1fb45aac2a1aa5-12-03-24-12-51-13.webp&w=1080&q=75',
      'https://agribegri.com/_next/image?url=https%3A%2F%2Fdujjhct8zer0r.cloudfront.net%2Fmedia%2Fprod_image%2F72fda056686413f2ee02a223a22239be-12-03-24-12-51-20.webp&w=1080&q=75',
      'https://agribegri.com/_next/image?url=https%3A%2F%2Fdujjhct8zer0r.cloudfront.net%2Fmedia%2Fprod_image%2F01ac2249885139470d55407c12af61ee-12-03-24-12-51-26.webp&w=1080&q=75',
    ],
    variants: [
      { name: '500 ml', quantity: '500 ML x 1 Qty', price: 292, isBestSeller: true },
      { name: '1 liter', quantity: '500 ML x 2 Qty', price: 426, isBestSeller: true },
      { name: '2 liter', quantity: '500 ML x 4 Qty', price: 757 },
      { name: '5 liter', quantity: '500 ML x 10 Qty', price: 1594 },
      { name: '10 liter', quantity: '500 ML x 20 Qty', price: 2960 },
      { name: '50 liter', quantity: '500 ML x 100 Qty', price: 11614 },
    ],
    isBestSeller: true,
    freeDelivery: true,
    pricePerUnit: '(₹42.60 /100 ml)',
  },
  {
    id: '5',
    name: 'Empala - Emamectin Benzoate 1.5% + Fipronil 3.5% SC Insecticide, Effective Against Resistant Pests with Systemic and Contact Activity',
    brand: 'KRISHANSHECLAT AGROXGLOBAL Trade Link Private Limited',
    rating: 4.6,
    reviews: 113,
    originalPrice: 910,
    currentPrice: 356,
    discount: 554,
    discountPercent: 61,
    images: [
      'https://agribegri.com/_next/image?url=https%3A%2F%2Fdujjhct8zer0r.cloudfront.net%2Fmedia%2Fprod_image%2F13925455601733207058.webp&w=640&q=75',
    ],
    variants: [
      { name: '250 ml', quantity: '250 ML x 1 Qty', price: 356, isBestSeller: true },
      { name: '500 ml', quantity: '250 ML x 2 Qty', price: 670, isBestSeller: true },
      { name: '1 liter', quantity: '250 ML x 4 Qty', price: 1260 },
    ],
    isBestSeller: true,
    freeDelivery: true,
    pricePerUnit: '(₹142.40 /100 ml)',
  },{
    "id": "6",
    "name": "Flow N - Nitrobenzene 35% Flowering Stimulant, Promotes Root Growth, Water Retention, Reduces Soil Erosion, Organic Fertilizer",
    "brand": "Noble Crop Science",
    "rating": 4.7,
    "reviews": 192,
    "originalPrice": 1508,
    "currentPrice": 545,
    "discount": 963,
    "discountPercent": 63,
    "images": [
      "https://dujjhct8zer0r.cloudfront.net/media/prod_image/20447868851735639283.webp",
      "https://dujjhct8zer0r.cloudfront.net/media/prod_image/834350fa06a83eb59f8ff5f409a77e0b-12-31-24-15-32-45.webp",
      "https://dujjhct8zer0r.cloudfront.net/media/prod_image/e94414dbf7e34471aa8a01fd82f848bf-12-31-24-15-32-54.webp",
      "https://dujjhct8zer0r.cloudfront.net/media/prod_image/d22c6ec590033f0edd956eddd47887cb-12-31-24-15-33-01.webp",
      "https://dujjhct8zer0r.cloudfront.net/media/prod_image/c74e92c20ae312256eeb03ca5e437c03-12-31-24-15-33-08.webp",
      "https://dujjhct8zer0r.cloudfront.net/media/prod_image/e4826b529cae6f05089d8c24052f0cdc-12-31-24-15-33-16.webp"
    ],
    "variants": [
      {
        "name": "600 gm",
        "quantity": "600 gm",
        "price": 545,
        "inStock": null,
        "isBestSeller": null
      },
      {
        "name": "900 gm",
        "quantity": "900 gm",
        "price": 594,
        "inStock": null,
        "isBestSeller": null
      },
      {
        "name": "900 gm",
        "quantity": "900 gm",
        "price": 2343,
        "inStock": null,
        "isBestSeller": null
      },
      {
        "name": "1500 gm",
        "quantity": "1500 gm",
        "price": 2582,
        "inStock": null,
        "isBestSeller": null
      },
      {
        "name": "2700 gm",
        "quantity": "2700 gm",
        "price": 2772,
        "inStock": null,
        "isBestSeller": null
      },
      {
        "name": "3 kg",
        "quantity": "3 kg",
        "price": 3057,
        "inStock": null,
        "isBestSeller": null
      },
      {
        "name": "4500 gm",
        "quantity": "4500 gm",
        "price": 3899,
        "inStock": null,
        "isBestSeller": null
      },
      {
        "name": "5 kg",
        "quantity": "5 kg",
        "price": 4374,
        "inStock": null,
        "isBestSeller": null
      },
      {
        "name": "6 kg",
        "quantity": "6 kg",
        "price": 12126,
        "inStock": null,
        "isBestSeller": null
      },
      {
        "name": "1 liter",
        "quantity": "1 liter",
        "price": 2,
        "inStock": null,
        "isBestSeller": null
      },
      {
        "name": "1 liter",
        "quantity": "1 liter",
        "price": 3,
        "inStock": null,
        "isBestSeller": null
      },
      {
        "name": "5 liter",
        "quantity": "5 liter",
        "price": null,
        "inStock": null,
        "isBestSeller": null
      },
      {
        "name": "5 liter",
        "quantity": "5 liter",
        "price": null,
        "inStock": null,
        "isBestSeller": null
      },
      {
        "name": "5 liter",
        "quantity": "5 liter",
        "price": null,
        "inStock": null,
        "isBestSeller": null
      },
      {
        "name": "5 liter",
        "quantity": "5 liter",
        "price": null,
        "inStock": null,
        "isBestSeller": null
      },
      {
        "name": "10 liter",
        "quantity": "10 liter",
        "price": null,
        "inStock": null,
        "isBestSeller": null
      },
      {
        "name": "10 liter",
        "quantity": "10 liter",
        "price": null,
        "inStock": null,
        "isBestSeller": null
      },
      {
        "name": "50 liter",
        "quantity": "50 liter",
        "price": null,
        "inStock": null,
        "isBestSeller": null
      }
    ],
    "description": "Flow N is a Nitrobenzene fertilizer containing Nitrobenzene 35% SL to boost plant performance. It increases the vitamin content of plants and helps break down nutrients in the soil for better absorption, which is perfect for prolonging the quality of post-harvest crops and achieving better yields.",
    "technicalComposition": "Nitrobenzene 35% SL",
    "keyFeatures": [
      {
        "title": null,
        "description": "Boosts"
      },
      {
        "title": null,
        "description": "Root"
      },
      {
        "title": null,
        "description": "Growth:"
      },
      {
        "title": null,
        "description": "Nitrobenzene fertilizer helps enhance root development, resulting in more vigorous plant growth."
      },
      {
        "title": null,
        "description": "Balance"
      },
      {
        "title": null,
        "description": "Soil pH:"
      },
      {
        "title": null,
        "description": "Flow N balances the soil’s pH level, making it more fertile for optimal crop growth."
      },
      {
        "title": null,
        "description": "Enhance"
      },
      {
        "title": null,
        "description": "Quality"
      },
      {
        "title": null,
        "description": "Yields:"
      },
      {
        "title": null,
        "description": "It helps plants grow more efficiently and stay healthier, resulting in increased yields and profits."
      },
      {
        "title": null,
        "description": "Better"
      },
      {
        "title": null,
        "description": "Nutrient"
      },
      {
        "title": null,
        "description": "Uptake:"
      },
      {
        "title": null,
        "description": "Nitrobenzene fertilizer also helps absorb better nutritional components and supply nutrients efficiently."
      },
      {
        "title": null,
        "description": "Increase"
      },
      {
        "title": null,
        "description": "Water"
      },
      {
        "title": null,
        "description": "Retention:"
      },
      {
        "title": null,
        "description": "It improves soil moisture and reduces water requirement by enhancing its water-holding capacity in crops."
      },
      {
        "title": null,
        "description": "Improves"
      },
      {
        "title": null,
        "description": "Resistance:"
      },
      {
        "title": null,
        "description": "Flow N allows plants and crops to withstand drought and build resistance to diseases."
      }
    ],
    "dosage": {
      "spraying": "For Foliar Application: Use 35 to 40 ml of Nitrobenzene fertilizer per 15-litre spray volume.",
      "sugarcane": null,
      "soilApplication": null
    },
    "suitableCrops": "Flow N is suitable for various crops, including Vegetables, Fruits, Plantation crops, Flowers and pot plants, Turf, and Lawns.",
    "safetyTips": [
      "Always wear gloves",
      "eyeglasses",
      "a face mask.Avoid drinking",
      "eating",
      "smoking while using the product.Keep it away from children",
      "animals."
    ],
    "note": "This Nitrobenzene fertilizer product is intended for agricultural use only.",
    "technicalDetails": {
      "brand": "Noble Crop Science",
      "productCode": null,
      "countryOfOrigin": "India",
      "category": "Fertilizers",
      "subCategory": "Organic Fertilizers",
      "pickupAddress": null,
      "addressOfOrigin": null
    },
    "phoneNumber": "7428208822",
    "pricePerUnit": "(₹54.50 /100 ml)",
    "freeDelivery": null,
    "isBestSeller": null
  }]

export default function BestSellers() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    const fetchBestsellers = async () => {
      try {
        setLoading(true);
        setError(null);
        setUseFallback(false);
        
        const response = await getBestsellerProducts(10);
        if (response.success && response.data && response.data.length > 0) {
          // Transform backend data to match frontend format
          const transformedProducts = response.data.map((product: any) => ({
            id: product._id || product.id,
            name: product.name,
            brand: product.brandName || (typeof product.brand === 'object' ? product.brand?.name : product.brand) || '',
            rating: product.rating || product.averageRating || 0,
            reviews: product.reviews || product.reviewCount || 0,
            originalPrice: product.originalPrice || product.basePrice || 0,
            currentPrice: product.currentPrice || product.salePrice || 0,
            discount: product.discount || 0,
            discountPercent: product.discountPercent || 0,
            images: product.images || [],
            variants: product.variants || [],
            isBestSeller: product.isBestSeller || product.isBestseller || false,
            freeDelivery: product.freeDelivery,
            pricePerUnit: product.pricePerUnit,
            slug: product.slug
          }));
          setProducts(transformedProducts);
        } else {
          // No products from API, use fallback
          console.warn('No bestseller products from API, using fallback data');
          setProducts(fallbackProducts.slice(0, 10));
          setUseFallback(true);
        }
      } catch (err: any) {
        console.error('Error fetching bestsellers:', err);
        const errorMessage = err.message || 'Failed to load bestseller products';
        
        // Log additional details for debugging
        if (process.env.NODE_ENV === 'development') {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
          console.error('API URL:', apiUrl);
          console.error('Full error:', err);
          console.warn('Using fallback products data due to API error');
        }
        
        // Use fallback products if API fails
        setProducts(fallbackProducts.slice(0, 10));
        setUseFallback(true);
        setError(null); // Don't show error if we have fallback data
      } finally {
        setLoading(false);
      }
    };

    fetchBestsellers();
  }, []);

  if (loading) {
    return (
      <section className="py-6 md:py-8 lg:py-10 bg-white">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">Best Sellers</h2>
            <a href="#" className="text-[#16a34a] hover:text-[#15803d] font-semibold text-base md:text-lg transition-colors whitespace-nowrap hover:underline">
              View All →
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5 md:gap-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="w-full h-full flex flex-col animate-pulse">
                <div className="bg-gray-200 rounded-lg aspect-square mb-2"></div>
                <div className="bg-gray-200 h-4 rounded mb-2"></div>
                <div className="bg-gray-200 h-4 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-6 md:py-8 lg:py-10 bg-white">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">Best Sellers</h2>
            <a href="#" className="text-[#16a34a] hover:text-[#15803d] font-semibold text-base md:text-lg transition-colors whitespace-nowrap hover:underline">
              View All →
            </a>
          </div>
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="py-6 md:py-8 lg:py-10 bg-white">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">Best Sellers</h2>
            <a href="#" className="text-[#16a34a] hover:text-[#15803d] font-semibold text-base md:text-lg transition-colors whitespace-nowrap hover:underline">
              View All →
            </a>
          </div>
          <div className="text-center py-8">
            <p className="text-gray-500">No bestseller products available at the moment.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 md:py-8 lg:py-10 bg-white">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">Best Sellers</h2>
          <a href="#" className="text-[#16a34a] hover:text-[#15803d] font-semibold text-base md:text-lg transition-colors whitespace-nowrap hover:underline">
            View All →
          </a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5 md:gap-3">
          {products.map((product) => (
            <div key={product.id} className="w-full h-full flex flex-col">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
