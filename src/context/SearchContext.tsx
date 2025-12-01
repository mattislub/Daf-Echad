import { createContext, useContext } from 'react';
import { Book } from '../types/catalog';

type SearchContextValue = {
  searchItems: Book[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSearch: (query: string) => void;
};

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

interface SearchProviderProps {
  children: React.ReactNode;
  searchItems: Book[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSearch: (query: string) => void;
}

export function SearchProvider({
  children,
  searchItems,
  searchTerm,
  setSearchTerm,
  onSearch,
}: SearchProviderProps) {
  return (
    <SearchContext.Provider value={{ searchItems, searchTerm, setSearchTerm, onSearch }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);

  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }

  return context;
}
