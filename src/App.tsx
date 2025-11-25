import { useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { CartProvider } from './context/CartContext';
import { useLanguage } from './context/LanguageContext';
import Header from './components/Header';
import Banner from './components/Banner';
import CategoryCards from './components/CategoryCards';
import ProductSection from './components/ProductSection';
import Footer from './components/Footer';
import Catalog from './pages/Catalog';
import ItemPage from './pages/ItemPage';
import { Product } from './types';

const mockProducts: Product[] = [
  {
    id: '1',
    title_he: 'ליקוטי מוהר"ן - חלק א',
    title_en: 'Likutey Moharan - Part 1',
    price_ils: 89.90,
    price_usd: 24.99,
    category: 'likutey',
    is_featured: true,
    is_new: false,
    stock: 15,
    image_url: '/logo.png',
  },
  {
    id: '2',
    title_he: 'סיפורי מעשיות',
    title_en: "Rabbi Nachman's Stories",
    price_ils: 69.90,
    price_usd: 19.99,
    category: 'stories',
    is_featured: true,
    is_new: false,
    stock: 23,
    image_url: '/logo.png',
  },
  {
    id: '3',
    title_he: 'ספר המידות',
    title_en: 'Sefer HaMidot',
    price_ils: 49.90,
    price_usd: 14.99,
    category: 'prayer',
    is_featured: false,
    is_new: true,
    stock: 30,
    image_url: '/logo.png',
  },
  {
    id: '4',
    title_he: 'ליקוטי תפילות',
    title_en: 'Likutey Tefilot',
    price_ils: 79.90,
    price_usd: 22.99,
    category: 'prayer',
    is_featured: true,
    is_new: false,
    stock: 18,
    image_url: '/logo.png',
  },
  {
    id: '5',
    title_he: 'סיפורי צדיקים לילדים',
    title_en: 'Stories for Children',
    price_ils: 39.90,
    price_usd: 11.99,
    category: 'children',
    is_featured: false,
    is_new: true,
    stock: 42,
    image_url: '/logo.png',
  },
  {
    id: '6',
    title_he: 'חיי מוהר"ן',
    title_en: "Rabbi Nachman's Wisdom",
    price_ils: 59.90,
    price_usd: 16.99,
    category: 'stories',
    is_featured: false,
    is_new: true,
    stock: 25,
    image_url: '/logo.png',
  },
  {
    id: '7',
    title_he: 'שבחי הר"ן',
    title_en: 'Shivchey HaRan',
    price_ils: 54.90,
    price_usd: 15.99,
    category: 'stories',
    is_featured: false,
    is_new: false,
    stock: 12,
    image_url: '/logo.png',
  },
  {
    id: '8',
    title_he: 'ספר ברסלב לנשים',
    title_en: 'Breslov for Women',
    price_ils: 64.90,
    price_usd: 18.99,
    category: 'women',
    is_featured: true,
    is_new: true,
    stock: 20,
    image_url: '/logo.png',
  },
];

function HomePage({ onNavigate }: { onNavigate: (page: string, bookId?: string) => void }) {
  const { t } = useLanguage();

  const featuredProducts = mockProducts.filter(p => p.is_featured);
  const newArrivals = mockProducts.filter(p => p.is_new);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} />

      <main className="container mx-auto px-4 py-8">
        <Banner />

        <div className="my-12">
          <CategoryCards />
        </div>

        <ProductSection title={t('featured')} products={featuredProducts} />

        <ProductSection title={t('new.arrivals')} products={newArrivals} />
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
    if (bookId) {
      setSelectedBookId(bookId);
    }
  };

  return (
    <LanguageProvider>
      <CartProvider>
        {currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}
        {currentPage === 'catalog' && <Catalog onNavigate={handleNavigate} />}
        {currentPage === 'item' && selectedBookId && <ItemPage bookId={selectedBookId} onNavigate={handleNavigate} />}
      </CartProvider>
    </LanguageProvider>
  );
}

export default App;
