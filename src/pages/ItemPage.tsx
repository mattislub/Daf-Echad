import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { Book, Category } from '../types/catalog';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ImageGallery from '../components/ImageGallery';
import ItemFacts from '../components/ItemFacts';
import ProductCard from '../components/ProductCard';
import {
  Loader2,
  ShoppingCart,
  Check,
  Package,
  ChevronDown,
  ShieldCheck,
  Truck,
  RotateCcw,
} from 'lucide-react';
import { getBookById, getCategories, getPopularBooks, getRelatedBooks } from '../services/api';
import { CartItem } from '../types';

interface ItemPageProps {
  bookId: string;
  onNavigate?: (page: string, bookId?: string) => void;
}

export default function ItemPage({ bookId, onNavigate }: ItemPageProps) {
  const { language, currency } = useLanguage();
  const { addToCart } = useCart();
  const [book, setBook] = useState<Book | null>(null);
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const [popularBooks, setPopularBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [isExtendedDescriptionOpen, setIsExtendedDescriptionOpen] = useState(false);

  useEffect(() => {
    fetchBookData();
  }, [bookId]);

  const fetchBookData = async () => {
    try {
      setLoading(true);

      const bookData = await getBookById(bookId);

      if (bookData) {
        const [categoriesData, relatedData, popularData] = await Promise.all([
          getCategories(),
          getRelatedBooks(bookData.category_id, bookId),
          getPopularBooks(bookId),
        ]);

        const findCategory = (targetBook: Book): Category | undefined =>
          categoriesData?.find((cat) => cat.id === targetBook.category_id);

        const resolveCategories = (targetBook: Book): Category[] => {
          if (targetBook.categories?.length) return targetBook.categories;

          if (targetBook.category_ids?.length && categoriesData) {
            const mappedCategories = targetBook.category_ids
              .map((categoryId) => categoriesData.find((cat) => cat.id === categoryId))
              .filter((category): category is Category => Boolean(category));

            if (mappedCategories.length) return mappedCategories;
          }

          const fallbackCategory = findCategory(targetBook);
          return fallbackCategory ? [fallbackCategory] : [];
        };

        const mapWithCategory = (items: Book[]) =>
          items.map((item) => {
            const categories = resolveCategories(item);
            const category = item.category ?? categories[0] ?? findCategory(item);

            return {
              ...item,
              category,
              categories: categories.length ? categories : item.categories,
              category_id: item.category_id ?? category?.id ?? null,
              category_ids: item.category_ids ?? categories.map((cat) => cat.id),
            };
          });

        const [bookWithCategory] = mapWithCategory([bookData]);

        setBook(bookWithCategory);
        setRelatedBooks(mapWithCategory(relatedData ?? []));
        setPopularBooks(mapWithCategory(popularData ?? []));
      }
    } catch (error) {
      console.error('Error fetching book data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!book) return;

    const cartItem: CartItem = {
      id: book.id,
      title_he: book.title_he,
      title_en: book.title_en,
      price_ils: book.price_ils,
      price_usd: book.price_usd,
      image_url: book.image_url,
      quantity,
    };

    addToCart(cartItem);

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleQuantityChange = (value: number) => {
    const newQuantity = Math.max(1, Math.min(99, value));
    setQuantity(newQuantity);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onNavigate={onNavigate} />
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-600" />
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onNavigate={onNavigate} />
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-500">
            {language === 'he' ? 'ספר לא נמצא' : 'Book not found'}
          </p>
        </div>
      </div>
    );
  }

  const images = book.images && book.images.length > 0
    ? book.images.sort((a, b) => a.position - b.position).map(img => img.image_url)
    : [book.image_url];

  const displayCategories =
    book.categories?.length ? book.categories : book.category ? [book.category] : [];

  const buildCategoryCatalogUrl = (categoryId: string) =>
    `/#/catalog?category=${encodeURIComponent(categoryId)}`;

  const price = currency === 'ILS' ? book.price_ils : book.price_usd;
  const currencySymbol = currency === 'ILS' ? '₪' : '$';
  const shortDescription = book.short_description || (language === 'he' ? book.description_he : book.description_en);
  const originalDescription = book.original_description;
  const descriptionTitle = book.description_title;
  const perks = [
    {
      icon: ShieldCheck,
      title: language === 'he' ? 'תשלום מאובטח' : 'Secure checkout',
      description: language === 'he' ? 'הצפנה מלאה ואישור הזמנה ברור' : 'Full encryption and transparent order details',
    },
    {
      icon: Truck,
      title: language === 'he' ? 'משלוח מהיר' : 'Fast delivery',
      description: language === 'he' ? 'שליחה מהירה עם עדכון סטטוס בזמן אמת' : 'Rapid dispatch with real-time updates',
    },
    {
      icon: RotateCcw,
      title: language === 'he' ? 'מדיניות החזרה' : 'Easy returns',
      description: language === 'he' ? 'אפשרויות החלפה גמישות' : 'Flexible exchange options',
    },
  ];
  const metaHighlights = [
    { label: language === 'he' ? 'כריכה' : 'Binding', value: book.binding },
    { label: language === 'he' ? 'שפה' : 'Language', value: book.language },
    { label: language === 'he' ? 'כרכים' : 'Volumes', value: book.volumes ? String(book.volumes) : null },
  ].filter((item) => Boolean(item.value));

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <Header onNavigate={onNavigate} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-10 mb-14 items-start">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 sm:p-6">
            <div className="rounded-xl bg-gradient-to-b from-gray-100 to-white p-2 sm:p-3">
              <ImageGallery
                images={images}
                alt={language === 'he' ? book.title_he : book.title_en}
              />
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              {displayCategories.length > 0 && (
                <div className="flex flex-wrap gap-2 text-sm text-gray-700">
                  {displayCategories.map((category) => (
                    <a
                      key={category.id}
                      href={buildCategoryCatalogUrl(category.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-full bg-white text-yellow-800 px-3 py-1 shadow-sm border border-yellow-100 hover:border-yellow-200 hover:shadow transition"
                    >
                      {language === 'he' ? category.name_he : category.name_en}
                    </a>
                  ))}
                </div>
              )}
              <h1 className="text-3xl lg:text-4xl font-semibold text-gray-900 tracking-tight">
                {language === 'he' ? book.title_he : book.title_en}
              </h1>
              {book.author && (
                <p className="text-lg text-gray-600">
                  {language === 'he' ? 'מאת' : 'by'} {book.author.name}
                </p>
              )}
            </div>

            <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-yellow-50 text-yellow-700 px-3 py-1 text-sm font-medium">
                    {language === 'he' ? 'מהדורה עדכנית' : 'Latest edition'}
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {currencySymbol}
                    {price.toFixed(2)}
                  </div>
                </div>
                <div className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ${
                  book.in_stock
                    ? 'bg-green-50 text-green-700 border border-green-100'
                    : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                  <Package className="w-4 h-4" />
                  {book.in_stock
                    ? language === 'he'
                      ? 'במלאי'
                      : 'In Stock'
                    : language === 'he'
                    ? 'אזל מהמלאי'
                    : 'Out of Stock'}
                </div>
              </div>

              {metaHighlights.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  {metaHighlights.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-3"
                    >
                      <p className="text-xs uppercase tracking-wide text-gray-500">{item.label}</p>
                      <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 pt-2">
                <label className="font-medium text-gray-700">
                  {language === 'he' ? 'כמות:' : 'Quantity:'}
                </label>
                <div className="flex items-center rounded-full bg-gray-50 border border-gray-200 shadow-inner">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="px-4 py-2 text-lg font-bold text-gray-700 hover:bg-white rounded-l-full transition-colors disabled:text-gray-400"
                    disabled={!book.in_stock}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                    className="w-16 text-center bg-transparent py-2 focus:outline-none text-gray-900"
                    min="1"
                    max="99"
                    disabled={!book.in_stock}
                  />
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="px-4 py-2 text-lg font-bold text-gray-700 hover:bg-white rounded-r-full transition-colors disabled:text-gray-400"
                    disabled={!book.in_stock}
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!book.in_stock || addedToCart}
                className="w-full bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 hover:from-yellow-500 hover:via-amber-500 hover:to-yellow-500 disabled:from-gray-300 disabled:to-gray-300 text-white py-4 px-6 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-amber-200/40 disabled:shadow-none"
              >
                {addedToCart ? (
                  <>
                    <Check className="w-6 h-6" />
                    {language === 'he' ? 'נוסף לעגלה!' : 'Added to Cart!'}
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-6 h-6" />
                    {language === 'he' ? 'הוסף לעגלה' : 'Add to Cart'}
                  </>
                )}
              </button>

              <div className="grid sm:grid-cols-3 gap-3 pt-1">
                {perks.map((perk) => (
                  <div
                    key={perk.title}
                    className="flex gap-3 items-start rounded-xl bg-gray-50 border border-gray-100 px-3 py-3"
                  >
                    <perk.icon className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-gray-900">{perk.title}</p>
                      <p className="text-xs text-gray-600 leading-snug">{perk.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {(shortDescription || descriptionTitle) && (
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3 tracking-tight">
                    {language === 'he' ? 'תיאור קצר' : 'Short Description'}
                  </h2>
                  {descriptionTitle && (
                    <p className="text-lg font-semibold text-gray-900 mb-2">{descriptionTitle}</p>
                  )}
                  {shortDescription && (
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">{shortDescription}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {originalDescription && (
          <div className="mb-12">
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <button
                type="button"
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                onClick={() => setIsExtendedDescriptionOpen((prev) => !prev)}
              >
                <span className="text-xl font-semibold text-gray-900">
                  {language === 'he' ? 'תיאור מורחב' : 'Extended Description'}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-600 transition-transform ${
                    isExtendedDescriptionOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isExtendedDescriptionOpen && (
                <div className="border-t border-gray-100 px-6 py-5">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {originalDescription}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mb-12">
          <ItemFacts book={book} />
        </div>

        {relatedBooks.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {language === 'he' ? 'פריטים קשורים' : 'Related Items'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedBooks.map((relatedBook) => (
                <ProductCard
                  key={relatedBook.id}
                  id={relatedBook.id}
                  title={language === 'he' ? relatedBook.title_he : relatedBook.title_en}
                  price={currency === 'ILS' ? relatedBook.price_ils : relatedBook.price_usd}
                  image={relatedBook.image_url}
                  category={
                    relatedBook.category
                      ? language === 'he'
                        ? relatedBook.category.name_he
                        : relatedBook.category.name_en
                      : ''
                  }
                  onViewDetails={() => onNavigate?.('item', relatedBook.id)}
                />
              ))}
            </div>
          </div>
        )}

        {popularBooks.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {language === 'he' ? 'פריטים פופולריים' : 'Popular Items'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularBooks.map((popularBook) => (
                <ProductCard
                  key={popularBook.id}
                  id={popularBook.id}
                  title={language === 'he' ? popularBook.title_he : popularBook.title_en}
                  price={currency === 'ILS' ? popularBook.price_ils : popularBook.price_usd}
                  image={popularBook.image_url}
                  category={
                    popularBook.category
                      ? language === 'he'
                        ? popularBook.category.name_he
                        : popularBook.category.name_en
                      : ''
                  }
                  onViewDetails={() => onNavigate?.('item', popularBook.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
