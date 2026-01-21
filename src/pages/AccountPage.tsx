import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
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
import { CustomerAccount } from '../types';
import {
  CustomerCreditEntry,
  CustomerCreditResponse,
  Country,
  CustomerShippingAddress,
  CustomerShippingAddressInput,
  createCustomerShippingAddress,
  getCountries,
  getCustomerCredit,
  getShipToTableAddresses,
  updateCustomerShippingAddress,
  updateCustomerProfile,
} from '../services/api';
import TrackingWidget from '../components/TrackingWidget';

interface AccountPageProps {
  onNavigate?: (page: string) => void;
  account?: CustomerAccount | null;
  onAccountUpdate?: (account: CustomerAccount) => void;
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

export default function AccountPage({ onNavigate, account, onAccountUpdate }: AccountPageProps) {
  const { language, currency, t, setLanguage } = useLanguage();
  const [profileAccount, setProfileAccount] = useState<CustomerAccount | null>(account ?? null);
  const [profileForm, setProfileForm] = useState({
    firstName: account?.firstName ?? '',
    lastName: account?.lastName ?? '',
    email: account?.email ?? '',
    phone: account?.phone ?? '',
    fax: account?.fax ?? '',
    language: account?.language ?? language,
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const isRTL = language === 'he';
  const customerId = profileAccount?.id ?? account?.id ?? '1045';
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [creditSummary, setCreditSummary] = useState<CustomerCreditResponse | null>(null);
  const [creditError, setCreditError] = useState<string | null>(null);
  const [isCreditLoading, setIsCreditLoading] = useState(false);
  const [shippingAddresses, setShippingAddresses] = useState<CustomerShippingAddress[]>([]);
  const [addressesError, setAddressesError] = useState<string | null>(null);
  const [isAddressesLoading, setIsAddressesLoading] = useState(false);
  const [addressForm, setAddressForm] = useState<CustomerShippingAddressInput>({ street: '', city: '' });
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressFormMessage, setAddressFormMessage] = useState<string | null>(null);
  const [addressFormError, setAddressFormError] = useState<string | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [countriesError, setCountriesError] = useState<string | null>(null);

  useEffect(() => {
    setProfileAccount(account ?? null);
  }, [account]);

  useEffect(() => {
    const source = profileAccount ?? account ?? null;

    setProfileForm({
      firstName: source?.firstName ?? '',
      lastName: source?.lastName ?? '',
      email: source?.email ?? '',
      phone: source?.phone ?? '',
      fax: source?.fax ?? '',
      language: source?.language ?? language,
    });
    setProfileMessage(null);
    setProfileError(null);
  }, [account, language, profileAccount]);

  const fallbackProfile = useMemo(
    () => ({
      name: { he: 'אברהם כהן', en: 'Avraham Cohen' },
      email: 'avraham.cohen@example.com',
      phone: '+972-52-123-4567',
      city: { he: 'ירושלים', en: 'Jerusalem' },
      id: '#1045',
      customerType: { he: 'לקוח פרטי', en: 'Personal customer' },
      languagePreference: { he: 'עברית', en: 'Hebrew' },
    }),
    [],
  );

  const customerProfile = useMemo(() => {
    const fullName = [profileAccount?.firstName, profileAccount?.lastName].filter(Boolean).join(' ').trim();

    const languagePreference =
      profileAccount?.language === 'en'
        ? { he: 'אנגלית', en: 'English' }
        : profileAccount?.language === 'he'
          ? { he: 'עברית', en: 'Hebrew' }
          : fallbackProfile.languagePreference;

    const customerType = profileAccount?.customerType
      ? { he: profileAccount.customerType, en: profileAccount.customerType }
      : fallbackProfile.customerType;

    return {
      ...fallbackProfile,
      name: {
        he: fullName || fallbackProfile.name.he,
        en: fullName || fallbackProfile.name.en,
      },
      email: profileAccount?.email ?? fallbackProfile.email,
      phone: profileAccount?.phone ?? fallbackProfile.phone,
      id: profileAccount?.id ? `#${profileAccount.id}` : fallbackProfile.id,
      customerType,
      languagePreference,
    };
  }, [fallbackProfile, profileAccount]);

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

  const resolveCountryName = useCallback(
    (value?: string) => {
      if (!value) return '';
      const trimmed = value.trim();
      const matched = countries.find((country) => country.id === trimmed);
      return matched?.name ?? trimmed;
    },
    [countries],
  );

  const resolveCountryId = useCallback(
    (value?: string) => {
      if (!value) return '';
      const trimmed = value.trim();
      const matched = countries.find((country) => country.id === trimmed || country.name === trimmed);
      return matched?.id ?? trimmed;
    },
    [countries],
  );

  const formatAddressDetails = (address: CustomerShippingAddress, currentLanguage: typeof language) => {
    const parts: string[] = [];
    const streetLine = [address.street, address.houseNumber].filter(Boolean).join(' ');

    if (streetLine) parts.push(streetLine);
    if (address.entrance) parts.push(currentLanguage === 'he' ? `כניסה ${address.entrance}` : `Entrance ${address.entrance}`);
    if (address.apartment) parts.push(currentLanguage === 'he' ? `דירה ${address.apartment}` : `Apartment ${address.apartment}`);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.zip)
      parts.push(currentLanguage === 'he' ? `מיקוד ${address.zip}` : `${currentLanguage === 'he' ? 'מיקוד' : 'ZIP'} ${address.zip}`);
    if (address.country) parts.push(resolveCountryName(address.country));

    return parts.join(', ');
  };

  const mapAddressToFormState = useCallback(
    (address?: CustomerShippingAddress): CustomerShippingAddressInput => ({
      street: address?.street?.trim() ?? '',
      houseNumber: address?.houseNumber?.trim() ?? '',
      entrance: address?.entrance?.trim() ?? '',
      apartment: address?.apartment?.trim() ?? '',
      city: address?.city?.trim() ?? '',
      state: address?.state?.trim() ?? '',
      zip: address?.zip?.trim() ?? '',
      country: resolveCountryId(address?.country),
      specialInstructions: address?.specialInstructions?.trim() ?? '',
      callId: address?.callId?.trim() ?? '',
      isDefault: Boolean(address?.isDefault),
    }),
    [resolveCountryId],
  );

  useEffect(() => {
    setCreditSummary(null);
    setCreditError(null);
    setShippingAddresses([]);
    setAddressesError(null);
    setSelectedAddressId('new');
    setAddressForm(mapAddressToFormState());
    setAddressFormMessage(null);
    setAddressFormError(null);
  }, [customerId, mapAddressToFormState]);

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

  const loadShippingAddresses = useCallback(async () => {
    setIsAddressesLoading(true);
    setAddressesError(null);

    try {
      const addresses = await getShipToTableAddresses(customerId, 50);
      setShippingAddresses(addresses);
    } catch (error) {
      console.error('Failed to load shipping addresses', error);
      setAddressesError(language === 'he' ? 'לא הצלחנו לטעון כתובות משלוח.' : 'Unable to load shipping addresses.');
      setShippingAddresses([]);
    } finally {
      setIsAddressesLoading(false);
    }
  }, [customerId, language]);

  useEffect(() => {
    loadCustomerCredit();
  }, [loadCustomerCredit]);

  useEffect(() => {
    loadShippingAddresses();
  }, [loadShippingAddresses]);

  const loadCountries = useCallback(async () => {
    setCountriesLoading(true);
    setCountriesError(null);

    try {
      const data = await getCountries();
      setCountries(data);
    } catch (error) {
      console.error('Failed to load countries', error);
      setCountriesError(t('account.addressForm.countryError'));
      setCountries([]);
    } finally {
      setCountriesLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadCountries();
  }, [loadCountries]);

  useEffect(() => {
    if (!addressForm.country) return;
    const normalized = resolveCountryId(addressForm.country);
    if (!normalized || normalized === addressForm.country) return;
    setAddressForm((previous) => ({ ...previous, country: normalized }));
  }, [addressForm.country, resolveCountryId]);

  useEffect(() => {
    if (shippingAddresses.length > 0) {
      const preferred = shippingAddresses.find((address) => address.isDefault) ?? shippingAddresses[0];
      setSelectedAddressId(preferred.id);
      setAddressForm(mapAddressToFormState(preferred));
    } else {
      setSelectedAddressId('new');
      setAddressForm(mapAddressToFormState());
    }
  }, [mapAddressToFormState, shippingAddresses]);

  const creditValue = creditSummary ? formatCurrency(creditSummary.totalCredit) : t('account.creditLoading');
  const tierLabel = language === 'he' ? 'חבר זהב' : 'Gold member';
  const tierDescription =
    language === 'he' ? 'משלוח מועדף והטבות קבועות' : 'Priority shipping and member rewards';

  const nextDelivery = orders[0];
  const pickupOrder = orders.find((order) => order.status.en === 'Awaiting pickup');

  const addressItems: AddressItem[] = shippingAddresses.map((address, index) => {
    const detailsHe = formatAddressDetails(address, 'he');
    const detailsEn = formatAddressDetails(address, 'en');

    return {
      label: {
        he: address.isDefault ? 'כתובת ברירת מחדל' : `כתובת ${index + 1}`,
        en: address.isDefault ? 'Default address' : `Address ${index + 1}`,
      },
      details: { he: detailsHe, en: detailsEn },
      phone: address.callId || customerProfile.phone,
      primary: address.isDefault,
    };
  });

  const handleProfileInputChange =
    (field: keyof typeof profileForm) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setProfileForm((previous) => ({
        ...previous,
        [field]: event.target.value,
      }));
    };

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError(null);
    setProfileMessage(null);

    const firstName = profileForm.firstName.trim();
    const lastName = profileForm.lastName.trim();
    const preferredLanguage = profileForm.language === 'he' || profileForm.language === 'en' ? profileForm.language : null;

    if (!firstName || !lastName) {
      setProfileError(t('account.profile.nameRequired'));
      return;
    }

    setIsSavingProfile(true);

    try {
      const updatedAccount = await updateCustomerProfile(customerId, {
        firstName,
        lastName,
        email: profileForm.email.trim() || undefined,
        phone: profileForm.phone.trim() || undefined,
        fax: profileForm.fax.trim() || undefined,
        language: preferredLanguage,
      });

      setProfileAccount(updatedAccount);
      onAccountUpdate?.(updatedAccount);
      setProfileMessage(t('account.profile.success'));

      if (updatedAccount.language && updatedAccount.language !== language) {
        setLanguage(updatedAccount.language);
      }
    } catch (error) {
      console.error('Failed to save customer profile', error);
      const message = error instanceof Error ? error.message : t('account.profile.error');
      setProfileError(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAddressInputChange = (field: keyof CustomerShippingAddressInput) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const target = event.target as HTMLInputElement;
      const value = target.type === 'checkbox' ? target.checked : event.target.value;

      setAddressForm((previous) => ({
        ...previous,
        [field]: value as CustomerShippingAddressInput[keyof CustomerShippingAddressInput],
      }));
    };

  const handleSelectSavedAddress = (addressId: string) => {
    setSelectedAddressId(addressId);
    const address = shippingAddresses.find((item) => item.id === addressId);
    setAddressForm(mapAddressToFormState(address));
    setAddressFormMessage(null);
    setAddressFormError(null);
  };

  const handleSaveAddress = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingAddress(true);
    setAddressFormError(null);
    setAddressFormMessage(null);

    const normalizedCountry = addressForm.country?.trim() ?? '';
    const countryId = countries.some((country) => country.id === normalizedCountry) ? normalizedCountry : '';

    const payload: CustomerShippingAddressInput = {
      ...addressForm,
      street: addressForm.street.trim(),
      city: addressForm.city.trim(),
      country: countryId || undefined,
    };

    if (!payload.street || !payload.city) {
      setAddressFormError(language === 'he' ? 'יש למלא רחוב ועיר לפחות.' : 'Street and city are required.');
      setIsSavingAddress(false);
      return;
    }

    try {
      if (selectedAddressId === 'new') {
        await createCustomerShippingAddress(customerId, payload);
      } else {
        await updateCustomerShippingAddress(customerId, selectedAddressId, payload);
      }

      setAddressFormMessage(t('account.addressesSaved'));
      await loadShippingAddresses();
    } catch (error) {
      console.error('Failed to save address', error);
      setAddressFormError(t('account.addressesSaveError'));
    } finally {
      setIsSavingAddress(false);
    }
  };

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
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wide">{t('account.profile.title')}</p>
            <h2 className="text-xl font-semibold text-gray-900">{t('account.profile.title')}</h2>
            <p className="text-sm text-gray-600">{t('account.profile.description')}</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700" htmlFor="profile-first-name">
                {t('account.profile.firstName')}
              </label>
              <input
                id="profile-first-name"
                value={profileForm.firstName}
                onChange={handleProfileInputChange('firstName')}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700" htmlFor="profile-last-name">
                {t('account.profile.lastName')}
              </label>
              <input
                id="profile-last-name"
                value={profileForm.lastName}
                onChange={handleProfileInputChange('lastName')}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700" htmlFor="profile-email">
                {t('account.profile.email')}
              </label>
              <input
                id="profile-email"
                type="email"
                value={profileForm.email}
                onChange={handleProfileInputChange('email')}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700" htmlFor="profile-phone">
                {t('account.profile.phone')}
              </label>
              <input
                id="profile-phone"
                value={profileForm.phone}
                onChange={handleProfileInputChange('phone')}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700" htmlFor="profile-fax">
                {t('account.profile.fax')}
              </label>
              <input
                id="profile-fax"
                value={profileForm.fax}
                onChange={handleProfileInputChange('fax')}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700" htmlFor="profile-language">
                {t('account.profile.language')}
              </label>
              <select
                id="profile-language"
                value={profileForm.language || ''}
                onChange={handleProfileInputChange('language')}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">{t('account.profile.languagePlaceholder')}</option>
                <option value="he">{t('account.profile.languageHebrew')}</option>
                <option value="en">{t('account.profile.languageEnglish')}</option>
              </select>
            </div>
          </div>

          {profileError && (
            <p className="text-sm text-red-600" role="alert">
              {profileError}
            </p>
          )}
          {profileMessage && <p className="text-sm text-green-700">{profileMessage}</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-yellow-700 rounded-lg hover:bg-yellow-800 disabled:opacity-60"
            >
              {isSavingProfile ? t('account.profile.saving') : t('account.profile.save')}
            </button>
          </div>
        </form>
      </div>

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

            <TrackingWidget defaultTrackingNumber={orders[0]?.trackingNumber || ''} />
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4 lg:col-span-2">
          {isAddressesLoading && (
            <p className="text-sm text-gray-500">{t('account.addressesLoading')}</p>
          )}
          {addressesError && <p className="text-sm text-red-600">{addressesError}</p>}
          {addressItems.map((address) => (
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
          {!isAddressesLoading && !addressItems.length && (
            <p className="text-sm text-gray-600">{t('account.addressesEmpty')}</p>
          )}
        </div>

        <form
          onSubmit={handleSaveAddress}
          className="space-y-3 bg-gray-50 border border-gray-200 rounded-lg p-4 self-start"
        >
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-900">{t('account.addressForm.title')}</p>
            <p className="text-xs text-gray-600">{t('account.addressForm.description')}</p>
          </div>

          {shippingAddresses.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700" htmlFor="select-address">
                {t('account.addressForm.selectLabel')}
              </label>
              <select
                id="select-address"
                value={selectedAddressId}
                onChange={(event) => handleSelectSavedAddress(event.target.value)}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="new">{t('account.addressForm.newAddress')}</option>
                {shippingAddresses.map((address) => (
                  <option key={address.id} value={address.id}>
                    {formatAddressDetails(address, language)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700" htmlFor="address-street">
                {t('account.addressForm.street')}
              </label>
              <input
                id="address-street"
                value={addressForm.street}
                onChange={handleAddressInputChange('street')}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700" htmlFor="address-number">
                {t('account.addressForm.houseNumber')}
              </label>
              <input
                id="address-number"
                value={addressForm.houseNumber || ''}
                onChange={handleAddressInputChange('houseNumber')}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700" htmlFor="address-entrance">
                {t('account.addressForm.entrance')}
              </label>
              <input
                id="address-entrance"
                value={addressForm.entrance || ''}
                onChange={handleAddressInputChange('entrance')}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700" htmlFor="address-apartment">
                {t('account.addressForm.apartment')}
              </label>
              <input
                id="address-apartment"
                value={addressForm.apartment || ''}
                onChange={handleAddressInputChange('apartment')}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700" htmlFor="address-city">
                {t('account.addressForm.city')}
              </label>
              <input
                id="address-city"
                value={addressForm.city}
                onChange={handleAddressInputChange('city')}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700" htmlFor="address-state">
                {t('account.addressForm.state')}
              </label>
              <input
                id="address-state"
                value={addressForm.state || ''}
                onChange={handleAddressInputChange('state')}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700" htmlFor="address-zip">
                {t('account.addressForm.zip')}
              </label>
              <input
                id="address-zip"
                value={addressForm.zip || ''}
                onChange={handleAddressInputChange('zip')}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700" htmlFor="address-country">
                {t('account.addressForm.country')}
              </label>
              <select
                id="address-country"
                value={addressForm.country || ''}
                onChange={handleAddressInputChange('country')}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                disabled={countriesLoading || countries.length === 0}
              >
                <option value="">{t('account.addressForm.countryPlaceholder')}</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </select>
              {countriesLoading && (
                <p className="text-xs text-gray-500">{t('account.addressForm.countryLoading')}</p>
              )}
              {countriesError && <p className="text-xs text-red-600">{countriesError}</p>}
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={Boolean(addressForm.isDefault)}
              onChange={handleAddressInputChange('isDefault')}
              className="rounded border-gray-300 text-yellow-700 focus:ring-yellow-500"
            />
            {t('account.addressForm.default')}
          </label>

          {addressFormError && (
            <p className="text-sm text-red-600" role="alert">
              {addressFormError}
            </p>
          )}
          {addressFormMessage && <p className="text-sm text-green-700">{addressFormMessage}</p>}

          <button
            type="submit"
            disabled={isSavingAddress}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-yellow-700 rounded-lg hover:bg-yellow-800 disabled:opacity-60"
          >
            {isSavingAddress ? t('account.addressForm.saving') : t('account.addressForm.save')}
          </button>
          <p className="text-xs text-gray-500">{t('account.addressForm.requiredHint')}</p>
        </form>
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
