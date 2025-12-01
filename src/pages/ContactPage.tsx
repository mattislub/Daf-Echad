import { Mail, MapPin, Phone, Clock } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';

interface ContactPageProps {
  onNavigate?: (page: string) => void;
}

export default function ContactPage({ onNavigate }: ContactPageProps) {
  const { language, t } = useLanguage();
  const isRTL = language === 'he';

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header onNavigate={onNavigate} />
      <main className="container mx-auto px-4 py-10 space-y-8">
        <div className="max-w-4xl mx-auto bg-white shadow-sm border border-gray-200 rounded-2xl p-8 space-y-6">
          <div>
            <p className="text-sm text-yellow-700 font-semibold mb-2">{t('contact.tagline')}</p>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('contact.title')}</h1>
            <p className="text-gray-700">{t('contact.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <MapPin className="w-5 h-5 text-yellow-700 mt-1" />
              <div>
                <p className="text-sm text-gray-500 uppercase">{t('contact.address.label')}</p>
                <p className="text-lg font-semibold text-gray-900">{t('contact.address.value')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <Phone className="w-5 h-5 text-yellow-700 mt-1" />
              <div>
                <p className="text-sm text-gray-500 uppercase">{t('contact.phone.label')}</p>
                <p className="text-lg font-semibold text-gray-900">{t('contact.phone.value')}</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <Mail className="w-5 h-5 text-yellow-700 mt-1" />
              <div>
                <p className="text-sm text-gray-500 uppercase">{t('contact.email.label')}</p>
                <p className="text-lg font-semibold text-gray-900">info@breslovbooks.com</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <Clock className="w-5 h-5 text-yellow-700 mt-1" />
              <div>
                <p className="text-sm text-gray-500 uppercase">{t('contact.hours.label')}</p>
                <p className="text-lg font-semibold text-gray-900">{t('contact.hours.value')}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
