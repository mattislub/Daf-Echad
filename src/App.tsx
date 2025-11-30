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
import { Book } from './types/catalog';
import { applySeoForPage } from './services/seo';
import { getBooks, getCategories } from './services/api';
import { Loader2 } from 'lucide-react';

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

  const handleNavigate = (page: string, bookId?: string) => {
    setCurrentPage(page);
    setSelectedBookId(bookId ?? null);
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
          currentPage={currentPage}
          selectedBookId={selectedBookId}
          onNavigate={handleNavigate}
          books={books}
          loadingBooks={loadingBooks}
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
}

function AppContent({ currentPage, selectedBookId, onNavigate, books, loadingBooks }: AppContentProps) {
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
    </>
  );
}

export default App;
