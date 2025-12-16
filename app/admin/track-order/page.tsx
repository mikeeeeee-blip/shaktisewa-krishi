'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import TopBar from '@/components/TopBar';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import AdminRouteGuard from '@/components/AdminRouteGuard';
import { adminTrackOrder } from '@/lib/api/orders';
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
  User,
  Mail,
  Phone,
  Filter,
  X,
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

const ORDER_STATUSES = [
  'ALL',
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
  'REFUNDED',
];

const PAYMENT_STATUSES = ['ALL', 'PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'];

export default function AdminTrackOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [searchForm, setSearchForm] = useState({
    orderNumber: '',
    customerEmail: '',
    customerPhone: '',
    customerName: '',
    dateFrom: '',
    dateTo: '',
    status: 'ALL',
    paymentStatus: 'ALL',
  });

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if at least one search criteria is provided
    const hasSearchCriteria =
      searchForm.orderNumber ||
      searchForm.customerEmail ||
      searchForm.customerPhone ||
      searchForm.customerName ||
      searchForm.dateFrom ||
      searchForm.dateTo ||
      (searchForm.status !== 'ALL') ||
      (searchForm.paymentStatus !== 'ALL');

    if (!hasSearchCriteria) {
      setError('Please provide at least one search criteria');
      return;
    }

    setLoading(true);
    setError(null);
    setOrders([]);

    try {
      const params: any = {
        limit: 50,
      };

      if (searchForm.orderNumber) params.orderNumber = searchForm.orderNumber;
      if (searchForm.customerEmail) params.customerEmail = searchForm.customerEmail;
      if (searchForm.customerPhone) params.customerPhone = searchForm.customerPhone;
      if (searchForm.customerName) params.customerName = searchForm.customerName;
      if (searchForm.dateFrom) params.dateFrom = searchForm.dateFrom;
      if (searchForm.dateTo) params.dateTo = searchForm.dateTo;
      if (searchForm.status !== 'ALL') params.status = searchForm.status;
      if (searchForm.paymentStatus !== 'ALL') params.paymentStatus = searchForm.paymentStatus;

      const response = await adminTrackOrder(params);
      if (response.success && response.data) {
        setOrders(Array.isArray(response.data) ? response.data : []);
        if (response.count === 0) {
          setError('No orders found matching your search criteria');
        }
      } else {
        setError('Failed to search orders. Please try again.');
      }
    } catch (err: any) {
      console.error('Error searching orders:', err);
      setError(err.response?.data?.message || err.message || 'Failed to search orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearchForm({
      orderNumber: '',
      customerEmail: '',
      customerPhone: '',
      customerName: '',
      dateFrom: '',
      dateTo: '',
      status: 'ALL',
      paymentStatus: 'ALL',
    });
    setOrders([]);
    setError(null);
  };

  return (
    <AdminRouteGuard>
      <div className="min-h-screen w-screen overflow-x-hidden bg-gray-50">
        <TopBar />
        <Header onMenuToggle={toggleMobileMenu} isMenuOpen={isMobileMenuOpen} />
        <Navigation isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />

        <main className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 mb-4 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back to Orders</span>
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Track Orders (Admin)</h1>
            <p className="text-gray-600">Search and track customer orders using multiple criteria</p>
          </div>

          {/* Search Form */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Search Orders</h2>
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Filter size={18} />
                {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
              </button>
            </div>

            <form onSubmit={handleSearch} className="space-y-4">
              {/* Basic Search */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="orderNumber" className="block text-sm font-semibold text-gray-800 mb-2">
                    Order Number
                  </label>
                  <input
                    type="text"
                    id="orderNumber"
                    value={searchForm.orderNumber}
                    onChange={(e) => setSearchForm({ ...searchForm, orderNumber: e.target.value })}
                    placeholder="e.g., ORD-2024-001"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 focus:bg-white shadow-sm text-gray-900 placeholder:text-gray-400"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="customerEmail" className="block text-sm font-semibold text-gray-800 mb-2">
                    Customer Email
                  </label>
                  <input
                    type="email"
                    id="customerEmail"
                    value={searchForm.customerEmail}
                    onChange={(e) => setSearchForm({ ...searchForm, customerEmail: e.target.value })}
                    placeholder="customer@example.com"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 focus:bg-white shadow-sm text-gray-900 placeholder:text-gray-400"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="pt-4 border-t border-gray-200 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="customerPhone" className="block text-sm font-semibold text-gray-800 mb-2">
                        Customer Phone
                      </label>
                      <input
                        type="tel"
                        id="customerPhone"
                        value={searchForm.customerPhone}
                        onChange={(e) => setSearchForm({ ...searchForm, customerPhone: e.target.value })}
                        placeholder="+91 9876543210"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 focus:bg-white shadow-sm text-gray-900 placeholder:text-gray-400"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label htmlFor="customerName" className="block text-sm font-semibold text-gray-800 mb-2">
                        Customer Name
                      </label>
                      <input
                        type="text"
                        id="customerName"
                        value={searchForm.customerName}
                        onChange={(e) => setSearchForm({ ...searchForm, customerName: e.target.value })}
                        placeholder="First or Last name"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 focus:bg-white shadow-sm text-gray-900 placeholder:text-gray-400"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="dateFrom" className="block text-sm font-semibold text-gray-800 mb-2">
                        Date From
                      </label>
                      <input
                        type="date"
                        id="dateFrom"
                        value={searchForm.dateFrom}
                        onChange={(e) => setSearchForm({ ...searchForm, dateFrom: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 focus:bg-white shadow-sm text-gray-900"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label htmlFor="dateTo" className="block text-sm font-semibold text-gray-800 mb-2">
                        Date To
                      </label>
                      <input
                        type="date"
                        id="dateTo"
                        value={searchForm.dateTo}
                        onChange={(e) => setSearchForm({ ...searchForm, dateTo: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 focus:bg-white shadow-sm text-gray-900"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="status" className="block text-sm font-semibold text-gray-800 mb-2">
                        Order Status
                      </label>
                      <select
                        id="status"
                        value={searchForm.status}
                        onChange={(e) => setSearchForm({ ...searchForm, status: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 focus:bg-white shadow-sm text-gray-900"
                        disabled={loading}
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="paymentStatus" className="block text-sm font-semibold text-gray-800 mb-2">
                        Payment Status
                      </label>
                      <select
                        id="paymentStatus"
                        value={searchForm.paymentStatus}
                        onChange={(e) => setSearchForm({ ...searchForm, paymentStatus: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 focus:bg-white shadow-sm text-gray-900"
                        disabled={loading}
                      >
                        {PAYMENT_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Search size={20} />
                      <span>Search Orders</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={loading}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <X size={20} />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              </div>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-800 flex items-center gap-3">
                <XCircle size={20} className="flex-shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}
          </div>

          {/* Results */}
          {orders.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Search Results ({orders.length})
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {orders.map((order: any) => (
                  <div
                    key={order._id}
                    className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                      {/* Order Info */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">
                              Order #{order.orderNumber}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {format(new Date(order.createdAt), 'MMMM dd, yyyy HH:mm')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                STATUS_COLORS[order.status] || STATUS_COLORS.PENDING
                              }`}
                            >
                              {order.status.replace('_', ' ')}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                order.paymentStatus === 'PAID'
                                  ? 'bg-green-100 text-green-800'
                                  : order.paymentStatus === 'PENDING'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {order.paymentStatus}
                            </span>
                          </div>
                        </div>

                        {/* Customer Info */}
                        {order.user && (
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                              <User size={16} />
                              Customer Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-2 text-gray-600">
                                <Mail size={14} />
                                <span>{order.user.email}</span>
                              </div>
                              {order.user.phone && (
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Phone size={14} />
                                  <span>{order.user.phone}</span>
                                </div>
                              )}
                              <div className="text-gray-600">
                                <span className="font-medium">Name:</span>{' '}
                                {order.user.firstName} {order.user.lastName}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Tracking Info */}
                        {(order.trackingNumber || order.carrierName) && (
                          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                              <Truck size={16} className="text-blue-600" />
                              Tracking Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              {order.trackingNumber && (
                                <div className="text-gray-700">
                                  <span className="font-medium">Tracking #:</span> {order.trackingNumber}
                                </div>
                              )}
                              {order.carrierName && (
                                <div className="text-gray-700">
                                  <span className="font-medium">Carrier:</span> {order.carrierName}
                                </div>
                              )}
                              {order.shippedAt && (
                                <div className="text-gray-700">
                                  <span className="font-medium">Shipped:</span>{' '}
                                  {format(new Date(order.shippedAt), 'MMM dd, yyyy')}
                                </div>
                              )}
                              {order.deliveredAt && (
                                <div className="text-gray-700">
                                  <span className="font-medium">Delivered:</span>{' '}
                                  {format(new Date(order.deliveredAt), 'MMM dd, yyyy')}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Order Items */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Order Items</h4>
                          <div className="space-y-2">
                            {order.items?.slice(0, 3).map((item: any, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-200"
                              >
                                {item.productImage && (
                                  <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
                                    <Image
                                      src={item.productImage}
                                      alt={item.productName}
                                      width={48}
                                      height={48}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {item.productName}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    Qty: {item.quantity} × ₹{item.unitPrice}
                                  </p>
                                </div>
                              </div>
                            ))}
                            {order.items?.length > 3 && (
                              <p className="text-xs text-gray-500 text-center">
                                +{order.items.length - 3} more items
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="lg:w-48 flex flex-col gap-3">
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <div className="text-sm text-gray-600 mb-1">Total Amount</div>
                          <div className="text-2xl font-bold text-green-600 flex items-center gap-1">
                            <IndianRupee size={24} />
                            {order.totalAmount.toLocaleString('en-IN')}
                          </div>
                        </div>
                        <Link
                          href={`/admin/orders/${order._id}`}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-center font-semibold"
                        >
                          View Details
                        </Link>
                        {order.trackingNumber && (
                          <Link
                            href={`/track-order?orderNumber=${order.orderNumber}`}
                            target="_blank"
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-center font-semibold text-sm"
                          >
                            View Tracking
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </AdminRouteGuard>
  );
}

