'use client';

import { CheckCircle2, Truck, Shield, HandCoins } from 'lucide-react';

export default function TrustBadges() {
  const badges = [
    {
      icon: CheckCircle2,
      title: 'Guaranteed Lowest Prices',
      bgColor: 'bg-green-600',
    },
    {
      icon: Truck,
      title: 'FREE India Wide Shipping',
      bgColor: 'bg-blue-600',
    },
    {
      icon: Shield,
      title: 'SAFE SHOPPING Guarantee',
      bgColor: 'bg-green-600',
    },
    {
      icon: HandCoins,
      title: 'EASY Returns & Replacements',
      bgColor: 'bg-blue-600',
    },
  ];

  return (
    <section className="trust-badges-section">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <div key={index} className="trust-badge-item">
                <div className={`trust-badge-icon ${badge.bgColor}`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-white" />
                </div>
                <h4 className="trust-badge-title">
                  {badge.title}
                </h4>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

