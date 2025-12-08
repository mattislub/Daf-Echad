import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CreditCard,
  Globe2,
  Home,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  Settings,
  ShieldCheck,
  Truck,
  UserCircle,
} from 'lucide-react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { useLanguage } from '../context/LanguageContext';
import { CustomerCreditEntry, CustomerCreditResponse, getCustomerCredit } from '../services/api';

interface AccountPageProps {
  onNavigate?: (page: string) => void;
}

interface OrderItem {
  id: string;
  title: { he: string; en: string };
  date: string;
  status: { he: string; en: string };
  totalILS: number;
  totalUSD: number;
  trackingNumber: string;
  courier: string;
}

interface AddressItem {
  label: { he: string; en: string };
  details: { he: string; en: string };
  phone: string;
  primary?: boolean;
}

const tabOrder = ['overview', 'orders', 'addresses', 'preferences', 'support'] as const;
type TabId = (typeof tabOrder)[number];

export default function AccountPage({ onNavigate }: AccountPageProps) {
  const { language, currency, t } = useLanguage();
  const isRTL = language === 'he';
  const customerId = '1045';
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courier, setCourier] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [creditSummary, setCreditSummary] = useState<CustomerCreditResponse | null>(null);
  const [creditError, setCreditError] = useState<string | null>(null);
  const [isCreditLoading, setIsCreditLoading] = useState(false);

  const customerProfile = {
    name: { he: 'אברהם כהן', en: 'Avraham Cohen' },
    email: 'avraham.cohen@example.com',
    phone: '+972-52-123-4567',
    city: { he: 'ירושלים', en: 'Jerusalem' },
    id: `#${customerId}`,
    customerType: { he: 'לקוח פרטי', en: 'Personal customer' },
    languagePreference: { he: 'עברית', en: 'Hebrew' },
  } as const;

  const customerName = customerProfile.name[language];

  const orders: OrderItem[] = [
    {
      id: '#BR-1043',
      title: {
        he: 'סט ליקוטי מוהר"ן מהדורה מפוארת',
        en: 'Likutey Moharan deluxe set',
      },
      date: '2024-07-15',
      status: { he: 'נשלח עם מעקב', en: 'Shipped with tracking' },
      totalILS: 410,
      totalUSD: 112,
      trackingNumber: 'IL123456789',
      courier: language === 'he' ? 'דואר ישראל' : 'Israel Post',
    },
    {
      id: '#BR-1031',
      title: {
        he: 'סידור אריז"ל מהודר',
        en: 'AriZal Siddur (premium)',
      },
      date: '2024-06-02',
      status: { he: 'הושלם', en: 'Completed' },
      totalILS: 180,
      totalUSD: 49,
      trackingNumber: 'FX987654321',
      courier: 'FedEx',
    },
    {
      id: '#BR-0988',
      title: {
        he: 'ספר המידות בכריכה רכה',
        en: 'Sefer Hamiddot softcover',
      },
      date: '2024-04-21',
      status: { he: 'ממתין לאיסוף', en: 'Awaiting pickup' },
      totalILS: 95,
      totalUSD: 26,
      trackingNumber: 'PU445566778',
      courier: language === 'he' ? 'איסוף עצמי - ירושלים' : 'Pickup - Jerusalem',
    },
  ];

  const carriers = [
    { value: 'Israel Post', label: language === 'he' ? 'דואר ישראל' : 'Israel Post' },
    { value: 'FedEx', label: 'FedEx' },
    { value: 'DHL', label: 'DHL' },
    { value: 'Aramex', label: 'Aramex' },
  ];

  const tabs = useMemo(
    () => [
      { id: 'overview', label: t('account.tabs.overview'), icon: LayoutDashboard },
      { id: 'orders', label: t('account.tabs.orders'), icon: Package },
      { id: 'addresses', label: t('account.tabs.addresses'), icon: MapPin },
      { id: 'preferences', label: t('account.tabs.preferences'), icon: Settings },
      { id: 'support', label: t('account.tabs.support'), icon: Bell },
    ],
    [t],
  );

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(language === 'he' ? 'he-IL' : 'en-US', {
      style: 'currency',
      currency: currency === 'ILS' ? 'ILS' : 'USD',
      minimumFractionDigits: 2,
    }).format(value);

  const formatDate = (value?: string) => {
    if (!value) return '-';

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;

    return parsed.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US');
  };

  const formatTotal = (order: OrderItem) => (currency === 'ILS' ? `₪${order.totalILS}` : `$${order.totalUSD}`);

  const loadCustomerCredit = useCallback(async () => {
    setIsCreditLoading(true);
    setCreditError(null);

    try {
      const creditData = await getCustomerCredit(customerId);
      setCreditSummary(creditData);
    } catch (error) {
      console.error('Failed to load credit history', error);
      setCreditError(t('account.creditLoadError'));
      setCreditSummary(null);
    } finally {
      setIsCreditLoading(false);
    }
  }, [customerId, t]);

  useEffect(() => {
    loadCustomerCredit();
  }, [loadCustomerCredit]);

  const handleTrackSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!trackingNumber || !courier) {
      return;
    }

    console.info('Track request', { trackingNumber, courier });
  };

  const addresses: AddressItem[] = [
    {
      label: { he: 'כתובת ראשית', en: 'Primary address' },
      details: { he: 'רח׳ הקבלה 12, ירושלים', en: '12 Hakabala St, Jerusalem' },
      phone: '+972-52-123-4567',
      primary: true,
    },
    {
      label: { he: 'כתובת גיבוי', en: 'Backup address' },
      details: { he: '45 Kedumim Ave, Lakewood NJ', en: '45 Kedumim Ave, Lakewood NJ' },
      phone: '+1-848-555-2211',
    },
  ];

  const creditValue = creditSummary ? formatCurrency(creditSummary.totalCredit) : t('account.creditLoading');
  const tierLabel = language === 'he' ? 'חבר זהב' : 'Gold member';
  const tierDescription =
    language === 'he' ? 'משלוח מועדף והטבות קבועות' : 'Priority shipping and member rewards';

  const customerDetailsRows = [
    { label: t('account.customerId'), value: customerProfile.id },
    { label: t('account.email'), value: customerProfile.email },
    { label: t('account.phone'), value: customerProfile.phone },
    { label: t('account.location'), value: customerProfile.city[language] },
    { label: t('account.customerTypeLabel'), value: customerProfile.customerType[language] },
    { label: t('account.languagePreference'), value: customerProfile.languagePreference[language] },
  ];

  const nextDelivery = orders[0];
  const pickupOrder = orders.find((order) => order.status.en === 'Awaiting pickup');

  const renderCreditRows = (transactions: CustomerCreditEntry[]) => (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-100 rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {t('account.date')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {t('account.creditCode')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {t('account.creditDescriptionLabel')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {t('account.creditOrderId')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {t('account.creditAmount')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {t('account.creditRunningBalance')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {transactions.map((entry) => (
            <tr key={entry.id} className="hover:bg-yellow-50/40">
              <td className="px-4 py-3 text-sm text-gray-700">{formatDate(entry.date)}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{entry.code || '-'}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{entry.description || '-'}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{entry.orderId || '-'}</td>
              <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatCurrency(entry.amount)}</td>
              <td className="px-4 py-3 text-sm font-semibold text-yellow-700">
                {formatCurrency(entry.runningBalance)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <UserCircle className="w-10 h-10 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-500">{t('account.membership')}</p>
              <p className="font-semibold text-gray-900">{tierLabel}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">{tierDescription}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <CreditCard className="w-10 h-10 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-500">{t('account.storeCredit')}</p>
              <p className="font-semibold text-gray-900">{creditValue}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {creditSummary?.updatedAt
              ? `${t('account.creditLastUpdated')} ${formatDate(creditSummary.updatedAt)}`
              : t('account.creditDescription')}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="w-10 h-10 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-500">{t('account.security')}</p>
              <p className="font-semibold text-gray-900">{t('account.securityStatus')}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">{t('account.securityDescription')}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wide">{t('account.summaryTitle')}</p>
            <h2 className="text-xl font-semibold text-gray-900">{t('account.orders')}</h2>
            <p className="text-sm text-gray-600">{t('account.summaryDescription')}</p>
          </div>
          <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-semibold text-gray-700">
            {orders.length} {t('account.ordersCount')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-yellow-50 via-white to-yellow-100 border border-yellow-100 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-yellow-800">
              <Truck className="w-5 h-5" />
              <span className="text-xs font-semibold uppercase">{t('account.nextDelivery')}</span>
            </div>
            <p className="font-semibold text-gray-900">{nextDelivery.title[language]}</p>
            <p className="text-sm text-gray-700">{nextDelivery.date}</p>
            <p className="text-sm text-gray-600">
              {t('account.courier')}: {nextDelivery.courier}
            </p>
            <p className="text-sm text-gray-600">
              {t('account.trackingNumber')}: {nextDelivery.trackingNumber}
            </p>
          </div>

          <div className="p-4 bg-white border border-gray-100 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-yellow-800">
              <Package className="w-5 h-5" />
              <span className="text-xs font-semibold uppercase">{t('account.awaitingPickup')}</span>
            </div>
            <p className="font-semibold text-gray-900">{pickupOrder?.title[language]}</p>
            <p className="text-sm text-gray-700">{pickupOrder?.date}</p>
            <p className="text-sm text-gray-600">{pickupOrder?.courier}</p>
          </div>

          <div className="p-4 bg-white border border-gray-100 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-yellow-800">
              <CreditCard className="w-5 h-5" />
              <span className="text-xs font-semibold uppercase">{t('account.paymentMethods')}</span>
            </div>
            <p className="font-semibold text-gray-900">{t('account.defaultPayment')}</p>
            <p className="text-sm text-gray-700">VISA •••• 3389</p>
            <button className="inline-flex items-center gap-2 text-sm font-semibold text-yellow-700 hover:text-yellow-800">
              {t('account.updatePayment')}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wide">{t('account.customerDetails')}</p>
            <h3 className="text-lg font-semibold text-gray-900">{t('account.customerDetailsTitle')}</h3>
            <p className="text-sm text-gray-600">{t('account.customerDetailsDescription')}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-100 rounded-lg overflow-hidden">
            <tbody className="divide-y divide-gray-100 bg-white">
              {customerDetailsRows.map((row) => (
                <tr key={row.label} className="hover:bg-yellow-50/40">
                  <th
                    className={`w-1/3 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 ${
                      isRTL ? 'text-right' : 'text-left'
                    }`}
                  >
                    {row.label}
                  </th>
                  <td className="px-4 py-3 text-sm text-gray-900">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wide">{t('account.storeCredit')}</p>
            <h3 className="text-lg font-semibold text-gray-900">{t('account.creditHistoryTitle')}</h3>
            <p className="text-sm text-gray-600">{t('account.creditHistoryDescription')}</p>
          </div>
          <button
            type="button"
            onClick={loadCustomerCredit}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-yellow-700 bg-yellow-50 border border-yellow-100 rounded-lg hover:bg-yellow-100"
            disabled={isCreditLoading}
          >
            {t('account.refresh')}
          </button>
        </div>

        {isCreditLoading && <p className="text-sm text-gray-600">{t('account.creditLoading')}</p>}
        {creditError && (
          <p className="text-sm text-red-600" role="alert">
            {creditError}
          </p>
        )}
        {!isCreditLoading && !creditError && creditSummary?.transactions?.length === 0 && (
          <p className="text-sm text-gray-600">{t('account.noCreditEntries')}</p>
        )}
        {!isCreditLoading && !creditError && creditSummary?.transactions?.length
          ? renderCreditRows(creditSummary.transactions)
          : null}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wide">{t('account.quickActions')}</p>
            <h3 className="text-lg font-semibold text-gray-900">{t('account.supportTitle')}</h3>
            <p className="text-sm text-gray-600">{t('account.supportDescription')}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-yellow-700 rounded-lg hover:bg-yellow-800">
            <Truck className="w-4 h-4" />
            {t('account.trackOrder')}
          </button>
          <button className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-gray-800 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100">
            <MapPin className="w-4 h-4" />
            {t('account.addAddress')}
          </button>
          <button className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-yellow-700 bg-yellow-50 border border-yellow-100 rounded-lg hover:bg-yellow-100">
            <ShieldCheck className="w-4 h-4" />
            {t('account.contactSupport')}
          </button>
        </div>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wide">{t('account.orders')}</p>
            <h2 className="text-xl font-semibold text-gray-900">{t('account.recentOrders')}</h2>
            <p className="text-sm text-gray-600">{t('account.ordersDescription')}</p>
          </div>
          <div className="px-3 py-1 bg-gray-100 rounded-full text-sm font-semibold text-gray-700">
            {orders.length} {t('account.ordersCount')}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border border-gray-100 rounded-lg hover:border-yellow-200 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Package className="w-5 h-5 text-yellow-700" />
                    <p className="font-semibold text-gray-900">{order.title[language]}</p>
                    <span className="text-sm text-gray-500">{order.id}</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1 flex flex-col sm:flex-row sm:items-center sm:gap-3">
                    <span>{order.date}</span>
                    <span className="hidden sm:inline-block text-gray-300">•</span>
                    <span>
                      {t('account.courier')}: {order.courier}
                    </span>
                    <span className="hidden sm:inline-block text-gray-300">•</span>
                    <span>
                      {t('account.trackingNumber')}: {order.trackingNumber}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-sm font-semibold">
                    {order.status[language]}
                  </span>
                  <span className="font-bold text-gray-900">{formatTotal(order)}</span>
                  <button className="text-sm font-semibold text-yellow-700 hover:text-yellow-800">
                    {t('account.viewDetails')}
                  </button>
                </div>
              </div>
            ))}

            <div className="overflow-x-auto border border-gray-100 rounded-lg">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{t('account.orderId')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{t('account.date')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{t('account.status')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{t('account.total')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{t('account.trackingNumber')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {orders.map((order) => (
                    <tr key={`${order.id}-history`} className="hover:bg-yellow-50/40">
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{order.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{order.date}</td>
                      <td className="px-4 py-3 text-sm text-yellow-700 font-semibold">{order.status[language]}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{formatTotal(order)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{order.trackingNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 h-full">
            <div className="flex items-center gap-3 mb-3">
              <Truck className="w-5 h-5 text-yellow-700" />
              <div>
                <p className="text-sm text-yellow-800 uppercase tracking-wide">{t('account.trackOrders')}</p>
                <h3 className="text-lg font-semibold text-gray-900">{t('account.trackOrdersTitle')}</h3>
              </div>
            </div>

            <p className="text-sm text-gray-700 mb-3">{t('account.trackOrdersDescription')}</p>

            <form className="space-y-3" onSubmit={handleTrackSubmit}>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-800" htmlFor="trackingNumber">
                  {t('account.trackingNumber')}
                </label>
                <input
                  id="trackingNumber"
                  name="trackingNumber"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full rounded-lg border border-yellow-200 bg-white px-3 py-2 text-sm focus:border-yellow-400 focus:ring-yellow-300"
                  placeholder={t('account.trackingPlaceholder')}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-800" htmlFor="courier">
                  {t('account.courier')}
                </label>
                <select
                  id="courier"
                  name="courier"
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  className="w-full rounded-lg border border-yellow-200 bg-white px-3 py-2 text-sm focus:border-yellow-400 focus:ring-yellow-300"
                >
                  <option value="">{t('account.selectCourier')}</option>
                  {carriers.map((carrier) => (
                    <option key={carrier.value} value={carrier.value}>
                      {carrier.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-700 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-800 disabled:opacity-60"
                disabled={!trackingNumber || !courier}
              >
                <Truck className="w-4 h-4" />
                {t('account.trackNow')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAddresses = () => (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <MapPin className="w-5 h-5 text-yellow-700" />
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wide">{t('account.addresses')}</p>
          <h2 className="text-lg font-semibold text-gray-900">{t('account.manageAddresses')}</h2>
        </div>
      </div>
      <div className="space-y-4">
        {addresses.map((address) => (
          <div key={address.details.en} className="p-4 border border-gray-100 rounded-lg bg-gray-50">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="font-semibold text-gray-900">{address.label[language]}</p>
              {address.primary && (
                <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">
                  {t('account.primary')}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-700">{address.details[language]}</p>
            <p className="text-sm text-gray-600">{address.phone}</p>
          </div>
        ))}
        <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-yellow-700 bg-yellow-50 border border-yellow-100 rounded-lg hover:bg-yellow-100">
          <MapPin className="w-4 h-4" />
          {t('account.addAddress')}
        </button>
      </div>
    </div>
  );

  const renderPreferences = () => (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-3">
        <Globe2 className="w-5 h-5 text-yellow-700" />
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wide">{t('account.preferences')}</p>
          <h2 className="text-lg font-semibold text-gray-900">{t('account.shoppingPreferences')}</h2>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">{t('account.language')}</p>
            <p className="text-sm text-gray-600">{language === 'he' ? 'עברית' : 'English'}</p>
          </div>
          <span className="px-3 py-1 text-sm font-semibold bg-gray-100 text-gray-700 rounded-full">{t('account.active')}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">{t('account.currency')}</p>
            <p className="text-sm text-gray-600">{currency === 'ILS' ? '₪ ILS' : '$ USD'}</p>
          </div>
          <span className="px-3 py-1 text-sm font-semibold bg-gray-100 text-gray-700 rounded-full">{t('account.active')}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">{t('account.notifications')}</p>
            <p className="text-sm text-gray-600">{t('account.notificationsDescription')}</p>
          </div>
          <span className="px-3 py-1 text-sm font-semibold bg-green-100 text-green-800 rounded-full">{t('account.enabled')}</span>
        </div>
      </div>
    </div>
  );

  const renderSupport = () => (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-3 mb-3">
        <Bell className="w-5 h-5 text-yellow-700" />
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wide">{t('account.support')}</p>
          <h2 className="text-lg font-semibold text-gray-900">{t('account.supportTitle')}</h2>
        </div>
      </div>
      <p className="text-sm text-gray-600">{t('account.supportDescription')}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-yellow-700 rounded-lg hover:bg-yellow-800">
          <Package className="w-4 h-4" />
          {t('account.trackOrder')}
        </button>
        <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-yellow-700 bg-yellow-50 border border-yellow-100 rounded-lg hover:bg-yellow-100">
          <ShieldCheck className="w-4 h-4" />
          {t('account.contactSupport')}
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'orders':
        return renderOrders();
      case 'addresses':
        return renderAddresses();
      case 'preferences':
        return renderPreferences();
      case 'support':
        return renderSupport();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header onNavigate={onNavigate} />

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="space-y-1">
              <p className="text-sm text-yellow-700 font-semibold">{t('account.title')}</p>
              <h1 className="text-3xl font-bold text-gray-900">{customerName}</h1>
              <p className="text-gray-600">{t('account.subtitle')}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate?.('home')}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100"
              >
                <Home className="w-4 h-4" />
                {t('account.backToStore')}
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100">
                <LogOut className="w-4 h-4" />
                {t('account.logout')}
              </button>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-max">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabId)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-yellow-700 text-white border-yellow-700 shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {renderContent()}
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
