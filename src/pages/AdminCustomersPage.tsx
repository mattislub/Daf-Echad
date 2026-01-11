import { ReactNode, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Globe,
  Mail,
  MapPin,
  Phone,
  Save,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import { AdminCustomerRecord, getAdminCustomers } from '../services/api';

type AdminCustomer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  language: 'he' | 'en';
  tier: 'standard' | 'vip' | 'wholesale';
  status: 'active' | 'paused' | 'prospect';
  lastOrder: string;
  totalOrders: number;
  balance: number;
  notes: string;
  tags: string[];
};

const normalizeLanguage = (value?: string): AdminCustomer['language'] => {
  if (!value) return 'he';
  const normalized = value.trim().toLowerCase();
  if (normalized.startsWith('he') || normalized.includes('עבר')) return 'he';
  return 'en';
};

const toAdminCustomer = (row: AdminCustomerRecord): AdminCustomer => ({
  id: row.id || '',
  firstName: row.first_name ?? '',
  lastName: row.last_name ?? '',
  email: row.email ?? '',
  phone: row.phone ?? '',
  city: '',
  language: normalizeLanguage(row.language),
  tier: 'standard',
  status: 'active',
  lastOrder: row.stamp ? String(row.stamp).slice(0, 10) : '',
  totalOrders: 0,
  balance: 0,
  notes: '',
  tags: [],
});

export default function AdminCustomersPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { language, t } = useLanguage();
  const isRTL = language === 'he';
  const [isAuthenticated] = useState(() => sessionStorage.getItem('admin-auth') === 'true');
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdminCustomer['status'] | 'all'>('all');
  const [recentlySaved, setRecentlySaved] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let isMounted = true;

    const loadCustomers = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const data = await getAdminCustomers();
        if (!isMounted) return;
        setCustomers(data.map((row) => toAdminCustomer(row)));
      } catch (error) {
        console.error('Failed to load customers', error);
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : 'unknown');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCustomers();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const filteredCustomers = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesTerm = normalizedTerm
        ? [
            customer.firstName,
            customer.lastName,
            customer.email,
            customer.phone,
            customer.city,
            customer.id,
          ]
            .join(' ')
            .toLowerCase()
            .includes(normalizedTerm)
        : true;

      const matchesStatus = statusFilter === 'all' ? true : customer.status === statusFilter;

      return matchesTerm && matchesStatus;
    });
  }, [customers, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const active = customers.filter((customer) => customer.status === 'active').length;
    const vip = customers.filter((customer) => customer.tier === 'vip').length;
    const prospects = customers.filter((customer) => customer.status === 'prospect').length;
    const debtBalance = customers.reduce((sum, customer) => sum + Math.max(customer.balance, 0), 0);

    return { total: customers.length, active, vip, prospects, debtBalance };
  }, [customers]);

  const handleUpdateCustomer = (customerId: string, updates: Partial<AdminCustomer>) => {
    setCustomers((prev) => prev.map((customer) => (customer.id === customerId ? { ...customer, ...updates } : customer)));
  };

  const handleSaveCustomer = (customerId: string) => {
    setRecentlySaved((prev) => ({ ...prev, [customerId]: true }));
    setTimeout(() => {
      setRecentlySaved((prev) => {
        const updated = { ...prev };
        delete updated[customerId];
        return updated;
      });
    }, 2500);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(language === 'he' ? 'he-IL' : 'en-US', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(value);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
        <Header onNavigate={onNavigate} />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-sm p-8 space-y-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-yellow-700" />
              <div>
                <p className="text-sm text-gray-600">{t('admin.title')}</p>
                <h1 className="text-xl font-bold text-gray-900">{t('admin.customersPage.title')}</h1>
              </div>
            </div>
            <p className="text-gray-600 text-sm">{t('admin.customersPage.notice')}</p>
            <button
              onClick={() => onNavigate?.('admin')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-700 text-white text-sm font-semibold hover:bg-yellow-800"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('admin.customersPage.back')}
            </button>
          </div>
        </main>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header onNavigate={onNavigate} />

      <main className="container mx-auto px-4 py-10 space-y-8">
        <div className="flex flex-col gap-4 bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">{t('admin.title')}</p>
              <h1 className="text-3xl font-bold text-gray-900">{t('admin.customersPage.title')}</h1>
              <p className="text-sm text-gray-700 max-w-2xl">{t('admin.customersPage.subtitle')}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate?.('admin')}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('admin.customersPage.back')}
              </button>
              <button
                onClick={() => onNavigate?.('home')}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-yellow-700 bg-yellow-50 border border-yellow-100 rounded-lg hover:bg-yellow-100"
              >
                <ShieldCheck className="w-4 h-4" />
                {t('admin.backToStore')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SummaryTile
              icon={<Users className="w-6 h-6 text-blue-700" />}
              label={t('admin.customersPage.total')}
              value={stats.total}
              tone="blue"
            />
            <SummaryTile
              icon={<CheckCircle2 className="w-6 h-6 text-emerald-700" />}
              label={t('admin.customersPage.summary.active')}
              value={stats.active}
              tone="emerald"
            />
            <SummaryTile
              icon={<ShieldCheck className="w-6 h-6 text-purple-700" />}
              label={t('admin.customersPage.summary.vip')}
              value={stats.vip}
              tone="purple"
            />
            <SummaryTile
              icon={<Mail className="w-6 h-6 text-amber-700" />}
              label={t('admin.customersPage.summary.prospects')}
              value={stats.prospects}
              tone="amber"
              helper={formatCurrency(stats.debtBalance)}
            />
          </div>
        </div>

        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{t('admin.customersPage.listTitle')}</h2>
              <p className="text-sm text-gray-600">{t('admin.customersPage.listSubtitle')}</p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <Search className="w-4 h-4 text-gray-500 absolute top-1/2 -translate-y-1/2 left-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={t('admin.customersPage.searchPlaceholder')}
                  className="w-full md:w-72 pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-yellow-600 focus:ring-yellow-100"
                  aria-label={t('admin.customersPage.searchLabel')}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as AdminCustomer['status'] | 'all')}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="all">{t('admin.customersPage.filters.all')}</option>
                <option value="active">{t('admin.customersPage.status.active')}</option>
                <option value="paused">{t('admin.customersPage.status.paused')}</option>
                <option value="prospect">{t('admin.customersPage.status.prospect')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredCustomers.length ? (
              filteredCustomers.map((customer) => (
                <article key={customer.id} className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">{`${t('admin.customersPage.cardTitle')} ${customer.id}`}</p>
                      <h3 className="text-lg font-semibold text-gray-900">{`${customer.firstName} ${customer.lastName}`}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{customer.email}</span>
                      </div>
                    </div>
                    <StatusBadge status={customer.status} label={t(`admin.customersPage.status.${customer.status}`)} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <MiniStat label={t('admin.customersPage.ordersCount')} value={customer.totalOrders.toString()} />
                    <MiniStat label={t('admin.customersPage.lastOrder')} value={customer.lastOrder} />
                    <MiniStat label={t('admin.customersPage.balance')} value={formatCurrency(customer.balance)} tone={customer.balance > 0 ? 'amber' : 'emerald'} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="text-xs font-medium text-gray-700">
                          {t('admin.customersPage.contact')}
                          <input
                            type="text"
                            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                            value={customer.firstName}
                            onChange={(event) => handleUpdateCustomer(customer.id, { firstName: event.target.value })}
                          />
                        </label>
                        <label className="text-xs font-medium text-gray-700">
                          {t('admin.customersPage.lastName')}
                          <input
                            type="text"
                            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                            value={customer.lastName}
                            onChange={(event) => handleUpdateCustomer(customer.id, { lastName: event.target.value })}
                          />
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="text-xs font-medium text-gray-700 inline-flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span>{t('admin.customersPage.phone')}</span>
                          <input
                            type="tel"
                            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                            value={customer.phone}
                            onChange={(event) => handleUpdateCustomer(customer.id, { phone: event.target.value })}
                          />
                        </label>
                        <label className="text-xs font-medium text-gray-700 inline-flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span>{t('admin.customersPage.email')}</span>
                          <input
                            type="email"
                            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                            value={customer.email}
                            onChange={(event) => handleUpdateCustomer(customer.id, { email: event.target.value })}
                          />
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <label className="text-xs font-medium text-gray-700 inline-flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span>{t('admin.customersPage.city')}</span>
                          <input
                            type="text"
                            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                            value={customer.city}
                            onChange={(event) => handleUpdateCustomer(customer.id, { city: event.target.value })}
                          />
                        </label>
                        <label className="text-xs font-medium text-gray-700 inline-flex items-center gap-2">
                          <Globe className="w-4 h-4 text-gray-500" />
                          <span>{t('admin.customersPage.language')}</span>
                          <select
                            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                            value={customer.language}
                            onChange={(event) => handleUpdateCustomer(customer.id, { language: event.target.value as AdminCustomer['language'] })}
                          >
                            <option value="he">עברית</option>
                            <option value="en">English</option>
                          </select>
                        </label>
                        <label className="text-xs font-medium text-gray-700">
                          {t('admin.customersPage.tags')}
                          <input
                            type="text"
                            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                            value={customer.tags.join(', ')}
                            onChange={(event) =>
                              handleUpdateCustomer(customer.id, {
                                tags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean),
                              })
                            }
                          />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <label className="text-xs font-medium text-gray-700">
                          {t('admin.customersPage.statusLabel')}
                          <select
                            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                            value={customer.status}
                            onChange={(event) => handleUpdateCustomer(customer.id, { status: event.target.value as AdminCustomer['status'] })}
                          >
                            <option value="active">{t('admin.customersPage.status.active')}</option>
                            <option value="paused">{t('admin.customersPage.status.paused')}</option>
                            <option value="prospect">{t('admin.customersPage.status.prospect')}</option>
                          </select>
                        </label>
                        <label className="text-xs font-medium text-gray-700">
                          {t('admin.customersPage.tier')}
                          <select
                            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                            value={customer.tier}
                            onChange={(event) => handleUpdateCustomer(customer.id, { tier: event.target.value as AdminCustomer['tier'] })}
                          >
                            <option value="standard">{t('admin.customersPage.tier.standard')}</option>
                            <option value="vip">{t('admin.customersPage.tier.vip')}</option>
                            <option value="wholesale">{t('admin.customersPage.tier.wholesale')}</option>
                          </select>
                        </label>
                        <label className="text-xs font-medium text-gray-700">
                          {t('admin.customersPage.balance')}
                          <input
                            type="number"
                            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                            value={customer.balance}
                            onChange={(event) => handleUpdateCustomer(customer.id, { balance: Number(event.target.value) })}
                          />
                        </label>
                      </div>

                      <label className="text-xs font-medium text-gray-700 block">
                        {t('admin.customersPage.notes')}
                        <textarea
                          className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm min-h-[96px]"
                          value={customer.notes}
                          onChange={(event) => handleUpdateCustomer(customer.id, { notes: event.target.value })}
                        />
                      </label>

                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex flex-wrap items-center gap-2">
                          {customer.tags.map((tag) => (
                            <span key={tag} className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          {recentlySaved[customer.id] && <span className="text-sm text-emerald-700">{t('admin.customersPage.saved')}</span>}
                          <button
                            onClick={() => handleSaveCustomer(customer.id)}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 shadow-sm"
                          >
                            <Save className="w-4 h-4" />
                            {t('admin.customersPage.save')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="text-center text-gray-500 py-10 border border-dashed border-gray-300 rounded-xl">
                {isLoading
                  ? t('admin.customersPage.loading')
                  : loadError
                    ? t('admin.customersPage.error')
                    : t('admin.customersPage.empty')}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}

function StatusBadge({ status, label }: { status: AdminCustomer['status']; label: string }) {
  const toneClasses: Record<AdminCustomer['status'], string> = {
    active: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    paused: 'text-amber-700 bg-amber-50 border-amber-100',
    prospect: 'text-blue-700 bg-blue-50 border-blue-100',
  };

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${toneClasses[status]}`}>
      <CheckCircle2 className="w-4 h-4" />
      {label}
    </span>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  helper?: string;
  tone: 'blue' | 'emerald' | 'purple' | 'amber';
}) {
  const toneClasses: Record<'blue' | 'emerald' | 'purple' | 'amber', string> = {
    blue: 'text-blue-700 bg-blue-50 border-blue-100',
    emerald: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    purple: 'text-purple-700 bg-purple-50 border-purple-100',
    amber: 'text-amber-700 bg-amber-50 border-amber-100',
  };

  return (
    <div className={`flex items-center gap-3 bg-white border rounded-2xl p-4 shadow-sm ${toneClasses[tone]}`}>
      <div className="w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center border border-white/80 shadow-inner">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-700">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {helper && <p className="text-xs text-gray-600">{helper}</p>}
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone = 'gray' }: { label: string; value: string; tone?: 'gray' | 'amber' | 'emerald' }) {
  const toneClasses: Record<'gray' | 'amber' | 'emerald', string> = {
    gray: 'text-gray-700 bg-gray-50',
    amber: 'text-amber-700 bg-amber-50',
    emerald: 'text-emerald-700 bg-emerald-50',
  };

  return (
    <div className={`rounded-lg border border-gray-200 px-3 py-2 ${toneClasses[tone]}`}>
      <p className="text-xs text-gray-600">{label}</p>
      <p className="text-base font-semibold">{value}</p>
    </div>
  );
}
