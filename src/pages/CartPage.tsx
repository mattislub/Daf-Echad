import { ArrowRight, ShoppingCart, Trash2 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

interface CartPageProps {
  onNavigate?: (page: string) => void;
}

export default function CartPage({ onNavigate }: CartPageProps) {
  const { cartItems, updateQuantity, removeFromCart, getTotalPrice } = useCart();
  const { t, currency, language } = useLanguage();

  const formatPrice = (value: number) => {
    const symbol = currency === 'ILS' ? '₪' : '$';
    return `${symbol}${value.toFixed(2)}`;
  };

  const itemsTotal = getTotalPrice(currency);
  const shippingNote =
    language === 'he'
      ? 'משלוח יתואם מולכם לאחר השלמת ההזמנה.'
      : 'Shipping will be confirmed with you after checkout.';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} />

      <main className="container mx-auto px-4 py-10">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-yellow-100 text-yellow-700 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('cart.title')}</h1>
              <p className="text-gray-600">{t('cart.subtitle')}</p>
            </div>
          </div>

          {cartItems.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
              <p className="text-gray-600 mb-6">{t('cart.empty')}</p>
              <button
                onClick={() => onNavigate?.('catalog')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-600 text-white font-semibold hover:bg-yellow-700"
              >
                {t('cart.continue')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-4"
                  >
                    <div className="flex gap-4">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={language === 'he' ? item.title_he : item.title_en}
                          className="w-20 h-24 object-cover rounded-lg border"
                        />
                      )}
                      <div className="flex-1 space-y-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {language === 'he' ? item.title_he : item.title_en}
                        </h3>
                        <p className="text-yellow-700 font-semibold">
                          {formatPrice(currency === 'ILS' ? item.price_ils : item.price_usd)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <label className="text-sm text-gray-600">{t('cart.quantity')}</label>
                        <div className="flex items-center border border-slate-200 rounded-lg bg-white">
                          <button
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className="px-3 py-1 text-lg font-bold hover:bg-slate-100"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={99}
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, Math.max(1, Number(e.target.value) || 1))}
                            className="w-16 text-center border-x border-slate-200 py-1"
                          />
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-3 py-1 text-lg font-bold hover:bg-slate-100"
                          >
                            +
                          </button>
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
                  </div>
                ))}
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide">{t('cart.summary')}</p>
                  <h2 className="text-xl font-semibold text-gray-900">{t('cart.checkout.tip')}</h2>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-700">
                  <span>{t('cart.items.total')}</span>
                  <span className="font-semibold">{formatPrice(itemsTotal)}</span>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm text-gray-700">
                  {shippingNote}
                </div>

                <div className="flex items-center justify-between text-base font-bold text-gray-900">
                  <span>{t('cart.total')}</span>
                  <span>{formatPrice(itemsTotal)}</span>
                </div>

                <button
                  onClick={() => onNavigate?.('payment')}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-yellow-600 text-white font-semibold hover:bg-yellow-700"
                >
                  {t('cart.checkout.cardCta')}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onNavigate?.('catalog')}
                  className="w-full text-sm text-gray-600 hover:text-gray-800"
                >
                  {t('cart.continue')}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
