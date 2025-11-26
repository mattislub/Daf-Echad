import ProductCard from './ProductCard';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { Product } from '../types';

interface ProductSectionProps {
  title: string;
  products: Product[];
  onViewAll?: () => void;
  onViewDetails?: (product: Product) => void;
}

export default function ProductSection({ title, products, onViewAll, onViewDetails }: ProductSectionProps) {
  const { language } = useLanguage();
  const { addToCart } = useCart();
  const isRTL = language === 'he';

  const handleAddToCart = (product: Product) => {
    addToCart({ ...product, quantity: 1 });
  };

  return (
    <section className="mb-12" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
        <button
          onClick={onViewAll}
          className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          {isRTL ? 'צפה בהכל ←' : 'View All →'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={() => handleAddToCart(product)}
            onViewDetails={() => onViewDetails?.(product)}
          />
        ))}
      </div>
    </section>
  );
}
