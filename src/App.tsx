import { useMemo, useState, useEffect, useCallback } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { CartProvider } from './context/CartContext';
import Header from './components/Header';
import Banner from './components/Banner';
import CategoryCards from './components/CategoryCards';
import ProductSection from './components/ProductSection';
import Footer from './components/Footer';
import Catalog from './pages/Catalog';
import ItemPage from './pages/ItemPage';
import CartPage from './pages/CartPage';
import AccountPage from './pages/AccountPage';
import LoginPage from './pages/LoginPage';
import { Book } from './types/catalog';
import { applySeoForPage } from './services/seo';
import { getBooks, getCategories } from './services/api';
import { Loader2 } from 'lucide-react';
import {
  buildProductPath,
  buildProductSlug,
  extractSkuFromSlug,
  normalizeSlug,
} from './utils/slug';

function HomePage({
  books,
  loading,
  onNavigate,
}: {
  books: Book[];
  loading: boolean;
  onNavigate: (page: string, bookId?: string) => void;
}) {
  const { t } = useLanguage();

  const featuredProducts = books.filter((p) => p.featured);
  const newArrivals = books.filter((p) => !p.featured).slice(0, 8);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} />

      <main className="container mx-auto px-4 py-8">
        <Banner />

        <div className="my-12">
          <CategoryCards />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-600" />
          </div>
        ) : (
          <>
            <ProductSection
              title={t('featured')}
              products={featuredProducts}
              onViewAll={() => onNavigate('catalog')}
              onViewDetails={(product) => onNavigate('item', product.id)}
            />

            <ProductSection
              title={t('new.arrivals')}
              products={newArrivals}
              onViewAll={() => onNavigate('catalog')}
              onViewDetails={(product) => onNavigate('item', product.id)}
            />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);

  const getBookSlug = useCallback((book: Book | undefined) => {
    if (!book) return '';
    return buildProductSlug(book);
  }, []);

  const findBookBySlug = useCallback(
    (slug: string) => {
      const decodedSlug = decodeURIComponent(slug);
      const normalizedSlug = normalizeSlug(decodedSlug);
      const skuFromSlug = extractSkuFromSlug(decodedSlug);

      return books.find((book) => {
        const bookSlug = normalizeSlug(getBookSlug(book));
        const normalizedItemNumber = book.item_number
          ? normalizeSlug(book.item_number)
          : null;
        const skuMatch = skuFromSlug
          ? normalizeSlug(skuFromSlug) === normalizeSlug(book.id) ||
            (normalizedItemNumber && normalizeSlug(skuFromSlug) === normalizedItemNumber)
          : false;

        const titleMatch =
          normalizeSlug(book.title_he) === normalizedSlug ||
          normalizeSlug(book.title_en) === normalizedSlug;

        return bookSlug === normalizedSlug || skuMatch || titleMatch;
      });
    },
    [books, getBookSlug],
  );

  const updateHashForPage = useCallback(
    (page: string, book?: Book) => {
      const basePath = page === 'home' ? '/' : `/${page}`;

      if (page === 'item') {
        const slug = getBookSlug(book);
        window.location.hash = slug && book ? buildProductPath(book) : '/item';
        return;
      }

      window.location.hash = basePath;
    },
    [getBookSlug],
  );

  const handleNavigate = (page: string, bookId?: string) => {
    const targetBook = books.find((book) => book.id === bookId);

    if (page === 'item') {
      const fallbackSlug = bookId ?? '';
      setPendingSlug(targetBook ? null : fallbackSlug || null);
      setCurrentPage('item');
      setSelectedBookId(bookId ?? null);
      updateHashForPage('item', targetBook);
      return;
    }

    setPendingSlug(null);
    setCurrentPage(page);
    setSelectedBookId(null);
    updateHashForPage(page);
  };

  useEffect(() => {
    const loadBooks = async () => {
      try {
        setLoadingBooks(true);
        const [booksData, categoriesData] = await Promise.all([
          getBooks(),
          getCategories(),
        ]);

        const booksWithCategories = (booksData ?? []).map((book) => {
          const category = categoriesData?.find((cat) => cat.id === book.category_id);
          return category ? { ...book, category } : book;
        });

        setBooks(booksWithCategories);
      } catch (error) {
        console.error('Failed to load books:', error);
        setBooks([]);
      } finally {
        setLoadingBooks(false);
      }
    };

    loadBooks();
  }, []);

  useEffect(() => {
    const matchBookFromSlug = () => {
      if (pendingSlug && books.length > 0) {
        const matchedBook = findBookBySlug(pendingSlug);
        if (matchedBook) {
          setSelectedBookId(matchedBook.id);
          setCurrentPage('item');
          setPendingSlug(null);
        }
      }
    };

    matchBookFromSlug();
  }, [books, findBookBySlug, pendingSlug]);

  useEffect(() => {
    const parseHashRoute = () => {
      const hash = window.location.hash.replace(/^#/, '');
      const [route, slugOrId] = hash.split('/').filter(Boolean);

      switch (route) {
        case 'catalog':
          setCurrentPage('catalog');
          setSelectedBookId(null);
          setPendingSlug(null);
          break;
        case 'item':
          setCurrentPage('item');
          setSelectedBookId(null);
          setPendingSlug(slugOrId ?? null);
          break;
        case 'cart':
          setCurrentPage('cart');
          setSelectedBookId(null);
          setPendingSlug(null);
          break;
        case 'account':
          setCurrentPage('account');
          setSelectedBookId(null);
          setPendingSlug(null);
          break;
        case 'login':
          setCurrentPage('login');
          setSelectedBookId(null);
          setPendingSlug(null);
          break;
        default:
          setCurrentPage('home');
          setSelectedBookId(null);
          setPendingSlug(null);
          break;
      }
    };

    parseHashRoute();
    window.addEventListener('hashchange', parseHashRoute);

    return () => window.removeEventListener('hashchange', parseHashRoute);
  }, []);

  return (
    <LanguageProvider>
      <CartProvider>
        <AppContent
          currentPage={currentPage}
          selectedBookId={selectedBookId}
          onNavigate={handleNavigate}
          books={books}
          loadingBooks={loadingBooks}
          pendingSlug={pendingSlug}
        />
      </CartProvider>
    </LanguageProvider>
  );
}

interface AppContentProps {
  currentPage: string;
  selectedBookId: string | null;
  onNavigate: (page: string, bookId?: string) => void;
  books: Book[];
  loadingBooks: boolean;
  pendingSlug: string | null;
}

function AppContent({ currentPage, selectedBookId, onNavigate, books, loadingBooks, pendingSlug }: AppContentProps) {
  const { language, t } = useLanguage();

  const selectedProduct = useMemo<Book | undefined>(
    () => books.find((product) => product.id === selectedBookId),
    [books, selectedBookId],
  );

  useEffect(() => {
    applySeoForPage(currentPage, {
      language,
      t,
      product: selectedProduct,
    });
  }, [currentPage, language, selectedProduct, t]);

  return (
    <>
      {currentPage === 'home' && (
        <HomePage books={books} loading={loadingBooks} onNavigate={onNavigate} />
      )}
      {currentPage === 'catalog' && <Catalog onNavigate={onNavigate} />}
      {currentPage === 'item' && selectedBookId && (
        <ItemPage bookId={selectedBookId} onNavigate={onNavigate} />
      )}
      {currentPage === 'item' && !selectedBookId && (
        <div className="min-h-screen bg-gray-50">
          <Header onNavigate={onNavigate} />
          <div className="flex items-center justify-center h-screen text-gray-500">
            {pendingSlug ? (
              <Loader2 className="w-8 h-8 animate-spin text-yellow-600" />
            ) : (
              <p>{language === 'he' ? 'ספר לא נמצא' : 'Book not found'}</p>
            )}
          </div>
        </div>
      )}
      {currentPage === 'cart' && <CartPage onNavigate={onNavigate} />}
      {currentPage === 'account' && <AccountPage onNavigate={onNavigate} />}
      {currentPage === 'login' && <LoginPage onNavigate={onNavigate} />}
    </>
  );
}

export default App;
