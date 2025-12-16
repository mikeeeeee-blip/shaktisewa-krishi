'use client';

import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import OrderStatusBadge from './OrderStatusBadge';
import PaymentStatusBadge from './PaymentStatusBadge';
import { Package, Calendar, IndianRupee, Eye } from 'lucide-react';

interface OrderCardProps {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    totalAmount: number;
    createdAt: string;
    items: Array<{
      id: string;
      productName: string;
      quantity: number;
      productImage?: string | null;
    }>;
    user?: {
      email?: string;
      firstName?: string;
      lastName?: string;
    };
  };
  isAdmin?: boolean;
}

export default function OrderCard({ order, isAdmin = false }: OrderCardProps) {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const firstItem = order.items[0];
  const remainingItems = order.items.length - 1;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        {/* Left Section */}
        <div className="flex-1 space-y-4">
          {/* Order Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Order #{order.orderNumber}
                </h3>
                <OrderStatusBadge status={order.status} size="sm" />
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                </div>
                <div className="flex items-center gap-1.5">
                  <Package className="h-4 w-4" />
                  {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                </div>
              </div>
            </div>
          </div>

          {/* Order Items Preview */}
          <div className="flex items-center gap-3">
            {firstItem?.productImage ? (
              <div className="relative w-16 h-16 rounded-md overflow-hidden border border-gray-200">
                <Image
                  src={firstItem.productImage}
                  alt={firstItem.productName}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-md bg-gray-100 flex items-center justify-center border border-gray-200">
                <Package className="h-6 w-6 text-gray-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {firstItem?.productName}
              </p>
              {remainingItems > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  +{remainingItems} more {remainingItems === 1 ? 'item' : 'items'}
                </p>
              )}
            </div>
          </div>

          {/* Customer Info (Admin only) */}
          {isAdmin && order.user && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Customer</p>
              <p className="text-sm font-medium text-gray-900">
                {order.user.firstName} {order.user.lastName}
              </p>
              <p className="text-xs text-gray-600">{order.user.email}</p>
            </div>
          )}

          {/* Payment Info */}
          <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500 mb-1">Payment Status</p>
              <PaymentStatusBadge status={order.paymentStatus} size="sm" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Payment Method</p>
              <p className="text-sm font-medium text-gray-900">{order.paymentMethod}</p>
            </div>
            <div className="ml-auto">
              <p className="text-xs text-gray-500 mb-1">Total Amount</p>
              <p className="text-lg font-bold text-gray-900 flex items-center gap-1">
                <IndianRupee className="h-4 w-4" />
                {formatPrice(order.totalAmount)}
              </p>
            </div>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex flex-col gap-2 md:ml-4">
          <Link
            href={isAdmin ? `/admin/orders/${order.id}` : `/my-orders/${order.id}`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors text-sm font-medium"
          >
            <Eye className="h-4 w-4" />
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}

