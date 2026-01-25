import { useMemo, useState, useEffect, useCallback } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { SearchProvider } from './context/SearchContext';
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
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PoliciesPage from './pages/PoliciesPage';
import TermsPage from './pages/TermsPage';
import AdminPage from './pages/AdminPage';
import AdminCustomersPage from './pages/AdminCustomersPage';
import PaymentPage from './pages/PaymentPage';
import WishlistPage from './pages/WishlistPage';
import TrackingPage from './pages/TrackingPage';
import DatabasePage from './pages/DatabasePage';
import { Book } from './types/catalog';
import { CustomerAccount } from './types';
import { applySeoForPage } from './services/seo';
import { getAuthors, getBooks, getCategories, getPublishers } from './services/api';
import { Loader2 } from 'lucide-react';
import {
  CUSTOMER_ACCOUNT_SESSION_MS,
  clearStoredCustomerAccount,
  getStoredCustomerExpiry,
  loadStoredCustomerAccount,
  persistCustomerAccount,
} from './utils/customerSession';
import {
  buildProductPath,
  buildProductSlug,
  extractSkuFromSlug,
  normalizeSlug,
} from './utils/slug';
import { resolvePrimaryImage } from './utils/imagePaths';

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
              onGoToCart={() => onNavigate('cart')}
            />

            <ProductSection
              title={t('new.arrivals')}
              products={newArrivals}
              onViewAll={() => onNavigate('catalog')}
              onViewDetails={(product) => onNavigate('item', product.id)}
              onGoToCart={() => onNavigate('cart')}
            />
          </>
        )}
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [catalogFiltersFromUrl, setCatalogFiltersFromUrl] = useState<string[]>([]);
  const [paymentCheckoutUrl, setPaymentCheckoutUrl] = useState<string | null>(null);
  const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
  const [customerAccount, setCustomerAccount] = useState<CustomerAccount | null>(() =>
    loadStoredCustomerAccount(),
  );

  useEffect(() => {
    const handleAccountUpdate = () => setCustomerAccount(loadStoredCustomerAccount());
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'daf_customer_account') {
        handleAccountUpdate();
      }
    };

    window.addEventListener('customer-account-updated', handleAccountUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('customer-account-updated', handleAccountUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

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

    setCatalogFiltersFromUrl([]);
    if (page !== 'payment') {
      setPaymentCheckoutUrl(null);
      setPaymentOrderId(null);
    }

    if (page === 'item') {
      const fallbackSlug = bookId ?? '';
      setPendingSlug(targetBook ? null : fallbackSlug || null);
      setCurrentPage('item');
      setSelectedBookId(bookId ?? null);
      updateHashForPage('item', targetBook);
      return;
    }

    if (page === 'wishlist') {
      setPendingSlug(null);
      setCurrentPage('wishlist');
      setSelectedBookId(null);
      updateHashForPage('wishlist');
      return;
    }

    setPendingSlug(null);
    setCurrentPage(page);
    setSelectedBookId(null);
    updateHashForPage(page);
  };

  const handleLoginSuccess = (account: CustomerAccount) => {
    setCustomerAccount(account);
    persistCustomerAccount(account);
    handleNavigate('account');
  };

  const handleAccountUpdate = (account: CustomerAccount) => {
    setCustomerAccount(account);
    const existingExpiry = getStoredCustomerExpiry();
    persistCustomerAccount(account, existingExpiry ?? Date.now() + CUSTOMER_ACCOUNT_SESSION_MS);
  };

  const handleLogout = () => {
    setCustomerAccount(null);
    clearStoredCustomerAccount();
    handleNavigate('home');
  };

  useEffect(() => {
    const loadBooks = async () => {
      try {
        setLoadingBooks(true);
        const [booksData, categoriesData, authorsData, publishersData] = await Promise.all([
          getBooks(),
          getCategories(),
          getAuthors(),
          getPublishers(),
        ]);

        const booksWithRelations = (booksData ?? []).map((book) => {
          const category = categoriesData?.find((cat) => cat.id === book.category_id);
          const author = authorsData?.find((a) => a.id === book.author_id);
          const publisher = publishersData?.find((p) => p.id === book.publisher_id);
          const bookWithRelations = { ...book, category, author, publisher };
          const primaryImage = resolvePrimaryImage(bookWithRelations);

          return {
            ...bookWithRelations,
            image_url: primaryImage || bookWithRelations.image_url,
          };
        });

        setBooks(booksWithRelations);
      } catch (error) {
        console.error('Failed to load books:', error);
        setBooks([]);
      } finally {
        setLoadingBooks(false);
      }
    };

    loadBooks();
  }, []);

  const handleSearch = useCallback(
    (query: string) => {
      const normalizedQuery = query.trim();
      setSearchQuery(normalizedQuery);
      setCatalogFiltersFromUrl([]);
      setCurrentPage('catalog');
      setSelectedBookId(null);
      updateHashForPage('catalog');
    },
    [updateHashForPage],
  );

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
      const [path, searchString] = hash.split('?');
      const [route, slugOrId] = (path || '').split('/').filter(Boolean);
      const searchParams = new URLSearchParams(searchString ?? '');
      const categoryFilters = searchParams.getAll('category').filter(Boolean);

      setPaymentCheckoutUrl(null);
      setPaymentOrderId(null);

      switch (route) {
        case 'catalog':
          setCurrentPage('catalog');
          setSelectedBookId(null);
          setPendingSlug(null);
          setCatalogFiltersFromUrl(categoryFilters);
          break;
        case 'item':
          setCurrentPage('item');
          setSelectedBookId(null);
          setPendingSlug(slugOrId ?? null);
          setCatalogFiltersFromUrl([]);
          break;
        case 'cart':
          setCurrentPage('cart');
          setSelectedBookId(null);
          setPendingSlug(null);
          setCatalogFiltersFromUrl([]);
          break;
        case 'wishlist':
          setCurrentPage('wishlist');
          setSelectedBookId(null);
          setPendingSlug(null);
          setCatalogFiltersFromUrl([]);
          break;
        case 'about':
          setCurrentPage('about');
          setSelectedBookId(null);
          setPendingSlug(null);
          setCatalogFiltersFromUrl([]);
          break;
        case 'contact':
          setCurrentPage('contact');
          setSelectedBookId(null);
          setPendingSlug(null);
          setCatalogFiltersFromUrl([]);
          break;
        case 'tracking':
          setCurrentPage('tracking');
          setSelectedBookId(null);
          setPendingSlug(null);
          setCatalogFiltersFromUrl([]);
          break;
        case 'policies':
          setCurrentPage('policies');
          setSelectedBookId(null);
          setPendingSlug(null);
          setCatalogFiltersFromUrl([]);
          break;
        case 'terms':
          setCurrentPage('terms');
          setSelectedBookId(null);
          setPendingSlug(null);
          setCatalogFiltersFromUrl([]);
          break;
        case 'account':
          setCurrentPage('account');
          setSelectedBookId(null);
          setPendingSlug(null);
          setCatalogFiltersFromUrl([]);
          break;
        case 'login':
          setCurrentPage('login');
          setSelectedBookId(null);
          setPendingSlug(null);
          setCatalogFiltersFromUrl([]);
          break;
        case 'admin':
          setCurrentPage('admin');
          setSelectedBookId(null);
          setPendingSlug(null);
          setCatalogFiltersFromUrl([]);
          break;
        case 'database':
          setCurrentPage('database');
          setSelectedBookId(null);
          setPendingSlug(null);
          setCatalogFiltersFromUrl([]);
          break;
        case 'admin-customers':
          setCurrentPage('admin-customers');
          setSelectedBookId(null);
          setPendingSlug(null);
          setCatalogFiltersFromUrl([]);
          break;
        case 'payment':
          setCurrentPage('payment');
          setSelectedBookId(null);
          setPendingSlug(null);
          setCatalogFiltersFromUrl([]);
          setPaymentCheckoutUrl(searchParams.get('checkoutUrl'));
          setPaymentOrderId(searchParams.get('orderId'));
          break;
        default:
          setCurrentPage('home');
          setSelectedBookId(null);
          setPendingSlug(null);
          setCatalogFiltersFromUrl([]);
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
        <WishlistProvider>
          <SearchProvider
            searchItems={books}
            searchTerm={searchQuery}
            setSearchTerm={setSearchQuery}
            onSearch={handleSearch}
          >
            <AppContent
              currentPage={currentPage}
              selectedBookId={selectedBookId}
              onNavigate={handleNavigate}
              onLoginSuccess={handleLoginSuccess}
              books={books}
              loadingBooks={loadingBooks}
              pendingSlug={pendingSlug}
              catalogFiltersFromUrl={catalogFiltersFromUrl}
              paymentCheckoutUrl={paymentCheckoutUrl}
              paymentOrderId={paymentOrderId}
              customerAccount={customerAccount}
              onAccountUpdate={handleAccountUpdate}
              onLogout={handleLogout}
            />
          </SearchProvider>
        </WishlistProvider>
      </CartProvider>
    </LanguageProvider>
  );
}

interface AppContentProps {
  currentPage: string;
  selectedBookId: string | null;
  onNavigate: (page: string, bookId?: string) => void;
  onLoginSuccess: (account: CustomerAccount) => void;
  books: Book[];
  loadingBooks: boolean;
  pendingSlug: string | null;
  catalogFiltersFromUrl: string[];
  paymentCheckoutUrl: string | null;
  paymentOrderId: string | null;
  customerAccount: CustomerAccount | null;
  onAccountUpdate?: (account: CustomerAccount) => void;
  onLogout?: () => void;
}

function AppContent({
  currentPage,
  selectedBookId,
  onNavigate,
  onLoginSuccess,
  books,
  loadingBooks,
  pendingSlug,
  catalogFiltersFromUrl,
  paymentCheckoutUrl,
  paymentOrderId,
  customerAccount,
  onAccountUpdate,
  onLogout,
}: AppContentProps) {
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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [currentPage, selectedBookId]);

  return (
    <>
      {currentPage === 'home' && (
        <HomePage books={books} loading={loadingBooks} onNavigate={onNavigate} />
      )}
      {currentPage === 'catalog' && (
        <Catalog
          onNavigate={onNavigate}
          initialCategoryFilters={catalogFiltersFromUrl}
        />
      )}
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
      {currentPage === 'wishlist' && <WishlistPage onNavigate={onNavigate} />}
      {currentPage === 'account' && (
        <AccountPage
          onNavigate={onNavigate}
          account={customerAccount}
          onAccountUpdate={onAccountUpdate}
          onLogout={onLogout}
        />
      )}
      {currentPage === 'login' && (
        <LoginPage onNavigate={onNavigate} onLoginSuccess={onLoginSuccess} />
      )}
      {currentPage === 'about' && <AboutPage onNavigate={onNavigate} />}
      {currentPage === 'contact' && <ContactPage onNavigate={onNavigate} />}
      {currentPage === 'tracking' && <TrackingPage onNavigate={onNavigate} />}
      {currentPage === 'policies' && <PoliciesPage onNavigate={onNavigate} />}
      {currentPage === 'terms' && <TermsPage onNavigate={onNavigate} />}
      {currentPage === 'admin' && <AdminPage onNavigate={onNavigate} />}
      {currentPage === 'admin-customers' && <AdminCustomersPage onNavigate={onNavigate} />}
      {currentPage === 'database' && <DatabasePage onNavigate={onNavigate} />}
      {currentPage === 'payment' && (
        <PaymentPage
          checkoutUrl={paymentCheckoutUrl}
          orderId={paymentOrderId}
          onNavigate={onNavigate}
        />
      )}
    </>
  );
}

export default App;
