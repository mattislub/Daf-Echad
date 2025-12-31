import {
  Search,
  ShoppingCart,
  User,
  Phone,
  Globe,
  Home,
  BookOpen,
  Baby,
  Sparkles,
  Truck,
  Heart,
  LogIn,
  Info,
  FileText,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useSearch } from '../context/SearchContext';
import { Book } from '../types/catalog';
import { useWishlist } from '../context/WishlistContext';

export interface HeaderProps {
  onNavigate?: (page: string) => void;
  searchItems?: Book[];
  onSearch?: (query: string) => void;
  searchTerm?: string;
}

type Suggestion = {
  id: string;
  label: string;
  type: string;
  categoryId?: string | null;
};

export default function Header({ onNavigate, onSearch, searchItems, searchTerm }: HeaderProps = {}) {
  const { language, setLanguage, currency, setCurrency, t } = useLanguage();
  const { getTotalItems, getTotalPrice } = useCart();
  const { wishlistItems } = useWishlist();
  const searchContext = useSearch();

  const effectiveSearchItems = searchItems ?? searchContext.searchItems;
  const currentSearchTerm = searchTerm ?? searchContext.searchTerm;
  const setSearchTerm = searchContext.setSearchTerm;
  const triggerSearch = onSearch ?? searchContext.onSearch;

  const [inputValue, setInputValue] = useState(currentSearchTerm);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setInputValue(currentSearchTerm);
  }, [currentSearchTerm]);

  const suggestions = useMemo(() => {
    const term = inputValue.trim().toLowerCase();
    if (!term) return [] as Suggestion[];

    const uniqueLabels = new Map<string, Suggestion>();

    effectiveSearchItems.forEach((item) => {
      const addSuggestion = (label: string, type: string, extra?: Partial<Suggestion>) => {
        if (label.toLowerCase().includes(term)) {
          const key = `${item.id}-${label}-${type}`;
          if (!uniqueLabels.has(key)) {
            uniqueLabels.set(key, { id: item.id, label, type, ...extra });
          }
        }
      };

      if (item.title_he) addSuggestion(item.title_he, 'title');
      if (item.title_en) addSuggestion(item.title_en, 'title');
      if (item.keywords?.length) addSuggestion(item.keywords.join(' '), 'keyword');
      if (item.author?.name) addSuggestion(item.author.name, 'author');
      if (item.category)
        addSuggestion(language === 'he' ? item.category.name_he : item.category.name_en, 'category', {
          categoryId: item.category.id ?? item.category_id ?? item.categories?.[0]?.id ?? null,
        });
      if (item.publisher?.name) addSuggestion(item.publisher.name, 'publisher');
    });

    return Array.from(uniqueLabels.values()).slice(0, 6);
  }, [effectiveSearchItems, inputValue, language]);

  const isRTL = language === 'he';

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = inputValue.trim();
    if (!query) return;

    setSearchTerm?.(query);
    triggerSearch?.(query);
    setIsFocused(false);
  };

  const handleSuggestionSelect = (suggestion: Suggestion) => {
    const selectedBook = effectiveSearchItems.find((book) => book.id === suggestion.id);
    setInputValue(suggestion.label);
    setSearchTerm?.(suggestion.label);
    setIsFocused(false);

    if (suggestion.type === 'category') {
      const targetCategoryId =
        suggestion.categoryId ??
        selectedBook?.category_id ??
        selectedBook?.categories?.[0]?.id ??
        selectedBook?.category?.id ??
        null;

      if (targetCategoryId) {
        setSearchTerm?.('');
        setInputValue('');
        window.location.hash = `#/catalog?category=${encodeURIComponent(targetCategoryId)}`;
        return;
      }
    }

    if (selectedBook) {
      onNavigate?.('item', selectedBook.id);
      return;
    }

    triggerSearch?.(suggestion.label);
  };

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
            <form className="relative" onSubmit={handleSubmit}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setSearchTerm?.(e.target.value);
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 100)}
                placeholder={t('search.placeholder')}
                className={`w-full px-4 py-3 ${isRTL ? 'pr-12' : 'pl-12'} border-2 border-gray-300 rounded-lg focus:outline-none focus:border-yellow-600 transition-colors`}
              />
              <button
                type="submit"
                className={`absolute ${isRTL ? 'right-2' : 'left-2'} top-1/2 -translate-y-1/2 p-2 rounded-full text-gray-500 hover:text-yellow-700 focus:outline-none`}
                aria-label={t('search.button')}
              >
                <Search className="w-5 h-5" />
              </button>
              {isFocused && suggestions.length > 0 && (
                <div className="absolute mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                  {suggestions.map((suggestion) => (
                    <button
                      type="button"
                      key={`${suggestion.id}-${suggestion.label}`}
                      onClick={() => handleSuggestionSelect(suggestion)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex justify-between items-center"
                    >
                      <span className="text-gray-800">{suggestion.label}</span>
                      <span className="text-xs text-gray-500 uppercase">{suggestion.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </form>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate?.('login')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-yellow-700 bg-yellow-50 border border-yellow-100 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <LogIn className="w-5 h-5" />
              <span>{t('nav.login')}</span>
            </button>
            <button
              onClick={() => onNavigate?.('account')}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <User className="w-5 h-5 text-gray-700" />
              <span className="text-gray-700 font-medium">{t('nav.account')}</span>
            </button>

            <button
              onClick={() => onNavigate?.('wishlist')}
              className="relative flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-yellow-600/40 text-gray-800 rounded-lg transition-colors shadow-sm"
            >
              <Heart className="w-5 h-5 text-yellow-700" />
              <div className="text-right">
                <div className="text-xs opacity-90">{t('nav.wishlist')}</div>
                <div className="font-bold">{wishlistItems.length} {language === 'he' ? 'פריטים' : 'items'}</div>
              </div>
              {wishlistItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {wishlistItems.length}
                </span>
              )}
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
            onClick={() => onNavigate?.('home')}
            className="flex items-center gap-2 text-gray-700 hover:text-yellow-700 font-medium transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>{t('nav.home')}</span>
          </button>
          <button
            onClick={() => onNavigate?.('catalog')}
            className="flex items-center gap-2 text-gray-700 hover:text-yellow-700 font-medium transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span>{t('nav.books')}</span>
          </button>
          <button
            onClick={() => onNavigate?.('catalog')}
            className="flex items-center gap-2 text-gray-700 hover:text-yellow-700 font-medium transition-colors"
          >
            <Baby className="w-4 h-4" />
            <span>{t('nav.children')}</span>
          </button>
          <button
            onClick={() => onNavigate?.('catalog')}
            className="flex items-center gap-2 text-gray-700 hover:text-yellow-700 font-medium transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t('nav.women')}</span>
          </button>
          <button
            onClick={() => onNavigate?.('tracking')}
            className="flex items-center gap-2 text-gray-700 hover:text-yellow-700 font-medium transition-colors"
          >
            <Truck className="w-4 h-4" />
            <span>{t('nav.tracking')}</span>
          </button>
          <button
            onClick={() => onNavigate?.('about')}
            className="flex items-center gap-2 text-gray-700 hover:text-yellow-700 font-medium transition-colors"
          >
            <Info className="w-4 h-4" />
            <span>{t('nav.about')}</span>
          </button>
          <button
            onClick={() => onNavigate?.('contact')}
            className="flex items-center gap-2 text-gray-700 hover:text-yellow-700 font-medium transition-colors"
          >
            <Mail className="w-4 h-4" />
            <span>{t('nav.contact')}</span>
          </button>
          <button
            onClick={() => onNavigate?.('terms')}
            className="flex items-center gap-2 text-gray-700 hover:text-yellow-700 font-medium transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>{t('nav.terms')}</span>
          </button>
          <button
            onClick={() => onNavigate?.('admin')}
            className="flex items-center gap-2 text-gray-700 hover:text-yellow-700 font-medium transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{t('nav.admin')}</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
