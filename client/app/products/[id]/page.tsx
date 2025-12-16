'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ShoppingCart, ChevronRight, CheckCircle, Truck, Package } from 'lucide-react';
import TopBar from '@/components/TopBar';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { productData } from '@/data/products';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import Toast from '@/components/Toast';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const productId = params?.id as string;
  const product = productData[productId as keyof typeof productData];
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">Product not found</p>
      </div>
    );
  }

  // Safe array access with validation
  const selectedVariantData = product.variants?.[selectedVariant];
  const productImage = product.images?.[0] || '/placeholder-image.png';

  // Validate that we have required data
  const hasImages = product.images && Array.isArray(product.images) && product.images.length > 0;
  if (!selectedVariantData || !hasImages) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">Product data incomplete</p>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!selectedVariantData || selectedVariantData.price === null) return; // Don't add if price is null
    addToCart({
      productId: product.id,
      name: product.name,
      brand: product.brand || '',
      image: productImage,
      variant: selectedVariantData.name,
      quantity: selectedVariantData.quantity,
      price: selectedVariantData.price,
      originalPrice: product.originalPrice,
    });
    setShowToast(true);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/cart');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      <TopBar />
      <Header onMenuToggle={toggleMobileMenu} isMenuOpen={isMobileMenuOpen} />
      <Navigation isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />
      
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200 py-3">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-green-600">Home</Link>
            {product.technicalDetails?.category && (
              <>
                <ChevronRight size={16} />
                <span>{product.technicalDetails.category}</span>
              </>
            )}
            {product.technicalDetails?.subCategory && (
              <>
                <ChevronRight size={16} />
                <span>{product.technicalDetails.subCategory}</span>
              </>
            )}
            <ChevronRight size={16} />
            <span className="text-gray-900 font-medium">Product Details</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Side - Product Images */}
          <div>
            {/* Main Image */}
            <div className="relative aspect-square bg-white rounded-lg border border-gray-200 mb-4 overflow-hidden">
              {/* Discount Badge */}
              <div className="absolute top-4 left-4 z-10">
                <span className="bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded">
                  {product.discountPercent}% OFF
                </span>
              </div>

              <Image
                src={product.images[selectedImageIndex] || productImage}
                alt={product.name || 'Product image'}
                fill
                className="object-contain p-4"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-image.png';
                }}
              />

              {/* Image Counter */}
              {product.images && product.images.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  {selectedImageIndex + 1}/{product.images.length}
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            <div className="grid grid-cols-6 gap-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative aspect-square rounded border-2 overflow-hidden transition-all ${
                    selectedImageIndex === idx
                      ? 'border-green-600 ring-2 ring-green-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} view ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 16vw, 8vw"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Right Side - Product Info */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {product.name}
            </h1>

            {product.brand && (
              <p className="text-gray-600 mb-4">Brand: {product.brand}</p>
            )}

            {/* Rating */}
            {product.rating !== null && product.reviews !== null && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  <Star size={20} className="fill-yellow-400 text-yellow-400" />
                  <span className="ml-1 font-semibold">{product.rating}</span>
                </div>
                <span className="text-gray-600">({product.reviews} reviews)</span>
              </div>
            )}

            {/* Price */}
            <div className="mb-6">
              {selectedVariantData.price !== null ? (
                <>
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-3xl font-bold text-gray-900">
                      ₹{selectedVariantData.price}
                    </span>
                    <span className="text-xl text-gray-500 line-through">
                      ₹{product.originalPrice}
                    </span>
                  </div>
                  {product.discount > 0 && (
                    <p className="text-green-600 font-semibold mb-1">
                      You save ₹{product.discount} ({product.discountPercent}% off)
                    </p>
                  )}
                  {product.freeDelivery && (
                    <p className="text-gray-600">Free Delivery</p>
                  )}
                </>
              ) : (
                <p className="text-gray-600 text-lg">Price not available</p>
              )}
            </div>

            {/* Variant Selection */}
            {product.variants && product.variants.length > 1 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Select Variant</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-2 border border-gray-200 rounded">
                  {product.variants.map((variant, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedVariant(idx)}
                      className={`p-3 border-2 rounded text-left transition-all ${
                        selectedVariant === idx
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${variant.inStock !== true ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={variant.inStock !== true}
                    >
                      <div className="font-semibold text-sm">{variant.name}</div>
                      <div className="text-xs text-gray-600 mt-1">{variant.quantity}</div>
                        <div className="text-sm font-bold mt-1">
                        {variant.price !== null ? `₹${variant.price}` : 'Price N/A'}
                      </div>
                      {'isBestSeller' in variant && variant.isBestSeller && (
                        <span className="inline-block mt-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded">
                          BEST SELLER
                        </span>
                      )}
                      {variant.inStock !== true && (
                        <span className="inline-block mt-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded">
                          SOLD OUT
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 mb-6">
              <button 
                onClick={handleAddToCart}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart size={20} />
                ADD TO CART
              </button>
              <button 
                onClick={handleBuyNow}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                BUY NOW
              </button>
            </div>

            {/* Payment & Delivery Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle size={24} className="text-green-600" />
                </div>
                <p className="text-xs text-gray-700">Pay On Delivery Or Online Payment</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle size={24} className="text-blue-600" />
                </div>
                <p className="text-xs text-gray-700">48 hours returnable</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Truck size={24} className="text-purple-600" />
                </div>
                <p className="text-xs text-gray-700">Eclat AgroxglobalDelivery</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Package size={24} className="text-orange-600" />
                </div>
                <p className="text-xs text-gray-700">Shipping Through Courier</p>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm text-gray-700 mb-6">
              <p>• Inclusive of all taxes</p>
              <p>• Pay online and get ₹30 Cash Discount</p>
              <p>• Pay 10% advance and get ₹15 Cash Discount</p>
              <p>
                • Please call us on{' '}
                <a href={`tel:${product.phoneNumber}`} className="text-green-600 underline font-semibold">
                  {product.phoneNumber}
                </a>{' '}
                for bulk quantity order
              </p>
            </div>
          </div>
        </div>

        {/* Product Description */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Product Description</h2>
          <div className="text-gray-700 space-y-4">
            <p>{product.description}</p>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Technical Composition:</h3>
              <p>{product.technicalComposition}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Key Features and Benefits:</h3>
              <ul className="space-y-3">
                {product.keyFeatures.map((feature, idx) => (
                  <li key={idx}>
                    <span className="font-semibold">{feature.title}:</span> {feature.description}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Dosage and Application Method:</h3>
              {'spraying' in product.dosage ? (
                <ul className="space-y-2 list-disc list-inside">
                  <li><span className="font-semibold">For Spraying:</span> {product.dosage.spraying}</li>
                  {'sugarcane' in product.dosage && (
                    <li><span className="font-semibold">For Sugarcane:</span> {product.dosage.sugarcane}</li>
                  )}
                  {'soilApplication' in product.dosage && (
                    <li><span className="font-semibold">For Soil Application Dose:</span> {product.dosage.soilApplication}</li>
                  )}
                </ul>
              ) : 'foliarApplicationTrees' in product.dosage && Array.isArray(product.dosage.foliarApplicationTrees) ? (
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold mb-2">For Foliar Application in Trees:</h4>
                    <ul className="space-y-2 list-disc list-inside ml-4">
                      {product.dosage.foliarApplicationTrees.map((item: string, idx: number) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  {'foliarApplicationOther' in product.dosage && typeof product.dosage.foliarApplicationOther === 'string' && (
                    <div>
                      <h4 className="font-semibold mb-2">For Foliar Application in Other Vegetables and Crops:</h4>
                      <p>{product.dosage.foliarApplicationOther}</p>
                    </div>
                  )}
                </div>
              ) : 'foliarApplication' in product.dosage && typeof product.dosage.foliarApplication === 'string' ? (
                <div>
                  <h4 className="font-semibold mb-2">For Foliar Application:</h4>
                  <p>{product.dosage.foliarApplication}</p>
                </div>
              ) : null}
            </div>

            {'recommendedDosageTable' in product && product.recommendedDosageTable && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Recommended Dosage Table:</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-300 rounded-lg">
                    <thead className="bg-gray-100">
                      <tr>
                        {product.recommendedDosageTable[0] && 'applicationTiming' in product.recommendedDosageTable[0] ? (
                          <>
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Crop Name</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Application Timing</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Dosage per Acre</th>
                          </>
                        ) : product.recommendedDosageTable[0] && 'pests' in product.recommendedDosageTable[0] ? (
                          <>
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Suitable Crop</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Target Pests (General)</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Dosage</th>
                          </>
                        ) : (
                          <>
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Suitable Crops</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Dosage (per 15 liters of water)</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {product.recommendedDosageTable.map((row, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-300 px-4 py-2">{row.crop}</td>
                          {'applicationTiming' in row && (
                            <>
                              <td className="border border-gray-300 px-4 py-2">{row.applicationTiming}</td>
                              <td className="border border-gray-300 px-4 py-2">{row.dosage}</td>
                            </>
                          )}
                          {'pests' in row && (
                            <>
                              <td className="border border-gray-300 px-4 py-2">{row.pests}</td>
                              <td className="border border-gray-300 px-4 py-2">{row.dosage}</td>
                            </>
                          )}
                          {!('applicationTiming' in row) && !('pests' in row) && (
                            <td className="border border-gray-300 px-4 py-2">{row.dosage}</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {'uses' in product && product.uses && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Uses:</h3>
                <p>{product.uses}</p>
              </div>
            )}

            {'targetPests' in product && product.targetPests && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Target Pests:</h3>
                <p>{product.targetPests}</p>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold mb-2">Suitable Crops:</h3>
              <p>{product.suitableCrops}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Safety Tips</h3>
              <ul className="space-y-2 list-disc list-inside">
                {product.safetyTips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Note:</h3>
              <p>{product.note}</p>
            </div>
          </div>
        </div>

        {/* Product Images Grid */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Product Images</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {product.images.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                <Image
                  src={img}
                  alt={`${product.name} - Image ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-2xl font-bold mb-4">Technical Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="font-semibold">Brand:</span> {product.technicalDetails.brand}
            </div>
            <div>
              <span className="font-semibold">Product Code:</span> {product.technicalDetails.productCode}
            </div>
            <div>
              <span className="font-semibold">Country of Origin:</span> {product.technicalDetails.countryOfOrigin}
            </div>
            <div>
              <span className="font-semibold">Category:</span> {product.technicalDetails.category}
            </div>
            <div>
              <span className="font-semibold">Sub Category:</span> {product.technicalDetails.subCategory}
            </div>
            <div>
              <span className="font-semibold">Pickup address:</span> {product.technicalDetails.pickupAddress}
            </div>
            <div className="md:col-span-2">
              <span className="font-semibold">Address of origin:</span> {product.technicalDetails.addressOfOrigin}
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
      
      <Toast
        message="Item added to cart!"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
