import React, { useState, useMemo } from 'react';
import { Customer } from '../types';
import { useCustomer } from '../context/CustomerContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { CustomerCard } from '../components/CustomerCard';
import { CustomerDetailsModal } from '../components/CustomerDetailsModal';
import {
  Search,
  X,
  Lock,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  LogOut,
  User,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Filter,
  Users,
  Wifi,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

interface ProtectedSearchPortalProps {
  onBackToHome?: () => void;
  onNavigateToCustomerPortal?: () => void;
}

export const ProtectedSearchPortal: React.FC<ProtectedSearchPortalProps> = ({
  onBackToHome,
  onNavigateToCustomerPortal,
}) => {
  const { customers, searchCustomers, ispProfile } = useCustomer();
  const {
    currentSearchOperator,
    isSearchOperatorAuthenticated,
    searchOperatorLogin,
    searchOperatorLogout,
  } = useAuth();
  const { isDark } = useTheme();
  const { addToast } = useToast();

  // Login Form State
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isCustomerAccountError, setIsCustomerAccountError] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Due' | 'Suspended'>('All');
  const [selectedArea, setSelectedArea] = useState<string>('All');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Effective authenticated operator strictly relies on currentSearchOperator
  const effectiveOperator = currentSearchOperator;
  const isOperatorLoggedIn = !!effectiveOperator;

  // Handle Operator Login
  const handleOperatorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!usernameInput.trim() || !passwordInput.trim()) {
      setLoginError('ইউজারনেম এবং পাসওয়ার্ড উভয়ই আবশ্যক।');
      return;
    }

    setIsLoggingIn(true);
    setIsCustomerAccountError(false);
    try {
      const res = await searchOperatorLogin(usernameInput, passwordInput);
      if (res.success && res.operator) {
        addToast('success', 'লগইন সফল!', `স্বাগতম ${res.operator.name}! কাস্টমার ডাটাবেজ সার্চ আনলক হয়েছে।`);
        setUsernameInput('');
        setPasswordInput('');
        setIsCustomerAccountError(false);
      } else {
        setLoginError(res.error || 'লগইন ব্যর্থ হয়েছে। সঠিক তথ্য প্রদান করুন।');
        setIsCustomerAccountError(!!res.isCustomerAccount);
      }
    } catch (err: any) {
      setLoginError(err.message || 'লগইনে সমস্যা দেখা দিয়েছে।');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Distinct Areas
  const distinctAreas = useMemo(() => {
    const areas = new Set<string>();
    customers.forEach((c) => {
      if (c.area) areas.add(c.area);
    });
    return Array.from(areas);
  }, [customers]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    let result = searchQuery.trim() ? searchCustomers(searchQuery) : customers;

    if (statusFilter !== 'All') {
      if (statusFilter === 'Due') {
        result = result.filter(
          (c) => c.dueAmount > 0 || c.paymentStatus === 'Due' || c.status === 'Due'
        );
      } else {
        result = result.filter((c) => c.status === statusFilter);
      }
    }

    if (selectedArea !== 'All') {
      result = result.filter((c) => c.area === selectedArea);
    }

    return result;
  }, [searchQuery, statusFilter, selectedArea, searchCustomers, customers]);

  // Quick sample queries
  const sampleQueries = useMemo(() => {
    if (customers.length > 0) {
      return customers.slice(0, 5).map((c) => c.name || c.uid);
    }
    return [];
  }, [customers]);

  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col transition-colors duration-500 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="হোমে ফিরে যান"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-cyan-400" />
              <span>সুরক্ষিত কাস্টমার সার্চ পোর্টাল</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            শুধুমাত্র CEO TM অনুমোদিত সার্চ অপারেটর এবং অফিস স্টাফদের জন্য সংরক্ষিত
          </p>
        </div>

        {/* If Operator Logged In */}
        {isOperatorLoggedIn && effectiveOperator && (
          <div className="flex items-center gap-3 bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-2 sm:px-4 sm:py-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-bold text-xs">
              {effectiveOperator.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden xs:block">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">{effectiveOperator.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-semibold">
                  অপারেটর অনুমোদিত
                </span>
              </div>
              <p className="text-[10px] text-cyan-300 font-mono">@{effectiveOperator.username}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                searchOperatorLogout();
                addToast('info', 'লগআউট সম্পন্ন', 'সার্চ অপারেটর সেশন সফলভাবে সমাপ্ত হয়েছে।');
              }}
              className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-500/30 transition-all text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
              title="সার্চ অপারেটর লগআউট"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">লগআউট</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. IF NOT LOGGED IN: SHOW OPERATOR LOGIN GATEWAY */}
      {/* ========================================================================= */}
      {!isOperatorLoggedIn ? (
        <div className="flex-1 flex items-center justify-center py-8">
          <div className={`w-full max-w-md rounded-3xl p-6 sm:p-8 border shadow-2xl transition-all ${
            isDark
              ? 'bg-slate-900/90 border-slate-800 text-slate-100 shadow-cyan-950/20'
              : 'bg-slate-900/95 border-purple-500/30 text-slate-100 shadow-purple-950/30'
          }`}>
            <div className="text-center space-y-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto shadow-md">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                সার্চ অপারেটর লগইন
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                গ্রাহক ডেটাবেজ সার্চ ও বিস্তারিত তথ্যে প্রবেশের জন্য আপনার অনুমোদিত অপারেটর ইউজারনেম ও পাসওয়ার্ড দিয়ে লগইন করুন।
              </p>
            </div>

            {loginError && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex flex-col gap-2.5">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{loginError}</span>
                </div>
                {isCustomerAccountError && onNavigateToCustomerPortal && (
                  <button
                    type="button"
                    onClick={onNavigateToCustomerPortal}
                    className="self-start mt-1 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <span>গ্রাহক লগইনে যান (Customer Login)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleOperatorLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  অপারেটর ইউজারনেম / আইডি
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4 text-cyan-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="আপনার অনুমোদিত অপারেটর ইউজারনেম লিখুন..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-white placeholder-slate-500 text-sm outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  পাসওয়ার্ড
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4 text-cyan-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="আপনার পাসওয়ার্ড লিখুন..."
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-white placeholder-slate-500 text-sm outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>যাচাই করা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>লগইন করুন ও সার্চ খুলুন</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-800/80 text-center space-y-1.5">
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>শুধুমাত্র CEO TM প্যানেল থেকে পারমিশন প্রাপ্ত অপারেটররা লগইন করতে পারবেন</span>
              </div>
              <p className="text-[10px] text-slate-500">
                পারমিশন না থাকলে CEO TM (Tamim) এর সাথে যোগাযোগ করুন।
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. IF LOGGED IN: SHOW PROTECTED CUSTOMER SEARCH INTERFACE */
        /* ========================================================================= */
        <div className="space-y-6">
          
          {/* Main Search Bar */}
          <div className="space-y-3">
            <div className={`relative flex items-center rounded-2xl overflow-hidden border-2 transition-all shadow-2xl ${
              isDark
                ? 'bg-slate-900/95 border-cyan-500/40 focus-within:border-cyan-400 focus-within:shadow-cyan-500/25'
                : 'bg-slate-900/95 border-purple-500/50 focus-within:border-cyan-300 focus-within:shadow-purple-500/40'
            }`}>
              <div className="pl-4 sm:pl-5 text-cyan-400">
                <Search className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="গ্রাহকের নাম, মোবাইল নম্বর (017...), কাস্টমার আইডি (WIFI-...), আইপি অথবা PPPoE ইউজার..."
                className="w-full py-4 sm:py-5 pl-3 pr-12 text-sm sm:text-base bg-transparent text-white placeholder-slate-400 outline-none font-medium"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="pr-4 text-slate-400 hover:text-white transition-colors p-2"
                  aria-label="Clear search input"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Quick Sample Queries */}
            {sampleQueries.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
                <span className="text-slate-400 font-medium text-[11px] sm:text-xs">নমুনা সার্চ:</span>
                {sampleQueries.map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => setSearchQuery(sample)}
                    className="px-2.5 py-1 rounded-xl font-mono text-[11px] bg-slate-800/80 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition-colors"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/70 border border-slate-800 text-xs">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 font-bold text-[11px] mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3 text-cyan-400" /> স্ট্যাটাস:
              </span>
              {(['All', 'Active', 'Due', 'Suspended'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs ${
                    statusFilter === status
                      ? status === 'Due'
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'bg-cyan-500 text-slate-950 shadow-xs'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750 hover:text-white'
                  }`}
                >
                  {status === 'All' ? 'সকল' : status === 'Active' ? 'সক্রিয়' : status === 'Due' ? 'বকেয়া' : 'স্থগিত'}
                </button>
              ))}
            </div>

            {/* Area Filter */}
            {distinctAreas.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px]">এলাকা:</span>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="py-1.5 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-cyan-400"
                >
                  <option value="All">সকল এলাকা</option>
                  {distinctAreas.map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Result count */}
            <div className="text-[11px] text-slate-400 font-mono">
              মোট রেজাল্ট: <strong className="text-white">{filteredCustomers.length}</strong> জন
            </div>
          </div>

          {/* Results Grid */}
          {filteredCustomers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredCustomers.map((customer) => (
                <CustomerCard
                  key={customer.id}
                  customer={customer}
                  onViewDetails={(cust) => {
                    setSelectedCustomer(cust);
                    setIsModalOpen(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl p-10 text-center max-w-md mx-auto space-y-3 bg-slate-900/60 border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">কোনো গ্রাহক পাওয়া যায়নি</h3>
              <p className="text-xs text-slate-400">
                অনুগ্রহ করে নাম, মোবাইল নম্বর অথবা কাস্টমার আইডি ঠিকভাবে লিখে আবার চেষ্টা করুন।
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
                >
                  সার্চ রিসেট করুন
                </button>
              )}
            </div>
          )}

        </div>
      )}

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <CustomerDetailsModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedCustomer(null);
          }}
          customer={selectedCustomer}
        />
      )}

    </div>
  );
};
