'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import TopBar from '@/components/TopBar';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import AdminRouteGuard from '@/components/AdminRouteGuard';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import PaymentStatusBadge from '@/components/orders/PaymentStatusBadge';
import {
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
} from '@/lib/api/orders';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  CreditCard,
  Calendar,
  IndianRupee,
  Save,
  User,
  Mail,
  Phone,
} from 'lucide-react';

const ORDER_STATUSES = [
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

const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'];

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusForm, setStatusForm] = useState({
    status: '',
    trackingNumber: '',
    carrierName: '',
  });
  const [paymentForm, setPaymentForm] = useState({
    paymentStatus: '',
    paymentId: '',
  });

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await getOrderById(orderId);
        setOrder(response.data);
        setStatusForm({
          status: response.data.status,
          trackingNumber: response.data.trackingNumber || '',
          carrierName: response.data.carrierName || '',
        });
        setPaymentForm({
          paymentStatus: response.data.paymentStatus,
          paymentId: response.data.paymentId || '',
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateOrderStatus(
        orderId,
        statusForm.status,
        statusForm.trackingNumber,
        statusForm.carrierName
      );
      // Refresh order data
      const response = await getOrderById(orderId);
      setOrder(response.data);
      alert('Order status updated successfully');
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updatePaymentStatus(
        orderId,
        paymentForm.paymentStatus,
        paymentForm.paymentId
      );
      // Refresh order data
      const response = await getOrderById(orderId);
      setOrder(response.data);
      setPaymentForm({
        paymentStatus: response.data.paymentStatus,
        paymentId: response.data.paymentId || '',
      });
      alert('Payment status updated successfully');
    } catch (err: any) {
      alert(err.message || 'Failed to update payment status');
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-screen overflow-x-hidden bg-gray-50">
        <TopBar />
        <Header onMenuToggle={toggleMobileMenu} isMenuOpen={isMobileMenuOpen} />
        <Navigation isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen w-screen overflow-x-hidden bg-gray-50">
        <TopBar />
        <Header onMenuToggle={toggleMobileMenu} isMenuOpen={isMobileMenuOpen} />
        <Navigation isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">{error || 'Order not found'}</p>
            <Link
              href="/admin/orders"
              className="mt-4 inline-block px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
            >
              Back to Orders
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const shippingAddress = order.shippingAddress || {};
  const user = order.user || {};

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
            className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 mb-4 transition-colors font-medium"
          >
            <ArrowLeft size={20} />
            <span>Back to Orders</span>
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Order #{order.orderNumber}
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <Calendar size={16} />
                Placed on {format(new Date(order.createdAt), 'MMMM dd, yyyy HH:mm')}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <OrderStatusBadge status={order.status} size="lg" />
              <PaymentStatusBadge status={order.paymentStatus} size="lg" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tracking Information */}
            {(order.trackingNumber || order.carrierName) && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 p-6 shadow-lg">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Truck className="h-5 w-5 text-blue-600" />
                  </div>
                  Tracking Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {order.trackingNumber && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Tracking Number</p>
                      <p className="font-semibold text-gray-900 text-lg">{order.trackingNumber}</p>
                    </div>
                  )}
                  {order.carrierName && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Carrier</p>
                      <p className="font-semibold text-gray-900 text-lg">{order.carrierName}</p>
                    </div>
                  )}
                  {order.shippedAt && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Shipped On</p>
                      <p className="font-medium text-gray-900">
                        {format(new Date(order.shippedAt), 'MMMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  )}
                  {order.deliveredAt && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Delivered On</p>
                      <p className="font-medium text-gray-900">
                        {format(new Date(order.deliveredAt), 'MMMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  )}
                </div>
                {order.trackingNumber && (
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <Link
                      href={`/track-order?orderNumber=${order.orderNumber}`}
                      target="_blank"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      <Truck className="h-4 w-4" />
                      View Tracking Page
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Customer Info */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <User className="h-5 w-5 text-green-600" />
                </div>
                Customer Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Name</p>
                  <p className="font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    Email
                  </p>
                  <p className="font-medium text-gray-900">{user.email}</p>
                </div>
                {user.phone && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      Phone
                    </p>
                    <p className="font-medium text-gray-900">{user.phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Package className="h-5 w-5 text-purple-600" />
                </div>
                Order Items
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Product</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Variant</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Quantity</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Unit Price</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((item: any) => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            {item.productImage ? (
                              <div className="relative w-16 h-16 rounded-md overflow-hidden border border-gray-200 flex-shrink-0">
                                <Image
                                  src={item.productImage}
                                  alt={item.productName}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-16 h-16 rounded-md bg-gray-100 flex items-center justify-center border border-gray-200 flex-shrink-0">
                                <Package className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <h3 className="font-medium text-gray-900">{item.productName}</h3>
                              {item.productSku && (
                                <p className="text-xs text-gray-500">SKU: {item.productSku}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm text-gray-600">
                            {item.variantName || 'Standard'}
                          </p>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center justify-center w-10 h-10 bg-primary/10 text-primary font-semibold rounded-md">
                            {item.quantity}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {formatPrice(Number(item.unitPrice))}
                          </p>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatPrice(Number(item.totalPrice))}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} className="py-4 px-4 text-right font-semibold text-gray-900">
                        Total Items:
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-gray-900">
                        {order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <MapPin className="h-5 w-5 text-orange-600" />
                </div>
                Shipping Address
              </h2>
              <div className="text-gray-600 space-y-1">
                <p className="font-medium text-gray-900">{shippingAddress.fullName}</p>
                <p>{shippingAddress.addressLine1}</p>
                {shippingAddress.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
                <p>
                  {shippingAddress.city}, {shippingAddress.state} {shippingAddress.pincode}
                </p>
                <p>{shippingAddress.country || 'India'}</p>
                {shippingAddress.phone && <p className="mt-2">Phone: {shippingAddress.phone}</p>}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Status Update */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Update Order Status</h2>
              <form onSubmit={handleStatusUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Status
                  </label>
                  <select
                    value={statusForm.status}
                    onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 focus:bg-white shadow-sm"
                    required
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                {statusForm.status === 'SHIPPED' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tracking Number
                      </label>
                      <input
                        type="text"
                        value={statusForm.trackingNumber}
                        onChange={(e) =>
                          setStatusForm({ ...statusForm, trackingNumber: e.target.value })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 focus:bg-white shadow-sm"
                        placeholder="Enter tracking number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Carrier Name
                      </label>
                      <input
                        type="text"
                        value={statusForm.carrierName}
                        onChange={(e) =>
                          setStatusForm({ ...statusForm, carrierName: e.target.value })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 focus:bg-white shadow-sm"
                        placeholder="e.g., FedEx, DHL"
                      />
                    </div>
                  </>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Update Status'}
                </button>
              </form>
            </div>

            {/* Payment Status Update */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CreditCard className="h-5 w-5 text-green-600" />
                </div>
                Update Payment Status
              </h2>
              <form onSubmit={handlePaymentStatusUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Status
                  </label>
                  <select
                    value={paymentForm.paymentStatus}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, paymentStatus: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 focus:bg-white shadow-sm"
                    required
                  >
                    {PAYMENT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={paymentForm.paymentId}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, paymentId: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 focus:bg-white shadow-sm"
                    placeholder="Payment gateway transaction ID"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Update Payment'}
                </button>
              </form>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Package className="h-5 w-5 text-indigo-600" />
                </div>
                Order Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(Number(order.subtotal))}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(Number(order.discountAmount))}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Tax (GST)</span>
                  <span>{formatPrice(Number(order.taxAmount))}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>
                    {order.shippingAmount > 0
                      ? formatPrice(Number(order.shippingAmount))
                      : 'Free'}
                  </span>
                </div>
                <div className="border-t-2 border-gray-200 pt-4 mt-4 flex justify-between text-xl font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-green-600 flex items-center gap-1">
                    <IndianRupee size={20} />
                    {order.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                  <p className="font-medium text-gray-900">{order.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Payment Status</p>
                  <PaymentStatusBadge status={order.paymentStatus} size="sm" />
                </div>
                {order.paidAt && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Paid on</p>
                    <p className="text-sm text-gray-900">
                      {format(new Date(order.paidAt), 'MMMM dd, yyyy')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Order Timeline
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Order Placed</p>
                  <p className="text-xs text-gray-600">
                    {format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
                {order.shippedAt && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">Shipped</p>
                    <p className="text-xs text-gray-600">
                      {format(new Date(order.shippedAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                )}
                {order.deliveredAt && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">Delivered</p>
                    <p className="text-xs text-gray-600">
                      {format(new Date(order.deliveredAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

        <Footer />
      </div>
    </AdminRouteGuard>
  );
}

