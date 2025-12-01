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
    'kav.title': 'קו הזמנות אוטומטי 24/6',
    'kav.phone': '076.598.91.31',
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
    'cart.title': 'עגלה והזמנה',
    'cart.subtitle': 'בדיקת פריטים, שילוח ואמצעי תשלום לפני שליחת ההזמנה.',
    'cart.empty': 'העגלה שלך ריקה כרגע.',
    'cart.continue': 'חזרה לקטלוג',
    'cart.delivery.worldwide': 'משלוחים לכל העולם',
    'cart.delivery.multi': 'מספר אפשרויות אספקה: שליח, דואר, או איסוף עצמי.',
    'cart.items': 'פריטי עגלה',
    'cart.quantity': 'כמות',
    'cart.remove': 'הסר',
    'cart.shipping.worldwide': 'משלוח בינלאומי',
    'cart.shipping.title': 'אפשרויות משלוח',
    'cart.shipping.description': 'בחרו משלוח לפי מיקום, סוג מסירה ומשקל. המחיר מתעדכן לפי המטבע שנבחר.',
    'cart.shipping.weight': 'טווח משקל',
    'cart.shipping.eta': 'זמן אספקה משוער',
    'cart.payment.title': 'אמצעי תשלום',
    'cart.payment.card': 'כרטיס אשראי (J5 - הרשאה בלבד בעת ההזמנה)',
    'cart.payment.card.note': 'ביצוע חיוב בפועל יתבצע רק לאחר אישור המשלוח והיערכות המלאי.',
    'cart.order.note': 'אנחנו מבצעים הרשאת J5 בלבד ולא מחייבים כרטיסים עד לאישור משלוח.',
    'cart.payment.cash': 'מזומן באיסוף עצמי',
    'cart.payment.cash.note': 'תשלום מתבצע בעת האיסוף מהסניף, ללא חיוב מוקדם.',
    'cart.summary': 'סיכום הזמנה',
    'cart.items.total': 'סכום פריטים',
    'cart.shipping.cost': 'עלות משלוח',
    'cart.total': 'סה"כ להזמנה',
    'cart.checkout': 'שליחת הזמנה',
    'cart.checkout.confirmation': 'שמירת פרטי ההזמנה בוצעה. ניצור קשר לאישור וחיוב רק לאחר אישור משלוח.',
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
    'kav.title': '24/6 Automated Order Line',
    'kav.phone': '+972.76.598.91.31',
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
    'cart.title': 'Cart & Checkout',
    'cart.subtitle': 'Review your items, delivery, and payment before confirming.',
    'cart.empty': 'Your cart is currently empty.',
    'cart.continue': 'Back to catalog',
    'cart.delivery.worldwide': 'Worldwide delivery available',
    'cart.delivery.multi': 'Multiple delivery methods: courier, post, or pickup.',
    'cart.items': 'Cart items',
    'cart.quantity': 'Quantity',
    'cart.remove': 'Remove',
    'cart.shipping.worldwide': 'Worldwide shipping',
    'cart.shipping.title': 'Shipping options',
    'cart.shipping.description': 'Choose shipping by location, delivery method, and weight. Prices follow your selected currency.',
    'cart.shipping.weight': 'Weight band',
    'cart.shipping.eta': 'Estimated delivery',
    'cart.payment.title': 'Payment methods',
    'cart.payment.card': 'Credit card (J5 authorization only at checkout)',
    'cart.payment.card.note': 'We only authorize the card and capture after shipping is confirmed.',
    'cart.order.note': 'Cards are not charged on order; a J5 authorization holds the shipment total.',
    'cart.payment.cash': 'Cash on pickup',
    'cart.payment.cash.note': 'Pay cash when collecting from our pickup desk. No upfront charge.',
    'cart.summary': 'Order summary',
    'cart.items.total': 'Items subtotal',
    'cart.shipping.cost': 'Shipping',
    'cart.total': 'Total for order',
    'cart.checkout': 'Submit order',
    'cart.checkout.confirmation': 'Order details saved. We will authorize or collect payment only after delivery is confirmed.',
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
