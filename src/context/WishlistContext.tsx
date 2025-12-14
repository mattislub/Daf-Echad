import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Book } from '../types/catalog';

interface WishlistContextType {
  wishlistItems: Book[];
  addToWishlist: (item: Book) => void;
  removeFromWishlist: (id: string) => void;
  toggleWishlist: (item: Book) => void;
  isInWishlist: (id: string) => boolean;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [wishlistItems, setWishlistItems] = useState<Book[]>([]);

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
        return exists ? prev.filter((existing) => existing.id !== item.id) : [...prev, item];
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
