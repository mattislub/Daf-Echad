import ProductCard from './ProductCard';
import { Book } from '../types/catalog';
import { useLanguage } from '../context/LanguageContext';
import { useWishlist } from '../context/WishlistContext';

interface ProductSectionProps {
  title: string;
  products: Book[];
  onViewAll?: () => void;
  onViewDetails?: (product: Book) => void;
  onGoToCart?: (product: Book) => void;
}

export default function ProductSection({
  title,
  products,
  onViewAll,
  onViewDetails,
  onGoToCart,
}: ProductSectionProps) {
  const { language, currency } = useLanguage();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isRTL = language === 'he';

  return (
    <section className="mb-12" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-3xl sm:text-4xl font-semibold text-gray-900 tracking-tight">
          {title}
        </h2>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-base text-yellow-700 hover:text-yellow-800 font-semibold flex items-center gap-2"
          >
            {language === 'he' ? 'הצג הכל' : 'View All'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            title={language === 'he' ? product.title_he : product.title_en}
            price={currency === 'ILS' ? product.price_ils : product.price_usd}
            image={product.image_url}
            category={
              product.category
                ? language === 'he'
                  ? product.category.name_he
                  : product.category.name_en
                : ''
            }
            onViewDetails={onViewDetails ? () => onViewDetails(product) : undefined}
            onGoToCart={onGoToCart ? () => onGoToCart(product) : undefined}
            isFeatured={product.featured}
            inStock={product.in_stock}
            onToggleWishlist={() => toggleWishlist(product)}
            isInWishlist={isInWishlist(product.id)}
          />
        ))}
      </div>
    </section>
  );
}
