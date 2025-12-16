'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import AdminRouteGuard from '@/components/AdminRouteGuard';
import OrderCard from '@/components/orders/OrderCard';
import { getAllOrders, getOrderStats } from '@/lib/api/orders';
import {
  Search,
  Filter,
  Package,
  DollarSign,
  ShoppingBag,
  XCircle,
  CheckCircle,
  CreditCard,
  Banknote,
  Clock,
} from 'lucide-react';
import OrderSummaryCard from '@/components/admin/OrderSummaryCard';

const ORDER_STATUSES = [
  'ALL',
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

const PAYMENT_METHODS = ['ALL', 'COD', 'PREPAID'];

export default function AdminOrdersPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: 'ALL',
    paymentMethod: 'ALL',
    search: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page: filters.page,
        limit: filters.limit,
      };
      if (filters.status !== 'ALL') {
        params.status = filters.status;
      }
      if (filters.paymentMethod !== 'ALL') {
        params.paymentMethod = filters.paymentMethod; // Backend will handle PREPAID filter
      }
      if (filters.search) {
        params.search = filters.search;
      }
      if (filters.dateFrom) {
        params.dateFrom = filters.dateFrom;
      }
      if (filters.dateTo) {
        params.dateTo = filters.dateTo;
      }

      const [ordersResponse, statsResponse] = await Promise.all([
        getAllOrders(params),
        getOrderStats(filters.dateFrom, filters.dateTo),
      ]);

      setOrders(ordersResponse.data || []);
      if (ordersResponse.pagination) {
        setPagination(ordersResponse.pagination);
      }
      if (statsResponse.data) {
        setStats(statsResponse.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filters.page, filters.status, filters.paymentMethod]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
    fetchOrders();
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Order Management</h1>
              <p className="text-gray-600">Manage, track, and monitor all customer orders</p>
            </div>
            <Link
              href="/admin/track-order"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-semibold"
            >
              <Search size={20} />
              Track Orders
            </Link>
          </div>
        </div>

        {/* Order Summary Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            <OrderSummaryCard
              title="Total Orders"
              value={stats.overview.totalOrders}
              icon={Package}
              iconColor="text-blue-600"
            />
            <OrderSummaryCard
              title="Total Items"
              value={stats.overview.totalItemsOrdered}
              icon={ShoppingBag}
              iconColor="text-purple-600"
            />
            <OrderSummaryCard
              title="Delivered"
              value={stats.overview.deliveredOrders}
              icon={CheckCircle}
              iconColor="text-green-600"
            />
            <OrderSummaryCard
              title="Cancelled"
              value={stats.overview.cancelledOrders}
              icon={XCircle}
              iconColor="text-red-600"
            />
            <OrderSummaryCard
              title="COD Orders"
              value={stats.overview.codOrders}
              icon={Banknote}
              iconColor="text-yellow-600"
            />
            <OrderSummaryCard
              title="Prepaid Orders"
              value={stats.overview.prepaidOrders}
              icon={CreditCard}
              iconColor="text-indigo-600"
            />
            <OrderSummaryCard
              title="Pending"
              value={stats.overview.pendingOrders}
              icon={Clock}
              iconColor="text-orange-600"
            />
            <OrderSummaryCard
              title="Prepaid Revenue"
              value={formatPrice(stats.overview.prepaidRevenue)}
              icon={DollarSign}
              iconColor="text-green-600"
            />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Filter className="h-5 w-5 text-green-600" />
              Filters & Search
            </h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>
          </div>

          {showFilters && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by order number, customer email..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 focus:bg-white shadow-sm text-gray-900 placeholder:text-gray-400 font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-semibold"
                >
                  Search
                </button>
              </form>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 focus:bg-white shadow-sm text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">To Date</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 focus:bg-white shadow-sm text-gray-900"
                  />
                </div>
              </div>

              {/* Status and Payment Method Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    Order Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ORDER_STATUSES.map((status) => (
                      <button
                        key={status}
                        onClick={() => handleFilterChange('status', status)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                          filters.status === status
                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {status === 'ALL' ? 'All' : status.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    Payment Method
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PAYMENT_METHODS.map((method) => (
                      <button
                        key={method}
                        onClick={() => handleFilterChange('paymentMethod', method)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                          filters.paymentMethod === method
                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {method === 'ALL' ? 'All' : method}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600"></div>
              <p className="text-gray-600 font-medium">Loading orders...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center shadow-lg">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-800 font-semibold text-lg mb-2">{error}</p>
            <button
              onClick={fetchOrders}
              className="mt-4 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold shadow-md"
            >
              Retry
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-12 text-center shadow-lg">
            <Package className="h-20 w-20 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600 mb-4">No orders match your current filters.</p>
            <Link
              href="/admin/track-order"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md font-semibold"
            >
              <Search size={20} />
              Try Advanced Search
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} isAdmin={true} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-3 bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  disabled={filters.page === 1}
                  className="px-6 py-2 border-2 border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 font-semibold text-gray-700 transition-colors"
                >
                  Previous
                </button>
                <span className="px-6 py-2 text-sm font-semibold text-gray-700 bg-gray-50 rounded-xl">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  disabled={filters.page >= pagination.pages}
                  className="px-6 py-2 border-2 border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 font-semibold text-gray-700 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
        </main>

        <Footer />
      </div>
    </AdminRouteGuard>
  );
}
