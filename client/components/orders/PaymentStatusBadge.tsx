'use client';

import { CheckCircle2, Clock, XCircle, RotateCcw } from 'lucide-react';

interface PaymentStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: Clock,
  },
  PAID: {
    label: 'Paid',
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: CheckCircle2,
  },
  FAILED: {
    label: 'Failed',
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: XCircle,
  },
  REFUNDED: {
    label: 'Refunded',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: RotateCcw,
  },
  PARTIALLY_REFUNDED: {
    label: 'Partially Refunded',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: RotateCcw,
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1.5',
  lg: 'text-base px-4 py-2',
};

export default function PaymentStatusBadge({ status, size = 'md' }: PaymentStatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: Clock,
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${config.color} ${sizeClasses[size]}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

