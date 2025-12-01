import { Search, ShoppingCart, User, Phone, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';

interface HeaderProps {
  onNavigate?: (page: string) => void;
}

export default function Header({ onNavigate }: HeaderProps = {}) {
  const { language, setLanguage, currency, setCurrency, t } = useLanguage();
  const { getTotalItems, getTotalPrice } = useCart();

  const isRTL = language === 'he';

  return (
    <header className={`bg-white shadow-md ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-2 border-b border-yellow-600/30">
        <div className="container mx-auto px-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-yellow-500" />
            <span className="font-medium text-yellow-100">{t('kav.title')}:</span>
            <span className="font-bold tracking-wider text-yellow-400">{t('kav.phone')}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-yellow-500" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'he' | 'en')}
                className="bg-transparent border border-white/30 rounded px-2 py-1 text-sm cursor-pointer focus:outline-none focus:border-white"
              >
                <option value="he" className="text-gray-900">עברית</option>
                <option value="en" className="text-gray-900">English</option>
              </select>
            </div>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as 'ILS' | 'USD')}
              className="bg-transparent border border-white/30 rounded px-2 py-1 text-sm cursor-pointer focus:outline-none focus:border-white"
            >
              <option value="ILS" className="text-gray-900">₪ ILS</option>
              <option value="USD" className="text-gray-900">$ USD</option>
            </select>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-16 h-16 object-contain cursor-pointer"
              onClick={() => onNavigate?.('home')}
            />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-700 via-yellow-600 to-yellow-700 bg-clip-text text-transparent">{t('site.title')}</h1>
              <p className="text-sm text-yellow-700">{t('site.tagline')}</p>
            </div>
          </div>

          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <input
                type="text"
                placeholder={t('search.placeholder')}
                className={`w-full px-4 py-3 ${isRTL ? 'pr-12' : 'pl-12'} border-2 border-gray-300 rounded-lg focus:outline-none focus:border-yellow-600 transition-colors`}
              />
              <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate?.('account')}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <User className="w-5 h-5 text-gray-700" />
              <span className="text-gray-700 font-medium">{t('nav.account')}</span>
            </button>

            <button
              onClick={() => onNavigate?.('cart')}
              className="relative flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white rounded-lg transition-colors shadow-md border border-yellow-600/30"
            >
              <ShoppingCart className="w-5 h-5" />
              <div className="text-right">
                <div className="text-xs opacity-90">{getTotalItems()} {t('nav.cart')}</div>
                <div className="font-bold">
                  {currency === 'ILS' ? '₪' : '$'}{getTotalPrice(currency).toFixed(2)}
                </div>
              </div>
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>
        </div>

        <nav className="mt-4 flex items-center gap-6 border-t pt-3">
          <button
            onClick={() => onNavigate?.('account')}
            className="text-gray-700 hover:text-yellow-700 font-medium transition-colors"
          >
            {t('nav.account')}
          </button>
          <button
            onClick={() => onNavigate?.('home')}
            className="text-gray-700 hover:text-yellow-700 font-medium transition-colors"
          >
            {t('nav.home')}
          </button>
          <button
            onClick={() => onNavigate?.('catalog')}
            className="text-gray-700 hover:text-yellow-700 font-medium transition-colors"
          >
            {t('nav.books')}
          </button>
          <button
            onClick={() => onNavigate?.('catalog')}
            className="text-gray-700 hover:text-yellow-700 font-medium transition-colors"
          >
            {t('nav.children')}
          </button>
          <button
            onClick={() => onNavigate?.('catalog')}
            className="text-gray-700 hover:text-yellow-700 font-medium transition-colors"
          >
            {t('nav.women')}
          </button>
        </nav>
      </div>
    </header>
  );
}
