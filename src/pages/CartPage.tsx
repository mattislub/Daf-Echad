import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CreditCard,
  Globe2,
  LogIn,
  Mail,
  MapPin,
  Package,
  ShieldCheck,
  Sparkles,
  Trash2,
  Truck,
  User,
  Phone,
  Wallet,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { API_BASE_URL, buildApiUrl } from '../services/api';

interface CartPageProps {
  onNavigate?: (page: string) => void;
}

interface ShippingOption {
  id: string;
  label: { he: string; en: string };
  description: { he: string; en: string };
  location: { he: string; en: string };
  method: { he: string; en: string };
  weightRange: string;
  eta: { he: string; en: string };
  priceILS: number;
  priceUSD: number;
  worldwide?: boolean;
}

interface Country {
  id: string;
  name: string;
}

interface Carrier {
  id: string;
  name: string;
  contact: string;
  telno: string;
  email: string;
  notes: string;
}

export default function CartPage({ onNavigate }: CartPageProps) {
  const { cartItems, updateQuantity, removeFromCart, getTotalPrice } = useCart();
  const { language, currency, t } = useLanguage();

  const [selectedShipping, setSelectedShipping] = useState<string>('israel-standard');
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [countryLoading, setCountryLoading] = useState(false);
  const [countryError, setCountryError] = useState<string | null>(null);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState('');
  const [carrierLoading, setCarrierLoading] = useState(false);
  const [carrierError, setCarrierError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);
  const [sendingOrder, setSendingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentRedirecting, setPaymentRedirecting] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerDetailsError, setCustomerDetailsError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [paymentStatusBanner, setPaymentStatusBanner] = useState<
    | { status: 'success' | 'cancel' | 'error'; orderId?: string | null }
    | null
  >(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('paymentStatus') as 'success' | 'cancel' | 'error' | null;
    const orderId = params.get('orderId');

    if (paymentStatus) {
      setPaymentStatusBanner({ status: paymentStatus, orderId });

      params.delete('paymentStatus');
      params.delete('orderId');

      const newQuery = params.toString();
      const newUrl = `${window.location.pathname}${newQuery ? `?${newQuery}` : ''}${window.location.hash}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  const loadCountries = useCallback(async () => {
    setCountryLoading(true);
    setCountryError(null);

    try {
      const response = await fetch(buildApiUrl('/countries'));

      if (!response.ok) {
        throw new Error('Failed to fetch countries');
      }

      const data: Country[] = await response.json();
      setCountries(data);

      if (data.length > 0) {
        const hasExistingSelection = data.some((country) => country.id === selectedCountry);
        setSelectedCountry(hasExistingSelection ? selectedCountry : data[0].id);
      } else {
        setSelectedCountry('');
      }
    } catch (error) {
      console.error('Failed to load countries', error);
      setCountryError(t('cart.shipping.country.error'));
    } finally {
      setCountryLoading(false);
    }
  }, [selectedCountry, t]);

  useEffect(() => {
    void loadCountries();
  }, [loadCountries]);

  const loadCarriers = useCallback(async () => {
    setCarrierLoading(true);
    setCarrierError(null);

    try {
      const response = await fetch(buildApiUrl('/carriers'));

      if (!response.ok) {
        throw new Error('Failed to fetch carriers');
      }

      const data: Carrier[] = await response.json();
      setCarriers(data);

      if (data.length > 0) {
        const hasExistingSelection = data.some((carrier) => carrier.id === selectedCarrier);
        setSelectedCarrier(hasExistingSelection ? selectedCarrier : data[0].id);
      } else {
        setSelectedCarrier('');
      }
    } catch (error) {
      console.error('Failed to load carriers', error);
      setCarrierError(t('cart.shipping.carrier.error'));
    } finally {
      setCarrierLoading(false);
    }
  }, [selectedCarrier, t]);

  useEffect(() => {
    void loadCarriers();
  }, [loadCarriers]);

  const shippingOptions: ShippingOption[] = useMemo(
    () => [
      {
        id: 'pickup',
        label: {
          he: 'איסוף עצמי + מזומן',
          en: 'Pickup point + cash ready',
        },
        description: {
          he: 'איסוף מהמרכז הירושלמי ותשלום במזומן אפשרי במקום.',
          en: 'Collect from our Jerusalem desk; cash payments accepted on site.',
        },
        location: { he: 'ירושלים', en: 'Jerusalem pickup desk' },
        method: { he: 'איסוף עצמי', en: 'Local pickup' },
        weightRange: '0-20kg',
        eta: { he: 'זמין לאיסוף בתיאום מראש', en: 'Ready for pickup with prior coordination' },
        priceILS: 0,
        priceUSD: 0,
      },
      {
        id: 'israel-standard',
        label: {
          he: 'שליח עד הבית - מרכז',
          en: 'Courier delivery - Israel (center)',
        },
        description: {
          he: 'משלוח לפי כתובת ואזור עם תמחור לפי משקל.',
          en: 'Door delivery priced by address zone and shipment weight.',
        },
        location: { he: 'גוש דן והשרון', en: 'Central Israel' },
        method: { he: 'שליח עד הבית', en: 'Standard courier' },
        weightRange: '0-5kg',
        eta: { he: '1-3 ימי עסקים', en: '1-3 business days' },
        priceILS: 25,
        priceUSD: 7,
      },
      {
        id: 'israel-express',
        label: {
          he: 'משלוח מהיר - לפי משקל',
          en: 'Express dispatch - weight based',
        },
        description: {
          he: 'חלוקה מהירה עם תוספת מחיר עבור משקל וגישה.',
          en: 'Faster handoff with pricing by delivery type and weight.',
        },
        location: { he: 'כל רחבי הארץ', en: 'Nationwide Israel' },
        method: { he: 'שליח מהיר / נקודת חלוקה', en: 'Fast courier / pickup spot' },
        weightRange: '5-15kg',
        eta: { he: 'מהיום להיום או עד יום עסקים אחד', en: 'Same-day or next business day' },
        priceILS: 55,
        priceUSD: 15,
      },
      {
        id: 'world-economy',
        label: {
          he: 'משלוח בינלאומי חסכוני',
          en: 'Economy worldwide shipping',
        },
        description: {
          he: 'משלוח בינלאומי לפי מדינה ואפשרות מסירה.',
          en: 'International delivery with location and service-based pricing.',
        },
        location: { he: 'אירופה / צפון אמריקה', en: 'Europe / North America' },
        method: { he: 'דואר אוויר / שליח', en: 'Air mail or courier handoff' },
        weightRange: '0-2kg',
        eta: { he: '7-14 ימי עסקים', en: '7-14 business days' },
        priceILS: 110,
        priceUSD: 30,
        worldwide: true,
      },
      {
        id: 'world-express',
        label: {
          he: 'משלוח בינלאומי מהיר',
          en: 'Express worldwide delivery',
        },
        description: {
          he: 'מסירה מהירה לכל העולם עם מעקב מלא.',
          en: 'Priority courier to worldwide destinations with full tracking.',
        },
        location: { he: 'כל העולם', en: 'Global destinations' },
        method: { he: 'שליח עד הבית', en: 'Door-to-door courier' },
        weightRange: '0-10kg',
        eta: { he: '3-7 ימי עסקים', en: '3-7 business days' },
        priceILS: 180,
        priceUSD: 49,
        worldwide: true,
      },
    ],
    [],
  );

  const steps = useMemo(
    () => [
      {
        key: 'items',
        title: t('cart.items'),
        description: t('cart.subtitle'),
        icon: Package,
      },
      {
        key: 'shipping',
        title: t('cart.shipping.title'),
        description: t('cart.shipping.description'),
        icon: Truck,
      },
      {
        key: 'details',
        title: t('cart.customer.title'),
        description: t('cart.customer.subtitle'),
        icon: User,
      },
      {
        key: 'payment',
        title: t('cart.payment.title'),
        description: t('cart.checkout.tip'),
        icon: CreditCard,
      },
    ],
    [t],
  );

  const selectedShippingOption = shippingOptions.find((option) => option.id === selectedShipping) || shippingOptions[0];
  const goToStep = (stepIndex: number) => {
    const clampedIndex = Math.min(Math.max(stepIndex, 0), steps.length - 1);
    setCurrentStep(clampedIndex);
  };

  const goToNextStep = () => goToStep(currentStep + 1);
  const goToPreviousStep = () => goToStep(currentStep - 1);
  const selectedCountryName = useMemo(
    () => countries.find((country) => country.id === selectedCountry)?.name || '',
    [countries, selectedCountry],
  );
  const selectedCarrierDetails = useMemo(
    () => carriers.find((carrier) => carrier.id === selectedCarrier),
    [carriers, selectedCarrier],
  );
  const selectedCarrierName = selectedCarrierDetails?.name ?? '';
  const carrierDetails = useMemo(
    () =>
      selectedCarrierDetails
        ? [
            selectedCarrierDetails.contact
              ? `${t('cart.shipping.carrier.contact')}: ${selectedCarrierDetails.contact}`
              : '',
            selectedCarrierDetails.telno
              ? `${t('cart.shipping.carrier.phone')}: ${selectedCarrierDetails.telno}`
              : '',
            selectedCarrierDetails.email
              ? `${t('cart.shipping.carrier.email')}: ${selectedCarrierDetails.email}`
              : '',
            selectedCarrierDetails.notes
              ? `${t('cart.shipping.carrier.notes')}: ${selectedCarrierDetails.notes}`
              : '',
          ].filter(Boolean)
        : [],
    [selectedCarrierDetails, t],
  );
  const carrierDetailsLine = carrierDetails.join(' | ');
  const carrierSummary = selectedCarrierName || t('cart.shipping.carrier.unknown');

  const itemsTotal = getTotalPrice(currency);
  const shippingCost = currency === 'ILS' ? selectedShippingOption.priceILS : selectedShippingOption.priceUSD;
  const orderTotal = itemsTotal + shippingCost;

  const totalWeightGrams = useMemo(
    () => cartItems.reduce((sum, item) => sum + (item.weight ?? 0) * item.quantity, 0),
    [cartItems],
  );

  const formatPrice = (value: number) => {
    const symbol = currency === 'ILS' ? '₪' : '$';
    return `${symbol}${value.toFixed(2)}`;
  };

  const formatWeight = (grams?: number | null) => {
    if (!grams || grams <= 0) return t('cart.weight.unknown');
    return `${(grams / 1000).toFixed(3)} ${t('cart.weight.kg')}`;
  };

  const sendOrderEmail = async (orderId: string) => {
    const storeEmail = import.meta.env.VITE_STORE_EMAIL || 'dafechadout@gmail.com';
    const storeLogoUrl = 'https://dafechad.com/logo.png';

    const subject = language === 'he' ? 'אישור קבלת הזמנה חדשה' : 'New Daf Echad order received';
    const thankYouLine = language === 'he' ? 'תודה שהזמנתם מדף אחד!' : 'Thank you for ordering from Daf Echad!';
    const introLine =
      language === 'he'
        ? 'קיבלנו את ההזמנה שלכם וניצור קשר לאישור המשלוח והחיוב.'
        : 'We received your order and will confirm delivery and payment soon.';
    const orderIdLine =
      language === 'he'
        ? `מספר הזמנה: ${orderId}`
        : `Order ID: ${orderId}`;

    const shippingDescription = `${selectedShippingOption.label[language]} - ${selectedShippingOption.method[language]}`;
    const paymentDescription = paymentMethod === 'card' ? t('cart.payment.card') : t('cart.payment.cash');
    const weightSummary =
      totalWeightGrams > 0 ? formatWeight(totalWeightGrams) : t('cart.weight.missingSummary');

    const itemLines = cartItems
      .map((item, index) => {
        const title = language === 'he' ? item.title_he : item.title_en;
        const lineTotal = formatPrice(
          (currency === 'ILS' ? item.price_ils : item.price_usd) * item.quantity,
        );
        return `${index + 1}. ${title} × ${item.quantity} – ${lineTotal}`;
      })
      .join('\n');

    const textBody = [
      thankYouLine,
      introLine,
      orderIdLine,
      '',
      language === 'he' ? 'סיכום הזמנה:' : 'Order summary:',
      itemLines,
      '',
      `${language === 'he' ? 'משלוח' : 'Shipping'}: ${shippingDescription}`,
      `${t('cart.shipping.country.summary')}: ${selectedCountryName || t('cart.shipping.country.unknown')}`,
      `${t('cart.shipping.carrier.summary')}: ${carrierSummary}${carrierDetailsLine ? ` (${carrierDetailsLine})` : ''}`,
      `${t('cart.customer.name')}: ${customerName}`,
      `${t('cart.customer.phone')}: ${customerPhone}`,
      `${t('cart.customer.email')}: ${customerEmail}`,
      `${t('cart.customer.address')}: ${customerAddress}`,
      `${language === 'he' ? 'תשלום' : 'Payment'}: ${paymentDescription}`,
      `${language === 'he' ? 'סה"כ' : 'Total'}: ${formatPrice(orderTotal)}`,
      `${language === 'he' ? 'משקל משוער' : 'Estimated weight'}: ${weightSummary}`,
    ]
      .filter(Boolean)
      .join('\n');

    const htmlItems = cartItems
      .map((item) => {
        const title = language === 'he' ? item.title_he : item.title_en;
        const lineTotal = formatPrice(
          (currency === 'ILS' ? item.price_ils : item.price_usd) * item.quantity,
        );
        const itemWeight = item.weight
          ? formatWeight((item.weight ?? 0) * item.quantity)
          : t('cart.weight.unknown');
        return `<li style="margin-bottom:8px;"><strong>${title}</strong> × ${item.quantity} - ${lineTotal}<br /><span style="color:#4a5568; font-size:12px;">${t('cart.weight.totalItem')}: ${itemWeight}</span></li>`;
      })
      .join('');

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; color: #1a202c; background: #f7fafc; padding: 24px;">
        <div style="background: #ffffff; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
          <div style="text-align: center; margin-bottom: 16px;">
            <img src="${storeLogoUrl}" alt="${language === 'he' ? 'דף אחד' : 'Daf Echad'}" style="height: 72px; margin-bottom: 12px;" />
            <h2 style="margin: 0; color: #b7791f;">${thankYouLine}</h2>
            <p style="margin: 4px 0 0; color: #4a5568;">${introLine}</p>
          </div>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px;">
            <h3 style="margin: 0 0 8px;">${language === 'he' ? 'סיכום הזמנה' : 'Order summary'}</h3>
            <p style="margin: 6px 0; color:#4a5568;"><strong>${
              language === 'he' ? 'מספר הזמנה:' : 'Order ID:'
            }</strong> ${orderId}</p>
            <ul style="padding-left: 18px; margin: 0 0 12px; line-height: 1.6;">${htmlItems}</ul>
            <p style="margin: 6px 0;"><strong>${language === 'he' ? 'משלוח:' : 'Shipping:'}</strong> ${shippingDescription}</p>
            <p style="margin: 6px 0;"><strong>${t('cart.shipping.country.summary')}:</strong> ${
              selectedCountryName || t('cart.shipping.country.unknown')
            }</p>
            <p style="margin: 6px 0;"><strong>${t('cart.shipping.carrier.summary')}:</strong> ${carrierSummary}${
      carrierDetailsLine ? `<br /><span style="color:#4a5568; font-size:12px;">${carrierDetailsLine}</span>` : ''
    }</p>
            <p style="margin: 6px 0;"><strong>${t('cart.customer.name')}:</strong> ${customerName}</p>
            <p style="margin: 6px 0;"><strong>${t('cart.customer.phone')}:</strong> ${customerPhone}</p>
            <p style="margin: 6px 0;"><strong>${t('cart.customer.email')}:</strong> ${customerEmail}</p>
            <p style="margin: 6px 0;"><strong>${t('cart.customer.address')}:</strong> ${customerAddress}</p>
            <p style="margin: 6px 0;"><strong>${language === 'he' ? 'תשלום:' : 'Payment:'}</strong> ${paymentDescription}</p>
            <p style="margin: 6px 0;"><strong>${language === 'he' ? 'סה"כ להזמנה:' : 'Order total:'}</strong> ${formatPrice(orderTotal)}</p>
            <p style="margin: 6px 0;"><strong>${language === 'he' ? 'משקל משוער:' : 'Estimated weight:'}</strong> ${weightSummary}</p>
          </div>
          <div style="margin-top: 16px; background: #fffbeb; border-radius: 10px; padding: 12px; color: #744210;">
            ${language === 'he' ? 'תודה שבחרתם בדף אחד! נשוב אליכם לאישור סופי של המשלוח והתשלום.' : 'Thank you for choosing Daf Echad! We will follow up to finalize delivery and payment details.'}
          </div>
        </div>
      </div>
    `;

    const response = await fetch(buildApiUrl('/email/send'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: storeEmail, subject, text: textBody, html: htmlBody }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'Failed to send order email');
    }
  };

  const buildReturnUrl = (status: 'success' | 'cancel' | 'error', orderId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('paymentStatus', status);
    url.searchParams.set('orderId', orderId);
    url.hash = '#/cart';

    return url.toString();
  };

  const startZCreditCheckout = async ({ orderId, description }: { orderId: string; description: string }) => {
    const itemsTotalILS = getTotalPrice('ILS');
    const orderTotalILS = itemsTotalILS + selectedShippingOption.priceILS;

    if (!Number.isFinite(orderTotalILS) || orderTotalILS <= 0) {
      setPaymentError(t('cart.checkout.paymentError'));
      return;
    }

    setPaymentError(null);
    setPaymentRedirecting(true);

    try {
      const response = await fetch(buildApiUrl('/zcredit/create-checkout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: orderTotalILS,
          description,
          orderId,
          installments: 1,
          customerEmail,
          customerName,
          customerPhone,
          successUrl: buildReturnUrl('success', orderId),
          cancelUrl: buildReturnUrl('cancel', orderId),
          callbackUrl: buildReturnUrl('error', orderId),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to start payment');
      }

      const data = (await response.json()) as { checkoutUrl?: string };

      if (!data.checkoutUrl) {
        throw new Error('Missing checkout URL');
      }

      window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error('ZCredit checkout error', error);
      setPaymentError(t('cart.checkout.paymentError'));
    } finally {
      setPaymentRedirecting(false);
    }
  };

  const handleCheckout = async (methodOverride?: 'card' | 'cash') => {
    const method = methodOverride ?? paymentMethod;

    if (!termsAccepted) {
      setShowTermsError(true);
      setShowConfirmation(false);
      setPaymentMethod(method);
      return;
    }

    if (method === 'card') {
      const trimmedName = customerName.trim();
      const trimmedEmail = customerEmail.trim();
      const isValidEmail = /.+@.+\..+/.test(trimmedEmail);

      if (!trimmedName || !trimmedEmail || !isValidEmail) {
        setPaymentError(t('cart.checkout.customerRequired'));
        setPaymentMethod(method);
        setSendingOrder(false);
        return;
      }
    }

    if (!customerName.trim() || !customerPhone.trim() || !customerEmail.trim() || !customerAddress.trim()) {
      setCustomerDetailsError(t('cart.customer.required'));
      setShowConfirmation(false);
      return;
    }

    setCustomerDetailsError(null);

    setPaymentMethod(method);
    setSendingOrder(true);
    setShowConfirmation(false);
    setOrderError(null);
    setPaymentError(null);

    const orderId = `ORD-${Date.now()}`;
    const shippingSummary = `${selectedShippingOption.label[language]} · ${selectedShippingOption.method[language]} · ${selectedCountryName || t('cart.shipping.country.unknown')}`;

    try {
      await sendOrderEmail(orderId);
      setShowConfirmation(true);

      if (method === 'card') {
        await startZCreditCheckout({ orderId, description: shippingSummary });
      }
    } catch (error) {
      console.error('Order email failed', error);
      setOrderError(
        language === 'he'
          ? 'שליחת המייל נכשלה. בבקשה נסו שוב.'
          : 'Could not send the order email. Please try again.',
      );
    } finally {
      setSendingOrder(false);
    }
  };

  const isRTL = language === 'he';
  const stepProgressText = isRTL
    ? `שלב ${currentStep + 1} מתוך ${steps.length}`
    : `Step ${currentStep + 1} of ${steps.length}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-yellow-50/40" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header onNavigate={onNavigate} />

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-3 mb-8">
          <p className="text-sm text-yellow-700 font-semibold">{t('cart.delivery.worldwide')}</p>
          <h1 className="text-3xl font-bold text-gray-900">{t('cart.title')}</h1>
          <p className="text-gray-600">{t('cart.subtitle')}</p>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border border-yellow-100 bg-white/70 px-4 py-3 shadow-sm">
              <Truck className="w-5 h-5 text-yellow-700" />
              <div>
                <p className="text-sm font-semibold text-gray-900">{t('cart.delivery.multi')}</p>
                <p className="text-xs text-gray-600">{t('cart.shipping.description')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-yellow-100 bg-white/70 px-4 py-3 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-yellow-700" />
              <div>
                <p className="text-sm font-semibold text-gray-900">{t('cart.checkout.secure')}</p>
                <p className="text-xs text-gray-600">{t('cart.order.note')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-yellow-100 bg-white/70 px-4 py-3 shadow-sm">
              <Sparkles className="w-5 h-5 text-yellow-700" />
              <div>
                <p className="text-sm font-semibold text-gray-900">{t('cart.checkout.tip')}</p>
                <p className="text-xs text-gray-600">{t('cart.checkout.cardCtaDescription')}</p>
              </div>
            </div>
          </div>
        </div>

        {paymentStatusBanner && (
          <div
            className={`mb-6 rounded-xl border p-4 text-sm shadow-sm ${
              paymentStatusBanner.status === 'success'
                ? 'border-green-200 bg-green-50 text-green-800'
                : paymentStatusBanner.status === 'cancel'
                  ? 'border-yellow-200 bg-yellow-50 text-yellow-800'
                  : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            <p className="font-semibold">
              {paymentStatusBanner.status === 'success'
                ? t('cart.checkout.status.success')
                : paymentStatusBanner.status === 'cancel'
                  ? t('cart.checkout.status.cancel')
                  : t('cart.checkout.status.error')}
            </p>
            {paymentStatusBanner.orderId && (
              <p className="mt-1 opacity-80">
                {language === 'he' ? 'מספר הזמנה:' : 'Order ID:'} {paymentStatusBanner.orderId}
              </p>
            )}
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center shadow-sm">
            <p className="text-gray-600 mb-4">{t('cart.empty')}</p>
            <button
              onClick={() => onNavigate?.('catalog')}
              className="inline-flex items-center justify-center px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              {t('cart.continue')}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === index;
                const isComplete = currentStep > index;

                return (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => goToStep(index)}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left shadow-sm transition ${
                      isActive
                        ? 'border-yellow-600 bg-yellow-50 ring-2 ring-yellow-100'
                        : 'border-gray-200 bg-white hover:border-yellow-500'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        isActive
                          ? 'bg-yellow-600 text-white'
                          : isComplete
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                      <p className="text-xs text-gray-600">{step.description}</p>
                    </div>
                    {isComplete && <span className="text-lg font-semibold text-green-600">✓</span>}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {currentStep === 0 && (
                  <div className="bg-white/90 backdrop-blur border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-500 uppercase tracking-wide">{t('cart.delivery.multi')}</p>
                        <h2 className="text-xl font-semibold text-gray-900">{t('cart.items')}</h2>
                      </div>
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-semibold text-gray-700">
                      {cartItems.length}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border border-gray-100 rounded-lg p-4"
                      >
                        <div className="flex items-start gap-4 flex-1">
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt={language === 'he' ? item.title_he : item.title_en}
                              className="w-20 h-24 object-cover rounded-md border"
                            />
                          )}
                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {language === 'he' ? item.title_he : item.title_en}
                            </h3>
                            <p className="text-yellow-700 font-bold">{formatPrice(currency === 'ILS' ? item.price_ils : item.price_usd)}</p>
                            <p className="text-sm text-gray-600">
                              {t('cart.weight.perUnit')}: {formatWeight(item.weight)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {t('cart.weight.totalItem')}: {formatWeight((item.weight ?? 0) * item.quantity)}
                            </p>
                            <div className="flex items-center gap-3">
                              <label className="text-sm text-gray-600">{t('cart.quantity')}</label>
                              <div className="flex items-center border rounded-lg">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="px-3 py-1 text-lg font-bold hover:bg-gray-100"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  max={99}
                                  value={item.quantity}
                                  onChange={(e) => updateQuantity(item.id, Math.max(1, Number(e.target.value) || 1))}
                                  className="w-16 text-center border-x py-1"
                                />
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="px-3 py-1 text-lg font-bold hover:bg-gray-100"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          <Trash2 className="w-4 h-4" />
                          {t('cart.remove')}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="bg-white/90 backdrop-blur border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-yellow-700" />
                    <div>
                      <p className="text-sm text-gray-500 uppercase tracking-wide">{t('cart.shipping.worldwide')}</p>
                      <h2 className="text-xl font-semibold text-gray-900">{t('cart.shipping.title')}</h2>
                    </div>
                  </div>
                  <p className="text-gray-600">{t('cart.shipping.description')}</p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="country-select" className="text-sm font-semibold text-gray-900">
                        {t('cart.shipping.country')}
                      </label>
                      {countryLoading && (
                        <span className="text-xs text-gray-500">{t('cart.shipping.country.loading')}</span>
                      )}
                    </div>

                    {countryError ? (
                      <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        <span>{countryError}</span>
                        <button
                          type="button"
                          onClick={() => void loadCountries()}
                          className="font-semibold hover:underline"
                        >
                          {t('cart.shipping.country.retry')}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <select
                          id="country-select"
                          value={selectedCountry}
                          onChange={(event) => setSelectedCountry(event.target.value)}
                          disabled={countryLoading || countries.length === 0}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-200 disabled:bg-gray-50"
                        >
                          <option value="" disabled>
                            {t('cart.shipping.country.placeholder')}
                          </option>
                          {countries.map((country) => (
                            <option key={country.id} value={country.id}>
                              {country.name}
                            </option>
                          ))}
                        </select>

                        {!countryLoading && countries.length === 0 && (
                          <p className="text-sm text-gray-500">{t('cart.shipping.country.empty')}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="carrier-select" className="text-sm font-semibold text-gray-900">
                        {t('cart.shipping.carrier')}
                      </label>
                      {carrierLoading && (
                        <span className="text-xs text-gray-500">{t('cart.shipping.carrier.loading')}</span>
                      )}
                    </div>

                    {carrierError ? (
                      <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        <span>{carrierError}</span>
                        <button
                          type="button"
                          onClick={() => void loadCarriers()}
                          className="font-semibold hover:underline"
                        >
                          {t('cart.shipping.carrier.retry')}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <select
                          id="carrier-select"
                          value={selectedCarrier}
                          onChange={(event) => setSelectedCarrier(event.target.value)}
                          disabled={carrierLoading || carriers.length === 0}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-200 disabled:bg-gray-50"
                        >
                          <option value="" disabled>
                            {t('cart.shipping.carrier.placeholder')}
                          </option>
                          {carriers.map((carrier) => (
                            <option key={carrier.id} value={carrier.id}>
                              {carrier.name}
                            </option>
                          ))}
                        </select>

                        {!carrierLoading && carriers.length === 0 && (
                          <p className="text-sm text-gray-500">{t('cart.shipping.carrier.empty')}</p>
                        )}

                        {selectedCarrierDetails && (
                          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 space-y-1">
                            <p className="font-semibold text-gray-900">{selectedCarrierDetails.name}</p>
                            {carrierDetails.map((detail) => (
                              <p key={detail}>{detail}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {shippingOptions.map((option) => (
                      <label
                        key={option.id}
                        className={`relative border rounded-lg p-4 cursor-pointer transition shadow-sm hover:border-yellow-600 ${
                          selectedShipping === option.id ? 'border-yellow-600 ring-2 ring-yellow-100' : 'border-gray-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="shipping-option"
                          value={option.id}
                          checked={selectedShipping === option.id}
                          onChange={() => setSelectedShipping(option.id)}
                          className="absolute opacity-0"
                        />
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-gray-100">
                            {option.worldwide ? <Globe2 className="w-5 h-5 text-yellow-700" /> : <Package className="w-5 h-5 text-yellow-700" />}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900">{option.label[language]}</h3>
                              {option.worldwide && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700">
                                  {t('cart.shipping.worldwide')}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{option.description[language]}</p>
                            <div className="text-sm text-gray-700 flex flex-col gap-1">
                              <span>{option.location[language]}</span>
                              <span>{option.method[language]}</span>
                              <span>
                                {t('cart.shipping.weight')}: {option.weightRange}
                              </span>
                              <span>
                                {t('cart.shipping.eta')}: {option.eta[language]}
                              </span>
                              <span className="font-semibold text-yellow-700">
                                {formatPrice(currency === 'ILS' ? option.priceILS : option.priceUSD)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="bg-white/90 backdrop-blur border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-yellow-700" />
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{t('cart.customer.title')}</h2>
                      <p className="text-sm text-gray-600">{t('cart.customer.subtitle')}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800">
                    <LogIn className="w-4 h-4 text-yellow-700" />
                    <span className="font-semibold">{t('cart.customer.loginPrompt')}</span>
                    <button
                      type="button"
                      onClick={() => onNavigate?.('login')}
                      className="inline-flex items-center gap-2 rounded-md bg-yellow-600 px-3 py-1.5 text-white font-semibold shadow hover:bg-yellow-700 transition"
                    >
                      {t('cart.customer.loginButton')}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-gray-600">{t('cart.customer.orGuest')}</span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <label htmlFor="customer-name" className="text-sm font-semibold text-gray-900">
                        {t('cart.customer.name')}
                      </label>
                      <div className="relative">
                        <input
                          id="customer-name"
                          type="text"
                          value={customerName}
                          onChange={(event) => setCustomerName(event.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-200"
                          placeholder={t('cart.customer.namePlaceholder')}
                        />
                        <User className="w-4 h-4 text-gray-400 absolute top-3 right-3" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="customer-phone" className="text-sm font-semibold text-gray-900">
                        {t('cart.customer.phone')}
                      </label>
                      <div className="relative">
                        <input
                          id="customer-phone"
                          type="tel"
                          value={customerPhone}
                          onChange={(event) => setCustomerPhone(event.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-200"
                          placeholder={t('cart.customer.phonePlaceholder')}
                        />
                        <Phone className="w-4 h-4 text-gray-400 absolute top-3 right-3" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="customer-email" className="text-sm font-semibold text-gray-900">
                        {t('cart.customer.email')}
                      </label>
                      <div className="relative">
                        <input
                          id="customer-email"
                          type="email"
                          value={customerEmail}
                          onChange={(event) => setCustomerEmail(event.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-200"
                          placeholder={t('cart.customer.emailPlaceholder')}
                        />
                        <Mail className="w-4 h-4 text-gray-400 absolute top-3 right-3" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="customer-address" className="text-sm font-semibold text-gray-900">
                        {t('cart.customer.address')}
                      </label>
                      <div className="relative">
                        <textarea
                          id="customer-address"
                          value={customerAddress}
                          onChange={(event) => setCustomerAddress(event.target.value)}
                          rows={3}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-200"
                          placeholder={t('cart.customer.addressPlaceholder')}
                        />
                        <MapPin className="w-4 h-4 text-gray-400 absolute top-3 right-3" />
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600">{t('cart.customer.helper')}</p>
                  {customerDetailsError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {customerDetailsError}
                    </div>
                  )}
                </div>
              )}

              {currentStep === 3 && (
                <div className="bg-white/90 backdrop-blur border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-yellow-700" />
                    <h2 className="text-xl font-semibold text-gray-900">{t('cart.payment.title')}</h2>
                  </div>
                  <div className="space-y-3">
                  <label
                    className={`flex items-start gap-3 border rounded-lg p-4 cursor-pointer ${
                      paymentMethod === 'card' ? 'border-yellow-600 ring-2 ring-yellow-100' : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                      className="mt-1"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-yellow-700" />
                        <p className="font-semibold text-gray-900">{t('cart.payment.card')}</p>
                      </div>
                      <p className="text-sm text-gray-600">{t('cart.payment.card.note')}</p>
                      <p className="text-xs text-gray-500">{t('cart.order.note')}</p>
                      <div className="mt-3 flex flex-wrap gap-3 items-center">
                        <button
                          type="button"
                          onClick={() => void handleCheckout('card')}
                          disabled={sendingOrder || paymentRedirecting}
                          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-yellow-700 to-yellow-600 px-4 py-2 text-sm font-semibold text-white shadow hover:from-yellow-600 hover:to-yellow-500 transition disabled:opacity-70"
                        >
                          {t('cart.checkout.cardCta')}
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <p className="text-xs text-gray-500">{t('cart.checkout.cardHelper')}</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

              <div className="bg-white/90 backdrop-blur border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-yellow-700" />
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide">{t('cart.customer.title')}</p>
                    <h2 className="text-xl font-semibold text-gray-900">{t('cart.customer.description')}</h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="customer-name" className="text-sm font-semibold text-gray-900">
                      {t('cart.customer.name')}
                    </label>
                    <input
                      id="customer-name"
                      type="text"
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                      placeholder={t('cart.customer.namePlaceholder')}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="customer-email" className="text-sm font-semibold text-gray-900">
                      {t('cart.customer.email')}
                    </label>
                    <input
                      id="customer-email"
                      type="email"
                      value={customerEmail}
                      onChange={(event) => setCustomerEmail(event.target.value)}
                      placeholder={t('cart.customer.emailPlaceholder')}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-200"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label htmlFor="customer-phone" className="text-sm font-semibold text-gray-900">
                      {t('cart.customer.phone')}
                    </label>
                    <input
                      id="customer-phone"
                      type="tel"
                      value={customerPhone}
                      onChange={(event) => setCustomerPhone(event.target.value)}
                      placeholder={t('cart.customer.phonePlaceholder')}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-200"
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-600">{t('cart.customer.note')}</p>
              </div>

              <div className="bg-white/90 backdrop-blur border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-yellow-700" />
                  <h2 className="text-xl font-semibold text-gray-900">{t('cart.payment.title')}</h2>
                </div>
                <div className="space-y-3">
                  <label className={`flex items-start gap-3 border rounded-lg p-4 cursor-pointer ${
                    paymentMethod === 'card' ? 'border-yellow-600 ring-2 ring-yellow-100' : 'border-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="payment-method"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                      className="mt-1"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-yellow-700" />
                        <p className="font-semibold text-gray-900">{t('cart.payment.card')}</p>
                      </div>
                      <p className="text-sm text-gray-600">{t('cart.payment.card.note')}</p>
                      <p className="text-xs text-gray-500">{t('cart.order.note')}</p>
                      <div className="mt-3 flex flex-wrap gap-3 items-center">
                        <button
                          type="button"
                          onClick={() => void handleCheckout('card')}
                          disabled={sendingOrder || paymentRedirecting}
                          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-yellow-700 to-yellow-600 px-4 py-2 text-sm font-semibold text-white shadow hover:from-yellow-600 hover:to-yellow-500 transition disabled:opacity-70"
                        >
                          {t('cart.checkout.cardCta')}
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <p className="text-xs text-gray-500">{t('cart.checkout.cardHelper')}</p>
                      </div>
                    </div>
                  </label>

                    <label className={`flex items-start gap-3 border rounded-lg p-4 cursor-pointer ${
                      paymentMethod === 'cash' ? 'border-yellow-600 ring-2 ring-yellow-100' : 'border-gray-200'
                    }`}>
                      <input
                        type="radio"
                        name="payment-method"
                        value="cash"
                        checked={paymentMethod === 'cash'}
                        onChange={() => setPaymentMethod('cash')}
                        className="mt-1"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-yellow-700" />
                          <p className="font-semibold text-gray-900">{t('cart.payment.cash')}</p>
                        </div>
                        <p className="text-sm text-gray-600">{t('cart.payment.cash.note')}</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white/80 px-4 py-3 shadow-sm">
                <div className="text-sm font-medium text-gray-700">{stepProgressText}</div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={goToPreviousStep}
                    disabled={currentStep === 0}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-yellow-600 disabled:opacity-60"
                  >
                    {t('cart.steps.previous')}
                  </button>
                  {currentStep < steps.length - 1 && (
                    <button
                      type="button"
                      onClick={goToNextStep}
                      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-yellow-700 to-yellow-600 px-4 py-2 text-sm font-semibold text-white shadow hover:from-yellow-600 hover:to-yellow-500 transition"
                    >
                      {t('cart.steps.next')}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white/90 backdrop-blur border border-yellow-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-yellow-700" />
                  <h2 className="text-lg font-semibold text-gray-900">{t('cart.summary')}</h2>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between text-gray-700">
                    <span>{t('cart.items.total')}</span>
                    <span className="font-semibold">{formatPrice(itemsTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-700">
                    <span>{t('cart.customer.name')}</span>
                    <span className="font-semibold text-right max-w-[60%] break-words">
                      {customerName || t('cart.customer.pending')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-gray-700">
                    <span>{t('cart.customer.phone')}</span>
                    <span className="font-semibold text-right max-w-[60%] break-words">
                      {customerPhone || t('cart.customer.pending')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-gray-700">
                    <span>{t('cart.customer.email')}</span>
                    <span className="font-semibold text-right max-w-[60%] break-words">
                      {customerEmail || t('cart.customer.pending')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-gray-700">
                    <span>{t('cart.customer.address')}</span>
                    <span className="font-semibold text-right max-w-[60%] break-words">
                      {customerAddress || t('cart.customer.pending')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-gray-700">
                    <span>{t('cart.weight.totalCart')}</span>
                    <span className="font-semibold">
                      {totalWeightGrams > 0 ? formatWeight(totalWeightGrams) : t('cart.weight.missingSummary')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-gray-700">
                    <span>{t('cart.shipping.country.summary')}</span>
                    <span className="font-semibold">{selectedCountryName || t('cart.shipping.country.unknown')}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-700">
                    <span>{t('cart.shipping.carrier.summary')}</span>
                    <span className="font-semibold">{selectedCarrierName || t('cart.shipping.carrier.unknown')}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-700">
                    <span>{t('cart.shipping.cost')}</span>
                    <span className="font-semibold">{formatPrice(shippingCost)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex items-center justify-between text-gray-900 font-bold text-base">
                    <span>{t('cart.total')}</span>
                    <span>{formatPrice(orderTotal)}</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-yellow-700" />
                    <span>{paymentMethod === 'card' ? t('cart.order.note') : t('cart.payment.cash.note')}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      id="terms-agreement"
                      checked={termsAccepted}
                      onChange={(e) => {
                        setTermsAccepted(e.target.checked);
                        setShowTermsError(false);
                      }}
                      className="mt-1"
                    />
                    <label htmlFor="terms-agreement" className="leading-snug">
                      {t('cart.terms.checkbox')}
                      <button
                        type="button"
                        onClick={() => onNavigate?.('terms')}
                        className="block text-yellow-700 font-semibold hover:underline"
                      >
                        {t('cart.terms.link')}
                      </button>
                    </label>
                  </div>
                  {showTermsError && (
                    <p className="text-red-600 text-sm">{t('cart.terms.required')}</p>
                  )}
                </div>
                <button
                  className="w-full mt-4 inline-flex justify-center items-center px-4 py-3 bg-gradient-to-r from-yellow-700 to-yellow-600 text-white font-semibold rounded-lg shadow hover:from-yellow-600 hover:to-yellow-500 transition disabled:opacity-70"
                  disabled={sendingOrder || paymentRedirecting || currentStep < steps.length - 1}
                  onClick={() => void handleCheckout()}
                >
                  {paymentRedirecting
                    ? t('cart.checkout.redirecting')
                    : sendingOrder
                      ? language === 'he'
                        ? 'שולח את פרטי ההזמנה...'
                        : 'Sending order details...'
                      : t('cart.checkout')}
                </button>
                {currentStep < steps.length - 1 && (
                  <div className="mt-3 text-sm text-blue-800 bg-blue-50 border border-blue-100 rounded-lg p-3">
                    {t('cart.steps.completeSteps')}
                  </div>
                )}
                {orderError && (
                  <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                    {orderError}
                  </div>
                )}
                {paymentError && (
                  <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                    {paymentError}
                  </div>
                )}
                {showConfirmation && (
                  <div className="mt-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
                    {t('cart.checkout.confirmation')}
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800 space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <Globe2 className="w-4 h-4" />
                  <span>{t('cart.delivery.worldwide')}</span>
                </div>
                <p>{t('cart.delivery.multi')}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
