import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Book, Category, Publisher, Author, FilterOptions } from '../types/catalog';
import FilterSidebar from '../components/FilterSidebar';
import ProductCard from '../components/ProductCard';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Loader2, SlidersHorizontal } from 'lucide-react';
import { getAuthors, getBooks, getCategories, getPublishers } from '../services/api';
import { getBookSlug } from '../utils/slug';

interface CatalogProps {
  onNavigate?: (page: string, bookSlug?: string) => void;
}

export default function Catalog({ onNavigate }: CatalogProps = {}) {
  const { language, currency } = useLanguage();
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    categories: [],
    publishers: [],
    authors: [],
    sizes: [],
    colors: [],
    volumes: [],
    bindings: [],
    languages: [],
    originalText: null,
    priceRange: { min: 0, max: 1000 },
    inStockOnly: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [books, filters, currency]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [booksData, categoriesData, publishersData, authorsData] = await Promise.all([
        getBooks(),
        getCategories(),
        getPublishers(),
        getAuthors(),
      ]);

      const booksWithCategories = (booksData ?? []).map((book) => {
        const category = categoriesData?.find((cat) => cat.id === book.category_id);
        return category ? { ...book, category } : book;
      });

      setBooks(booksWithCategories);
      setFilteredBooks(booksWithCategories);
      setCategories(categoriesData ?? []);
      setPublishers(publishersData ?? []);
      setAuthors(authorsData ?? []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...books];

    // Filter by categories
    if (filters.categories.length > 0) {
      result = result.filter((book) =>
        book.category_id && filters.categories.includes(book.category_id)
      );
    }

    // Filter by publishers
    if (filters.publishers.length > 0) {
      result = result.filter((book) =>
        book.publisher_id && filters.publishers.includes(book.publisher_id)
      );
    }

    // Filter by authors
    if (filters.authors.length > 0) {
      result = result.filter((book) =>
        book.author_id && filters.authors.includes(book.author_id)
      );
    }

    // Filter by price range
    if (currency === 'ILS') {
      result = result.filter(
        (book) =>
          book.price_ils >= filters.priceRange.min &&
          book.price_ils <= filters.priceRange.max
      );
    } else {
      result = result.filter(
        (book) =>
          book.price_usd >= filters.priceRange.min &&
          book.price_usd <= filters.priceRange.max
      );
    }

    // Filter by original text
    if (filters.originalText !== null) {
      result = result.filter((book) => book.original_text === filters.originalText);
    }

    // Filter by in stock
    if (filters.inStockOnly) {
      result = result.filter((book) => book.in_stock);
    }

    setFilteredBooks(result);
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {language === 'he' ? 'קטלוג ספרים' : 'Book Catalog'}
          </h1>
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              {filteredBooks.length} {language === 'he' ? 'ספרים' : 'books'}
            </p>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <SlidersHorizontal className="w-5 h-5" />
              {language === 'he' ? 'סינון' : 'Filters'}
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block">
            <FilterSidebar
              filters={filters}
              onFilterChange={handleFilterChange}
              availableCategories={categories}
              availablePublishers={publishers}
              availableAuthors={authors}
            />
          </aside>

          {/* Sidebar - Mobile */}
          {showFilters && (
            <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowFilters(false)}>
              <div className="bg-white h-full w-80 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-4">
                  <button
                    onClick={() => setShowFilters(false)}
                    className="mb-4 text-gray-600 hover:text-gray-900"
                  >
                    {language === 'he' ? 'סגור' : 'Close'}
                  </button>
                  <FilterSidebar
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    availableCategories={categories}
                    availablePublishers={publishers}
                    availableAuthors={authors}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1">
            {filteredBooks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  {language === 'he' ? 'לא נמצאו ספרים' : 'No books found'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredBooks.map((book) => (
                  <ProductCard
                    key={book.id}
                    id={book.id}
                    title={language === 'he' ? book.title_he : book.title_en}
                    price={currency === 'ILS' ? book.price_ils : book.price_usd}
                    image={book.image_url}
                    category={
                      book.category
                        ? language === 'he'
                          ? book.category.name_he
                          : book.category.name_en
                        : ''
                    }
                    onViewDetails={() => onNavigate?.('item', getBookSlug(book))}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
