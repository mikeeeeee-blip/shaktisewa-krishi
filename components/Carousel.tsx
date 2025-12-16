'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

const banners = [
  '/banner/1.webp',
  '/banner/2.webp',
  '/banner/3.webp',
  '/banner/4.webp',
  '/banner/5.webp',
  '/banner/6.webp',
];

export default function Carousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000); // Auto-advance every 5 seconds

    return () => clearInterval(timer);
  }, []);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="relative w-full h-[200px] xs:h-[250px] sm:h-[300px] md:h-[400px] lg:h-[500px] xl:h-[600px] overflow-hidden bg-gradient-to-b from-yellow-50 via-yellow-50 to-green-50" style={{ zIndex: 1 }}>
      {/* Carousel Images */}
      <div className="relative w-full h-full">
        {banners.map((banner, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={banner}
              alt={`Banner ${index + 1}`}
              fill
              className="object-contain sm:object-cover"
              priority={index === 0}
              sizes="100vw"
            />
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1.5 sm:p-2 shadow-lg transition-all z-10"
        aria-label="Previous slide"
      >
        <ChevronLeft size={18} className="sm:w-6 sm:h-6 text-gray-800" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1.5 sm:p-2 shadow-lg transition-all z-10"
        aria-label="Next slide"
      >
        <ChevronRight size={18} className="sm:w-6 sm:h-6 text-gray-800" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-3 sm:bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 z-10">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-1.5 sm:h-2 md:h-2.5 rounded-full transition-all ${
              index === currentIndex
                ? 'w-6 sm:w-8 bg-white shadow-md'
                : 'w-1.5 sm:w-2 md:w-2.5 bg-white/60 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

