'use client';

import { CheckCircle2, Clock, Package, Truck, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface OrderTrackingTimelineProps {
  order: {
    status: string;
    createdAt: string;
    shippedAt?: string | null;
    deliveredAt?: string | null;
    cancelledAt?: string | null;
    trackingNumber?: string | null;
    carrierName?: string | null;
    orderNumber?: string;
  };
}

const statusSteps = [
  { key: 'PENDING', label: 'Order Placed', icon: Clock },
  { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'PROCESSING', label: 'Processing', icon: Package },
  { key: 'SHIPPED', label: 'Shipped', icon: Truck },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle2 },
];

const cancelledStatuses = ['CANCELLED', 'RETURNED', 'REFUNDED'];

export default function OrderTrackingTimeline({ order }: OrderTrackingTimelineProps) {
  const getStatusIndex = (status: string) => {
    return statusSteps.findIndex(step => step.key === status);
  };

  const currentIndex = getStatusIndex(order.status);
  const isCancelled = cancelledStatuses.includes(order.status);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Order Tracking</h3>
        {order.orderNumber && (
          <span className="text-sm text-gray-500">Order #{order.orderNumber}</span>
        )}
      </div>

      {/* Tracking Number Display */}
      {order.trackingNumber && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Tracking Number</p>
              <p className="text-lg font-bold text-blue-700 mt-1">{order.trackingNumber}</p>
            </div>
            {order.carrierName && (
              <div className="text-right">
                <p className="text-sm text-blue-600">Carrier</p>
                <p className="text-sm font-medium text-blue-900">{order.carrierName}</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200">
          {!isCancelled && currentIndex >= 0 && (
            <div
              className="absolute top-0 left-0 w-0.5 bg-primary transition-all duration-500"
              style={{ height: `${(currentIndex / (statusSteps.length - 1)) * 100}%` }}
            />
          )}
        </div>

        {/* Status Steps */}
        <div className="space-y-6">
          {statusSteps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index <= currentIndex && !isCancelled;
            const isCurrent = index === currentIndex && !isCancelled;
            const isPast = index < currentIndex && !isCancelled;

            // Get timestamp for this step
            let timestamp: string | null = null;
            if (step.key === 'PENDING' && order.createdAt) {
              timestamp = format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm');
            } else if (step.key === 'CONFIRMED' && order.status === 'CONFIRMED' && order.createdAt) {
              timestamp = format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm');
            } else if (step.key === 'PROCESSING' && order.status === 'PROCESSING' && order.createdAt) {
              timestamp = format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm');
            } else if (step.key === 'SHIPPED' && order.shippedAt) {
              timestamp = format(new Date(order.shippedAt), 'MMM dd, yyyy HH:mm');
            } else if (step.key === 'OUT_FOR_DELIVERY' && order.status === 'OUT_FOR_DELIVERY' && order.shippedAt) {
              timestamp = format(new Date(order.shippedAt), 'MMM dd, yyyy HH:mm');
            } else if (step.key === 'DELIVERED' && order.deliveredAt) {
              timestamp = format(new Date(order.deliveredAt), 'MMM dd, yyyy HH:mm');
            }

            return (
              <div key={step.key} className="relative flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                    isActive
                      ? 'bg-primary border-primary text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  <StepIcon className="h-6 w-6" />
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className={`font-medium ${
                          isActive ? 'text-gray-900' : 'text-gray-500'
                        }`}
                      >
                        {step.label}
                      </p>
                      {timestamp && (
                        <p className="text-sm text-gray-500 mt-1">{timestamp}</p>
                      )}
                    </div>
                    {isCurrent && (
                      <span className="px-2 py-1 text-xs font-medium bg-primary text-white rounded">
                        Current
                      </span>
                    )}
                    {isPast && (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Cancelled Status */}
          {isCancelled && (
            <div className="relative flex items-start gap-4">
              <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 bg-red-100 border-red-500 text-red-600">
                <XCircle className="h-6 w-6" />
              </div>
              <div className="flex-1 pt-1">
                <p className="font-medium text-red-600">
                  {order.status === 'CANCELLED' ? 'Order Cancelled' : 
                   order.status === 'RETURNED' ? 'Order Returned' : 
                   'Order Refunded'}
                </p>
                {order.cancelledAt && (
                  <p className="text-sm text-gray-500 mt-1">
                    {format(new Date(order.cancelledAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

