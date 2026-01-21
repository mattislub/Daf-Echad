import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from 'react';
import { Book } from '../types/catalog';
import { addWishlistItem, getBookById, getCustomerWishlist } from '../services/api';
import { useLanguage } from './LanguageContext';
import { buildProductPath } from '../utils/slug';
import { resolvePrimaryImage } from '../utils/imagePaths';
import { loadStoredCustomerAccount } from '../utils/customerSession';
import { CustomerAccount } from '../types';

interface WishlistContextType {
  wishlistItems: Book[];
  addToWishlist: (item: Book) => void;
  removeFromWishlist: (id: string) => void;
  toggleWishlist: (item: Book) => void;
  isInWishlist: (id: string) => boolean;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);
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
  const [customerAccount, setCustomerAccount] = useState<CustomerAccount | null>(() => loadStoredCustomerAccount());
  const syncedWishlistIds = useRef<Set<string>>(new Set());
  const previousCustomerId = useRef<string | null>(customerAccount?.id ?? null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleAccountUpdate = () => {
      setCustomerAccount(loadStoredCustomerAccount());
    };

    window.addEventListener('customer-account-updated', handleAccountUpdate);
    window.addEventListener('storage', handleAccountUpdate);

    return () => {
      window.removeEventListener('customer-account-updated', handleAccountUpdate);
      window.removeEventListener('storage', handleAccountUpdate);
    };
  }, []);

  useEffect(() => {
    const currentCustomerId = customerAccount?.id ?? null;
    if (previousCustomerId.current && previousCustomerId.current !== currentCustomerId) {
      syncedWishlistIds.current.clear();
    }
    previousCustomerId.current = currentCustomerId;
  }, [customerAccount?.id]);

  const logWishlistAdd = useCallback(
    async (item: Book, items: Book[]) => {
      if (syncedWishlistIds.current.has(item.id)) {
        return;
      }

      const account = customerAccount;
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
        syncedWishlistIds.current.add(item.id);
      } catch (error) {
        console.error('Failed to log wishlist update', error);
      }
    },
    [customerAccount, language],
  );

  useEffect(() => {
    if (!customerAccount?.id || wishlistItems.length === 0) {
      return;
    }

    wishlistItems.forEach((item) => {
      if (!syncedWishlistIds.current.has(item.id)) {
        Promise.resolve().then(() => logWishlistAdd(item, wishlistItems));
      }
    });
  }, [customerAccount?.id, logWishlistAdd, wishlistItems]);

  const addToWishlist = useCallback((item: Book) => {
    setWishlistItems((prev) => {
      const exists = prev.some((existing) => existing.id === item.id);
      if (exists) return prev;
      return [...prev, item];
    });
  }, []);

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
        return [...prev, item];
      });
    },
    [],
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
