import { ShoppingCart, Star, Book, Eye, Heart, CreditCard } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  image: string;
  category?: string;
  onAddToCart?: () => void;
  onViewDetails?: () => void;
  onGoToCart?: () => void;
  onImmediateCheckout?: () => void;
  isFeatured?: boolean;
  inStock?: boolean;
  onToggleWishlist?: () => void;
  isInWishlist?: boolean;
}

export default function ProductCard({
  title,
  price,
  image,
  category,
  onAddToCart,
  onViewDetails,
  onGoToCart,
  onImmediateCheckout,
  isFeatured = false,
  inStock = true,
  onToggleWishlist,
  isInWishlist = false,
}: ProductCardProps) {
  const { language, currency } = useLanguage();
  const isRTL = language === 'he';
  const currencySymbol = currency === 'ILS' ? '₪' : '$';

  return (
    <div
      className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group border border-yellow-600/20 hover:border-yellow-600/40"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="relative h-64 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden border-b border-yellow-600/20 p-6">
        {image ? (
          <img
            src={image}
            alt={title}
            className="max-h-full max-w-full object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-500 rounded-2xl bg-white/80 p-2"
          />
        ) : (
          <Book className="w-16 h-16 text-gray-400 stroke-[1.5]" />
        )}
        {isFeatured && (
          <div className="absolute top-3 left-3 bg-gray-800 text-white p-2 rounded shadow-lg">
            <Star className="w-4 h-4 fill-white" />
          </div>
        )}
        {onToggleWishlist && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleWishlist();
            }}
            className="absolute top-3 right-3 bg-white/90 hover:bg-white text-yellow-700 p-2 rounded-full shadow-md border border-yellow-100 transition"
            aria-label={isInWishlist ? (isRTL ? 'הסר מרשימת המשאלות' : 'Remove from wishlist') : isRTL ? 'הוסף לרשימת המשאלות' : 'Add to wishlist'}
          >
            <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-yellow-600 text-yellow-700' : 'text-yellow-700'}`} />
          </button>
        )}
        {onViewDetails && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails();
            }}
            className="absolute inset-0 bg-black/0 hover:bg-black/40 opacity-0 hover:opacity-100 transition-all duration-300 flex items-center justify-center"
          >
            <div className="bg-white text-gray-900 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <Eye className="w-5 h-5" />
              <span>{isRTL ? 'צפה בפרטים' : 'View Details'}</span>
            </div>
          </button>
        )}
      </div>

      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">{title}</h3>

        {category && <p className="text-sm text-gray-500 mb-1">{category}</p>}

        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold bg-gradient-to-r from-yellow-700 to-yellow-600 bg-clip-text text-transparent">
            {currencySymbol}
            {price.toFixed(2)}
          </span>
          {onAddToCart && (
            <span className="text-sm text-gray-500">
              {inStock ? (
                <span className="text-green-600 font-medium">{isRTL ? 'במלאי' : 'In Stock'}</span>
              ) : (
                <span className="text-red-600 font-medium">{isRTL ? 'אזל המלאי' : 'Out of Stock'}</span>
              )}
            </span>
          )}
        </div>

        {(onAddToCart || onViewDetails || onImmediateCheckout) && (
          <div className="flex items-center gap-2 mb-4">
            {onAddToCart && (
              <button
                type="button"
                onClick={onAddToCart}
                disabled={!inStock}
                aria-label={isRTL ? 'הוסף לעגלה' : 'Add to cart'}
                title={isRTL ? 'הוסף לעגלה' : 'Add to cart'}
                className="p-2 rounded-full border border-yellow-100 bg-white text-gray-700 hover:text-yellow-700 hover:border-yellow-200 shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingCart className="w-5 h-5" />
              </button>
            )}
            {onViewDetails && (
              <button
                type="button"
                onClick={onViewDetails}
                aria-label={isRTL ? 'צפה בדף מוצר' : 'View product page'}
                title={isRTL ? 'צפה בדף מוצר' : 'View product page'}
                className="p-2 rounded-full border border-yellow-100 bg-white text-gray-700 hover:text-yellow-700 hover:border-yellow-200 shadow-sm transition"
              >
                <Eye className="w-5 h-5" />
              </button>
            )}
            {onImmediateCheckout && (
              <button
                type="button"
                onClick={onImmediateCheckout}
                aria-label={isRTL ? 'מעבר לתשלום מיידי' : 'Immediate checkout'}
                title={isRTL ? 'מעבר לתשלום מיידי' : 'Immediate checkout'}
                className="p-2 rounded-full border border-yellow-100 bg-white text-gray-700 hover:text-yellow-700 hover:border-yellow-200 shadow-sm transition"
              >
                <CreditCard className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {(onAddToCart || onGoToCart) && (
          <div className="flex flex-col gap-2">
            {onAddToCart && (
              <button
                onClick={onAddToCart}
                disabled={!inStock}
                className="w-full bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded font-semibold flex items-center justify-center gap-2 transition-all border border-yellow-600/30"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>{isRTL ? 'הוסף לעגלה' : 'Add to Cart'}</span>
              </button>
            )}
            {onGoToCart && (
              <button
                type="button"
                onClick={onGoToCart}
                className="w-full border-2 border-yellow-600/60 text-yellow-800 bg-yellow-50 hover:bg-yellow-100 py-3 rounded font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>{isRTL ? 'מעבר לעגלה' : 'Go to Cart'}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
