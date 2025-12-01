import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';

interface TermsPageProps {
  onNavigate?: (page: string) => void;
}

export default function TermsPage({ onNavigate }: TermsPageProps) {
  const { language, t } = useLanguage();
  const isRTL = language === 'he';

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header onNavigate={onNavigate} />
      <main className="container mx-auto px-4 py-10 space-y-8">
        <div className="max-w-4xl mx-auto bg-white shadow-sm border border-gray-200 rounded-2xl p-8 space-y-6">
          <div>
            <p className="text-sm text-yellow-700 font-semibold mb-2">{t('terms.tagline')}</p>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('terms.title')}</h1>
            <p className="text-gray-700">{t('terms.subtitle')}</p>
          </div>

          <div className="space-y-5">
            <div className="p-5 rounded-xl border border-gray-100 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('terms.acceptance')}</h2>
              <p className="text-gray-700 leading-relaxed">{t('terms.acceptance.description')}</p>
            </div>
            <div className="p-5 rounded-xl border border-gray-100 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('terms.usage')}</h2>
              <p className="text-gray-700 leading-relaxed">{t('terms.usage.description')}</p>
            </div>
            <div className="p-5 rounded-xl border border-gray-100 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('terms.policyLink')}</h2>
              <p className="text-gray-700 leading-relaxed">{t('terms.policyLink.description')}</p>
            </div>
          </div>
        </div>
      </main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
