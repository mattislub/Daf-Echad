import { useMemo, useState, useEffect } from 'react';
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
import { Book } from './types/catalog';
import { applySeoForPage } from './services/seo';
import { getBooks, getCategories } from './services/api';
import { Loader2 } from 'lucide-react';
import { getBookSlug } from './utils/slug';

type PageKey = 'home' | 'catalog' | 'item' | 'cart' | 'account';

interface RouteState {
  page: PageKey;
  slug?: string | null;
}

function HomePage({
  books,
  loading,
  onViewAll,
  onViewDetails,
}: {
  books: Book[];
  loading: boolean;
  onViewAll: () => void;
  onViewDetails: (product: Book) => void;
}) {
  const { t } = useLanguage();

  const featuredProducts = books.filter((p) => p.featured);
  const newArrivals = books.filter((p) => !p.featured).slice(0, 8);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

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
              onViewAll={onViewAll}
              onViewDetails={onViewDetails}
            />

            <ProductSection
              title={t('new.arrivals')}
              products={newArrivals}
              onViewAll={onViewAll}
              onViewDetails={onViewDetails}
            />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

function App() {
  const [route, setRoute] = useState<RouteState>(() =>
    getRouteFromPath(window.location.pathname),
  );
  const [books, setBooks] = useState<Book[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);

  useEffect(() => {
    const handlePopState = () => setRoute(getRouteFromPath(window.location.pathname));

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (page: PageKey, bookSlug?: string) => {
    const targetPath = getPathForPage(page, bookSlug);

    if (targetPath) {
      window.history.pushState({}, '', targetPath);
      setRoute({ page, slug: bookSlug });
    }
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

  return (
    <LanguageProvider>
      <CartProvider>
        <AppContent
          route={route}
          onNavigate={handleNavigate}
          books={books}
          loadingBooks={loadingBooks}
        />
      </CartProvider>
    </LanguageProvider>
  );
}

function AppContent({ route, onNavigate, books, loadingBooks }: {
  route: RouteState;
  onNavigate: (page: PageKey, bookSlug?: string) => void;
  books: Book[];
  loadingBooks: boolean;
}) {
  const { language, t } = useLanguage();
  const [selectedProduct, setSelectedProduct] = useState<Book | undefined>();

  useEffect(() => {
    if (route.page !== 'item') {
      setSelectedProduct(undefined);
    }
  }, [route.page]);

  const selectedBookFromList = useMemo<Book | undefined>(
    () =>
      route.page === 'item' && route.slug
        ? books.find((product) => getBookSlug(product) === route.slug)
        : undefined,
    [books, route.page, route.slug],
  );

  useEffect(() => {
    const productForSeo = route.page === 'item'
      ? selectedProduct ?? selectedBookFromList
      : undefined;

    applySeoForPage(route.page, {
      language,
      t,
      product: productForSeo,
    });
  }, [language, route.page, route.slug, selectedBookFromList, selectedProduct, t]);

  const handleViewDetails = (product: Book) => {
    const slug = getBookSlug(product);
    onNavigate('item', slug);
    setSelectedProduct(product);
  };

  return (
    <>
      {route.page === 'home' && (
        <HomePage
          books={books}
          loading={loadingBooks}
          onViewAll={() => onNavigate('catalog')}
          onViewDetails={handleViewDetails}
        />
      )}
      {route.page === 'catalog' && <Catalog onNavigate={onNavigate} />}
      {route.page === 'item' && route.slug && (
        <ItemPage
          bookSlug={route.slug}
          books={books}
          onNavigate={onNavigate}
          onBookResolved={setSelectedProduct}
        />
      )}
      {route.page === 'cart' && <CartPage onNavigate={onNavigate} />}
      {route.page === 'account' && <AccountPage onNavigate={onNavigate} />}
    </>
  );
}

function getRouteFromPath(path: string): RouteState {
  const normalizedPath = path.replace(/\/+$/, '') || '/';

  if (normalizedPath.startsWith('/catalog')) return { page: 'catalog' };
  if (normalizedPath.startsWith('/cart')) return { page: 'cart' };
  if (normalizedPath.startsWith('/account')) return { page: 'account' };
  if (normalizedPath.startsWith('/item/')) {
    const slug = decodeURIComponent(normalizedPath.replace('/item/', ''));
    return { page: 'item', slug };
  }

  return { page: 'home' };
}

function getPathForPage(page: PageKey, slug?: string) {
  switch (page) {
    case 'home':
      return '/';
    case 'catalog':
      return '/catalog';
    case 'cart':
      return '/cart';
    case 'account':
      return '/account';
    case 'item':
      return slug ? `/item/${slug}` : null;
    default:
      return '/';
  }
}

export default App;
