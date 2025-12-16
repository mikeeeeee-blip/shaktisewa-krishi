'use client';

import Link from 'next/link';

export default function CampaignBanners() {
  const campaigns = [
    { title: 'Be Vocal for Local – Desh ka Vishwas, Desh ka Digital Store', link: '#' },
    { title: 'Geolife Campaign 2025-26', link: '#' },
    { title: 'Vanproz Campaign: Sep. 2025', link: '#' },
    { title: 'Rabi Season', link: '#' },
    { title: 'Sagar Biotech Campaign – Sep 2025', link: '#' },
    { title: 'Mulching paper- Upto 50% off (Nov. 2025)', link: '#' },
    { title: 'ATPL-  Upto 60% off (November, 2025)', link: '#' },
    { title: 'Mitrasena Bio Products – Price Drop', link: '#' },
  ];

  return (
    <section className="py-3 sm:py-4 md:py-5 lg:py-6 bg-gradient-to-r from-green-50 via-blue-50 to-green-50 border-y border-gray-200">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 max-w-7xl">
        <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
          <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900">Explore Our Current Offers Bundles</h3>
        </div>
        <div className="overflow-x-auto scrollbar-hide -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6">
          <div className="flex gap-2 sm:gap-2.5 md:gap-3 pb-2" style={{ minWidth: 'max-content' }}>
            {campaigns.map((campaign, index) => (
              <Link
                key={index}
                href={campaign.link}
                className="flex-shrink-0 bg-white border border-gray-300 rounded-lg px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-3 hover:shadow-md hover:border-[#16a34a] hover:bg-green-50 transition-base whitespace-nowrap"
              >
                <span className="text-[11px] sm:text-xs md:text-sm lg:text-base font-medium text-gray-800">
                  {campaign.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

