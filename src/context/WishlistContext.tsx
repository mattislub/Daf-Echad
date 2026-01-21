import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Book } from '../types/catalog';
import { CustomerAccount } from '../types';
import { addWishlistItem } from '../services/api';
import { useLanguage } from './LanguageContext';
import { buildProductPath } from '../utils/slug';
import { resolvePrimaryImage } from '../utils/imagePaths';

interface WishlistContextType {
  wishlistItems: Book[];
  addToWishlist: (item: Book) => void;
  removeFromWishlist: (id: string) => void;
  toggleWishlist: (item: Book) => void;
  isInWishlist: (id: string) => boolean;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);
const CUSTOMER_ACCOUNT_STORAGE_KEY = 'daf_customer_account';

type StoredCustomerAccount = {
  account: CustomerAccount;
  expiresAt: number;
};

function loadStoredCustomerAccount(): CustomerAccount | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = window.localStorage.getItem(CUSTOMER_ACCOUNT_STORAGE_KEY);
  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored) as StoredCustomerAccount;
    if (!parsed?.account || !parsed?.expiresAt) {
      window.localStorage.removeItem(CUSTOMER_ACCOUNT_STORAGE_KEY);
      return null;
    }

    if (parsed.expiresAt <= Date.now()) {
      window.localStorage.removeItem(CUSTOMER_ACCOUNT_STORAGE_KEY);
      return null;
    }

    return parsed.account;
  } catch (error) {
    console.warn('Failed to parse stored customer account', error);
    window.localStorage.removeItem(CUSTOMER_ACCOUNT_STORAGE_KEY);
    return null;
  }
}

function buildAbsoluteUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (typeof window === 'undefined') return path;
  const origin = window.location.origin;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${normalizedPath}`;
}

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [wishlistItems, setWishlistItems] = useState<Book[]>([]);
  const { language } = useLanguage();

  const logWishlistAdd = useCallback(
    async (item: Book, items: Book[]) => {
      const account = loadStoredCustomerAccount();
      if (!account?.id) {
        return;
      }

      const customerName = [account.firstName, account.lastName].filter(Boolean).join(' ').trim() || undefined;
      const formatter = new Intl.NumberFormat(language === 'he' ? 'he-IL' : 'en-US', {
        style: 'currency',
        currency: 'ILS',
      });

      const payloadItems = items.map((wishlistItem) => {
        const title = language === 'he' ? wishlistItem.title_he : wishlistItem.title_en || wishlistItem.title_he;
        const imageUrl = buildAbsoluteUrl(resolvePrimaryImage(wishlistItem));
        const productUrl = buildAbsoluteUrl(buildProductPath(wishlistItem));
        const priceLabel = Number.isFinite(wishlistItem.price_ils)
          ? formatter.format(wishlistItem.price_ils)
          : undefined;

        return {
          id: wishlistItem.id,
          title: title || wishlistItem.id,
          imageUrl: imageUrl || undefined,
          priceLabel,
          productUrl,
        };
      });

      try {
        await addWishlistItem({
          customerId: account.id,
          itemId: item.id,
          customerEmail: account.email || undefined,
          customerName,
          language,
          items: payloadItems,
        });
      } catch (error) {
        console.error('Failed to log wishlist update', error);
      }
    },
    [language],
  );

  const addToWishlist = useCallback((item: Book) => {
    setWishlistItems((prev) => {
      const exists = prev.some((existing) => existing.id === item.id);
      if (exists) return prev;
      const next = [...prev, item];
      Promise.resolve().then(() => logWishlistAdd(item, next));
      return next;
    });
  }, [logWishlistAdd]);

  const removeFromWishlist = useCallback((id: string) => {
    setWishlistItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toggleWishlist = useCallback(
    (item: Book) => {
      setWishlistItems((prev) => {
        const exists = prev.some((existing) => existing.id === item.id);
        if (exists) {
          return prev.filter((existing) => existing.id !== item.id);
        }
        const next = [...prev, item];
        Promise.resolve().then(() => logWishlistAdd(item, next));
        return next;
      });
    },
    [logWishlistAdd],
  );

  const isInWishlist = useCallback(
    (id: string) => wishlistItems.some((item) => item.id === id),
    [wishlistItems],
  );

  const clearWishlist = useCallback(() => setWishlistItems([]), []);

  return (
    <WishlistContext.Provider
      value={{ wishlistItems, addToWishlist, removeFromWishlist, toggleWishlist, isInWishlist, clearWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
};
