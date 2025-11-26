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
import { Product } from './types';
import mockProducts from './data/mockProducts.json';
import { applySeoForPage } from './services/seo';

const products: Product[] = mockProducts as Product[];

function HomePage({ onNavigate }: { onNavigate: (page: string, bookId?: string) => void }) {
  const { t } = useLanguage();

  const featuredProducts = products.filter((p) => p.is_featured);
  const newArrivals = products.filter((p) => p.is_new);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} />

      <main className="container mx-auto px-4 py-8">
        <Banner />

        <div className="my-12">
          <CategoryCards />
        </div>

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
      </main>

      <Footer />
    </div>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  const handleNavigate = (page: string, bookId?: string) => {
    setCurrentPage(page);
    setSelectedBookId(bookId ?? null);
  };

  return (
    <LanguageProvider>
      <CartProvider>
        <AppContent
          currentPage={currentPage}
          selectedBookId={selectedBookId}
          onNavigate={handleNavigate}
        />
      </CartProvider>
    </LanguageProvider>
  );
}

interface AppContentProps {
  currentPage: string;
  selectedBookId: string | null;
  onNavigate: (page: string, bookId?: string) => void;
}

function AppContent({ currentPage, selectedBookId, onNavigate }: AppContentProps) {
  const { language, t } = useLanguage();

  const selectedProduct = useMemo<Product | undefined>(
    () => products.find((product) => product.id === selectedBookId),
    [selectedBookId],
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
      {currentPage === 'home' && <HomePage onNavigate={onNavigate} />}
      {currentPage === 'catalog' && <Catalog onNavigate={onNavigate} />}
      {currentPage === 'item' && selectedBookId && (
        <ItemPage bookId={selectedBookId} onNavigate={onNavigate} />
      )}
    </>
  );
}

export default App;
