'use client';

import { LucideIcon } from 'lucide-react';

interface OrderSummaryCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  bgColor?: string;
}

export default function OrderSummaryCard({
  title,
  value,
  icon: Icon,
  iconColor,
  bgColor = 'bg-white',
}: OrderSummaryCardProps) {
  return (
    <div className={`${bgColor} rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-5 w-5 ${iconColor}`} />
        <p className="text-sm text-gray-600">{title}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900">
        {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
      </p>
    </div>
  );
}

