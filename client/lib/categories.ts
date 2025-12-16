// Category mapping based on krishansheclatagro.com footer categories
export const categories = [
  'Equipments',
  'Gardening',
  'Crop Protection',
  'Fertilizers',
  'Organic Farming',
  'Bulk',
  'Seeds',
  'Irrigation',
  'Cattle & Bird Care',
  'Farm Products',
  'Media',
  'Health & Wellness',
  'Growth Regulators',
  'Har Din Sasta',
] as const;

export type CategoryType = typeof categories[number];

// Category slug mapping
export const categorySlugs: Record<CategoryType, string> = {
  'Equipments': 'equipments',
  'Gardening': 'gardening',
  'Crop Protection': 'crop-protection',
  'Fertilizers': 'fertilizers',
  'Organic Farming': 'organic-farming',
  'Bulk': 'bulk',
  'Seeds': 'seeds',
  'Irrigation': 'irrigation',
  'Cattle & Bird Care': 'cattle-bird-care',
  'Farm Products': 'farm-products',
  'Media': 'media',
  'Health & Wellness': 'health-wellness',
  'Growth Regulators': 'growth-regulators',
  'Har Din Sasta': 'har-din-sasta',
};

// Reverse mapping: slug to category name
export const slugToCategory: Record<string, CategoryType> = Object.fromEntries(
  Object.entries(categorySlugs).map(([category, slug]) => [slug, category as CategoryType])
) as Record<string, CategoryType>;

// Function to categorize a product based on its name, brand, and technical details
export function categorizeProduct(product: {
  name: string;
  brand?: string | null;
  discountPercent?: number | null;
  technicalDetails?: {
    category?: string;
    subCategory?: string;
  } | null;
}): CategoryType | null {
  const name = product.name.toLowerCase();
  const techCategory = product.technicalDetails?.category?.toLowerCase() || '';
  const subCategory = product.technicalDetails?.subCategory?.toLowerCase() || '';

  // Seeds - Check FIRST to override incorrect technicalDetails.category
  // Seed products should be identified by name even if technicalDetails says "Fertilizers"
  if (
    name.endsWith(' seeds') ||
    name.endsWith(' seed') ||
    (name.includes(' seeds') && !name.includes('treatment') && !name.includes('insecticide') && !name.includes('fungicide')) ||
    (name.includes(' seed') && !name.includes('treatment') && !name.includes('insecticide') && !name.includes('fungicide')) ||
    (name.includes('hybrid') && (name.includes('seed') || name.includes('f1')) && !name.includes('treatment') && !name.includes('insecticide')) ||
    name.includes('cotton seed') ||
    name.includes('vegetable seed') ||
    name.includes('field crop seed') ||
    name.includes('sunflower seed') ||
    name.includes('cabbage seed') ||
    name.includes('brinjal seed') ||
    name.includes('cauliflower seed') ||
    name.includes('maize seed') ||
    name.includes('makka ke beej') ||
    name.includes('f1 hybrid') ||
    (name.includes('hybrid') && (name.includes('brinjal') || name.includes('cauliflower') || name.includes('cabbage') || name.includes('maize') || name.includes('sunflower'))) ||
    (techCategory.includes('seed') && !techCategory.includes('treatment')) ||
    subCategory.includes('seed')
  ) {
    return 'Seeds';
  }

  // Crop Protection - Check BEFORE Growth Regulators to catch insecticides/fungicides/herbicides
  // Check for common active ingredients and patterns
  const cropProtectionPatterns = [
    'insecticide', 'fungicide', 'herbicide', 'pesticide', 'nematicide', 'bactericide', 'acaricide', 'miticide',
    'animal repellent', 'pest control', 'disease control', 'weed control', 'virus control', 'viral',
    // Common insecticide active ingredients
    'emamectin', 'thiamethoxam', 'chlorantraniliprole', 'fipronil', 'imidacloprid', 'acetamiprid', 'cypermethrin',
    'lambda-cyhalothrin', 'cartap', 'chlorpyrifos', 'dimethoate', 'monocrotophos',
    // Common fungicide active ingredients
    'hexaconazole', 'azoxystrobin', 'tebuconazole', 'validamycin', 'propiconazole', 'carbendazim', 'mancozeb',
    'copper', 'sulphur', 'bordeaux',
    // Common herbicide active ingredients
    'oxyfluorfen', 'glyphosate', '2,4-d', 'atrazine', 'pendimethalin', 'paraquat',
    // Seed treatment insecticides/fungicides
    'seed treatment',
  ];
  
  // Check for combo packs with pest/virus control (prioritize Crop Protection over Growth Regulators)
  const isComboWithPestControl = name.includes('combo') && (
    name.includes('pest') || 
    name.includes('virus') || 
    name.includes('insecticide') || 
    name.includes('fungicide') ||
    name.includes('disease control')
  );
  
  if (
    cropProtectionPatterns.some(pattern => name.includes(pattern)) ||
    isComboWithPestControl ||
    techCategory.includes('crop protection') ||
    techCategory.includes('insecticide') ||
    techCategory.includes('fungicide') ||
    techCategory.includes('herbicide') ||
    subCategory.includes('insecticide') ||
    subCategory.includes('fungicide') ||
    subCategory.includes('herbicide')
  ) {
    return 'Crop Protection';
  }

  // Growth Regulators - Check AFTER Crop Protection to override incorrect technicalDetails.category
  // Products with humic acid, gibberellic, paclobutrazol, flowering stimulants, etc. should be Growth Regulators
  // even if technicalDetails says "Fertilizers"
  const growthRegulatorPatterns = [
    'growth regulator', 'gibberellic', 'paclobutrazol', 'humic acid', 'fulvic acid',
    'pgr', 'pgp', 'pgh', 'flowering stimulant', 'yield enhancer', 'plant growth',
    'plant growth promoter', 'bio-stimulant', 'bio stimulant', 'biosimulant',
    'growth enhancer', 'spring flower', 'spring ever', 'nuclear', 'flowie', 'flow n',
    'nitrobenzene', 'cytokinin', 'auxin', 'brassinosteroid', 'jasmonic', 'salicylic',
  ];
  
  if (
    growthRegulatorPatterns.some(pattern => name.includes(pattern)) ||
    (name.includes('seaweed extract') && (name.includes('bio-stimulant') || name.includes('bio stimulant') || name.includes('specialized'))) ||
    techCategory.includes('growth regulator') ||
    subCategory.includes('pgr') ||
    subCategory.includes('pgp') ||
    subCategory.includes('pgh')
  ) {
    return 'Growth Regulators';
  }

  // Organic Farming - But exclude "vermi compost bed" which should go to Gardening
  // Also exclude products that are Growth Regulators (even if they mention "organic")
  if (
    (name.includes('organic') && !name.includes('flowering stimulant') && !name.includes('plant growth') && !name.includes('growth regulator') && !name.includes('bio-stimulant') && !name.includes('bio stimulant')) ||
    (name.includes('vermi compost') && !name.includes('bed')) ||
    name.includes('neem oil') ||
    name.includes('waste decomposer') ||
    name.includes('viricide') ||
    (techCategory.includes('organic') && !name.includes('humic') && !name.includes('fulvic') && !name.includes('growth'))
  ) {
    return 'Organic Farming';
  }

  // Irrigation - Check BEFORE Equipments to catch irrigation connectors
  if (
    name.includes('irrigation') ||
    name.includes('joiner connector') ||
    name.includes('take off connector') ||
    name.includes('tee connector') ||
    name.includes('lateral pipe') ||
    (name.includes('drip') && !name.includes('insecticide') && !name.includes('fungicide')) ||
    name.includes('sprinkler') ||
    name.includes('rain pipe') ||
    name.includes('pipe & fitting') ||
    techCategory.includes('irrigation')
  ) {
    return 'Irrigation';
  }

  // Equipments - Check BEFORE Fertilizers to override incorrect technicalDetails.category
  // Equipment products should be identified by name even if technicalDetails says "Fertilizers"
  if (
    name.includes('sprayer') ||
    name.includes('spray pump') ||
    (name.includes('pump') && !name.includes('irrigation')) ||
    name.includes('water pump') ||
    name.includes('diaphragm pump') ||
    name.includes('brush cutter') ||
    name.includes('weeder') ||
    name.includes('mulching') ||
    name.includes('tarpaulin') ||
    name.includes('trap') ||
    (name.includes('equipment') && !name.includes('irrigation')) ||
    name.includes('equipments') ||
    name.includes('fogging machine') ||
    name.includes('chain saw') ||
    name.includes('hedge trimmer') ||
    name.includes('earth auger') ||
    name.includes('pruning saw') ||
    name.includes('light fleshlight') ||
    name.includes('analog clock') ||
    name.includes('biofloc fish tank') ||
    name.includes('torch') ||
    name.includes('azolla growing bed') ||
    name.includes('weed control mat') ||
    name.includes('solar') ||
    name.includes('chaff cutter') ||
    name.includes('crop cover') ||
    name.includes('agricultural hardware') ||
    name.includes('pond liner') ||
    techCategory.includes('equipment')
    
  ) {
    return 'Equipments';
  }

  // Gardening - Check BEFORE Fertilizers to override incorrect technicalDetails.category
  // Gardening products should be identified by name even if technicalDetails says "Fertilizers"
  if (
    name.includes('vermi compost bed') ||
    name.includes('compost bed') ||
    (name.includes('garden') && !name.includes('pump') && !name.includes('irrigation') && !name.includes('tool') && !name.includes('sprayer')) ||
    name.includes('lawn mower') ||
    name.includes('coco peat') ||
    name.includes('grow bag') ||
    name.includes('garden shade net') ||
    name.includes('pebble') ||
    name.includes('gardening tool') ||
    name.includes('tools') ||
    name.includes('garden')||
    (name.includes('gardening') && !name.includes('tool') && !name.includes('kit')) ||
    techCategory.includes('gardening')
  ) {
    return 'Gardening';
  }

  // Fertilizers - Check after other categories to avoid false matches
  // BUT exclude products that are Growth Regulators (even if they mention "fertilizer" in name)
  // Check for NPK patterns, micronutrients, and fertilizer-specific terms
  const fertilizerPatterns = [
    'npk', 'nitrogen', 'phosphorus', 'potassium', 'urea', 'dap', 'ssp', 'mop', 'sop',
    'micronutrient', 'macronutrient', 'zinc', 'iron', 'manganese', 'copper', 'boron', 'molybdenum',
    'sulphur', 'calcium', 'magnesium', 'foliar nutrient', 'liquid fertilizer', 'bio fertilizer',
    'fertilizer', 'fertiliser', 'nutrient', 'manure', 'compost', 'dung',
  ];
  
  // Check for NPK ratio patterns (e.g., "25:25:25", "00:00:50", "19:19:19")
  const npkRatioPattern = /\d+:\d+:\d+/;
  
  if (
    fertilizerPatterns.some(pattern => name.includes(pattern)) ||
    npkRatioPattern.test(name) ||
    (name.includes('fertilizer') && !name.includes('flowering stimulant') && !name.includes('organic fertilizer') && !name.includes('bio-stimulant') && !name.includes('bio stimulant') && !name.includes('growth regulator')) ||
    (techCategory.includes('fertilizer') && !name.includes('humic') && !name.includes('fulvic') && !name.includes('growth regulator') && !name.includes('plant growth') && !name.includes('bio-stimulant'))
  ) {
    return 'Fertilizers';
  }

  // Cattle & Bird Care
  if (
    name.includes('cattle') ||
    name.includes('poultry') ||
    name.includes('animal feed') ||
    name.includes('fodder') ||
    name.includes('mineral mixture') ||
    name.includes('aquaculture') ||
    name.includes('goat') ||
    name.includes('sheep') ||
    name.includes('swine') ||
    name.includes('bird') ||
    name.includes('silage') ||
    techCategory.includes('cattle') ||
    techCategory.includes('poultry')
  ) {
    return 'Cattle & Bird Care';
  }

  // Bulk - Products sold in bulk quantities or bulk packaging
  if (
    name.toLowerCase().includes('bulk') ||
    name.toLowerCase().includes('wholesale') ||
    techCategory.includes('bulk')
  ) {
    return 'Bulk';
  }

  // Farm Products
  if (
    name.includes('farm product') ||
    name.includes('agricultural product') ||
    techCategory.includes('farm product')
  ) {
    return 'Farm Products';
  }

  // Media
  if (
    name.includes('magazine') ||
    name.includes('book') ||
    name.includes('guide') ||
    name.includes('manual') ||
    techCategory.includes('media')
  ) {
    return 'Media';
  }

  // Health & Wellness
  if (
    name.includes('health') ||
    name.includes('wellness') ||
    name.includes('nutrition') ||
    name.includes('supplement') ||
    techCategory.includes('health') ||
    techCategory.includes('wellness')
  ) {
    return 'Health & Wellness';
  }

  // Har Din Sasta (Daily Deals - products with high discounts)
  // This is typically for products with very high discounts, but we'll handle it in the component
  // since it's more of a promotional category
  if (
    name.includes('sasta') ||
    name.includes('daily deal') ||
    (product.discountPercent && product.discountPercent > 60)
  ) {
    return 'Har Din Sasta';
  }

  // Default to Fertilizers if it has fertilizer-related terms but no specific match
  if (techCategory.includes('fertilizer')) {
    return 'Fertilizers';
  }

  return null;
}

