import { Bell, CreditCard, Globe2, Home, LogOut, MapPin, Package, ShieldCheck, UserCircle } from 'lucide-react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { useLanguage } from '../context/LanguageContext';

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
}

interface AddressItem {
  label: { he: string; en: string };
  details: { he: string; en: string };
  phone: string;
  primary?: boolean;
}

export default function AccountPage({ onNavigate }: AccountPageProps) {
  const { language, currency, t } = useLanguage();
  const isRTL = language === 'he';

  const customerName = language === 'he' ? 'אברהם כהן' : 'Avraham Cohen';

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
    },
  ];

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

  const creditValue = currency === 'ILS' ? '₪220' : '$60';
  const tierLabel = language === 'he' ? 'חבר זהב' : 'Gold member';
  const tierDescription = language === 'he'
    ? 'משלוח מועדף והטבות קבועות'
    : 'Priority shipping and member rewards';

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header onNavigate={onNavigate} />

      <main className="container mx-auto px-4 py-8 space-y-8">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
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
                <p className="text-sm text-gray-600">{t('account.creditDescription')}</p>
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

              <div className="space-y-3">
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
                      <p className="text-sm text-gray-600 mt-1">{order.date}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-sm font-semibold">
                        {order.status[language]}
                      </span>
                      <span className="font-bold text-gray-900">
                        {currency === 'ILS' ? `₪${order.totalILS}` : `$${order.totalUSD}`}
                      </span>
                      <button className="text-sm font-semibold text-yellow-700 hover:text-yellow-800">
                        {t('account.viewDetails')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
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
                  <span className="px-3 py-1 text-sm font-semibold bg-gray-100 text-gray-700 rounded-full">
                    {t('account.active')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{t('account.currency')}</p>
                    <p className="text-sm text-gray-600">{currency === 'ILS' ? '₪ ILS' : '$ USD'}</p>
                  </div>
                  <span className="px-3 py-1 text-sm font-semibold bg-gray-100 text-gray-700 rounded-full">
                    {t('account.active')}
                  </span>
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

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <Bell className="w-5 h-5 text-yellow-700" />
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide">{t('account.support')}</p>
                  <h2 className="text-lg font-semibold text-gray-900">{t('account.supportTitle')}</h2>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">{t('account.supportDescription')}</p>
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
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
