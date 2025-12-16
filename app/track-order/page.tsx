'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import TopBar from '@/components/TopBar';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { trackOrderByNumber } from '@/lib/api/orders';
import {
  Search,
  Package,
  Truck,
  MapPin,
  Calendar,
  IndianRupee,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  RETURNED: 'bg-pink-100 text-pink-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
};

const STATUS_ICONS: Record<string, any> = {
  PENDING: Clock,
  CONFIRMED: CheckCircle2,
  PROCESSING: Package,
  SHIPPED: Truck,
  OUT_FOR_DELIVERY: Truck,
  DELIVERED: CheckCircle2,
  CANCELLED: XCircle,
  RETURNED: XCircle,
  REFUNDED: XCircle,
};

const STATUS_STEPS = [
  { status: 'PENDING', label: 'Order Placed' },
  { status: 'CONFIRMED', label: 'Confirmed' },
  { status: 'PROCESSING', label: 'Processing' },
  { status: 'SHIPPED', label: 'Shipped' },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { status: 'DELIVERED', label: 'Delivered' },
];

export default function TrackOrderPage() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) {
      setError('Please enter an order number');
      return;
    }

    setLoading(true);
    setError(null);
    setOrderData(null);

    try {
      const response = await trackOrderByNumber(orderNumber.trim());
      if (response.success && response.data) {
        setOrderData(response.data);
      } else {
        setError('Order not found. Please check your order number.');
      }
    } catch (err: any) {
      console.error('Error tracking order:', err);
      setError(err.response?.data?.message || err.message || 'Failed to track order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStepIndex = () => {
    if (!orderData) return -1;
    return STATUS_STEPS.findIndex(step => step.status === orderData.status);
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="min-h-screen w-screen overflow-x-hidden bg-gray-50">
      <TopBar />
      <Header onMenuToggle={toggleMobileMenu} isMenuOpen={isMobileMenuOpen} />
      <Navigation isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Track Your Order</h1>
          <p className="text-gray-600">Enter your order number to track the status of your order</p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8 mb-8">
          <form onSubmit={handleTrackOrder} className="space-y-4">
            <div>
              <label htmlFor="orderNumber" className="block text-sm font-semibold text-gray-800 mb-2">
                Order Number
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  id="orderNumber"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="Enter your order number (e.g., ORD-2024-001)"
                  className="flex-1 px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 focus:bg-white shadow-sm text-gray-900 placeholder:text-gray-400 font-medium"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !orderNumber.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span className="hidden sm:inline">Tracking...</span>
                    </>
                  ) : (
                    <>
                      <Search size={20} />
                      <span className="hidden sm:inline">Track Order</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-800 flex items-center gap-3">
              <XCircle size={20} className="flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}
        </div>

        {/* Order Details */}
        {orderData && (
          <div className="space-y-6">
            {/* Order Status Timeline */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Status</h2>
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                <div
                  className="absolute left-6 top-0 w-0.5 bg-green-600 transition-all duration-500"
                  style={{ height: `${((currentStepIndex + 1) / STATUS_STEPS.length) * 100}%` }}
                ></div>

                {/* Timeline Steps */}
                <div className="space-y-6 relative">
                  {STATUS_STEPS.map((step, index) => {
                    const isActive = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    const StepIcon = STATUS_ICONS[step.status] || Package;
                    const stepStatus = orderData.status;

                    return (
                      <div key={step.status} className="flex items-start gap-4">
                        <div
                          className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                            isActive
                              ? 'bg-green-600 text-white shadow-lg scale-110'
                              : 'bg-gray-200 text-gray-400'
                          }`}
                        >
                          <StepIcon size={20} />
                        </div>
                        <div className="flex-1 pt-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3
                              className={`font-semibold ${
                                isActive ? 'text-gray-900' : 'text-gray-400'
                              }`}
                            >
                              {step.label}
                            </h3>
                            {isCurrent && (
                              <span className="px-3 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800">
                                Current
                              </span>
                            )}
                          </div>
                          {isActive && step.status === 'SHIPPED' && orderData.shippedAt && (
                            <p className="text-sm text-gray-600">
                              Shipped on {format(new Date(orderData.shippedAt), 'MMM dd, yyyy')}
                            </p>
                          )}
                          {isActive && step.status === 'DELIVERED' && orderData.deliveredAt && (
                            <p className="text-sm text-gray-600">
                              Delivered on {format(new Date(orderData.deliveredAt), 'MMM dd, yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Order Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Order Summary */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Package size={20} className="text-green-600" />
                  Order Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Number:</span>
                    <span className="font-semibold text-gray-900">{orderData.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Date:</span>
                    <span className="font-semibold text-gray-900">
                      {format(new Date(orderData.createdAt), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        STATUS_COLORS[orderData.status] || STATUS_COLORS.PENDING
                      }`}
                    >
                      {orderData.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Status:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        orderData.paymentStatus === 'PAID'
                          ? 'bg-green-100 text-green-800'
                          : orderData.paymentStatus === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {orderData.paymentStatus}
                    </span>
                  </div>
                  {orderData.trackingNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tracking Number:</span>
                      <span className="font-semibold text-gray-900">{orderData.trackingNumber}</span>
                    </div>
                  )}
                  {orderData.carrierName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Carrier:</span>
                      <span className="font-semibold text-gray-900">{orderData.carrierName}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Total Amount:</span>
                      <span className="text-xl font-bold text-green-600 flex items-center gap-1">
                        <IndianRupee size={20} />
                        {orderData.totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin size={20} className="text-green-600" />
                  Shipping Address
                </h3>
                {orderData.shippingAddress && (
                  <div className="space-y-2 text-gray-700">
                    <p className="font-semibold">
                      {orderData.shippingAddress.fullName || orderData.shippingAddress.name}
                    </p>
                    <p>{orderData.shippingAddress.addressLine1}</p>
                    {orderData.shippingAddress.addressLine2 && (
                      <p>{orderData.shippingAddress.addressLine2}</p>
                    )}
                    {orderData.shippingAddress.landmark && (
                      <p>Landmark: {orderData.shippingAddress.landmark}</p>
                    )}
                    <p>
                      {orderData.shippingAddress.city}, {orderData.shippingAddress.state}{' '}
                      {orderData.shippingAddress.pincode}
                    </p>
                    {orderData.shippingAddress.phone && (
                      <p className="pt-2 text-sm text-gray-600">
                        Phone: {orderData.shippingAddress.phone}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Order Items</h3>
              <div className="space-y-4">
                {orderData.items?.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200"
                  >
                    {item.productImage && (
                      <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{item.productName}</h4>
                      {item.variantName && (
                        <p className="text-sm text-gray-600">Variant: {item.variantName}</p>
                      )}
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}


