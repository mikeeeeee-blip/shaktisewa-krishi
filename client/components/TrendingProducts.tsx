'use client';

import Link from 'next/link';

export default function TrendingProducts() {
  const trendingProducts = [
    'Vesicular Arbuscular Mycorrhiza',
    'Hydrogen Peroxide 30%',
    'Crop Tonic 21 Amino Acid',
    'Green Seaweed Extract',
    'Spinosad 45% SC',
    'Saprophytic Microorganisms',
    'Active Phosphorus And Potash',
    'Auxins: 05% w/v + Carboxylic Acid: 05% w/v + Elongation Hormones: 01% w/v',
    'Pest Out Pest Out Sucking Pest Controller',
    'NPK Microbial Consortia',
    'Size Fast Plant Growth Promoter',
    'Insta Bion Amino Acid',
    'Chitosan 10%',
    'Wet Gold Silicon Based Spreader',
    'Tomato Special Growth Enhancer',
    'Control TRM Sucking Pest Controller',
    'Fulvic Acid 98%',
    'Thiobacillus Spp.',
    'Hexaconazole 4% + Carbendazim 16% SC',
    'Brilliant Flowering Stimulant',
    'Dr.Bacto\'s Telya Kill',
    'Bascillus Subtilis',
    'Vesicular Arbuscular Mycorrhizae',
    'Ferrous Sulphate 19%',
    'Dr. Bacto\'s Bactomine',
    'Dr. Bactos Bacto DIP',
    'Dr. Bacto\'s Bacto Kit',
    'Ampelomyces Quisqualis',
    'Larva Lock Botanical Extracts',
    'Capsona Growth Enhancer',
  ];

  return (
    <section className="py-6 md:py-8 lg:py-10 bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 md:mb-6">Trending Products</h3>
        <div className="flex flex-wrap gap-2 md:gap-3">
          {trendingProducts.map((product, index) => (
            <Link
              key={index}
              href={`/products?search=${encodeURIComponent(product)}`}
              className="inline-block px-3 md:px-4 py-1.5 md:py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs md:text-sm text-black hover:text-gray-900 transition-all duration-200 font-medium cursor-pointer border border-transparent hover:border-gray-300"
            >
              {product}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

