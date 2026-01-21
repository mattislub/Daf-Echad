import ProductCard from './ProductCard';
import { Book } from '../types/catalog';
import { useLanguage } from '../context/LanguageContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { CartItem } from '../types';

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
  const { addToCart } = useCart();
  const isRTL = language === 'he';

  const buildCartItem = (product: Book): CartItem => ({
    id: product.id,
    title_he: product.title_he,
    title_en: product.title_en,
    price_ils: product.price_ils,
    price_usd: product.price_usd,
    image_url: product.image_url,
    weight: product.weight,
    quantity: 1,
  });

  return (
    <section className="mb-12" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-yellow-700 hover:text-yellow-800 font-semibold flex items-center gap-2"
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
            onAddToCart={
              product.in_stock
                ? () => {
                    addToCart(buildCartItem(product));
                  }
                : undefined
            }
            onGoToCart={onGoToCart ? () => onGoToCart(product) : undefined}
            onImmediateCheckout={
              product.in_stock && onGoToCart
                ? () => {
                    addToCart(buildCartItem(product));
                    onGoToCart(product);
                  }
                : undefined
            }
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
