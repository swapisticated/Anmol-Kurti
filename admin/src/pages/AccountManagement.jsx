import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { backendUrl, currency } from '../App';
import { toast } from 'react-toastify';
import { FaSearch, FaFilter, FaUser, FaShoppingBag, FaBox, FaChartLine, FaSort, FaSortUp, FaSortDown, FaTicketAlt, FaPlus, FaEdit, FaTrash, FaRupeeSign, FaExclamationTriangle, FaCheckCircle, FaTruck, FaClock, FaCalendarAlt, FaEnvelope } from 'react-icons/fa';
import Coupons from './Coupons';
import Add from './Add';
import FilterManager from './FilterManager';
import Orders from './Orders';
import { useFilters } from '../context/FilterContext';
import NewsletterManager from './NewsletterManager';
import Pagination from '../components/Pagination';
import EditProductModal from '../components/EditProductModal';

const AccountManagement = ({ token }) => {
  const { dynamicFilters } = useFilters();

  // Get categories from dynamic filters with fallback
  const categories = dynamicFilters?.category;

  // State for data
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Loading states
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingBestsellers, setLoadingBestsellers] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  // Metrics
  const [totalSales, setTotalSales] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);

  // Pagination state
  const [pagination, setPagination] = useState({
    customers: { page: 1, limit: 10, total: 0 },
    orders: { page: 1, limit: 10, total: 0 },
    products: { page: 1, limit: 10, total: 0 }
  });

  // Filter and search state
  const [filters, setFilters] = useState({
    customers: { search: '', sortBy: 'name', sortOrder: 'asc' },
    orders: { status: 'all', dateRange: 'all' },
    products: {
      search: '',
      category: '',
      sortBy: 'date',
      sortOrder: 'desc'
    }
  });

  // Active tab state
  const [activeTab, setActiveTab] = useState('dashboard');

  const fetchOrders = async (page = pagination.orders.page) => {
    setLoadingOrders(true);
    try {
      const response = await axios.post(backendUrl.join('/order/list'), {}, {
        headers: { token },
        params: {
          page,
          limit: pagination.orders.limit,
          status: filters.orders.status,
          dateRange: filters.orders.dateRange
        }
      });
      if (response.data.success) {
        setOrders(response.data.orders);
        setPagination(prev => ({
          ...prev,
          orders: {
            ...prev.orders,
            page,
            total: response.data.totalOrders
          }
        }));
      } else {
        if (response.data.message === 'User not found' || response.data.message === 'Invalid token') {
          // Logout user on auth error
          localStorage.removeItem('token');
          window.location.reload();
        } else {
          toast.error('Failed to fetch orders');
        }
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Update fetchProducts function to properly handle the total count
  const fetchProducts = async (page = pagination.products.page) => {
    setLoadingProducts(true);
    try {
      const response = await axios.get(backendUrl.join('/product/list'), {
        headers: { token },
        params: {
          page,
          limit: pagination.products.limit,
          search: filters.products.search,
          category: filters.products.category,
          sortBy: filters.products.sortBy,
          sortOrder: filters.products.sortOrder
        }
      });
      console.log("in fetchProduct", response.data.products)

      if (response.data.success) {
        console.log("in fetchProduct", response.data.products)
        setProducts(response.data.products);
        // Ensure we have a valid total count
        const totalCount = parseInt(response.data.totalProducts || response.data.total || 0);
        setPagination(prev => ({
          ...prev,
          products: {
            ...prev.products,
            page,
            total: totalCount
          }
        }));
      } else {
        if (response.data.message === 'User not found' || response.data.message === 'Invalid token') {
          localStorage.removeItem('token');
          window.location.reload();
        } else {
          toast.error('Failed to fetch products');
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error(error.message || 'Failed to fetch products');
      // Set default values on error
      setProducts([]);
      setPagination(prev => ({
        ...prev,
        products: {
          ...prev.products,
          page: 1,
          total: 0
        }
      }));
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchBestsellers = async (page = 1) => {
    setLoadingBestsellers(true);
    try {
      const response = await axios.get(backendUrl.join('/order/bestsellers'), {
        headers: { token },
        params: {
          page,
          limit: 10 // Assuming a limit for bestsellers
        }
      });
      if (response.data.success && response.data.bestsellers.length > 0) {
        setBestsellers(response.data.bestsellers);
      } else {
        // Fallback: fetch products flagged as bestseller
        const fallbackResponse = await axios.get(backendUrl.join('/product/bestsellers'), {
          headers: { token }
        });
        if (fallbackResponse.data.success) {
          setBestsellers(fallbackResponse.data.bestsellers);
        } else {
          toast.error('Failed to fetch bestsellers');
        }
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingBestsellers(false);
    }
  };

  const fetchCustomers = async (page = pagination.customers.page) => {
    setLoadingCustomers(true);
    try {
      const response = await axios.get(backendUrl.join('/user/list'), {
        headers: { token },
        params: {
          page,
          limit: pagination.customers.limit,
          search: filters.customers.search,
          sortBy: filters.customers.sortBy,
          sortOrder: filters.customers.sortOrder
        }
      });
      if (response.data.success) {
        setCustomers(response.data.users);
        setPagination(prev => ({
          ...prev,
          customers: {
            ...prev.customers,
            page,
            total: response.data.totalUsers
          }
        }));
      } else {
        toast.error('Failed to fetch customers');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchDashboardMetrics = async () => {
    try {
      const response = await axios.get(backendUrl.join('/order/dashboard-metrics'), {
        headers: { token }
      });
      if (response.data.success) {
        setTotalSales(response.data.totalSales);
        setTotalOrders(response.data.totalOrders);
      } else {
        if (response.data.message === 'User not found' || response.data.message === 'Invalid token') {
          localStorage.removeItem('token');
          window.location.reload();
        } else {
          toast.error('Failed to fetch dashboard metrics');
        }
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardMetrics();
    } else if (activeTab === 'customers') {
      fetchCustomers();
    } else if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'products') {
      fetchProducts();
      fetchBestsellers();
    }
  }, [activeTab, filters]);

  // Identify low stock products (stock less than threshold, e.g., 5)
  const lowStockThreshold = 5;
  const lowStockProducts = products.filter(product => {
    if (product.hasSize) {
      // For products with sizes, check if any size stock is low
      return Object.values(product.stock || {}).some(stockQty => stockQty < lowStockThreshold);
    } else {
      // For products without sizes, stock is a number
      return product.stock < lowStockThreshold;
    }
  });

  const handleSearch = (value, section) => {
    setFilters(prev => ({
      ...prev,
      [section]: { ...prev[section], search: value }
    }));
  };

  const handleSort = (field, section) => {
    setFilters(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        sortBy: field,
        sortOrder: prev[section].sortOrder === 'asc' ? 'desc' : 'asc'
      }
    }));
  };

  // Add handleProductSearch function
  const handleProductSearch = (value) => {
    setFilters(prev => ({
      ...prev,
      products: { ...prev.products, search: value }
    }));
    // Reset to first page when searching
    fetchProducts(1);
  };

  // Add handleProductFilter function
  const handleProductFilter = (type, value) => {
    setFilters(prev => ({
      ...prev,
      products: { ...prev.products, [type]: value }
    }));
    // Reset to first page when filtering
    fetchProducts(1);
  };

  // Add resetProductFilters function
  const resetProductFilters = () => {
    setFilters(prev => ({
      ...prev,
      products: {
        search: '',
        category: '',
        sortBy: 'date',
        sortOrder: 'desc'
      }
    }));
    fetchProducts(1);
  };

  // Add handleProductSort function to handle sorting
  const handleProductSort = (sortValue) => {
    let sortBy, sortOrder;

    switch (sortValue) {
      case 'newest':
        sortBy = 'date'; // Using 'date' field from the product model
        sortOrder = 'desc';
        break;
      case 'oldest':
        sortBy = 'date';
        sortOrder = 'asc';
        break;
      case 'price-high':
        sortBy = 'price';
        sortOrder = 'desc';
        break;
      case 'price-low':
        sortBy = 'price';
        sortOrder = 'asc';
        break;
      case 'name-asc':
        sortBy = 'name';
        sortOrder = 'asc';
        break;
      case 'name-desc':
        sortBy = 'name';
        sortOrder = 'desc';
        break;
      case 'stock-low':
        sortBy = 'stock';
        sortOrder = 'asc';
        break;
      case 'stock-high':
        sortBy = 'stock';
        sortOrder = 'desc';
        break;
      default:
        sortBy = 'date';
        sortOrder = 'desc';
    }

    setFilters(prev => ({
      ...prev,
      products: {
        ...prev.products,
        sortBy,
        sortOrder
      }
    }));
    fetchProducts(1); // Reset to first page when sorting changes
  };

  const [dashboardMetrics, setDashboardMetrics] = useState({
    revenue: {
      total: 0,
      today: 0,
      yesterday: 0,
      weekly: 0,
      lastWeek: 0,
      monthly: 0,
      lastMonth: 0,
      growth: {
        daily: 0,
        weekly: 0,
        monthly: 0
      },
      trends: {
        daily: [],
        monthly: []
      }
    },
    orders: {
      total: 0,
      pending: 0,
      processing: 0,
      delivered: 0,
      cancelled: 0,
      revenueByStatus: {}
    },
    customers: {
      total: 0,
      new: 0,
      lastWeek: 0,
      returning: 0,
      growth: 0
    },
    products: {
      total: 0,
      outOfStock: 0,
      lowStock: 0
    },
    analytics: {
      topCategories: [],
      averageOrderValue: 0
    }
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoadingDashboard(true);
      const [metricsResponse, ordersResponse, productsResponse] = await Promise.all([
        axios.get(backendUrl.join('/order/dashboard-metrics'), { headers: { token } }),
        axios.get(backendUrl.join('/order/recent'), { headers: { token } }),
        axios.get(backendUrl.join('/product/bestsellers'), { headers: { token } })
      ]);

      console.log('Dashboard metrics response:', metricsResponse.data);

      if (metricsResponse.data.success) {
        setDashboardMetrics(metricsResponse.data.metrics || {
          revenue: {
            total: 0,
            today: 0,
            yesterday: 0,
            weekly: 0,
            lastWeek: 0,
            monthly: 0,
            lastMonth: 0,
            growth: {
              daily: 0,
              weekly: 0,
              monthly: 0
            },
            trends: {
              daily: [],
              monthly: []
            }
          },
          orders: { total: 0, pending: 0, processing: 0, delivered: 0, cancelled: 0, revenueByStatus: {} },
          customers: { total: 0, new: 0, lastWeek: 0, returning: 0, growth: 0 },
          products: { total: 0, outOfStock: 0, lowStock: 0 },
          analytics: { topCategories: [], averageOrderValue: 0 }
        });
      }

      if (ordersResponse.data.success) {
        setRecentOrders(ordersResponse.data.orders || []);
      }

      if (productsResponse.data.success) {
        const bestsellers = productsResponse.data.bestsellers || [];
        // Ensure each product has the required properties
        setTopProducts(bestsellers.map(product => ({
          _id: product._id || '',
          name: product.name || product.productName || 'Unnamed Product',
          category: product.category || 'Uncategorized',
          price: product.price || 0,
          image: Array.isArray(product.image) ? product.image : [],
          totalQuantity: product.totalQuantity || 0
        })));
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      toast.error('Failed to fetch dashboard data');
      // Set default values on error
      setDashboardMetrics({
        revenue: { total: 0, today: 0, weekly: 0, monthly: 0 },
        orders: { total: 0, pending: 0, processing: 0, delivered: 0, cancelled: 0 },
        customers: { total: 0, new: 0, returning: 0 },
        products: { total: 0, outOfStock: 0, lowStock: 0 }
      });
      setRecentOrders([]);
      setTopProducts([]);
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardData();
    }
  }, [activeTab]);

  const formatCurrency = (amount) => {
    // Handle NaN, null, undefined, or invalid values
    const validAmount = Number(amount);
    if (isNaN(validAmount) || !isFinite(validAmount)) {
      return '₹0';
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(validAmount);
  };

  const getOrderStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-blue-100 text-blue-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'Order Placed': 'bg-yellow-100 text-yellow-800',
      'Packing': 'bg-blue-100 text-blue-800',
      'Shipped': 'bg-purple-100 text-purple-800',
      'Out for delivery': 'bg-orange-100 text-orange-800',
      'Delivered': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date) => {
    try {
      // Handle both timestamp (number) and date string formats
      const dateObj = typeof date === 'number' ? new Date(date) : new Date(date);
      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {loadingDashboard ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Revenue Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Revenue</p>
                  <h3 className="text-3xl font-bold mt-1">{formatCurrency(dashboardMetrics.revenue.total)}</h3>
                  <p className="text-blue-200 text-sm mt-1">
                    {typeof dashboardMetrics.revenue.growth?.monthly === 'number' && dashboardMetrics.revenue.growth.monthly > 0 ? '+' : ''}
                    {typeof dashboardMetrics.revenue.growth?.monthly === 'number' ? dashboardMetrics.revenue.growth.monthly.toFixed(1) : '0.0'}% vs last month
                  </p>
                </div>
                <FaRupeeSign className="text-4xl text-blue-200" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Monthly Revenue</p>
                  <h3 className="text-3xl font-bold mt-1">{formatCurrency(dashboardMetrics.revenue.monthly)}</h3>
                  <p className="text-green-200 text-sm mt-1">
                    {typeof dashboardMetrics.revenue.growth?.monthly === 'number' && dashboardMetrics.revenue.growth.monthly > 0 ? '+' : ''}
                    {typeof dashboardMetrics.revenue.growth?.monthly === 'number' ? dashboardMetrics.revenue.growth.monthly.toFixed(1) : '0.0'}% vs last month
                  </p>
                </div>
                <FaCalendarAlt className="text-4xl text-green-200" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Weekly Revenue</p>
                  <h3 className="text-3xl font-bold mt-1">{formatCurrency(dashboardMetrics.revenue.weekly)}</h3>
                  <p className="text-purple-200 text-sm mt-1">
                    {dashboardMetrics.revenue.growth?.weekly > 0 ? '+' : ''}
                    {dashboardMetrics.revenue.growth?.weekly?.toFixed(1) ?? '0.0'}% vs last week
                  </p>
                </div>
                <FaChartLine className="text-4xl text-purple-200" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Today's Revenue</p>
                  <h3 className="text-3xl font-bold mt-1">{formatCurrency(dashboardMetrics.revenue.today)}</h3>
                  <p className="text-orange-200 text-sm mt-1">
                    {dashboardMetrics.revenue.growth.daily > 0 ? '+' : ''}
                    {dashboardMetrics.revenue.growth.daily.toFixed(1)}% vs yesterday
                  </p>
                </div>
                <FaClock className="text-4xl text-orange-200" />
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Orders Overview */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Orders Overview</h3>
                <FaShoppingBag className="text-gray-400" />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Orders</span>
                  <span className="font-semibold">{dashboardMetrics.orders.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Pending</span>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-600 font-semibold">{dashboardMetrics.orders.pending}</span>
                    <span className="text-xs text-gray-500">
                      {formatCurrency(dashboardMetrics.orders.revenueByStatus.pending || 0)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Processing</span>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600 font-semibold">{dashboardMetrics.orders.processing}</span>
                    <span className="text-xs text-gray-500">
                      {formatCurrency(dashboardMetrics.orders.revenueByStatus.processing || 0)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Delivered</span>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 font-semibold">{dashboardMetrics.orders.delivered}</span>
                    <span className="text-xs text-gray-500">
                      {formatCurrency(dashboardMetrics.orders.revenueByStatus.delivered || 0)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Cancelled</span>
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 font-semibold">{dashboardMetrics.orders.cancelled}</span>
                    <span className="text-xs text-gray-500">
                      {formatCurrency(dashboardMetrics.orders.revenueByStatus.cancelled || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Insights */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Customer Insights</h3>
                <FaUser className="text-gray-400" />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Customers</span>
                  <span className="font-semibold">{dashboardMetrics.customers.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">New Customers</span>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 font-semibold">{dashboardMetrics.customers.new}</span>
                    <span className={`text-xs ${dashboardMetrics.customers.growth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {dashboardMetrics.customers.growth > 0 ? '+' : ''}{dashboardMetrics.customers.growth.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Returning Customers</span>
                  <span className="text-blue-600 font-semibold">{dashboardMetrics.customers.returning}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Avg Order Value</span>
                  <span className="font-semibold">{formatCurrency(dashboardMetrics.analytics.averageOrderValue)}</span>
                </div>
              </div>
            </div>

            {/* Inventory Status */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Inventory Status</h3>
                <FaBox className="text-gray-400" />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Products</span>
                  <span className="font-semibold">{dashboardMetrics.products.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Out of Stock</span>
                  <span className="text-red-600 font-semibold">{dashboardMetrics.products.outOfStock}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Low Stock</span>
                  <span className="text-yellow-600 font-semibold">{dashboardMetrics.products.lowStock}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Categories Performance */}
          {dashboardMetrics.analytics.topCategories.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Performing Categories</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardMetrics.analytics.topCategories.map((category, index) => (
                  <div key={category._id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800">{category._id}</span>
                      <span className="text-sm text-gray-500">#{index + 1}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Revenue</span>
                        <span className="font-semibold">{formatCurrency(category.revenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Orders</span>
                        <span className="text-sm">{category.orders}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Orders and Top Products */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">Recent Orders</h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View All
                  </button>
                </div>
              </div>
              <div className="p-6">
                {recentOrders.length > 0 ? (
                  <div className="space-y-4">
                    {recentOrders.map(order => (
                      <div key={order._id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-2 h-2 rounded-full ${order.status === 'delivered' ? 'bg-green-500' :
                            order.status === 'processing' ? 'bg-blue-500' :
                              order.status === 'cancelled' ? 'bg-red-500' : 'bg-yellow-500'
                            }`} />
                          <div>
                            <p className="font-medium text-gray-800">{order.orderNumber}</p>
                            <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-800">{formatCurrency(order.totalAmount)}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${getOrderStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    No recent orders
                  </div>
                )}
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">Top Products</h3>
                  <button
                    onClick={() => setActiveTab('products')}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View All
                  </button>
                </div>
              </div>
              <div className="p-6">
                {topProducts.length > 0 ? (
                  <div className="space-y-4">
                    {topProducts.map(product => (
                      <div key={product._id} className="flex items-center space-x-4">
                        <div className="w-12 h-12 flex-shrink-0">
                          {Array.isArray(product.image) && product.image.length > 0 ? (
                            <img
                              src={product.image[0]}
                              alt={product.name || 'Product'}
                              className="w-12 h-12 rounded-lg object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/placeholder-product.png';
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                              <FaBox className="text-gray-400 text-xl" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{product.name || product.productName || 'Unnamed Product'}</p>
                          <p className="text-sm text-gray-500">{product.category || 'Uncategorized'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-800">{formatCurrency(product.price || 0)}</p>
                          <p className="text-sm text-gray-500">{product.totalQuantity || 0} sold</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    No top products data
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <button
              onClick={() => setActiveTab('add')}
              className="flex items-center justify-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl p-6 transition-colors"
            >
              <FaPlus className="text-xl" />
              <span className="font-medium">Add New Product</span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className="flex items-center justify-center space-x-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl p-6 transition-colors"
            >
              <FaShoppingBag className="text-xl" />
              <span className="font-medium">View Orders</span>
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className="flex items-center justify-center space-x-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl p-6 transition-colors"
            >
              <FaUser className="text-xl" />
              <span className="font-medium">Manage Customers</span>
            </button>
            <button
              onClick={() => setActiveTab('coupons')}
              className="flex items-center justify-center space-x-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl p-6 transition-colors"
            >
              <FaTicketAlt className="text-xl" />
              <span className="font-medium">Create Coupon</span>
            </button>
          </div>
        </>
      )}
    </div>
  );

  // Add these functions before the renderCustomers function
  const handleCustomerSearch = (value) => {
    setFilters(prev => ({
      ...prev,
      customers: { ...prev.customers, search: value }
    }));
    // Reset to first page when searching
    fetchCustomers(1);
  };

  const handleCustomerSort = (field) => {
    setFilters(prev => ({
      ...prev,
      customers: {
        ...prev.customers,
        sortBy: field,
        sortOrder: prev.customers.sortBy === field
          ? prev.customers.sortOrder === 'asc' ? 'desc' : 'asc'
          : 'asc'
      }
    }));
    fetchCustomers(1);
  };

  const deleteCustomer = async (id) => {
    try {
      const response = await axios.delete(backendUrl.join(`/user/${id}`), {
        headers: { token }
      });

      if (response.data.success) {
        toast.success('Customer deleted successfully');
        fetchCustomers(pagination.customers.page);
      } else {
        toast.error(response.data.message || 'Failed to delete customer');
      }
    } catch (error) {
      console.error('Delete customer error:', error);
      toast.error(error.message || 'Failed to delete customer');
    }
  };

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetailsModal, setCustomerDetailsModal] = useState(false);

  const viewCustomerDetails = async (id) => {
    const customerData = customers.find(c => c._id === id);
    if (customerData) {
      setSelectedCustomer(customerData);
      setCustomerDetailsModal(true);
      return;
    } else {
      toast.error('Customer data not found');
    }

    // fallback if not in state
    try {
      setLoadingCustomers(true); // Add loading state while fetching details
      const response = await axios.get(backendUrl.join(`/user/${id}`), {
        headers: { token }
      });
      console.log("Response for view customer deyails")

      if (response.data.success) {
        setSelectedCustomer(response.data.user);
        setCustomerDetailsModal(true);
      } else {
        toast.error(response.data.message || 'Failed to fetch customer details');
      }
    } catch (error) {
      console.error('View customer error:', error);
      toast.error(error.message || 'Failed to fetch customer details');
    } finally {
      setLoadingCustomers(false);
    }
  };


  // Update the CustomerDetailsModal component to handle loading state
  const CustomerDetailsModal = ({ customer, onClose }) => {
    if (!customer) return null;

    const formatDate = (dateString) => {
      try {
        return new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (error) {
        return 'Invalid Date';
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
          <div className="sticky top-0 bg-white pb-4 mb-4 border-b flex justify-between items-center">
            <h3 className="text-2xl font-semibold text-gray-800">Customer Details</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-8">
            {/* Personal Information */}
            <div className="bg-white rounded-lg">
              <h4 className="text-lg font-semibold mb-4 text-gray-800">Personal Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium text-gray-900">{customer.name}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{customer.email}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">{customer.phone}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Join Date</p>
                  <p className="font-medium text-gray-900">{formatDate(customer.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-white rounded-lg">
              <h4 className="text-lg font-semibold mb-4 text-gray-800">Address</h4>
              {customer.address ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Street</p>
                    <p className="font-medium text-gray-900">{customer.address.street || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">City</p>
                    <p className="font-medium text-gray-900">{customer.address.city || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">State</p>
                    <p className="font-medium text-gray-900">{customer.address.state || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">ZIP Code</p>
                    <p className="font-medium text-gray-900">{customer.address.zipCode || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg md:col-span-2">
                    <p className="text-sm text-gray-500">Country</p>
                    <p className="font-medium text-gray-900">{customer.address.country || 'N/A'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 p-4 bg-gray-50 rounded-lg">No address information available</p>
              )}
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-lg">
              <h4 className="text-lg font-semibold mb-4 text-gray-800">Statistics</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600">Total Orders</p>
                  <p className="text-2xl font-bold text-blue-700">{customer.stats?.totalOrders || 0}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600">Total Spent</p>
                  <p className="text-2xl font-bold text-green-700">
                    {currency} {(customer.stats?.totalSpent || 0).toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600">Wishlist Items</p>
                  <p className="text-2xl font-bold text-purple-700">{customer.stats?.wishlistItems || 0}</p>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="bg-white rounded-lg">
              <h4 className="text-lg font-semibold mb-4 text-gray-800">Preferences</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'newsletter', label: 'Newsletter Subscription' },
                  { key: 'smsUpdates', label: 'SMS Updates' },
                  { key: 'stockAlerts', label: 'Stock Alerts' },
                  { key: 'emailNotifications', label: 'Email Notifications' }
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <span className={`w-3 h-3 rounded-full mr-3 ${customer.preferences?.[key] ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                    <span className="text-gray-700">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Update the renderCustomers function
  const renderCustomers = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="p-6 border-b">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
          <h3 className="text-2xl font-semibold text-gray-800">Customers List</h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search customers..."
              value={filters.customers.search}
              onChange={(e) => handleCustomerSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {loadingCustomers ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <FaUser className="text-5xl mb-4" />
          <p className="text-xl">No customers found</p>
          <p className="text-sm mt-2">Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer group"
                  onClick={() => handleCustomerSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Name
                    {filters.customers.sortBy === 'name' ? (
                      filters.customers.sortOrder === 'asc' ? (
                        <FaSortUp className="text-blue-600" />
                      ) : (
                        <FaSortDown className="text-blue-600" />
                      )
                    ) : (
                      <FaSort className="text-gray-400 opacity-0 group-hover:opacity-100" />
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer group"
                  onClick={() => handleCustomerSort('email')}
                >
                  <div className="flex items-center gap-2">
                    Email
                    {filters.customers.sortBy === 'email' ? (
                      filters.customers.sortOrder === 'asc' ? (
                        <FaSortUp className="text-blue-600" />
                      ) : (
                        <FaSortDown className="text-blue-600" />
                      )
                    ) : (
                      <FaSort className="text-gray-400 opacity-0 group-hover:opacity-100" />
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer group"
                  onClick={() => handleCustomerSort('createdAt')}
                >
                  <div className="flex items-center gap-2">
                    Join Date
                    {filters.customers.sortBy === 'createdAt' ? (
                      filters.customers.sortOrder === 'asc' ? (
                        <FaSortUp className="text-blue-600" />
                      ) : (
                        <FaSortDown className="text-blue-600" />
                      )
                    ) : (
                      <FaSort className="text-gray-400 opacity-0 group-hover:opacity-100" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Orders</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Spent</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map(customer => (
                <tr key={customer._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        {customer.avatar ? (
                          <img className="h-10 w-10 rounded-full" src={customer.avatar} alt="" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                        {customer.phone && (
                          <div className="text-sm text-gray-500">{customer.phone}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.stats?.totalOrders || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {currency} {customer.stats?.totalSpent?.toFixed(2) || '0.00'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => viewCustomerDetails(customer._id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                      {/* Only show delete button if not the super admin */}
                      {customer.email !== "prince83w@gmail.com" && (
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
                              deleteCustomer(customer._id);
                            }
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}
                      {/* Show protected message for super admin */}
                      {customer.email === "prince83w@gmail.com" && (
                        <span className="text-gray-400 text-sm italic">
                          Super Admin (Protected)
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="p-6 border-t">
        {/* {renderPagination('customers')} */}
        <Pagination
          page={pagination.customers.page}
          total={pagination.customers.total}
          limit={pagination.customers.limit}
          onPageChange={(newPage) => fetchCustomers(newPage)}
        />
      </div>

      {customerDetailsModal && selectedCustomer && (
        <CustomerDetailsModal
          customer={selectedCustomer}
          onClose={() => {
            setCustomerDetailsModal(false);
            setSelectedCustomer(null);
          }}
        />
      )}
    </div>
  );

  const renderProducts = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="p-6 border-b">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
          <h3 className="text-2xl font-semibold text-gray-800">Products List</h3>
          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab('add')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaPlus className="text-sm" />
              <span>Add New Product</span>
            </button>
            <button
              onClick={resetProductFilters}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <FaFilter className="text-sm" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search products..."
              value={filters.products.search}
              onChange={(e) => handleProductSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          <select
            value={filters.products.category}
            onChange={(e) => handleProductFilter('category', e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {Array.isArray(categories) && categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={`${filters.products.sortBy}-${filters.products.sortOrder}`}
            onChange={(e) => handleProductSort(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price-high">Price: High to Low</option>
            <option value="price-low">Price: Low to High</option>
            <option value="name-asc">Name: A to Z</option>
            <option value="name-desc">Name: Z to A</option>
            <option value="stock-low">Stock: Low to High</option>
            <option value="stock-high">Stock: High to Low</option>
          </select>
        </div>
      </div>

      {loadingProducts ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <FaBox className="text-5xl mb-4" />
          <p className="text-xl">No products found</p>
          <p className="text-sm mt-2">Try adjusting your filters or add new products</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Image</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product Details</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(products) && products.map(product => (
                <tr key={product._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img
                      src={product.image?.[0] || '/placeholder-product.png'}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-lg shadow-sm hover:scale-150 transition-transform cursor-zoom-in"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      {/* Defensive rendering: render product properties explicitly */}
                      <h4 className="text-lg font-medium text-gray-900">
                        {typeof product.name === 'string' ? product.name : JSON.stringify(product.name)}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {typeof product.category === 'string' ? product.category : JSON.stringify(product.category)}
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="text-lg font-semibold text-gray-900">
                          {currency} {typeof product.price === 'number' ? product.price : JSON.stringify(product.price)}
                        </span>
                        {product.bestseller && (
                          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                            Bestseller
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {product.hasSize ? (
                      <div className="flex flex-col gap-1">
                        {Object.entries(product.stock || {}).map(([size, count]) => (
                          <div key={size} className="flex items-center gap-2">
                            <span className="w-8 font-medium">{size}:</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${count < lowStockThreshold
                              ? 'bg-red-100 text-red-800'
                              : count < lowStockThreshold * 2
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                              }`}>
                              {count} pcs
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      typeof product.stock === 'number' ? (
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${product.stock < lowStockThreshold
                          ? 'bg-red-100 text-red-800'
                          : product.stock < lowStockThreshold * 2
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                          }`}>
                          {product.stock} in stock
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          {JSON.stringify(product.stock)}
                        </div>
                      )
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-2">
                      <button
                        className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        onClick={() => setEditingProduct(product)}
                      >
                        <FaEdit className="text-sm" />
                        Edit
                      </button>
                      <button
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this product?')) {
                            removeProduct(product._id);
                          }
                        }}
                      >
                        <FaTrash className="text-sm" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="p-6 border-t">
        {/* {renderPagination('products')} */}
        <Pagination
          page={pagination.products.page}
          total={pagination.products.total}
          limit={pagination.products.limit}
          onPageChange={(newPage) => fetchProducts(newPage)}
        />
      </div>
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onUpdate={fetchProducts}
          backendUrl={backendUrl}
          token={token}
        />
      )}
    </div>
  );

  // Add removeProduct function
  const removeProduct = async (id) => {
    try {
      const response = await axios.post(backendUrl.join(`/product/remove`),
        { id },
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        fetchProducts(pagination.products.page);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  return (
    <div className="p-8 max-w-[1920px] mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Account Management</h2>
        <p className="mt-2 text-gray-600">Manage your customers, orders, and products</p>
      </div>

      <div className="mb-8">
        <nav className="flex flex-wrap w-full gap-2 sm:gap-3">
          {[
            { id: 'dashboard', icon: FaChartLine, label: 'Dashboard' },
            { id: 'customers', icon: FaUser, label: 'Customers' },
            { id: 'orders', icon: FaShoppingBag, label: 'Orders' },
            { id: 'products', icon: FaBox, label: 'Products' },
            { id: 'coupons', icon: FaTicketAlt, label: 'Coupons' },
            { id: 'filters', icon: FaFilter, label: 'Filters' },
            { id: 'newsletter', icon: FaEnvelope, label: 'Newsletter' },
            { id: 'add', icon: FaPlus, label: 'Add Product' }
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 ${activeTab === id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
            >
              <Icon className={activeTab === id ? 'text-white' : 'text-gray-400'} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="space-y-8">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'customers' && renderCustomers()}
        {activeTab === 'products' && renderProducts()}
        {activeTab === 'coupons' && <Coupons />}
        {activeTab === 'add' && <Add />}
        {activeTab === 'filters' && <FilterManager />}
        {activeTab === 'newsletter' && <NewsletterManager />}
        {activeTab === 'orders' && <Orders token={token} />}
      </div>
    </div>
  );
};

export default AccountManagement;
