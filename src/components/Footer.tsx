import { Mail, Phone, MapPin, CreditCard, Heart } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { language, t } = useLanguage();
  const isRTL = language === 'he';

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-white mt-16 border-t-2 border-yellow-600/30" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-10 h-10 object-contain"
              />
              {t('site.title')}
            </h3>
            <p className="text-gray-400 mb-4">
              {t('site.tagline')}
            </p>
            <div className="flex flex-col gap-2 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{t('kav.phone')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>info@breslovbooks.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{isRTL ? 'ירושלים, ישראל' : 'Jerusalem, Israel'}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-4">{t('footer.sitemap')}</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-yellow-500 transition-colors">{t('nav.home')}</a></li>
              <li><a href="#" className="hover:text-yellow-500 transition-colors">{t('nav.books')}</a></li>
              <li><a href="#" className="hover:text-yellow-500 transition-colors">{t('nav.children')}</a></li>
              <li><a href="#" className="hover:text-yellow-500 transition-colors">{t('nav.women')}</a></li>
              <li><a href="#" className="hover:text-yellow-500 transition-colors">{t('categories.all')}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-4">{t('footer.about')}</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-yellow-500 transition-colors">{t('footer.about')}</a></li>
              <li><a href="#" className="hover:text-yellow-500 transition-colors">{t('footer.contact')}</a></li>
              <li>
                <a href="#" className="hover:text-yellow-500 transition-colors flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  {t('footer.donations')}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              {t('footer.giftcard')}
            </h4>
            <p className="text-gray-400 mb-4 text-sm">
              {isRTL
                ? 'כרטיס מתנה מושלם לכל אירוע'
                : 'Perfect gift for any occasion'}
            </p>
            <div className="space-y-2">
              <button className="w-full bg-gradient-to-r from-yellow-700 to-yellow-600 hover:from-yellow-600 hover:to-yellow-500 text-white py-2 px-4 rounded-lg transition-colors text-sm shadow-lg">
                {isRTL ? 'רכוש כרטיס מתנה' : 'Purchase Gift Card'}
              </button>
              <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors text-sm">
                {t('footer.balance')}
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-yellow-600/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
          <div>
            {t('footer.rights')} {new Date().getFullYear()} - {t('site.title')}
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-yellow-500 transition-colors">
              {isRTL ? 'תנאי שימוש' : 'Terms of Service'}
            </a>
            <span>|</span>
            <a href="#" className="hover:text-yellow-500 transition-colors">
              {isRTL ? 'מדיניות פרטיות' : 'Privacy Policy'}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
