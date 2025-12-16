import Header from '../components/Header';
import Footer from '../components/Footer';
import TrackingWidget from '../components/TrackingWidget';
import { useLanguage } from '../context/LanguageContext';

interface TrackingPageProps {
  onNavigate?: (page: string) => void;
}

export default function TrackingPage({ onNavigate }: TrackingPageProps) {
  const { language, t } = useLanguage();
  const isRTL = language === 'he';

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header onNavigate={onNavigate} />

      <main className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-sm text-yellow-700 font-semibold">{t('tracking.title')}</p>
            <h1 className="text-3xl font-bold text-gray-900">{t('tracking.title')}</h1>
            <p className="text-gray-600">{t('tracking.subtitle')}</p>
          </div>

          <TrackingWidget />
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
