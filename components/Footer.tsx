'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Facebook, 
  Linkedin, 
  Twitter, 
  Youtube, 
  Instagram, 
  MessageCircle,
  CheckCircle2,
  Truck,
  Shield,
  HandCoins,
  MapPin,
  Mail,
  Phone
} from 'lucide-react';

const Footer = () => {
  const { isAuthenticated } = useAuth();
  return (
    <footer className="w-full">
      {/* Upper Section - Dark Blue */}
      <div className="bg-[#1e3a5f] text-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          {/* Guarantee Boxes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-7 md:mb-8">
            <div className="bg-gray-800 rounded-lg p-2 sm:p-3 md:p-4 flex items-center gap-1.5 sm:gap-2 md:gap-3">
              <div className="bg-green-600 rounded-full p-1.5 sm:p-2 flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-[10px] xs:text-xs sm:text-sm leading-tight">Guaranteed Lowest Prices</p>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-2 sm:p-3 md:p-4 flex items-center gap-1.5 sm:gap-2 md:gap-3">
              <div className="bg-blue-600 rounded-full p-1.5 sm:p-2 flex-shrink-0">
                <Truck className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-[10px] xs:text-xs sm:text-sm leading-tight">FREE India Wide Shipping</p>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-2 sm:p-3 md:p-4 flex items-center gap-1.5 sm:gap-2 md:gap-3">
              <div className="bg-green-600 rounded-full p-1.5 sm:p-2 flex-shrink-0">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-[10px] xs:text-xs sm:text-sm leading-tight">SAFE SHOPPING Guarantee</p>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-2 sm:p-3 md:p-4 flex items-center gap-1.5 sm:gap-2 md:gap-3">
              <div className="bg-blue-600 rounded-full p-1.5 sm:p-2 flex-shrink-0">
                <HandCoins className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-[10px] xs:text-xs sm:text-sm leading-tight">EASY Returns & Replacements</p>
              </div>
            </div>
          </div>

          {/* Footer Navigation Links */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8 md:gap-10 lg:gap-12 mb-6 sm:mb-8 md:mb-10">
            {/* Categories */}
            <div>
              <h3 className="font-bold text-base sm:text-lg md:text-xl mb-3 sm:mb-4 md:mb-5 text-white">Categories</h3>
              <ul className="space-y-2 sm:space-y-2.5 md:space-y-3">
                <li>
                  <Link 
                    href="/categories/equipments" 
                    className="text-sm sm:text-base text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block"
                  >
                    Equipments
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/categories/gardening" 
                    className="text-sm sm:text-base text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block"
                  >
                    Gardening
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/categories/crop-protection" 
                    className="text-sm sm:text-base text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block"
                  >
                    Crop protection
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/categories/fertilizers" 
                    className="text-sm sm:text-base text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block"
                  >
                    Fertilizers
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/categories/organic-farming" 
                    className="text-sm sm:text-base text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block"
                  >
                    Organic Farming
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/categories/bulk" 
                    className="text-sm sm:text-base text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block"
                  >
                    Bulk
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/categories/seeds" 
                    className="text-sm sm:text-base text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block"
                  >
                    Seeds
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/categories/irrigation" 
                    className="text-sm sm:text-base text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block"
                  >
                    Irrigation
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/categories/cattle-bird-care" 
                    className="text-sm sm:text-base text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block"
                  >
                    Cattle & Bird Care
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/categories/farm-products" 
                    className="text-sm sm:text-base text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block"
                  >
                    Farm Products
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/categories/media" 
                    className="text-sm sm:text-base text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block"
                  >
                    Media
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/categories/health-wellness" 
                    className="text-sm sm:text-base text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block"
                  >
                    Health & Wellness
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/categories/growth-regulators" 
                    className="text-sm sm:text-base text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block"
                  >
                    Growth Regulators
                  </Link>
                </li>
              </ul>
            </div>

            {/* Know Us Better */}
            <div>
              <h3 className="font-bold text-base sm:text-lg md:text-xl mb-3 sm:mb-4 md:mb-5 text-white">Know Us Better</h3>
              <ul className="space-y-2 sm:space-y-2.5 md:space-y-3">
                <li>
                  <Link 
                    href="/about-us" 
                    className="text-sm sm:text-base text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/why-eclat-agroxglobal" 
                    className="text-sm sm:text-base text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block"
                  >
                    Why ShaktiSewa
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/careers" 
                    className="text-sm sm:text-base text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/contact-us" 
                    className="text-sm sm:text-base text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block"
                  >
                    Contact us
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/new-arrivals" 
                    className="text-sm sm:text-base text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block"
                  >
                    New Arrivals
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/eclat-sale" 
                    className="text-sm sm:text-base text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block"
                  >
                    ShaktiSewa Sale
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/todays-offers" 
                    className="text-sm sm:text-base text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block"
                  >
                    Today&apos;s Offers
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/eclat-talk" 
                    className="text-sm sm:text-base text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block"
                  >
                    ShaktiSewa Talk
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/find-commodity-prices" 
                    className="text-sm sm:text-base text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block"
                  >
                    Find Commodity Prices
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/how-referral-works" 
                    className="text-sm sm:text-base text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block"
                  >
                    How Referral works
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/eclat-agroxglobal-blog" 
                    className="text-sm sm:text-base text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block"
                  >
                    ShaktiSewa Blog
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/sitemap" 
                    className="text-sm sm:text-base text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block"
                  >
                    Sitemap
                  </Link>
                </li>
              </ul>
            </div>

            {/* Our Policies */}
            <div>
              <h3 className="font-bold text-base sm:text-lg md:text-xl mb-3 sm:mb-4 md:mb-5 text-white">Our Policies</h3>
              <ul className="space-y-2 sm:space-y-2.5 md:space-y-3">
                <li>
                  <Link 
                    href="/privacy-policy" 
                    className="text-sm sm:text-base text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/shipping-delivery" 
                    className="text-sm sm:text-base text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block"
                  >
                    Shipping / Delivery
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/cancellation-policy" 
                    className="text-sm sm:text-base text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block"
                  >
                    Cancellation Policy
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/return-policy" 
                    className="text-sm sm:text-base text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block"
                  >
                    Return Policy
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/faq" 
                    className="text-sm sm:text-base text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/terms-of-use" 
                    className="text-sm sm:text-base text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block"
                  >
                    Terms of Use
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/seller-terms-and-conditions" 
                    className="text-sm sm:text-base text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block"
                  >
                    Seller Terms and Conditions
                  </Link>
                </li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="font-bold text-base sm:text-lg md:text-xl mb-3 sm:mb-4 md:mb-5 text-white">Services</h3>
              <ul className="space-y-2 sm:space-y-2.5 md:space-y-3">
                <li>
                  <Link 
                    href="/sell-on-eclat-agroxglobal" 
                    className="text-sm sm:text-base text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block"
                  >
                    Sell on ShaktiSewa
                  </Link>
                </li>
                {!isAuthenticated && (
                  <li>
                    <Link 
                      href="/customer-login" 
                      className="text-sm sm:text-base text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block"
                    >
                      Customer Login
                    </Link>
                  </li>
                )}
              </ul>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="font-bold text-base sm:text-lg md:text-xl mb-3 sm:mb-4 md:mb-5 text-white">Contact Us</h3>
              <ul className="space-y-3 sm:space-y-3.5 md:space-y-4">
                <li className="flex items-start gap-2 sm:gap-3">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 mt-1 flex-shrink-0" />
                  <p className="text-sm sm:text-base text-gray-200 leading-relaxed">
                    SHAKTISEWA FOUNDATION<br />
                    MR.3. 353, MAHALAXMI NAGAR<br />
                    Indore Tukoganj, Indore<br />
                    Indore- 452001, Madhya Pradesh
                  </p>
                </li>
                <li className="flex items-center gap-2 sm:gap-3">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 flex-shrink-0" />
                  <a 
                    href="mailto:Sales@shaktisewa.com" 
                    className="text-sm sm:text-base text-gray-200 hover:text-white hover:underline transition-all duration-200"
                  >
                    Sales@shaktisewa.com
                  </a>
                </li>
                <li className="flex items-center gap-2 sm:gap-3">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 flex-shrink-0" />
                  <a 
                    href="tel:9243143997" 
                    className="text-sm sm:text-base text-gray-200 hover:text-white hover:underline transition-all duration-200"
                  >
                    *9243143997
                  </a>
                </li>
              </ul>
              <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-gray-600">
                <p className="text-xs sm:text-sm text-gray-300 italic">
                  Managed by<br />
                  <span className="font-semibold text-white">ShaktiSewa</span>
                </p>
              </div>
            </div>
          </div>

          {/* Copyright and Social Media */}
          <div className="flex flex-col md:flex-row justify-between items-center pt-5 sm:pt-6 md:pt-8 border-t border-gray-600 gap-4 sm:gap-5">
            <p className="text-sm sm:text-base text-gray-200 text-center md:text-left mb-2 md:mb-0">Copyright©2025@shaktisewa.com. All rights reserved.</p>
            <div className="flex items-center gap-3 sm:gap-4 md:gap-5 flex-wrap justify-center md:justify-start">
              <span className="text-sm sm:text-base text-gray-200 mr-2 sm:mr-3">Connect With</span>
              <div className="flex gap-3 sm:gap-4">
                <a 
                  href="#" 
                  className="text-gray-200 hover:text-white hover:scale-110 transition-all duration-200" 
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5 sm:w-6 sm:h-6" />
                </a>
                <a 
                  href="#" 
                  className="text-gray-200 hover:text-white hover:scale-110 transition-all duration-200" 
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5 sm:w-6 sm:h-6" />
                </a>
                <a 
                  href="#" 
                  className="text-gray-200 hover:text-white hover:scale-110 transition-all duration-200" 
                  aria-label="Twitter"
                >
                  <Twitter className="w-5 h-5 sm:w-6 sm:h-6" />
                </a>
                <a 
                  href="#" 
                  className="text-gray-200 hover:text-white hover:scale-110 transition-all duration-200" 
                  aria-label="YouTube"
                >
                  <Youtube className="w-5 h-5 sm:w-6 sm:h-6" />
                </a>
                <a 
                  href="#" 
                  className="text-gray-200 hover:text-white hover:scale-110 transition-all duration-200" 
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5 sm:w-6 sm:h-6" />
                </a>
                <a 
                  href="#" 
                  className="text-gray-200 hover:text-white hover:scale-110 transition-all duration-200" 
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Section - Lighter Blue */}
      <div className="bg-[#4a7ba7] text-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-5 md:mb-6">Most Searched on ShaktiSewa</h2>
          
          <div className="space-y-4 sm:space-y-5 md:space-y-6 text-xs sm:text-sm">
            {/* Equipments */}
            <div>
              <h3 className="font-bold mb-1.5 sm:mb-2 text-sm sm:text-base">Equipments :</h3>
              <p className="text-gray-100 leading-relaxed">
                Hand Operated Tools | Spray Pump | Tarpaulin | Mulching | Brush Cutter | Weeders | Water Pump | Pond Liner | Vermi Compost Bed | Biofloc Fish Tank | Head Torch | Azolla Growing Bed | Weed Control Mat | Solar Products | Fogging Machine | Chain Saw | Crop Protection Cover | Hedge Trimmer | Earth Auger | Other Hardware | Traps
              </p>
            </div>

            {/* Gardening */}
            <div>
              <h3 className="font-bold mb-2">Gardening :</h3>
              <p className="text-gray-100">
                Spray Pumps | Lawn Mowers | Pebbles | Accessories | Seeds | Fertilizer | Pesticides | Garden Shade Net | Coco Peat | Tools | Transplanting | Repotting Mat | Gardening Kit | Grow Bag | De oiled Cake | Flower Seeds | Fertilizer Blend
              </p>
            </div>

            {/* Crop protection */}
            <div>
              <h3 className="font-bold mb-2">Crop protection :</h3>
              <p className="text-gray-100">
                Insecticides | Herbicides/Weedicide | Fungicides | Bactericides | Sticking/Wetting Agent | Animal Repellent | Nematicide | Combo Product | Crop Special Products
              </p>
            </div>

            {/* Fertilizers */}
            <div>
              <h3 className="font-bold mb-2">Fertilizers :</h3>
              <p className="text-gray-100">
                Biological Fertilizers | Micronutrient Fertilizers | Organic Fertilizers | Liquid Fertilizers | Soil Fertilizers | Bulk Fertilizers | Water Fertilizers | Chelated Micronutrient
              </p>
            </div>

            {/* Organic Farming */}
            <div>
              <h3 className="font-bold mb-2">Organic Farming :</h3>
              <p className="text-gray-100">
                Organic Fertilizer | Viricides | Neem Oil | Waste Decomposer | Vermi Compost | Organic Remedial Inputs
              </p>
            </div>

            {/* Seeds */}
            <div>
              <h3 className="font-bold mb-2">Seeds :</h3>
              <p className="text-gray-100">
                Vegetable | Natural | Onion | Cotton Seeds | Field Crop | Exotic Vegetable | Fruit Crop | Root And Tuber Crop | Leafy Vegetable | Marigold
              </p>
            </div>

            {/* Irrigation */}
            <div>
              <h3 className="font-bold mb-2">Irrigation :</h3>
              <p className="text-gray-100">
                Sprinkler | Drip Irrigation Accessories | Pipe & Fitting | Drip Irrigation Kit | Rain Pipe
              </p>
            </div>

            {/* Cattle & Bird Care */}
            <div>
              <h3 className="font-bold mb-2">Cattle & Bird Care :</h3>
              <p className="text-gray-100">
                Fodder Seed | Mineral Mixture | Aquaculture Feed Additives | Goat And Sheep Care | Poultry Feed Supplements | Swine Supplement | Silage bag(Murghas Bag)
              </p>
            </div>

            {/* Growth Promoters */}
            <div>
              <h3 className="font-bold mb-2">Growth Promoters :</h3>
              <p className="text-gray-100">
                pH balancer | Humic Acid | PGR / PGP / PGH | Humic & Fulvic Acid | Flowering Stimulant
              </p>
            </div>

            {/* Insecticides */}
            <div>
              <h3 className="font-bold mb-2">Insecticides :</h3>
              <p className="text-gray-100">
                 Thiazol Thiamethoxam 30% FS Insecticide, Efficient Seed Treatment For Early Pest Control / Katyayani Docter Thiamethoxam 30% FS Insecticide, For Systemic Seed Treatment / Mahindra Summit Attila Gold Thiamethoxam 30% FS Insecticide, Use For Seed Treatment and Sucking Pests / United Chemical Unitara FS Thiamethoxam 30% FS Insecticide, Systemic Insecticide / EBS Thiomaster Thiamethoxam 30% FS, Control Of A Wide Range Of Early Season Sucking And Chewing, Leaf-Feeding And Soil Dwelling Insect Pests
              </p>
            </div>

            {/* Agriculture Equipments */}
            <div>
              <h3 className="font-bold mb-2">Agriculture Equipments :</h3>
              <p className="text-gray-100">
                WAVAR A4 Sticky Trap, 12 x 8 Inch, 3mm Thickness, Eco Friendly (Combo Of 20 Yellow + 5 Blue) / WAVAR Bactrocera Dorsalis Macphil Trap, Easy To Install, Effective Fruit Fly Control / WAVAR Funnel Trap with Spodoptera Litura Lure, Efficient For Armyworm And Cutworm Pest Control In Crops / WAVAR Leucinodes Orbonalis Funnel Trap, Efficient For Brinjal Fruit Shoot Borer Pest, Effective Pest Management / WAVAR Tuta Absoluta Delta Trap, Effective For Tomato Leaf Miner Pest Control In Crops
              </p>
            </div>

            {/* Gardening Products */}
            <div>
              <h3 className="font-bold mb-2">Gardening Products :</h3>
              <p className="text-gray-100">
                Radhe Premium Silicone Thumb Cutter With Finger Protection, Plucking Device For Cutting Vegetable and Fruit Scraper (Pack of 5) / Balwaan SP-80B Li-Ion Garden Spray Pump, 12 Volt x 2.6 Amp Battery, 8 Ltr Tank Capacity, Suitable for Garden Pest Control and Agriculture / Mustard Oil Cake Powder for Healthy Plant Growth, made from premium quality cold pressed oil cakes / Green Garden Shade Net - Genuine 50% Shade, Mesh, UV Stabilized Material, HDPE Virgin Polymer
              </p>
            </div>

            {/* Trending Products */}
            <div>
              <h3 className="font-bold mb-2">Trending Products</h3>
              <p className="text-gray-100">
                Vesicular Arbuscular Mycorrhiza / Hydrogen Peroxide 30% / Crop Tonic 21 Amino Acid / Green Seaweed Extract / Spinosad 45% SC / Saprophytic Microorganisms / Active Phosphorus And Potash / Auxins: 05% w/v + Carboxylic Acid: 05% w/v + Elongation Hormones: 01% w/v / Pest Out Pest Out Sucking Pest Controller / NPK Microbial Consortia / Size Fast Plant Growth Promoter / Insta Bion Amino Acid / Chitosan 10% / Wet Gold Silicon Based Spreader / Tomato Special Growth Enhancer / Control TRM Sucking Pest Controller / Fulvic Acid 98% / Thiobacillus Spp. / Hexaconazole 4% + Carbendazim 16% SC / Brilliant Flowering Stimulant / Dr.Bacto`s Telya Kill / Bascillus Subtilis / Vesicular Arbuscular Mycorrhizae / Ferrous Sulphate 19% / Dr. Bacto`s Bactomine / Dr. Bactos Bacto DIP / Dr. Bacto`s Bacto Kit / Ampelomyces Quisqualis / Larva Lock Botanical Extracts / Capsona Growth Enhancer
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

