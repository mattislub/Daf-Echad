import { ShoppingCart, Star, Book, Eye } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Product } from '../types';

interface ProductCardPropsOld {
  product: Product;
  onAddToCart: () => void;
  onViewDetails?: () => void;
}

interface ProductCardPropsNew {
  id: string;
  title: string;
  price: number;
  image: string;
  category: string;
  onViewDetails?: () => void;
}

type ProductCardProps = ProductCardPropsOld | ProductCardPropsNew;

function isOldProps(props: ProductCardProps): props is ProductCardPropsOld {
  return 'product' in props;
}

export default function ProductCard(props: ProductCardProps) {
  const { language, currency } = useLanguage();
  const isRTL = language === 'he';

  let title: string;
  let price: number;
  let currencySymbol: string;
  let imageUrl: string;
  let isNew: boolean = false;
  let isFeatured: boolean = false;
  let stock: number = 1;
  let onAddToCart: (() => void) | undefined;
  let onViewDetails: (() => void) | undefined;

  if (isOldProps(props)) {
    const { product } = props;
    title = isRTL ? product.title_he : product.title_en;
    price = currency === 'ILS' ? product.price_ils : product.price_usd;
    currencySymbol = currency === 'ILS' ? '₪' : '$';
    imageUrl = product.image_url;
    isNew = product.is_new || false;
    isFeatured = product.is_featured || false;
    stock = product.stock || 0;
    onAddToCart = props.onAddToCart;
    onViewDetails = props.onViewDetails;
  } else {
    title = props.title;
    price = props.price;
    currencySymbol = currency === 'ILS' ? '₪' : '$';
    imageUrl = props.image;
    onViewDetails = props.onViewDetails;
  }

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group border border-yellow-600/20 hover:border-yellow-600/40" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="relative h-64 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden border-b border-yellow-600/20 p-6">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="max-h-full max-w-full object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-500 rounded-2xl bg-white/80 p-2"
          />
        ) : (
          <Book className="w-16 h-16 text-gray-400 stroke-[1.5]" />
        )}
        {isNew && (
          <div className="absolute top-3 right-3 bg-gray-900 text-white px-3 py-1 rounded text-xs font-semibold tracking-wide shadow-lg">
            {isRTL ? 'חדש' : 'NEW'}
          </div>
        )}
        {isFeatured && (
          <div className="absolute top-3 left-3 bg-gray-800 text-white p-2 rounded shadow-lg">
            <Star className="w-4 h-4 fill-white" />
          </div>
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
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">
          {title}
        </h3>

        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold bg-gradient-to-r from-yellow-700 to-yellow-600 bg-clip-text text-transparent">
            {currencySymbol}{price.toFixed(2)}
          </span>
          {isOldProps(props) && (
            <span className="text-sm text-gray-500">
              {stock > 0 ? (
                <span className="text-green-600 font-medium">
                  {isRTL ? 'במלאי' : 'In Stock'}
                </span>
              ) : (
                <span className="text-red-600 font-medium">
                  {isRTL ? 'אזל המלאי' : 'Out of Stock'}
                </span>
              )}
            </span>
          )}
        </div>

        {onAddToCart && (
          <button
            onClick={onAddToCart}
            disabled={stock === 0}
            className="w-full bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded font-semibold flex items-center justify-center gap-2 transition-all border border-yellow-600/30"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>{isRTL ? 'הוסף לעגלה' : 'Add to Cart'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
