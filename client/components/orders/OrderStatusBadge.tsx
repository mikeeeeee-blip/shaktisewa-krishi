'use client';

import { CheckCircle2, Clock, Package, Truck, XCircle, RotateCcw, Ban } from 'lucide-react';

interface OrderStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: Clock,
  },
  CONFIRMED: {
    label: 'Confirmed',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: CheckCircle2,
  },
  PROCESSING: {
    label: 'Processing',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    icon: Package,
  },
  SHIPPED: {
    label: 'Shipped',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: Truck,
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for Delivery',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: Truck,
  },
  DELIVERED: {
    label: 'Delivered',
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: XCircle,
  },
  RETURNED: {
    label: 'Returned',
    color: 'bg-pink-100 text-pink-800 border-pink-300',
    icon: RotateCcw,
  },
  REFUNDED: {
    label: 'Refunded',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: Ban,
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1.5',
  lg: 'text-base px-4 py-2',
};

export default function OrderStatusBadge({ status, size = 'md' }: OrderStatusBadgeProps) {
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

