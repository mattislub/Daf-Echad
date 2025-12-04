import { useMemo, useState } from 'react';
import { CreditCard, Globe2, Package, Trash2, Truck, Wallet } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

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

export default function CartPage({ onNavigate }: CartPageProps) {
  const { cartItems, updateQuantity, removeFromCart, getTotalPrice } = useCart();
  const { language, currency, t } = useLanguage();

  const [selectedShipping, setSelectedShipping] = useState<string>('israel-standard');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);

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

  const selectedShippingOption = shippingOptions.find((option) => option.id === selectedShipping) || shippingOptions[0];

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

  const isRTL = language === 'he';

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header onNavigate={onNavigate} />

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-2 mb-8">
          <p className="text-sm text-yellow-700 font-semibold">{t('cart.delivery.worldwide')}</p>
          <h1 className="text-3xl font-bold text-gray-900">{t('cart.title')}</h1>
          <p className="text-gray-600">{t('cart.subtitle')}</p>
        </div>

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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
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

              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-yellow-700" />
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide">{t('cart.shipping.worldwide')}</p>
                    <h2 className="text-xl font-semibold text-gray-900">{t('cart.shipping.title')}</h2>
                  </div>
                </div>
                <p className="text-gray-600">{t('cart.shipping.description')}</p>

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

              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
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
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
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
                    <span>{t('cart.weight.totalCart')}</span>
                    <span className="font-semibold">
                      {totalWeightGrams > 0 ? formatWeight(totalWeightGrams) : t('cart.weight.missingSummary')}
                    </span>
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
                  className="w-full mt-4 inline-flex justify-center items-center px-4 py-3 bg-gradient-to-r from-yellow-700 to-yellow-600 text-white font-semibold rounded-lg shadow hover:from-yellow-600 hover:to-yellow-500 transition"
                  onClick={() => {
                    if (!termsAccepted) {
                      setShowTermsError(true);
                      setShowConfirmation(false);
                      return;
                    }
                    setShowConfirmation(true);
                  }}
                >
                  {t('cart.checkout')}
                </button>
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
