'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { getProfile } from '@/lib/api/auth';
import {
  UserCircle,
  Mail,
  Phone,
  Calendar,
  Shield,
  ArrowLeft,
  Edit,
  Save,
  X,
  Truck,
  Package,
  LayoutDashboard,
} from 'lucide-react';

export default function MyProfilePage() {
  const router = useRouter();
  const { user: authUser, isAuthenticated, refreshUser } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await getProfile();
        if (response.success && response.data) {
          setUser(response.data);
          setFormData({
            firstName: response.data.firstName || '',
            lastName: response.data.lastName || '',
            email: response.data.email || '',
            phone: response.data.phone || '',
          });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, router]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  };

  const handleSave = async () => {
    // TODO: Implement profile update API call
    // For now, just close edit mode
    setIsEditing(false);
    // Refresh user data
    if (refreshUser) {
      await refreshUser();
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen w-screen overflow-x-hidden bg-gray-50">
      <TopBar />
      <Header onMenuToggle={toggleMobileMenu} isMenuOpen={isMobileMenuOpen} />
      <Navigation isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={authUser?.role === 'ADMIN' ? '/admin/orders' : '/my-orders'}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 mb-4 transition-colors font-medium"
          >
            <ArrowLeft size={20} />
            <span>{authUser?.role === 'ADMIN' ? 'Back to Admin Dashboard' : 'Back to My Orders'}</span>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
              <p className="text-gray-600">Manage your account information</p>
            </div>
            {!isEditing && (
              <button
                onClick={handleEdit}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-semibold"
              >
                <Edit size={20} />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600"></div>
              <p className="text-gray-600 font-medium">Loading profile...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center shadow-lg">
            <p className="text-red-800 font-semibold text-lg">{error}</p>
          </div>
        ) : user ? (
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8">
              <div className="flex items-center gap-6 mb-6">
                <div className="flex-shrink-0 w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <UserCircle size={40} className="text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    {user.firstName} {user.lastName || ''}
                  </h2>
                  <p className="text-gray-600">{user.email}</p>
                  {user.role && (
                    <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full">
                      <Shield size={12} />
                      {user.role}
                    </span>
                  )}
                </div>
              </div>

              {/* Profile Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <UserCircle size={16} className="text-green-600" />
                    First Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 focus:bg-white shadow-sm text-gray-900"
                    />
                  ) : (
                    <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                      {user.firstName || 'Not provided'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <UserCircle size={16} className="text-green-600" />
                    Last Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 focus:bg-white shadow-sm text-gray-900"
                    />
                  ) : (
                    <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                      {user.lastName || 'Not provided'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <Mail size={16} className="text-green-600" />
                    Email Address
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 focus:bg-white shadow-sm text-gray-900"
                      disabled
                    />
                  ) : (
                    <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                      {user.email}
                    </p>
                  )}
                  {!isEditing && (
                    <p className="text-xs text-gray-500 mt-1 ml-4">
                      {user.emailVerified ? (
                        <span className="text-green-600 font-medium">✓ Verified</span>
                      ) : (
                        <span className="text-yellow-600">Not verified</span>
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <Phone size={16} className="text-green-600" />
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 focus:bg-white shadow-sm text-gray-900"
                    />
                  ) : (
                    <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                      {user.phone || 'Not provided'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <Calendar size={16} className="text-green-600" />
                    Member Since
                  </label>
                  <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleSave}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-semibold"
                  >
                    <Save size={20} />
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold flex items-center gap-2"
                  >
                    <X size={20} />
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {authUser?.role === 'ADMIN' ? (
                <>
                  <Link
                    href="/admin/orders"
                    className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <LayoutDashboard size={24} className="text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Admin Dashboard</h3>
                        <p className="text-sm text-gray-600">Manage all orders</p>
                      </div>
                    </div>
                  </Link>
                  <Link
                    href="/admin/track-order"
                    className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-100 rounded-xl">
                        <Truck size={24} className="text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Track Order</h3>
                        <p className="text-sm text-gray-600">Track customer orders</p>
                      </div>
                    </div>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/my-orders"
                    className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <Package size={24} className="text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">My Orders</h3>
                        <p className="text-sm text-gray-600">View order history</p>
                      </div>
                    </div>
                  </Link>
                  <Link
                    href="/track-order"
                    className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-100 rounded-xl">
                        <Truck size={24} className="text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Track Order</h3>
                        <p className="text-sm text-gray-600">Track your orders</p>
                      </div>
                    </div>
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}

