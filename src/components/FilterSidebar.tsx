import { useLanguage } from '../context/LanguageContext';
import { FilterOptions } from '../types/catalog';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface FilterSidebarProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  availableCategories: Array<{ id: string; name_en: string; name_he: string }>;
  availablePublishers: Array<{ id: string; name: string }>;
  availableAuthors: Array<{ id: string; name: string }>;
}

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const FilterSection = ({ title, children, defaultOpen = true }: FilterSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left font-semibold text-gray-900 hover:text-yellow-600 transition-colors"
      >
        {title}
        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      {isOpen && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );
};

export default function FilterSidebar({
  filters,
  onFilterChange,
  availableCategories,
  availablePublishers,
  availableAuthors,
}: FilterSidebarProps) {
  const { t, language, currency } = useLanguage();

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter((id) => id !== categoryId)
      : [...filters.categories, categoryId];
    onFilterChange({ ...filters, categories: newCategories });
  };

  const handlePublisherToggle = (publisherId: string) => {
    const newPublishers = filters.publishers.includes(publisherId)
      ? filters.publishers.filter((id) => id !== publisherId)
      : [...filters.publishers, publisherId];
    onFilterChange({ ...filters, publishers: newPublishers });
  };

  const handleAuthorToggle = (authorId: string) => {
    const newAuthors = filters.authors.includes(authorId)
      ? filters.authors.filter((id) => id !== authorId)
      : [...filters.authors, authorId];
    onFilterChange({ ...filters, authors: newAuthors });
  };

  const handlePriceRangeChange = (min: number, max: number) => {
    onFilterChange({ ...filters, priceRange: { min, max } });
  };

  const handleOriginalTextToggle = (value: boolean | null) => {
    onFilterChange({ ...filters, originalText: value });
  };

  const handleInStockToggle = () => {
    onFilterChange({ ...filters, inStockOnly: !filters.inStockOnly });
  };

  const clearAllFilters = () => {
    onFilterChange({
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
  };

  return (
    <div className="w-full lg:w-72 bg-white border border-gray-200 rounded-lg shadow-sm sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {language === 'he' ? 'סינון' : 'Filters'}
          </h2>
          <button
            onClick={clearAllFilters}
            className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
          >
            {language === 'he' ? 'נקה הכל' : 'Clear All'}
          </button>
        </div>

        {/* Availability */}
        <div className="mb-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={filters.inStockOnly}
              onChange={handleInStockToggle}
              className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
            />
            <span className="mr-2 text-sm text-gray-700">
              {language === 'he' ? 'במלאי בלבד' : 'In Stock Only'}
            </span>
          </label>
        </div>

        {/* Categories */}
        {availableCategories.length > 0 && (
          <FilterSection title={language === 'he' ? 'קטגוריות' : 'Categories'}>
            {availableCategories.map((category) => (
              <label key={category.id} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(category.id)}
                  onChange={() => handleCategoryToggle(category.id)}
                  className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                />
                <span className="mr-2 text-sm text-gray-700">
                  {language === 'he' ? category.name_he : category.name_en}
                </span>
              </label>
            ))}
          </FilterSection>
        )}

        {/* Publishers */}
        {availablePublishers.length > 0 && (
          <FilterSection title={language === 'he' ? 'הוצאה לאור' : 'Publishers'}>
            {availablePublishers.map((publisher) => (
              <label key={publisher.id} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.publishers.includes(publisher.id)}
                  onChange={() => handlePublisherToggle(publisher.id)}
                  className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                />
                <span className="mr-2 text-sm text-gray-700">{publisher.name}</span>
              </label>
            ))}
          </FilterSection>
        )}

        {/* Authors */}
        {availableAuthors.length > 0 && (
          <FilterSection title={language === 'he' ? 'מחברים' : 'Authors'}>
            {availableAuthors.map((author) => (
              <label key={author.id} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.authors.includes(author.id)}
                  onChange={() => handleAuthorToggle(author.id)}
                  className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                />
                <span className="mr-2 text-sm text-gray-700">{author.name}</span>
              </label>
            ))}
          </FilterSection>
        )}

        {/* Price Range */}
        <FilterSection title={language === 'he' ? 'טווח מחירים' : 'Price Range'}>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={filters.priceRange.min}
                onChange={(e) => handlePriceRangeChange(Number(e.target.value), filters.priceRange.max)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                placeholder={language === 'he' ? 'מינימום' : 'Min'}
                min="0"
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                value={filters.priceRange.max}
                onChange={(e) => handlePriceRangeChange(filters.priceRange.min, Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                placeholder={language === 'he' ? 'מקסימום' : 'Max'}
                min="0"
              />
            </div>
            <div className="text-xs text-gray-500">
              {currency === 'ILS' ? '₪' : '$'}
              {filters.priceRange.min} - {currency === 'ILS' ? '₪' : '$'}
              {filters.priceRange.max}
            </div>
          </div>
        </FilterSection>

        {/* Original Text */}
        <FilterSection title={language === 'he' ? 'טקסט מקורי' : 'Original Text'}>
          <div className="space-y-2">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                checked={filters.originalText === null}
                onChange={() => handleOriginalTextToggle(null)}
                className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                name="originalText"
              />
              <span className="mr-2 text-sm text-gray-700">
                {language === 'he' ? 'הכל' : 'All'}
              </span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                checked={filters.originalText === true}
                onChange={() => handleOriginalTextToggle(true)}
                className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                name="originalText"
              />
              <span className="mr-2 text-sm text-gray-700">
                {language === 'he' ? 'עם טקסט מקורי' : 'With Original Text'}
              </span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                checked={filters.originalText === false}
                onChange={() => handleOriginalTextToggle(false)}
                className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                name="originalText"
              />
              <span className="mr-2 text-sm text-gray-700">
                {language === 'he' ? 'ללא טקסט מקורי' : 'Without Original Text'}
              </span>
            </label>
          </div>
        </FilterSection>
      </div>
    </div>
  );
}
