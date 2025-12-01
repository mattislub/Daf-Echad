import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';

interface PoliciesPageProps {
  onNavigate?: (page: string) => void;
}

export default function PoliciesPage({ onNavigate }: PoliciesPageProps) {
  const { language, t } = useLanguage();
  const isRTL = language === 'he';

  const policies = [
    {
      title: t('policies.delivery.title'),
      body: t('policies.delivery.description'),
    },
    {
      title: t('policies.cancellation.title'),
      body: t('policies.cancellation.description'),
    },
    {
      title: t('policies.consumerLaw.title'),
      body: t('policies.consumerLaw.description'),
    },
    {
      title: t('policies.privacy.title'),
      body: t('policies.privacy.description'),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header onNavigate={onNavigate} />
      <main className="container mx-auto px-4 py-10 space-y-8">
        <div className="max-w-4xl mx-auto bg-white shadow-sm border border-gray-200 rounded-2xl p-8 space-y-6">
          <div>
            <p className="text-sm text-yellow-700 font-semibold mb-2">{t('policies.tagline')}</p>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('policies.title')}</h1>
            <p className="text-gray-700">{t('policies.subtitle')}</p>
          </div>

          <div className="space-y-5">
            {policies.map((policy) => (
              <div key={policy.title} className="p-5 rounded-xl border border-gray-100 bg-gray-50">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{policy.title}</h2>
                <p className="text-gray-700 leading-relaxed">{policy.body}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
