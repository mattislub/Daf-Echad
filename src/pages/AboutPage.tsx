import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';

interface AboutPageProps {
  onNavigate?: (page: string) => void;
}

export default function AboutPage({ onNavigate }: AboutPageProps) {
  const { language, t } = useLanguage();
  const isRTL = language === 'he';

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header onNavigate={onNavigate} />
      <main className="container mx-auto px-4 py-10 space-y-8">
        <div className="max-w-4xl mx-auto bg-white shadow-sm border border-gray-200 rounded-2xl p-8">
          <p className="text-sm text-yellow-700 font-semibold mb-2">{t('about.tagline')}</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('about.title')}</h1>
          <p className="text-gray-700 leading-relaxed mb-6">{t('about.description')}</p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('about.focus')}</h2>
              <p className="text-gray-700 leading-relaxed">{t('about.focus.description')}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('about.experience')}</h2>
              <p className="text-gray-700 leading-relaxed">{t('about.experience.description')}</p>
            </div>
          </div>
        </div>
      </main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
