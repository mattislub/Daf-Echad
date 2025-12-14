import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

interface WishlistPageProps {
  onNavigate?: (page: string, bookId?: string) => void;
}

export default function WishlistPage({ onNavigate }: WishlistPageProps) {
  const { language, currency, t } = useLanguage();
  const { wishlistItems, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  const isRTL = language === 'he';
  const currencySymbol = currency === 'ILS' ? '₪' : '$';

  const handleAddToCart = (bookId: string) => {
    const book = wishlistItems.find((item) => item.id === bookId);
    if (!book) return;

    addToCart({
      id: book.id,
      title_he: book.title_he,
      title_en: book.title_en,
      price_ils: book.price_ils,
      price_usd: book.price_usd,
      image_url: book.image_url,
      weight: book.weight,
      quantity: 1,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header onNavigate={onNavigate} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-14">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-yellow-700 font-semibold mb-2">
              {language === 'he' ? 'רשימת משאלות' : 'Wishlist'}
            </p>
            <h1 className="text-3xl font-bold text-gray-900">
              {wishlistItems.length > 0
                ? t('wishlist.title')
                : language === 'he'
                  ? 'רשימה ריקה'
                  : 'Your list is empty'}
            </h1>
            <p className="text-gray-600 mt-1">
              {t('wishlist.subtitle')}
            </p>
          </div>
          {wishlistItems.length > 0 && (
            <button
              onClick={clearWishlist}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {language === 'he' ? 'נקה רשימה' : 'Clear list'}
            </button>
          )}
        </div>

        {wishlistItems.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-10 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-yellow-50 text-yellow-700 flex items-center justify-center mb-4">
              <Heart className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {t('wishlist.empty')}
            </h2>
            <p className="text-gray-600 mb-6">
              {language === 'he'
                ? 'שמרו ספרים שאהבתם כדי לחזור אליהם בכל עת.'
                : 'Save books you love and revisit them anytime.'}
            </p>
            <button
              onClick={() => onNavigate?.('catalog')}
              className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-amber-500 text-white rounded-lg font-semibold shadow-sm hover:shadow transition"
            >
              {language === 'he' ? 'חזרה לקטלוג' : 'Back to catalog'}
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {wishlistItems.map((book) => (
              <div
                key={book.id}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 sm:p-6 flex flex-col md:flex-row gap-6 items-center"
              >
                <div className="w-full md:w-32 h-32 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center overflow-hidden">
                  {book.image_url ? (
                    <img
                      src={book.image_url}
                      alt={language === 'he' ? book.title_he : book.title_en}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <Heart className="w-8 h-8 text-gray-300" />
                  )}
                </div>

                <div className="flex-1 w-full text-center md:text-left space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {language === 'he' ? book.title_he : book.title_en}
                  </h3>
                  {book.author && (
                    <p className="text-gray-600 text-sm">
                      {language === 'he' ? 'מאת' : 'by'} {book.author.name}
                    </p>
                  )}
                  <p className="text-xl font-bold text-yellow-700">
                    {currencySymbol}
                    {(currency === 'ILS' ? book.price_ils : book.price_usd).toFixed(2)}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full md:w-auto">
                  <button
                    onClick={() => onNavigate?.('item', book.id)}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-lg font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
                  >
                    {language === 'he' ? 'פרטי מוצר' : 'View details'}
                  </button>
                  <button
                    onClick={() => handleAddToCart(book.id)}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:from-gray-800 hover:to-gray-700 transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {language === 'he' ? 'הוסף לעגלה' : 'Add to cart'}
                  </button>
                  <button
                    onClick={() => removeFromWishlist(book.id)}
                    className="px-4 py-3 bg-red-50 text-red-700 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    {language === 'he' ? 'הסר' : 'Remove'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
