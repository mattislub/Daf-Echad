import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'he' | 'en';
type Currency = 'ILS' | 'USD';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  currency: Currency;
  setCurrency: (curr: Currency) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  he: {
    'site.title': 'ספרי ברסלב',
    'site.tagline': 'כל ספרי ברסלב במקום אחד',
    'nav.home': 'בית',
    'nav.books': 'ספרים',
    'nav.children': 'ערוץ ילדים',
    'nav.women': 'ערוץ נשים',
    'nav.login': 'התחברות',
    'nav.cart': 'עגלה',
    'search.placeholder': 'חיפוש ספרים, מחבר, קטגוריה...',
    'search.button': 'חיפוש',
    'kav.title': 'קו הזמנות אוטומטי 24/7',
    'kav.phone': '02-123-4567',
    'categories.all': 'כל הספרים',
    'categories.likutey': 'ליקוטי מוהר"ן',
    'categories.prayer': 'תפילה',
    'categories.stories': 'סיפורי מעשיות',
    'categories.children': 'ילדים',
    'categories.women': 'נשים',
    'featured': 'מוצרים מומלצים',
    'new.arrivals': 'הגיעו לאחרונה',
    'collections': 'אוספים',
    'brands': 'מותגים',
    'recently.viewed': 'נצפו לאחרונה',
    'footer.sitemap': 'מפת האתר',
    'footer.about': 'אודות',
    'footer.contact': 'צור קשר',
    'footer.donations': 'תרומות',
    'footer.giftcard': 'כרטיס מתנה',
    'footer.balance': 'בדיקת יתרה',
    'footer.rights': '© כל הזכויות שמורות',
  },
  en: {
    'site.title': 'Breslov Books',
    'site.tagline': 'Authentic Breslov Holy Books & Products',
    'nav.home': 'Home',
    'nav.books': 'Books',
    'nav.children': "Children's Channel",
    'nav.women': "Women's Channel",
    'nav.login': 'Login',
    'nav.cart': 'Cart',
    'search.placeholder': 'Search books, author, category...',
    'search.button': 'Search',
    'kav.title': '24/7 Automated Order Line',
    'kav.phone': '+972-2-123-4567',
    'categories.all': 'All Books',
    'categories.likutey': 'Likutey Moharan',
    'categories.prayer': 'Prayer',
    'categories.stories': 'Stories',
    'categories.children': 'Children',
    'categories.women': 'Women',
    'featured': 'Featured Products',
    'new.arrivals': 'New Arrivals',
    'collections': 'Collections',
    'brands': 'Brands',
    'recently.viewed': 'Recently Viewed',
    'footer.sitemap': 'Site Map',
    'footer.about': 'About Us',
    'footer.contact': 'Contact Us',
    'footer.donations': 'Donations',
    'footer.giftcard': 'Gift Card',
    'footer.balance': 'Check Balance',
    'footer.rights': '© All Rights Reserved',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('he');
  const [currency, setCurrency] = useState<Currency>('ILS');

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, currency, setCurrency, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
